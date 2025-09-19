<template>
    <div class="library-container">
        <div class="toolbar">
            <h2 class="title">灵感库</h2>
            <div class="actions">
                <el-button-group class="sort-group">
                    <el-button size="small" :type="sortBy === 'review_count' ? 'primary' : 'default'" plain
                        @click="setSortBy('review_count')">按热度</el-button>
                    <el-button size="small" :type="sortBy === 'createtime' ? 'primary' : 'default'" plain
                        @click="setSortBy('createtime')">按时间</el-button>
                </el-button-group>
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

        <el-empty v-else-if="!mediaList.length" description="暂无内容">
            <el-button type="primary" @click="refresh">刷新试试</el-button>
        </el-empty>

        <template v-else>
            <div class="waterfall-container">
                <div class="card" v-for="item in mediaList" :key="item.id ?? item.createtime">
                    <!-- 顶部工具条：常显 -->
                    <div class="media-header">
                        <el-button :loading="item._loadingOrigin" size="small" class="origin-btn" type="primary" plain
                            @click.stop="showOrigin(item)">
                            <el-icon style="margin-right:6px;">
                                <component :is="item._isOriginalShown ? RefreshLeft : Picture" />
                            </el-icon>
                            {{ item._isOriginalShown ? '返回编辑图' : '查看原图' }}
                        </el-button>
                        <el-button size="small" class="detail-btn" @click.stop="goToDetail(item)">查看详情</el-button>
                    </div>
                    <div class="card-media" :class="{ switching: item._switching }">
                        <span v-if="isVideo(item._displayUrl)" class="badge">视频</span>
                        <video v-if="isVideo(item._displayUrl)" :src="item._displayUrl" autoplay loop muted playsinline
                            class="media"></video>
                        <el-image v-else :src="item._displayUrl" fit="cover" class="media" lazy />
                    </div>
                    <div class="card-body">
                        <div class="prompt-row">
                            <div class="prompt-text">{{ getDisplayPrompt(item.prompt) }}</div>
                        </div>

                        <div class="meta">
                            <div class="meta-left">
                                <span class="username">{{ item.username || item.userName }}</span>
                                <span v-if="item.id" class="media-id">#{{ item.id }}</span>
                                <el-tag v-if="item.model" size="small" type="info" effect="plain" class="model-tag">{{
                                    item.model }}</el-tag>
                            </div>
                            <div class="meta-right">
                                <span class="review-count" title="评论数" @click.stop="goToDetail(item)" role="button">
                                    <el-icon class="review-icon">
                                        <ChatDotRound />
                                    </el-icon>
                                    {{ item.reviewcount ?? 0 }}
                                    <span v-if="(item.reviewcount ?? 0) > 3" class="hot-flag" aria-label="热议"
                                        title="热议">🔥</span>
                                </span>
                                <span class="create-time">{{ formatTime(item.createtime) }}</span>
                            </div>
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
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getAllLibraryService, getMediaOriginUrlService } from '@/api/ai.js';
import { ElMessage } from 'element-plus';
import { formatDate } from '@/utils/format';
import { Download, Picture, RefreshLeft, ChatDotRound } from '@element-plus/icons-vue';

const mediaList = ref([]);
const loading = ref(false);
const skeletonCount = 10;

// 分页
const pageNum = ref(1);
const pageSize = ref(15);
const total = ref(0);
const sortBy = ref('review_count'); // 默认按评论数排序

const router = useRouter();

const refresh = () => {
    getMediaList(pageNum.value);
};

const setSortBy = (val) => {
    if (sortBy.value === val) return;
    sortBy.value = val;
    getMediaList(1);
};

const goToDetail = (item) => {
    if (item.id) {
        router.push(`/ai/library/${item.id}`);
    } else {
        ElMessage.info('该作品没有详情信息');
    }
};

