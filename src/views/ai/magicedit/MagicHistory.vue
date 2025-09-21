<template>
  <div>
    <div class="history-page">
      <div class="guide-banner" :class="{ 'is-collapsed': guideCollapsed }">
        <span class="guide-badge">提示</span>
        <div class="guide-content">
          <div class="guide-title">快速了解作品与灵感库</div>
          <ul class="guide-steps">
            <li>点击作品右侧的发布开关即可同步到灵感库展示给更多人。</li>
            <li>点击作品图片或详情按钮可以打开抽屉查看大图与提示词。</li>
          </ul>
        </div>
        <div class="guide-actions">
          <el-button size="small" type="primary" plain @click="goToInspiration">打开灵感库</el-button>
          <el-button size="small" link @click="guideCollapsed = !guideCollapsed">{{ guideCollapsed ? '展开提示' : '收起提示'
            }}</el-button>
        </div>
      </div>
      <div class="list-panel">
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
              :key="item.id ?? item.createtime">
              <div class="list-thumb-wrap" role="button" tabindex="0" @click="openDetails(item)"
                @keydown.enter.prevent="openDetails(item)" @keydown.space.prevent="openDetails(item)">
                <el-image :src="item._displayUrl" fit="cover" class="list-thumb" lazy />
              </div>
              <div class="list-content">
                <div class="prompt-text">{{ item.prompt }}</div>
                <div class="meta">
                  <div class="meta-left">
                    <el-tag size="small" :type="item.isPublic ? 'success' : 'info'" effect="plain">
                      {{ item.isPublic ? '已发布·灵感库' : '未发布' }}
                    </el-tag>
                    <el-tag v-if="item.model" size="small" type="info" effect="plain" class="model-tag">
                      {{ item.model }}
                    </el-tag>
                  </div>
                  <div class="meta-right">
                    <span class="review-count" title="评论数" @click.stop="openDetails(item)" role="button">
                      <el-icon class="review-icon">
                        <ChatDotRound />
                      </el-icon>
                      {{ item.reviewcount ?? 0 }}
                      <span v-if="(item.reviewcount ?? 0) > 5" class="hot-flag" aria-label="热议" title="热议">🔥</span>
                    </span>
                    <span class="create-time">{{ formatTime(item.createtime) }}</span>
                  </div>
                </div>
                <div class="list-actions">
                  <div class="publish-toggle">
                    <span>发布到灵感库</span>
                    <el-switch :model-value="item.isPublic" inline-prompt size="small" active-text="是" inactive-text="否"
                      :disabled="item._updating" @change="(val) => handleItemPublicChange(item, val)" />
                  </div>
                  <el-button size="small" type="primary" plain @click="openDetails(item)">查看详情</el-button>
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

    <!-- 图片详情抽屉（PC & 移动端通用） -->
    <el-drawer v-model="detailsDrawer" direction="rtl" :size="drawerSize" :with-header="true" title="图片详情"
      append-to-body destroy-on-close :body-class="'history-drawer-body'">
      <div class="drawer-wrapper">
        <div v-if="drawerLoading" class="drawer-loading">
          <el-skeleton :rows="6" animated />
        </div>
        <el-empty v-else-if="!drawerDetail" description="未找到媒体详情" />
        <div v-else class="drawer-board">
          <section class="media-row">
            <div class="media-card">
              <header>
                <h3>原图</h3>
                <p>起始素材</p>
              </header>
              <div class="media-frame">
                <template v-if="drawerDetail.originurl">
                  <span v-if="isVideo(drawerDetail.originurl)" class="badge">视频</span>
                  <video v-if="isVideo(drawerDetail.originurl)" :src="drawerDetail.originurl" controls playsinline
                    class="media-element"></video>
                  <el-image v-else :src="drawerDetail.originurl" fit="contain" class="media-element"
                    :preview-src-list="[drawerDetail.originurl]" preview-teleported hide-on-click-modal />
                </template>
                <el-empty v-else description="暂无原图" :image-size="120" class="placeholder" />
              </div>
            </div>
            <div class="media-card">
              <header>
                <h3>AI 输出</h3>
                <p>生成结果</p>
              </header>
              <div class="media-frame">
                <span v-if="isVideo(drawerDetail.mediaurl)" class="badge">视频</span>
                <video v-if="isVideo(drawerDetail.mediaurl)" :src="drawerDetail.mediaurl" controls playsinline
                  class="media-element"></video>
                <el-image v-else :src="drawerDetail.mediaurl" fit="contain" class="media-element"
                  :preview-src-list="[drawerDetail.mediaurl]" preview-teleported hide-on-click-modal />
              </div>
            </div>
          </section>

          <section class="prompt-section">
            <header>
              <h3>提示词</h3>
              <el-button v-if="drawerDetail.prompt" size="small" link type="primary" :loading="copying"
                @click="copyPrompt(drawerDetail.prompt)">复制</el-button>
            </header>
            <div class="prompt-content" v-if="drawerDetail.prompt">{{ drawerDetail.prompt }}</div>
            <div class="prompt-content empty" v-else>暂无提示词</div>
          </section>

          <section class="meta-section">
            <header>
              <h3>其他信息</h3>
            </header>
            <div class="meta-grid">
              <div class="meta-item">
                <span class="label">媒体 ID</span>
                <span class="value">#{{ drawerDetail.id }}</span>
              </div>
              <div class="meta-item">
                <span class="label">作者</span>
                <span class="value">{{ drawerDetail.username || '未知' }}</span>
              </div>
              <div class="meta-item">
                <span class="label">创建时间</span>
                <span class="value">{{ formatTime(drawerDetail.createtime) }}</span>
              </div>
              <div class="meta-item">
                <span class="label">模型</span>
                <span class="value">{{ drawerDetail.model || '未提供' }}</span>
              </div>
              <div class="meta-item">
                <span class="label">生成地址</span>
                <span class="value">
                  <el-link v-if="drawerDetail.mediaurl" :href="drawerDetail.mediaurl" target="_blank" type="primary">
                    打开链接
                  </el-link>
                  <span v-else>暂无</span>
                </span>
              </div>
              <div class="meta-item">
                <span class="label">原图地址</span>
                <span class="value">
                  <el-link v-if="drawerDetail.originurl" :href="drawerDetail.originurl" target="_blank" type="primary">
                    打开链接
                  </el-link>
                  <span v-else>暂无</span>
                </span>
              </div>
            </div>
          </section>

          <section class="publish-section">
            <div class="publish-label">发布到灵感库</div>
            <el-switch v-model="selectedPublic" inline-prompt :active-text="'是'" :inactive-text="'否'"
              :loading="publishing" @change="onTogglePublic" />
          </section>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getUserLibraryService, setMediaPublicService, getMediaByIdService } from '@/api/ai.js'
