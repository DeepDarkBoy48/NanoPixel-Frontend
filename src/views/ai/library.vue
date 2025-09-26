<template>
    <div class="library-container">
        <div class="toolbar">
            <h2 class="title">灵感库</h2>
            <div class="gallery-tip">
                <div class="tip-content">
                    <span class="tip-text">去"我的图集"公开作品，让更多人发现你的创意</span>
                    <el-button type="primary" size="small" class="gallery-btn" @click="goToGallery">
                        前往图集
                    </el-button>
                </div>
            </div>
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
                    <div class="card-media" :class="{ switching: item._switching }" @click="goToDetail(item)"
                        role="button" :aria-label="`查看 ${item.username || item.userName || ''} 的作品详情`" tabindex="0"
                        @keydown.enter.prevent="goToDetail(item)" @keydown.space.prevent="goToDetail(item)">
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
const DISPLAY_CHAR_LIMIT = 50;
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
    animation: containerFadeIn 0.8s ease-out forwards;
    opacity: 0;
    transform: translateY(20px);
}

@keyframes containerFadeIn {
    to {
        opacity: 1;
        transform: translateY(0);
    }
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
    background: linear-gradient(135deg, var(--el-text-color-primary) 0%, var(--app-primary) 70%, #4facfe 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 600;
    animation: titleShimmer 3s ease-in-out infinite;
    background-size: 200% 100%;
}

@keyframes titleShimmer {

    0%,
    100% {
        background-position: 0% 50%;
    }

    50% {
        background-position: 100% 50%;
    }
}

.actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.actions .el-button:not(.sort-group .el-button) {
    background: linear-gradient(135deg, var(--app-primary) 0%, #4facfe 100%);
    border: none;
    color: #fff;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    position: relative;
    overflow: hidden;
}

.actions .el-button:not(.sort-group .el-button)::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s ease;
}

.actions .el-button:not(.sort-group .el-button):hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.actions .el-button:not(.sort-group .el-button):hover::before {
    left: 100%;
}

.sort-group :deep(.el-button.is-plain) {
    border-color: var(--el-border-color);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

.sort-group :deep(.el-button.is-plain::before) {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.2), transparent);
    transition: left 0.5s ease;
}

.sort-group :deep(.el-button.is-plain:hover::before) {
    left: 100%;
}

.sort-group :deep(.el-button.is-plain:hover) {
    border-color: color-mix(in srgb, var(--app-primary) 40%, transparent);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
    transform: translateY(-2px);
}

.sort-group :deep(.el-button--primary.is-plain) {
    /* 激活态：更明显 */
    border-color: color-mix(in srgb, var(--el-color-primary) 55%, transparent);
    background: linear-gradient(135deg,
            color-mix(in srgb, var(--el-color-primary) 14%, transparent) 0%,
            color-mix(in srgb, var(--el-color-primary) 10%, transparent) 100%);
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
    animation: activeButtonPulse 2s ease-in-out infinite;
}

@keyframes activeButtonPulse {

    0%,
    100% {
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
    }

    50% {
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }
}

.waterfall-container {
    column-count: 5;
    column-gap: 16px;
}

.card,
.skeleton-card {
    break-inside: avoid;
    margin-bottom: 16px;
    background: linear-gradient(145deg, var(--app-surface) 0%, color-mix(in srgb, var(--app-surface) 96%, #667eea 4%) 100%);
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--el-border-color);
    /* Softer, gradient-like shadow */
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.05);
    transition: all 0.4s ease;
    animation: cardSlideIn 0.8s ease-out forwards;
    opacity: 0;
    transform: translateY(30px) scale(0.95);
    position: relative;
}

.skeleton-card {
    animation: skeletonFadeIn 0.6s ease-out forwards;
}

@keyframes skeletonFadeIn {
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 70% 30%, rgba(102, 126, 234, 0.05) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    z-index: 0;
}

.card>* {
    position: relative;
    z-index: 1;
}

/* 错开动画 - 根据卡片在瀑布流中的位置 */
.card:nth-child(5n+1) {
    animation-delay: 0.1s;
}

