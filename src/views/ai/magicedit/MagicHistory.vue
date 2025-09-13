<template>
  <div class="history-page">
    <div class="left-panel" v-if="!isMobile">
      <el-card shadow="never" class="left-card">
        <template #header>
          <div class="left-header">已选图片详情</div>
        </template>

        <el-empty v-if="!selectedItem" description="从右侧选择一张图片" />

        <template v-else>
          <!-- <el-alert
            title="点击上方图片可放大，点击放大层空白处可关闭"
            type="info"
            :closable="false"
            show-icon
            class="hint"
          /> -->

      <el-image :src="selectedItem._displayUrl" fit="contain" class="preview"
        :preview-src-list="[selectedItem._displayUrl]" preview-teleported hide-on-click-modal />

          <div class="side-actions">
            <el-button :loading="selectedItem._loadingOrigin" size="small" type="primary" plain
              @click="showOrigin(selectedItem)">
              <el-icon style="margin-right:6px;">
                <component :is="selectedItem._isOriginalShown ? RefreshLeft : Picture" />
              </el-icon>
              {{ selectedItem._isOriginalShown ? '返回编辑图' : '查看原图' }}
            </el-button>

            <el-button size="small" type="primary" plain @click="downloadMedia(selectedItem._displayUrl)">
              点击下载
            </el-button>
          </div>

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

      <div v-if="loading" class="list-container">
        <div class="list-item skeleton">
          <el-skeleton animated :rows="2">
            <template #template>
              <div class="list-thumb skeleton-box"></div>
              <div class="list-content">
                <el-skeleton-item variant="text" style="width: 80%; margin-bottom: 8px;" />
                <el-skeleton-item variant="text" style="width: 50%;" />
              </div>
            </template>
          </el-skeleton>
        </div>
        <div class="list-item skeleton" v-for="i in 6" :key="i">
          <el-skeleton animated :rows="2">
            <template #template>
              <div class="list-thumb skeleton-box"></div>
              <div class="list-content">
                <el-skeleton-item variant="text" style="width: 80%; margin-bottom: 8px;" />
                <el-skeleton-item variant="text" style="width: 50%;" />
              </div>
            </template>
          </el-skeleton>
        </div>
      </div>

      <el-empty v-else-if="!mediaList.length" description="暂无作品" />

      <template v-else>
        <div class="list-container">
          <div class="list-item" :class="{ selected: item.id === selectedItem?.id }" v-for="item in mediaList"
            :key="item.id ?? item.createtime" @click="selectItem(item)">
            <div class="list-thumb-wrap" :class="{ switching: item._switching }">
              <el-image :src="item._displayUrl" fit="cover" class="list-thumb" :preview-src-list="[item._displayUrl]"
                preview-teleported lazy hide-on-click-modal />
            </div>
            <div class="list-content">
              <div class="prompt-text">{{ item.prompt }}</div>
              <div class="meta">
                <el-tag size="small" :type="item.isPublic ? 'success' : 'info'" effect="plain">
                  {{ item.isPublic ? '公开' : '私密' }}
                </el-tag>
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
  <el-drawer v-if="isMobile" v-model="detailsDrawer" direction="rtl" size="85%" :with-header="true" title="图片详情">
    <el-empty v-if="!selectedItem" description="从右侧选择一张图片" />
    <template v-else>
      <el-alert title="点击图片可放大，点击空白关闭" type="info" :closable="false" show-icon class="hint" />
      <el-image :src="selectedItem._displayUrl" fit="contain"
        style="width:100%;height:240px;border-radius:6px;background:var(--app-surface-2)" :preview-src-list="[selectedItem._displayUrl]"
        preview-teleported hide-on-click-modal />

      <div class="side-actions" style="margin-top:10px;">
        <el-button :loading="selectedItem._loadingOrigin" size="small" type="primary" plain
          @click="showOrigin(selectedItem)">
          <el-icon style="margin-right:6px;">
            <component :is="selectedItem._isOriginalShown ? RefreshLeft : Picture" />
          </el-icon>
          {{ selectedItem._isOriginalShown ? '返回编辑图' : '查看原图' }}
        </el-button>
        <el-button size="small" type="primary" plain @click="downloadMedia(selectedItem._displayUrl)">
          点击下载
        </el-button>
      </div>

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
import { getUserLibraryService, setMediaPublicService, getMediaOriginUrlService } from '@/api/ai.js'
import { formatDate } from '@/utils/format'
import { Download, Picture, RefreshLeft } from '@element-plus/icons-vue'