const getMediaList = async (page = 1) => {
    try {
        loading.value = true;
        pageNum.value = page;
        const response = await getAllLibraryService(pageNum.value, pageSize.value, sortBy.value);
        const data = response?.data || {};
        const items = Array.isArray(data.items) ? data.items : [];
        // enrich items with UI state
        mediaList.value = items.map(it => ({
            ...it,
            _displayUrl: it.mediaurl,
            _originUrl: null,
            _isOriginalShown: false,
            _loadingOrigin: false,
            _switching: false,
        }));
        total.value = Number(data.total || 0);
    } catch (error) {
        ElMessage.error('获取媒体库失败');
        console.error(error);
    } finally {
        loading.value = false;
    }
};

const handlePageChange = (p) => {
    getMediaList(p);
};

const downloadMedia = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok.');
        const blob = await response.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = url.split('/').pop() || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        ElMessage.success('下载已开始');
    } catch (error) {
        console.error('Download error:', error);
        ElMessage.error('下载失败');
        // Fallback to opening in a new tab
        window.open(url, '_blank');
    }
};

const isVideo = (url) => {
    if (!url) return false;
    const videoExtensions = ['.mp4', '.webm', '.ogg'];
    return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
};

const formatTime = (time) => {
    if (!time) return '';
    return formatDate(time, 'YYYY-MM-DD HH:mm');
};

const copyPrompt = async (text) => {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
        ElMessage.success('提示词已复制');
    } catch (e) {
        ElMessage.error('复制失败');
    }
};

// 限制展示的提示词字符数（尽量展示100字以内都要展示）
const DISPLAY_CHAR_LIMIT = 100;
const getDisplayPrompt = (text) => {
    if (!text) return '';
    const s = String(text);
    if (s.length <= DISPLAY_CHAR_LIMIT) return s;
    return s.slice(0, DISPLAY_CHAR_LIMIT) + '…';
};

// 预加载图片，确保平滑切换
const preloadImage = (url) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
});

// 切换展示原图/编辑图
const showOrigin = async (item) => {
    try {
        if (!item) return;
        // 如果正在加载，直接返回
        if (item._loadingOrigin) return;

        // 已经是原图，则切回编辑图
        if (item._isOriginalShown) {
            item._switching = true;
            await preloadImage(item.mediaurl).catch(() => { });
            item._displayUrl = item.mediaurl;
            item._isOriginalShown = false;
            setTimeout(() => { item._switching = false; }, 280);
            return;
        }

        if (!item.id) {
            ElMessage.error('缺少媒体ID，无法获取原图');
            return;
        }

        item._loadingOrigin = true;
        // 如果没有缓存的originUrl，则请求后端
        if (!item._originUrl) {
            const res = await getMediaOriginUrlService(item.id);
            const url = res?.data;
            if (!url) throw new Error('原图地址为空');
            item._originUrl = url;
        }

        // 平滑切换：先开启动画，预加载，再替换
        item._switching = true;
        await preloadImage(item._originUrl).catch(() => { });
        item._displayUrl = item._originUrl;
        item._isOriginalShown = true;
        setTimeout(() => { item._switching = false; }, 280);
    } catch (e) {
        console.error(e);
        ElMessage.error('获取原图失败');
    } finally {
        item._loadingOrigin = false;
    }
};

onMounted(() => {
    getMediaList();
});
</script>

<style scoped>
.library-container {
    padding: 20px;
    background-color: transparent;
    /* 继承主区域背景 */
}

.toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
}

.title {
    margin: 0;
    font-size: 18px;
}

.actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.sort-group :deep(.el-button.is-plain) {
    border-color: var(--el-border-color);
}

.sort-group :deep(.el-button--primary.is-plain) {
    /* 激活态：更明显 */
    border-color: color-mix(in srgb, var(--el-color-primary) 55%, transparent);
    background: color-mix(in srgb, var(--el-color-primary) 14%, transparent);
}

.waterfall-container {
    column-count: 5;
    column-gap: 16px;
}