.card:nth-child(5n+2) {
    animation-delay: 0.2s;
}

.card:nth-child(5n+3) {
    animation-delay: 0.3s;
}

.card:nth-child(5n+4) {
    animation-delay: 0.4s;
}

.card:nth-child(5n+5) {
    animation-delay: 0.5s;
}

@keyframes cardSlideIn {
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.card:hover {
    transform: translateY(-8px) scale(1.02);
    /* Subtle highlight */
    border-color: color-mix(in srgb, var(--app-primary) 40%, transparent);
    /* Enhanced shadow on hover */
    box-shadow:
        0 20px 40px rgba(0, 0, 0, 0.12),
        0 0 0 1px rgba(102, 126, 234, 0.1) inset,
        0 0 30px rgba(102, 126, 234, 0.15);
}

.card:hover::before {
    opacity: 1;
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
    transition: all 0.3s ease;
}

.card:hover .media-header {
    background: color-mix(in srgb, var(--app-surface-2) 90%, #667eea 10%);
    border-bottom-color: color-mix(in srgb, var(--app-primary) 30%, transparent);
}

.media-header .el-button {
    border-radius: 999px;
    height: 26px;
    padding: 0 10px;
    border-color: color-mix(in srgb, var(--app-primary) 35%, transparent);
    color: var(--app-primary);
    background: linear-gradient(135deg,
            color-mix(in srgb, var(--app-primary) 8%, transparent) 0%,
            color-mix(in srgb, var(--app-primary) 5%, transparent) 100%);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    box-shadow: 0 2px 6px rgba(102, 126, 234, 0.1);
}

.media-header .el-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.2), transparent);
    transition: left 0.5s ease;
}