const mediaList = ref([])
const loading = ref(false)
const skeletonCount = 10

// 右侧列表分页
const pageNum = ref(1)
const pageSize = ref(10)
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
  isPublic: it?.isPublic ?? it?.public ?? it?.ispublic,
  _displayUrl: it.mediaurl,
  _originUrl: null,
  _isOriginalShown: false,
  _loadingOrigin: false,
  _switching: false,
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

// 下载当前展示的媒体
const downloadMedia = async (url) => {
  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error('Network response was not ok.')
    const blob = await response.blob()
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = url.split('/').pop() || 'download'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)
    ElMessage.success('下载已开始')
  } catch (error) {
    console.error('Download error:', error)
    ElMessage.error('下载失败')
    window.open(url, '_blank')
  }
}

// 预加载图片
const preloadImage = (url) => new Promise((resolve, reject) => {
  const img = new Image()
  img.onload = () => resolve()
  img.onerror = reject
  img.src = url
})

// 切换原图/编辑图（与 library.vue 一致）
const showOrigin = async (item) => {
  try {
    if (!item) return
    if (item._loadingOrigin) return

    if (item._isOriginalShown) { // 切回编辑图
      item._switching = true
      await preloadImage(item.mediaurl).catch(() => { })
      item._displayUrl = item.mediaurl
      item._isOriginalShown = false
      setTimeout(() => { item._switching = false }, 280)
      return
    }

    if (!item.id) {
      ElMessage.error('缺少媒体ID，无法获取原图')
      return
    }

    item._loadingOrigin = true
    if (!item._originUrl) {
      const res = await getMediaOriginUrlService(item.id)
      const url = res?.data
      if (!url) throw new Error('原图地址为空')
      item._originUrl = url
    }

    item._switching = true
    await preloadImage(item._originUrl).catch(() => { })
    item._displayUrl = item._originUrl
    item._isOriginalShown = true
    setTimeout(() => { item._switching = false }, 280)
  } catch (e) {
    console.error(e)
    ElMessage.error('获取原图失败')
  } finally {
    item._loadingOrigin = false
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
  grid-template-columns: 500px 1fr;
  /* 侧边栏更宽 */
  gap: 12px;
}

/* 左侧面板吸附顶部，随页面滚动可见 */
.left-panel {
  position: sticky;
  /* 贴紧容器顶部 */
  top: 0;
  align-self: start;
  /* 最大高度同步调整，保持底部留白 */
  max-height: calc(100vh - 12px);
  overflow: auto;
  /* 面板内容过长时内部滚动 */
}

.left-card {
  height: 100%;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
}

.left-header {
  font-weight: 600;
}

.hint {
  margin-bottom: 10px;
}

.preview {
  width: 100%;
  height: 400px;
  background: var(--app-surface-2);
  border-radius: 6px;
  cursor: zoom-in;
}

.side-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
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
  color: var(--el-text-color-secondary);
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
  color: var(--el-text-color-primary);
}

.publish-row .tip {
  color: var(--el-text-color-secondary);
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

.list-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (max-width: 768px) {
  .history-page {
    grid-template-columns: 1fr;
  }

  .left-panel {
    display: none;
  }
}

/* 列表样式 */
.list-item {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 12px;
  padding: 10px;
  border: 1px solid var(--el-border-color);
  border-radius: 10px;
  background: var(--app-surface);
  transition: border-color .2s, box-shadow .2s, transform .2s;
  cursor: pointer;
}

.list-item:hover {
  transform: translateY(-1px);
  border-color: var(--el-border-color-light);
  box-shadow: 0 8px 16px rgba(0,0,0,0.06);
}

.list-item.selected {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 22%, transparent);
}

.list-thumb-wrap { position: relative; }
.list-thumb {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 6px;
}

/* Smooth media swap effect */
.list-thumb-wrap.switching .list-thumb {
  filter: blur(2px) grayscale(6%);
  opacity: 0.85;
  transform: scale(0.985);
  transition: filter .28s ease, opacity .28s ease, transform .28s ease;
}

.prompt-text {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  color: var(--el-text-color-primary);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 12px 0 8px;
}
</style>