.card,
.skeleton-card {
    break-inside: avoid;
    margin-bottom: 16px;
    background-color: var(--app-surface);
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--el-border-color);
    /* Softer, gradient-like shadow */
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.05);
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.card:hover {
    transform: translateY(-4px);
    /* Subtle highlight */
    border-color: var(--el-border-color-light);
    /* Enhanced shadow on hover */
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
}

.card-media:hover .media-actions {
    opacity: 1;
}

/* 顶部工具条（常显，位于图片上方） */
.media-header {
    display: flex;
    gap: 8px;
    padding: 8px;
    background: var(--app-surface-2);
    border-bottom: 1px solid var(--el-border-color);
}

.media-header .el-button {
    border-radius: 999px;
    height: 26px;
    padding: 0 10px;
    border-color: color-mix(in srgb, var(--app-primary) 35%, transparent);
    color: var(--app-primary);
    background: color-mix(in srgb, var(--app-primary) 8%, transparent);
}

.media-header .el-button:hover {
    background: color-mix(in srgb, var(--app-primary) 14%, transparent);
}

.media-header .detail-btn {
    border-color: #f37a24;
    color: #f37a24;
    background: color-mix(in srgb, #f37a24 10%, transparent);
}

.media-header .detail-btn:hover {
    color: #f37a24;
    border-color: #f37a24;
    background: color-mix(in srgb, #f37a24 20%, transparent);
}

.card-media {
    margin-top: 0;
}

.card-media {
    position: relative;
    /* No border needed here, card has border */
}

.media-actions {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 2;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.download-btn {
    background-color: rgba(255, 255, 255, 0.8) !important;
    border-color: transparent !important;
}

.download-btn:hover {
    background-color: rgba(255, 255, 255, 1) !important;
}

.badge {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 2;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    font-size: 12px;
    padding: 3px 9px;
    border-radius: 999px;
}

.media {
    width: 100%;
    display: block;
    max-height: 520px;
    object-fit: cover;
}

.card-body {
    padding: 12px 14px 10px 14px;
    border-top: 1px solid var(--el-border-color);
}

.prompt-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
}

.prompt-text {
    flex: 1;
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.6;
    font-size: 14px;
    color: var(--el-text-color-primary);
    /* 取消行数裁剪，改为按字符数限制 */
}

.copy-btn {
    flex: none;
}

.meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
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

.media-id {
    color: var(--el-text-color-secondary);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
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

/* Remove original colorful border */
.card::before {
    display: none;
}

.pagination-wrapper {
    display: flex;
    justify-content: center;
    padding: 16px 0 8px;
}

/* Origin button & transition styles */
.card-actions {
    margin-top: 10px;
    display: flex;
    justify-content: flex-start;
}

.card-actions .origin-btn {
    border: none;
    color: #fff;
    background: var(--app-primary);
    background: linear-gradient(135deg, var(--app-primary), color-mix(in srgb, var(--app-primary) 60%, #36cfc9));
    box-shadow: 0 6px 14px color-mix(in srgb, var(--app-primary) 35%, transparent);
    transition: transform 0.15s ease, box-shadow 0.2s ease;
}

.card-actions .origin-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 18px color-mix(in srgb, var(--app-primary) 45%, transparent);
}

/* Smooth media swap effect */
.media {
    transition: filter 0.28s ease, opacity 0.28s ease, transform 0.28s ease;
}

.card-media.switching .media {
    filter: blur(2px) grayscale(6%);
    opacity: 0.75;
    transform: scale(0.985);
}

/* Responsive adjustments */
@media (max-width: 1400px) {
    .waterfall-container {
        column-count: 4;
    }
}

@media (max-width: 1100px) {
    .waterfall-container {
        column-count: 3;
    }
}

@media (max-width: 768px) {
    .waterfall-container {
        column-count: 2;
    }
}

@media (max-width: 520px) {
    .waterfall-container {
        column-count: 1;
    }
}
</style>
