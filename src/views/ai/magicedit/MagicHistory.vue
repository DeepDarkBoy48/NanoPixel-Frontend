<template>
  <div class="history-page">
    <div class="left-panel" v-if="!isMobile">
      <el-card shadow="never" class="left-card">
        <template #header>
          <div class="left-header">已选图片详情</div>
        </template>

        <el-empty v-if="!selectedItem" description="从右侧选择一张图片" />

        <template v-else>
          <el-alert
            title="点击上方图片可放大，点击放大层空白处可关闭"
            type="info"
            :closable="false"
            show-icon
            class="hint"
          />

          <el-image :src="selectedItem.mediaurl" fit="contain" class="preview"
            :preview-src-list="[selectedItem.mediaurl]" preview-teleported hide-on-click-modal />

          <el-descriptions :column="1" border class="desc">
            <el-descriptions-item label="ID">{{ selectedItem.id }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ formatTime(selectedItem.createtime) }}</el-descriptions-item>
            <el-descriptions-item label="作者">{{ selectedItem.userName }}</el-descriptions-item>
          </el-descriptions>

          <div class="prompt-block">
            <div class="prompt-title">提示词</div>
            <el-input type="textarea" :model-value="selectedItem.prompt" readonly autosize />
            <div class="prompt-actions">
              <el-button size="small" @click="copyPrompt(selectedItem.prompt)" :loading="copying">复制</el-button>
            </div>
          </div>

          <div class="publish-row">
            <div class="label">发布状态</div>
            <el-switch v-model="selectedPublic" :active-text="'公开'" :inactive-text="'私密'" :loading="publishing"
              @change="onTogglePublic" />
          </div>
        </template>
      </el-card>
    </div>

    <div class="right-panel">
      <div class="toolbar">
        <h2 class="title">我的作品</h2>
        <div class="actions">
          <el-button size="small" @click="refresh" :loading="loading">刷新</el-button>
        </div>
      </div>

      <div v-if="loading" class="waterfall-container">
        <div class="skeleton-card" v-for="i in skeletonCount" :key="i">
          <el-skeleton animated>
            <template #template>
              <el-skeleton-item variant="image" style="height: 180px;" />
              <div style="padding:10px;">
                <el-skeleton-item variant="text" style="width: 90%; margin-bottom: 8px;" />
                <el-skeleton-item variant="text" style="width: 60%;" />
              </div>
            </template>
          </el-skeleton>
        </div>
      </div>

      <el-empty v-else-if="!mediaList.length" description="暂无作品" />

      <template v-else>
        <div class="waterfall-container">
          <div class="card" :class="{ selected: item.id === selectedItem?.id }" v-for="item in mediaList"
            :key="item.id ?? item.createtime" @click="selectItem(item)">
            <div class="card-media">
              <span class="status-badge" :class="item.isPublic ? 'public' : 'private'">{{ item.isPublic ? '公开' : '私密'
                }}</span>
              <el-image :src="item.mediaurl" fit="cover" class="media" loading="lazy" />
            </div>
            <div class="card-body">
              <div class="prompt-text">{{ item.prompt }}</div>
              <div class="meta">
                <span class="media-id">#{{ item.id }}</span>
                <span class="create-time">{{ formatTime(item.createtime) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="pagination-wrapper">
          <el-pagination background layout="prev, pager, next, jumper, ->, total" :current-page="pageNum"
            :page-size="pageSize" :total="total" @current-change="handlePageChange" />
        </div>
      </template>
    </div>
  </div>

  <!-- 移动端详情悬浮窗 -->
  <el-drawer
    v-if="isMobile"
    v-model="detailsDrawer"
    direction="rtl"
    size="85%"
    :with-header="true"
    title="图片详情"
  >
    <el-empty v-if="!selectedItem" description="从右侧选择一张图片" />
    <template v-else>
      <el-alert title="点击图片可放大，点击空白关闭" type="info" :closable="false" show-icon class="hint" />
      <el-image :src="selectedItem.mediaurl" fit="contain" style="width:100%;height:240px;border-radius:6px;background:#f5f7fa"
        :preview-src-list="[selectedItem.mediaurl]" preview-teleported hide-on-click-modal />

      <el-descriptions :column="1" border class="desc" style="margin-top:10px;">
        <el-descriptions-item label="ID">{{ selectedItem.id }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatTime(selectedItem.createtime) }}</el-descriptions-item>
        <el-descriptions-item label="作者">{{ selectedItem.userName }}</el-descriptions-item>
      </el-descriptions>

      <div class="prompt-block">
        <div class="prompt-title">提示词</div>
        <el-input type="textarea" :model-value="selectedItem.prompt" readonly autosize />
        <div class="prompt-actions">
          <el-button size="small" @click="copyPrompt(selectedItem.prompt)" :loading="copying">复制</el-button>
        </div>
      </div>

      <div class="publish-row">
        <div class="label">发布状态</div>
        <el-switch v-model="selectedPublic" :active-text="'公开'" :inactive-text="'私密'" :loading="publishing"
          @change="onTogglePublic" />
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { getUserLibraryService, setMediaPublicService } from '@/api/ai.js'
import { formatDate } from '@/utils/format'

const mediaList = ref([])
const loading = ref(false)
const skeletonCount = 10

// 右侧列表分页
const pageNum = ref(1)
const pageSize = ref(15)
const total = ref(0)

// 左侧选中项
const selectedItem = ref(null)
const selectedPublic = ref(false)
const publishing = ref(false)
const copying = ref(false)
const isMobile = ref(false)
const detailsDrawer = ref(false)

const checkIsMobile = () => {
  isMobile.value = window.innerWidth < 768
}

const refresh = () => getMediaList(pageNum.value)

const normalizeItem = (it) => ({
  ...it,
  isPublic: it?.isPublic ?? it?.public ?? it?.ispublic
})

const getMediaList = async (page = 1) => {
  try {
    loading.value = true
    pageNum.value = page
    const res = await getUserLibraryService(pageNum.value, pageSize.value)
    const data = res?.data || {}
    mediaList.value = Array.isArray(data.items) ? data.items.map(normalizeItem) : []
    total.value = Number(data.total || 0)
  } catch (e) {
    ElMessage.error('获取我的作品失败')
    console.error(e)
  } finally {
    loading.value = false
  }
}

const handlePageChange = (p) => {
  getMediaList(p)
}

const selectItem = (item) => {
  selectedItem.value = item
  if (isMobile.value) {
    detailsDrawer.value = true
  }
}

// 同步 isPublic 到开关（后端可能未返回该字段）
watch(selectedItem, (val) => {
  selectedPublic.value = !!val?.isPublic
})

const onTogglePublic = async (val) => {
  if (!selectedItem.value) return
  try {
    publishing.value = true
    await setMediaPublicService(selectedItem.value.id, !!val)
    // 本地同步状态，后端未返回 isPublic 时也能立即反映
    selectedItem.value.isPublic = !!val
    const idx = mediaList.value.findIndex(m => m.id === selectedItem.value.id)
    if (idx > -1) mediaList.value[idx].isPublic = !!val
  } catch (e) {
    // 失败时回滚 UI
    selectedPublic.value = !val
  } finally {
    publishing.value = false
  }
}

const formatTime = (time) => {
  if (!time) return ''
  return formatDate(time, 'YYYY-MM-DD HH:mm')
}

const copyPrompt = async (text) => {
  try {
    copying.value = true
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    ElMessage.success('提示词已复制')
  } catch (e) {
    ElMessage.error('复制失败')
  } finally {
    copying.value = false
  }
}

onMounted(() => {
  getMediaList()
  checkIsMobile()
  window.addEventListener('resize', checkIsMobile)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkIsMobile)
})
</script>