.media-header .el-button:hover {
    background: linear-gradient(135deg,
            color-mix(in srgb, var(--app-primary) 15%, transparent) 0%,
            color-mix(in srgb, var(--app-primary) 10%, transparent) 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.media-header .el-button:hover::before {
    left: 100%;
}

.card:hover .media-header .el-button {
    animation: buttonPulse 2s ease-in-out infinite;
    border-color: color-mix(in srgb, var(--app-primary) 50%, transparent);
}

.card:hover .media-header .detail-btn {
    animation: detailButtonPulse 2s ease-in-out infinite;
    border-color: color-mix(in srgb, #f37a24 60%, transparent);
}

@keyframes buttonPulse {

    0%,
    100% {
        box-shadow: 0 2px 6px rgba(102, 126, 234, 0.1);
    }

    50% {
        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        transform: translateY(-1px) scale(1.02);
    }
}

@keyframes detailButtonPulse {

    0%,
    100% {
        box-shadow: 0 2px 6px rgba(243, 122, 36, 0.15);
    }

    50% {
        box-shadow: 0 4px 15px rgba(243, 122, 36, 0.35);
        transform: translateY(-1px) scale(1.02);
    }
}

.media-header .detail-btn {
    border-color: #f37a24;
    color: #f37a24;
    background: linear-gradient(135deg,
            color-mix(in srgb, #f37a24 10%, transparent) 0%,
            color-mix(in srgb, #f37a24 6%, transparent) 100%);
    box-shadow: 0 2px 6px rgba(243, 122, 36, 0.15);
}

.media-header .detail-btn::before {
    background: linear-gradient(90deg, transparent, rgba(243, 122, 36, 0.2), transparent);
}

.media-header .detail-btn:hover {
    color: #f37a24;
    border-color: #f37a24;
    background: linear-gradient(135deg,
            color-mix(in srgb, #f37a24 20%, transparent) 0%,
            color-mix(in srgb, #f37a24 15%, transparent) 100%);
    box-shadow: 0 4px 12px rgba(243, 122, 36, 0.25);
}

.card-media {
    margin-top: 0;
    position: relative;
    overflow: hidden;
    /* No border needed here, card has border */
    cursor: pointer;
    outline: none;
}

.card-media::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg,
            transparent 0%,
            rgba(102, 126, 234, 0.08) 25%,
            transparent 50%,
            rgba(79, 172, 254, 0.08) 75%,
            transparent 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    z-index: 2;
}

.card-media:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 45%, transparent);
}

.card:hover .card-media::after {
    opacity: 1;
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
    z-index: 3;
    background: linear-gradient(135deg, #1a4fff 0%, #667eea 100%);
    color: #fff;
    font-size: 12px;
    padding: 3px 9px;
    border-radius: 999px;
    transition: all 0.3s ease;
    animation: badgePulse 2s ease-in-out infinite;
    box-shadow: 0 2px 8px rgba(26, 79, 255, 0.4);
    backdrop-filter: blur(8px);
}

.badge:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 15px rgba(26, 79, 255, 0.6);
}

@keyframes badgePulse {

    0%,
    100% {
        transform: scale(1);
        box-shadow: 0 2px 8px rgba(26, 79, 255, 0.4);
    }

    50% {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(26, 79, 255, 0.6);
    }
}

.media {
    width: 100%;
    display: block;
    max-height: 520px;
    object-fit: cover;
    transition: all 0.4s ease;
    position: relative;
    z-index: 1;
}

.card:hover .media {
    transform: scale(1.05);
    filter: brightness(1.05) contrast(1.05);
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
    flex: 1;
    min-width: 0;
}

.meta-right {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
}

.media-id {
    color: var(--el-text-color-secondary);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.model-tag {
    line-height: 1;
}

.username {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.review-count {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 8px;
    border-radius: 999px;
    background: linear-gradient(135deg,
            color-mix(in srgb, var(--el-color-warning) 15%, transparent) 0%,
            color-mix(in srgb, var(--el-color-warning) 10%, transparent) 100%);
    border: 1px solid color-mix(in srgb, var(--el-color-warning) 40%, transparent);
    color: var(--el-color-warning);
    font-weight: 600;
    font-size: 13px;
    line-height: 1.2;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(255, 193, 7, 0.2);
}

.review-count::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 193, 7, 0.3), transparent);
    transition: left 0.5s ease;
}

.review-count:hover::before {
    left: 100%;
}

.review-icon {
    color: var(--el-color-warning);
    font-size: 16px;
    transition: all 0.3s ease;
    animation: reviewIconPulse 2s ease-in-out infinite;
}

.hot-flag {
    display: inline-flex;
    align-items: center;
    margin-left: 2px;
    font-size: 16px;
    line-height: 1;
    animation: hotFlagFlicker 1.5s ease-in-out infinite;
}

.review-count:hover {
    background: linear-gradient(135deg,
            color-mix(in srgb, var(--el-color-warning) 25%, transparent) 0%,
            color-mix(in srgb, var(--el-color-warning) 20%, transparent) 100%);
    border-color: color-mix(in srgb, var(--el-color-warning) 60%, transparent);
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(255, 193, 7, 0.3);
}

.review-count:hover .review-icon {
    transform: scale(1.2);
    color: #ff9800;
}

.card:hover .review-count {
    animation: reviewCountPulse 2s ease-in-out infinite;
    border-color: color-mix(in srgb, var(--el-color-warning) 60%, transparent);
}

@keyframes reviewCountPulse {

    0%,
    100% {
        box-shadow: 0 2px 8px rgba(255, 193, 7, 0.2);
        transform: scale(1);
    }

    50% {
        box-shadow: 0 4px 15px rgba(255, 193, 7, 0.4);
        transform: scale(1.05);
    }
}

.review-count:active {
    transform: translateY(0);
}

@keyframes reviewIconPulse {

    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.1);
    }
}

@keyframes hotFlagFlicker {

    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }

    50% {
        opacity: 0.7;
        transform: scale(1.1);
    }
}

/* 卡片特效样式已在上方定义 */

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

    /* 紧凑化底部信息，确保显示时间与评论 */
    .review-count {
        padding: 2px 6px;
        font-size: 12px;
    }

    .create-time {
        font-size: 12px;
        white-space: nowrap;
    }
}
</style>
