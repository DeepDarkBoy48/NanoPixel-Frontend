<template>
    <div class="library-container">
        <div class="toolbar">
            <h2 class="title">灵感库</h2>
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

        <el-empty v-else-if="!mediaList.length" description="暂无内容">
            <el-button type="primary" @click="refresh">刷新试试</el-button>
        </el-empty>

        <template v-else>
            <div class="waterfall-container">
                <div class="card" v-for="item in mediaList" :key="item.id ?? item.createtime">
                    <div class="card-media" :class="{ switching: item._switching }">
                        <span v-if="isVideo(item._displayUrl)" class="badge">视频</span>
                        <video v-if="isVideo(item._displayUrl)" :src="item._displayUrl" autoplay loop muted playsinline
                            class="media"></video>
                        <el-image v-else :src="item._displayUrl" fit="cover" class="media"
                            :preview-src-list="[item._displayUrl]" preview-teleported lazy hide-on-click-modal />
                        <div class="media-actions">
                            <el-button :icon="Download" circle @click="downloadMedia(item.mediaurl)"
                                class="download-btn" />
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="prompt-row">
                            <div class="prompt-text">{{ item.prompt }}</div>
                            <el-button link type="primary" class="copy-btn"
                                @click="copyPrompt(item.prompt)">复制</el-button>
                        </div>
                        <div class="card-actions">
                            <el-button
                                :loading="item._loadingOrigin"
                                round
                                class="origin-btn"
                                :type="item._isOriginalShown ? 'success' : 'primary'"
                                @click="showOrigin(item)"
                            >
                                <el-icon style="margin-right:6px;">
                                    <component :is="item._isOriginalShown ? RefreshLeft : Picture" />
                                </el-icon>
                                {{ item._isOriginalShown ? '返回编辑图' : '查看原图' }}
                            </el-button>
                        </div>
                        <div class="meta">
                            <div class="meta-left">
                                <span class="username">{{ item.userName }}</span>
                                <span v-if="item.id" class="media-id">#{{ item.id }}</span>
                            </div>
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
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getAllLibraryService, getMediaOriginUrlService } from '@/api/ai.js';
import { ElMessage } from 'element-plus';
import { formatDate } from '@/utils/format';
import { Download, Picture, RefreshLeft } from '@element-plus/icons-vue';

const mediaList = ref([]);
const loading = ref(false);
const skeletonCount = 10;

// 分页
const pageNum = ref(1);
const pageSize = ref(15);
const total = ref(0);

const refresh = () => {
    getMediaList(pageNum.value);
};

const getMediaList = async (page = 1) => {
    try {
        loading.value = true;
        pageNum.value = page;
        const response = await getAllLibraryService(pageNum.value, pageSize.value);
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
            await preloadImage(item.mediaurl).catch(() => {});
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
        await preloadImage(item._originUrl).catch(() => {});
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
    background-color: #f5f7fa;
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

.waterfall-container {
    column-count: 5;
    column-gap: 16px;
}

.card,
.skeleton-card {
    break-inside: avoid;
    margin-bottom: 16px;
    background-color: #fff;
    border-radius: 10px;
    overflow: hidden;
    border: 2px solid #ebeef5;
    /* Softer, gradient-like shadow */
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.05);
    transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.card:hover {
    transform: translateY(-4px);
    /* Subtle highlight */
    border-color: #dcdfe6;
    /* Enhanced shadow on hover */
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
}

.card-media:hover .media-actions {
    opacity: 1;
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
    line-height: 1.5;
    font-size: 14px;
    color: #303133;
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
    color: #909399;
}

.meta-left {
    display: flex;
    align-items: center;
    gap: 8px;
}

.media-id {
    color: #a6a9ad;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
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

.origin-btn {
    border: none;
    color: #fff;
    background: linear-gradient(135deg, #409EFF, #36cfc9);
    box-shadow: 0 6px 14px rgba(64, 158, 255, 0.25);
    transition: transform 0.15s ease, box-shadow 0.2s ease;
}

.origin-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 18px rgba(64, 158, 255, 0.28);
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