import { formatDate } from '@/utils/format'
import { ChatDotRound } from '@element-plus/icons-vue'

const guideCollapsed = ref(false)
const mediaList = ref([])
const loading = ref(false)

// 右侧列表分页
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 当前选中项
const selectedItem = ref(null)
const selectedPublic = ref(false)
const publishing = ref(false)
const copying = ref(false)
const isMobile = ref(false)
const detailsDrawer = ref(false)
const drawerSize = computed(() => (isMobile.value ? '95%' : '960px'))

const router = useRouter()

const goToInspiration = () => {
  router.push('/ai/library')
}

const checkIsMobile = () => {
  isMobile.value = window.innerWidth < 768
}

const refresh = () => getMediaList(pageNum.value)

const drawerDetail = ref(null)
const drawerLoading = ref(false)

const toBoolean = (val) => {
  if (typeof val === 'boolean') return val
  if (typeof val === 'number') return val === 1
  if (typeof val === 'string') {
    const lowered = val.toLowerCase()
    return lowered === '1' || lowered === 'true'
  }
  return false
}

const normalizeItem = (it) => ({
  ...it,
  isPublic: toBoolean(it?.isPublic ?? it?.public ?? it?.ispublic),
  _displayUrl: it.mediaurl,
  _updating: false,
})