<style scoped>
.history-page {
  display: grid;
  grid-template-columns: 380px 1fr; /* 面板更宽 */
  gap: 12px;
}

/* 左侧面板吸附顶部，随页面滚动可见 */
.left-panel{
  position: sticky;
  top: var(--app-message-offset, 72px);
  align-self: start;
  max-height: calc(100vh - var(--app-message-offset, 72px) - 12px);
  overflow: auto; /* 面板内容过长时内部滚动 */
}

.left-card {
  height: 100%;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.06);
}

.left-header {
  font-weight: 600;
}

.hint{ margin-bottom: 10px; }

.preview {
  width: 100%;
  height: 260px;
  background: #f5f7fa;
  border-radius: 6px;
  cursor: zoom-in;
}

.desc {
  margin-top: 10px;
}

.prompt-block {
  margin-top: 12px;
}

.prompt-title {
  font-size: 13px;
  margin-bottom: 8px;
  color: #606266;
}

.prompt-actions {
  margin-top: 8px;
}

.publish-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 12px;
}

.publish-row .label {
  color: #606266;
}

.publish-row .tip {
  color: #a6a9ad;
  font-size: 12px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.title {
  margin: 0;
  font-size: 18px;
}

.waterfall-container {
  column-count: 4;
  column-gap: 16px;
}

@media (max-width: 1400px) {
  .waterfall-container {
    column-count: 3;
  }
}

@media (max-width: 1100px) {
  .waterfall-container {
    column-count: 2;
  }
}

@media (max-width: 768px) {
  .history-page {
    grid-template-columns: 1fr;
  }

  .left-panel{ display: none; }

  .waterfall-container {
    column-count: 1;
  }
}

.card,
.skeleton-card {
  break-inside: avoid;
  margin-bottom: 16px;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid #ebeef5;
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.05);
  transition: transform .2s, box-shadow .2s, border-color .2s;
  cursor: pointer;
}

.card:hover {
  transform: translateY(-4px);
  border-color: #dcdfe6;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
}

.card.selected {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 25%, transparent);
}

.card-media {
  position: relative;
}

.status-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 12px;
  color: #fff;
}

.status-badge.public {
  background: #67C23A;
}

.status-badge.private {
  background: #909399;
}

.media {
  width: 100%;
  display: block;
  max-height: 520px;
  object-fit: cover;
}

.card-body {
  padding: 10px 12px;
}

.prompt-text {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  color: #303133;
}

.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
}

.media-id {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 12px 0 8px;
}
</style>