const normalizeDetail = (data) => ({
  id: data?.id ?? null,
  mediaurl: data?.mediaurl ?? '',
  originurl: data?.originurl ?? '',
  prompt: data?.prompt ?? '',
  createtime: data?.createtime ?? '',
  username: data?.username ?? data?.userName ?? '',
  model: data?.model ?? '',
  isPublic: toBoolean(data?.isPublic ?? data?.ispublic),
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

const loadDetail = async (mediaId) => {
  if (!mediaId) {
    drawerDetail.value = null
    return
  }
  try {
    drawerLoading.value = true
    drawerDetail.value = null
    const res = await getMediaByIdService(mediaId)
    const data = res?.data
    if (!data) {
      drawerDetail.value = null
      ElMessage.warning('未找到该媒体')
      return
    }
    drawerDetail.value = normalizeDetail(data)
    selectedPublic.value = drawerDetail.value.isPublic
  } catch (e) {
    console.error(e)
    drawerDetail.value = null
    ElMessage.error('获取媒体详情失败')
  } finally {
    drawerLoading.value = false
  }
}

const openDetails = async (item) => {
  selectedItem.value = item
  selectedPublic.value = !!item?.isPublic
  detailsDrawer.value = true
  await loadDetail(item?.id)
}

watch(drawerDetail, (detailVal) => {
  if (detailVal) {
    selectedPublic.value = detailVal.isPublic
  }
})

watch(detailsDrawer, (visible) => {
  if (!visible) {
    drawerDetail.value = null
    drawerLoading.value = false
  }
})

const onTogglePublic = async (val) => {
  if (!drawerDetail.value?.id) return
  try {
    publishing.value = true
    await setMediaPublicService(drawerDetail.value.id, !!val)
    drawerDetail.value.isPublic = !!val
    if (selectedItem.value) {
      selectedItem.value.isPublic = !!val
    }
    const idx = mediaList.value.findIndex(m => m.id === drawerDetail.value.id)
    if (idx > -1) mediaList.value[idx].isPublic = !!val
    ElMessage.success(val ? '已发布到灵感库' : '已取消灵感库发布')
  } catch (e) {
    selectedPublic.value = !val
    ElMessage.error('更新发布状态失败')
  } finally {
    publishing.value = false
  }
}

const handleItemPublicChange = async (item, nextVal) => {
  if (!item?.id || item._updating) return
  const target = !!nextVal
  const original = !!item.isPublic
  if (target === original) return
  item._updating = true
  try {
    await setMediaPublicService(item.id, target)
    item.isPublic = target
    if (selectedItem.value?.id === item.id) {
      selectedItem.value.isPublic = target
      selectedPublic.value = target
    }
    if (drawerDetail.value?.id === item.id) {
      drawerDetail.value.isPublic = target
      selectedPublic.value = target
    }
    ElMessage.success(target ? '已发布到灵感库' : '已取消灵感库发布')
  } catch (e) {
    ElMessage.error('更新发布状态失败')
  } finally {
    item._updating = false
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

const isVideo = (url) => {
  if (!url) return false
  const lower = url.toLowerCase()
  return ['.mp4', '.webm', '.ogg'].some(ext => lower.endsWith(ext))
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
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.guide-banner {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  background: color-mix(in srgb, var(--el-color-primary-light-9) 70%, #fff 30%);
  border-left: 4px solid var(--el-color-primary-light-5);
  border-radius: 12px;
}

.guide-badge {
  font-size: 12px;
  color: #fff;
  background: var(--el-color-primary);
  border-radius: 6px;
  padding: 2px 8px;
}

.guide-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.guide-title {
  font-weight: 600;
  white-space: normal;
  word-break: break-word;
}

.guide-steps {
  margin: 0;
  padding-left: 18px;
  color: var(--el-text-color-secondary);
  list-style: disc;
  line-height: 1.6;
}

.guide-actions {
  display: flex;
  gap: 8px;
}

.guide-banner.is-collapsed .guide-content {
  display: none;
}

.guide-banner.is-collapsed {
  background: color-mix(in srgb, var(--app-surface-2, #f6f7f9) 85%, #fff 15%);
}

@media (max-width: 576px) {
  .guide-banner {
    grid-template-columns: 1fr;
    align-items: flex-start;
  }

  .guide-actions {
    justify-content: flex-start;
    flex-wrap: wrap;
    margin-top: 6px;
  }
}

/* 防止列表在小屏时出现横向溢出被裁切 */
.list-panel {
  min-width: 0;
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
  cursor: default;
}

.list-item:hover {
  transform: translateY(-1px);
  border-color: var(--el-border-color-light);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
}

.list-item.selected {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 22%, transparent);
}

.list-thumb-wrap {
  position: relative;
  cursor: pointer;
}

.list-thumb-wrap:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.list-thumb {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 6px;
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

.meta-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.list-actions {
  margin-top: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.publish-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 让右侧文字列在 grid 中可以正确缩小，不产生横向溢出 */
.list-content {
  min-width: 0;
}

.meta .create-time {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.model-tag {
  line-height: 1;
}

.review-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-color-warning) 15%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-warning) 40%, transparent);
  color: var(--el-color-warning);
  font-weight: 600;
  font-size: 13px;
  line-height: 1.2;
  cursor: pointer;
  transition: background-color .15s ease, border-color .15s ease, transform .05s ease;
}

.review-icon {
  color: var(--el-color-warning);
  font-size: 16px;
}

.hot-flag {
  display: inline-flex;
  align-items: center;
  margin-left: 2px;
  font-size: 16px;
  line-height: 1;
}

.review-count:hover {
  background: color-mix(in srgb, var(--el-color-warning) 22%, transparent);
  border-color: color-mix(in srgb, var(--el-color-warning) 60%, transparent);
}

.review-count:active {
  transform: translateY(1px);
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 16px 8px 20px;
  overflow-x: auto;
  scrollbar-width: thin;
}

.pagination-wrapper :deep(.el-pagination) {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  min-width: min(100%, 520px);
}

.pagination-wrapper :deep(.el-pagination__rightwrapper) {
  flex: 1 1 100%;
  display: flex;
  justify-content: center;
}

.pagination-wrapper :deep(.el-pagination__editor) {
  margin-top: 4px;
}

/* 移动端优化：
 * - 在窄屏下减小缩略图列宽与高度，避免右侧内容被裁切
 * - 极窄屏下改为上下布局，图片占满宽度，信息在下方显示
 */
@media (max-width: 768px) {
  .list-item {
    grid-template-columns: 120px 1fr;
    gap: 10px;
  }

  .list-thumb {
    height: 100px;
  }
}

.history-drawer-body {
  padding: 0;
  display: flex;
  flex-direction: column;
}

.drawer-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 18px 18px;
  box-sizing: border-box;
}

.drawer-loading {
  padding: 24px 8px;
}

.drawer-board {
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  padding-right: 6px;
}

.media-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

.media-card {
  border-radius: 20px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 70%, transparent);
  background: var(--app-surface);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.media-card header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.media-card header p {
  margin: 4px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.media-frame {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: clamp(280px, 45vh, 420px);
  border-radius: 18px;
  overflow: hidden;
  background: color-mix(in srgb, var(--app-surface-2) 75%, #fff 25%);
}

.media-element,
.media-frame :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: var(--app-surface-2);
}

.badge {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 2;
  background: rgba(64, 158, 255, 0.9);
  color: #fff;
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 999px;
}

.placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.prompt-section,
.meta-section,
.publish-section {
  border-radius: 18px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 70%, transparent);
  background: var(--app-surface);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prompt-section header,
.meta-section header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.prompt-section header h3,
.meta-section header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}

.prompt-content {
  line-height: 1.7;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
  word-break: break-word;
  padding: 12px;
  border-radius: 12px;
  background: color-mix(in srgb, var(--app-surface-2) 90%, transparent);
}

.prompt-content.empty {
  color: var(--el-text-color-secondary);
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px 18px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-item .label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.meta-item .value {
  font-size: 14px;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.publish-section {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.publish-label {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

@media (max-width: 420px) {
  .list-item {
    grid-template-columns: 1fr;
  }

  .list-thumb {
    height: 56vw;
    /* 近似 16:9，随屏幕自适应 */
  }
}

@media (min-width: 768px) {
  .media-row {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
