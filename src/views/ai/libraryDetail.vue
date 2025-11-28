<template>
    <div class="detail-container">
        <!-- <div class="detail-heading">
            <h2 class="detail-title">媒体详情</h2>
        </div> -->

        <div v-if="loading" class="detail-loading">
            <el-skeleton :rows="6" animated />
        </div>

        <el-empty v-else-if="!detail" description="未找到对应媒体">
            <el-button type="primary" @click="goBack">返回列表</el-button>
        </el-empty>

        <div v-else class="detail-board">
            <div class="board-header">
                <el-button size="small" plain @click="goBack">
                    <el-icon class="toolbar-icon">
                        <ArrowLeft />
                    </el-icon>
                    返回
                </el-button>
            </div>

            <div class="board-body">
                <section class="workflow">
                    <div class="stage-row">
                        <div class="stage-card">
                            <header>
                                <h3>原图</h3>
                                <p>起始素材</p>
                            </header>
                            <div class="media-frame">
                                <template v-if="detail.originurl">
                                    <span v-if="isVideo(detail.originurl)" class="badge">视频</span>
                                    <video v-if="isVideo(detail.originurl)" :src="detail.originurl" controls playsinline
                                        class="media-element"></video>
                                    <el-image v-else :src="detail.originurl" fit="contain" class="media-element"
                                        :preview-src-list="[detail.originurl]" :initial-index="0" preview-teleported
                                        :hide-on-click-modal="true" />
                                </template>
                                <el-empty v-else description="暂无原图" :image-size="120" class="placeholder" />
                            </div>
                        </div>

                        <div class="stage-card">
                            <header>
                                <h3>AI 输出</h3>
                                <p>生成结果</p>
                            </header>
                            <div class="media-frame">
                                <span v-if="isVideo(detail.mediaurl)" class="badge">视频</span>
                                <video v-if="isVideo(detail.mediaurl)" :src="detail.mediaurl" controls playsinline
                                    class="media-element"></video>
                                <el-image v-else :src="detail.mediaurl" fit="contain" class="media-element"
                                    :preview-src-list="[detail.mediaurl]" :initial-index="0" preview-teleported
                                    :hide-on-click-modal="true" />
                            </div>
                        </div>
                    </div>



                    <section class="prompt-card">
                        <header>
                            <h3>提示词</h3>
                            <el-button v-if="detail.prompt" size="small" link type="primary"
                                @click="copyPrompt(detail.prompt)">复制</el-button>
                        </header>
                        <div class="prompt-content" v-if="detail.prompt" @click="copyPrompt(detail.prompt, $event)"
                            title="点击复制提示词">
                            {{ detail.prompt }}
                            <div class="copy-hint">
                                <el-icon>
                                    <DocumentCopy />
                                </el-icon>
                                <span>点击复制</span>
                            </div>
                        </div>
                        <div class="prompt-content empty" v-else>暂无提示词</div>
                    </section>

                    <section class="meta-card">
                        <header>
                            <h3>其他信息</h3>
                        </header>
                        <div class="meta-grid">
                            <div class="meta-item">
                                <span class="label">媒体 ID</span>
                                <span class="value">#{{ detail.id }}</span>
                            </div>
                            <div class="meta-item">
                                <span class="label">作者</span>
                                <span class="value">{{ detail.username ?? '未知' }}</span>
                            </div>
                            <div class="meta-item">
                                <span class="label">发布时间</span>
                                <span class="value">{{ formatTime(detail.createtime) }}</span>
                            </div>
                            <div class="meta-item">
                                <span class="label">模型</span>
                                <span class="value">{{ detail.model || '未提供' }}</span>
                            </div>
                            <div class="meta-item">
                                <span class="label">生成地址</span>
                                <span class="value">
                                    <el-link v-if="detail.mediaurl" :href="detail.mediaurl" target="_blank"
                                        type="primary">打开链接</el-link>
                                    <span v-else>暂无</span>
                                </span>
                            </div>
                            <div class="meta-item">
                                <span class="label">原图地址</span>
                                <span class="value">
                                    <el-link v-if="detail.originurl" :href="detail.originurl" target="_blank"
                                        type="primary">打开链接</el-link>
                                    <span v-else>暂无</span>
                                </span>
                            </div>
                        </div>
                    </section>
                </section>

                <aside class="comment-panel">
                    <header>
                        <div>
                            <h3>评论区</h3>
                            <p>围绕该作品的讨论与反馈</p>
                        </div>
                        <el-button size="small" type="primary" plain @click="toggleCommentForm">
                            {{ showCommentForm ? '收起' : '新增评论' }}
                        </el-button>
                    </header>

                    <div v-if="showCommentForm" class="comment-form" :class="{ 'is-submitting': submittingReview }">
                        <el-input v-model="newReviewContent" type="textarea" :rows="4" maxlength="500" show-word-limit
                            placeholder="写下你的想法，最多 500 字" />
                        <div class="comment-form__actions">
                            <el-button size="small" @click="cancelReview" :disabled="submittingReview">
                                取消
                            </el-button>
                            <el-button size="small" type="primary"
                                :disabled="!newReviewContent.trim() || submittingReview" :loading="submittingReview"
                                @click="submitReview">
                                发布
                            </el-button>
                        </div>
                    </div>

                    <div class="comment-list" v-loading="reviewsLoading">
                        <el-empty v-if="!reviewsLoading && !normalizedReviews.length" description="暂时没有评论" />
                        <div v-else class="comment-item" v-for="review in normalizedReviews" :key="review.id">
                            <div class="comment-avatar">{{ review.initials }}</div>
                            <div class="comment-body">
                                <div class="comment-head">
                                    <span class="comment-author">{{ review.userName }}</span>
                                    <span class="comment-time">{{ review.time }}</span>
                                </div>
                                <p class="comment-content">{{ review.content }}</p>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft, DocumentCopy } from '@element-plus/icons-vue';
import { getMediaByIdService, listReviewsByMediaService, addReviewService } from '@/api/ai.js';
import { formatDate } from '@/utils/format';

const route = useRoute();
const router = useRouter();

const detail = ref(null);
const loading = ref(false);
const reviews = ref([]);
const reviewsLoading = ref(false);
const showCommentForm = ref(false);
const newReviewContent = ref('');
const submittingReview = ref(false);

const mediaId = computed(() => route.params.mediaId);

const loadDetail = async (id) => {
    if (!id) {
        detail.value = null;
        reviews.value = [];
        return;
    }
    try {
        loading.value = true;
        const res = await getMediaByIdService(id);
        const data = res?.data;
        detail.value = data || null;
        if (!detail.value) {
            ElMessage.warning('未找到该媒体');
        }
        await fetchReviews(id);
    } catch (error) {
        console.error(error);
        detail.value = null;
        ElMessage.error('获取媒体详情失败');
    } finally {
        loading.value = false;
    }
};

const fetchReviews = async (id) => {
    if (!id) {
        reviews.value = [];
        return;
    }
    try {
        reviewsLoading.value = true;
        const response = await listReviewsByMediaService(id);
        const list = Array.isArray(response?.data) ? response.data : [];
        reviews.value = list;
    } catch (error) {
        console.error('加载评论失败', error);
        ElMessage.error('加载评论失败');
        reviews.value = [];
    } finally {
        reviewsLoading.value = false;
    }
};

const toggleCommentForm = () => {
    showCommentForm.value = !showCommentForm.value;
    if (!showCommentForm.value) {
        newReviewContent.value = '';
    }
};

const cancelReview = () => {
    newReviewContent.value = '';
    showCommentForm.value = false;
};

const submitReview = async () => {
    const media = detail.value?.id ?? mediaId.value;
    const content = newReviewContent.value.trim();
    if (!media || !content) return;
    try {
        submittingReview.value = true;
        await addReviewService({
            mediaId: Number(media),
            content,
        });
        ElMessage.success('评论已发布');
        newReviewContent.value = '';
        showCommentForm.value = false;
        await fetchReviews(media);
    } catch (error) {
        console.error('发布评论失败', error);
        ElMessage.error('发布评论失败');
    } finally {
        submittingReview.value = false;
    }
};

const normalizedReviews = computed(() => {
    return reviews.value.map((item, index) => {
        const name = item?.userName ?? '匿名用户';
        return {
            id: item?.id ?? `temp-${index}`,
            content: item?.content ?? '',
            userName: String(name),
            initials: getInitials(String(name)),
            time: formatTime(item?.createTime),
        };
    });
});

const getInitials = (name) => {
    if (!name) return '友';
    const clean = String(name).trim();
    if (!clean) return '友';
    const parts = clean.split(/\s+/);
    if (parts.length === 1) {
        const segment = parts[0];
        return segment.slice(0, 2).toUpperCase();
    }
    const first = parts[0].charAt(0);
    const last = parts[parts.length - 1].charAt(0);
    return `${first}${last}`.toUpperCase();
};

const goBack = () => {
    router.push('/ai/library');
};

const isVideo = (url) => {
    if (!url) return false;
    const ext = ['.mp4', '.webm', '.ogg'];
    const lower = url.toLowerCase();
    return ext.some(item => lower.endsWith(item));
};

const formatTime = (time) => {
    if (!time) return '';
    return formatDate(time, 'YYYY-MM-DD HH:mm');
};

const copyPrompt = async (text, event) => {
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

        // 添加复制成功的视觉反馈
        if (event && event.target) {
            const target = event.target.closest('.prompt-content');
            const hintSpan = target?.querySelector('.copy-hint span');
            if (target && hintSpan) {
                const originalText = hintSpan.textContent;
                target.classList.add('copy-success');
                hintSpan.textContent = '已复制!';

                setTimeout(() => {
                    target.classList.remove('copy-success');
                    hintSpan.textContent = originalText;
                }, 600);
            }
        }

        ElMessage.success('✅ 提示词已复制到剪贴板');
    } catch (error) {
        ElMessage.error('复制失败');
    }
};

onMounted(() => {
    loadDetail(mediaId.value);
});

watch(mediaId, (id) => {
    cancelReview();
    loadDetail(id);
});
</script>

<style scoped>
.detail-container {
    padding: 24px;
}

.detail-heading {
    margin-bottom: 20px;
}

.detail-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
}

.toolbar-icon {
    margin-right: 6px;
}

.detail-loading {
    padding: 24px;
    background-color: var(--app-surface);
    border-radius: 16px;
    border: 1px solid var(--el-border-color);
}

.detail-board {
    position: relative;
    padding: 16px 20px 20px;
    border: 1px solid color-mix(in srgb, var(--el-border-color) 80%, transparent);
    border-radius: 28px;
    background: linear-gradient(145deg, color-mix(in srgb, var(--app-surface) 94%, #fff 6%) 0%, color-mix(in srgb, var(--app-surface) 96%, #D97459 4%) 100%);
    box-shadow:
        inset 0 0 0 1px color-mix(in srgb, var(--el-border-color) 35%, transparent),
        0 20px 60px rgba(92, 75, 58, 0.08);
    animation: boardFadeIn 1s ease-out forwards;
    opacity: 0;
    transform: translateY(20px);
}

@keyframes boardFadeIn {
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.board-header {
    display: flex;
    justify-content: flex-start;
    margin-bottom: 12px;
}

.board-header .el-button {
    background: linear-gradient(135deg, var(--app-surface) 0%, color-mix(in srgb, var(--app-surface) 90%, #D97459 10%) 100%);
    border: 1px solid color-mix(in srgb, var(--app-primary) 30%, transparent);
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(217, 116, 89, 0.1);
}

.board-header .el-button:hover {
    background: linear-gradient(135deg, var(--app-primary) 0%, #F4A261 100%);
    color: #fff;
    border-color: var(--app-primary);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(217, 116, 89, 0.3);
}

.board-header .el-button .toolbar-icon {
    transition: transform 0.3s ease;
}

.board-header .el-button:hover .toolbar-icon {
    transform: translateX(-2px);
}




.board-body {
    display: flex;
    gap: 32px;
}

.workflow {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.stage-row {
    display: flex;
    gap: 20px;
}

.stage-card {
    flex: 1;
    border-radius: 28px;
    border: 1px solid color-mix(in srgb, var(--el-border-color) 80%, transparent);
    background: linear-gradient(145deg, var(--app-surface) 0%, color-mix(in srgb, var(--app-surface) 96%, #D97459 4%) 100%);
    box-shadow: 0 16px 36px rgba(92, 75, 58, 0.08);
    padding: 16px 18px 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: all 0.4s ease;
    animation: cardSlideUp 0.8s ease-out forwards;
    transform: translateY(20px);
    opacity: 0;
    position: relative;
    overflow: hidden;
}

.stage-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 80% 20%, rgba(217, 116, 89, 0.05) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
}

.stage-card>* {
    position: relative;
    z-index: 1;
}

.stage-card:hover {
    transform: translateY(-8px);
    box-shadow:
        0 25px 50px rgba(92, 75, 58, 0.15),
        0 0 0 1px rgba(217, 116, 89, 0.1) inset,
        0 0 30px rgba(217, 116, 89, 0.1);
    border-color: color-mix(in srgb, var(--app-primary) 30%, transparent);
}

.stage-card:nth-child(1) {
    animation-delay: 0.2s;
}

.stage-card:nth-child(2) {
    animation-delay: 0.4s;
}

@keyframes cardSlideUp {
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.stage-card header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    background: linear-gradient(135deg, var(--el-text-color-primary) 0%, var(--app-primary) 70%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    transition: all 0.3s ease;
}

.stage-card:hover header h3 {
    background: linear-gradient(135deg, var(--app-primary) 0%, #F4A261 70%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.stage-card header p {
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
    height: clamp(330px, 48vh, 480px);
    border-radius: 22px;
    overflow: hidden;
    background: color-mix(in srgb, var(--app-surface-2) 70%, #fff 30%);
    transition: all 0.4s ease;
    cursor: zoom-in;
    box-shadow:
        inset 0 0 0 1px rgba(255, 255, 255, 0.1),
        0 4px 15px rgba(0, 0, 0, 0.1);
}

.media-frame::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg,
            transparent 0%,
            rgba(217, 116, 89, 0.05) 25%,
            transparent 50%,
            rgba(244, 162, 97, 0.05) 75%,
            transparent 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    z-index: 1;
}

.media-frame:hover {
    transform: scale(1.02);
    box-shadow:
        inset 0 0 0 2px rgba(217, 116, 89, 0.2),
        0 8px 30px rgba(0, 0, 0, 0.15),
        0 0 40px rgba(217, 116, 89, 0.1);
}

.media-frame:hover::after {
    opacity: 1;
}

.media-element,
.media-frame :deep(img) {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: var(--app-surface-2);
    transition: all 0.3s ease;
    position: relative;
    z-index: 2;
}

.media-frame:hover .media-element,
.media-frame:hover :deep(img) {
    filter: brightness(1.05) contrast(1.05);
}

.badge {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 3;
    background: linear-gradient(135deg, #D97459 0%, #F4A261 100%);
    color: #fff;
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 999px;
    transition: all 0.3s ease;
    animation: badgePulse 2s ease-in-out infinite;
    box-shadow: 0 2px 8px rgba(217, 116, 89, 0.3);
}

.badge:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 15px rgba(217, 116, 89, 0.5);
}

@keyframes badgePulse {

    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.05);
    }
}

.placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* removed connector arrows */

.prompt-card,
.meta-card {
    border-radius: 26px;
    border: 1px solid color-mix(in srgb, var(--el-border-color) 80%, transparent);
    background: linear-gradient(145deg, var(--app-surface) 0%, color-mix(in srgb, var(--app-surface) 95%, #D97459 5%) 100%);
    box-shadow: 0 14px 34px rgba(92, 75, 58, 0.07);
    padding: 18px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    transition: all 0.4s ease;
    animation: cardSlideUp 0.8s ease-out forwards;
    transform: translateY(20px);
    opacity: 0;
    position: relative;
    overflow: hidden;
}

.prompt-card::before,
.meta-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 70% 30%, rgba(244, 162, 97, 0.04) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
}

.prompt-card>*,
.meta-card>* {
    position: relative;
    z-index: 1;
}

.prompt-card:hover,
.meta-card:hover {
    transform: translateY(-6px);
    box-shadow:
        0 20px 40px rgba(92, 75, 58, 0.12),
        0 0 0 1px rgba(244, 162, 97, 0.1) inset,
        0 0 25px rgba(244, 162, 97, 0.08);
    border-color: color-mix(in srgb, var(--app-primary) 25%, transparent);
}

.prompt-card {
    animation-delay: 0.6s;
}

.meta-card {
    animation-delay: 0.8s;
}

.prompt-card header,
.meta-card header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.prompt-card header h3,
.meta-card header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    background: linear-gradient(135deg, var(--el-text-color-primary) 0%, var(--app-primary) 80%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    transition: all 0.3s ease;
}

.prompt-card:hover header h3,
.meta-card:hover header h3 {
    background: linear-gradient(135deg, var(--app-primary) 0%, #F4A261 80%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.prompt-card header .el-button {
    background: linear-gradient(135deg, color-mix(in srgb, var(--app-primary) 10%, transparent) 0%, color-mix(in srgb, var(--app-primary) 15%, transparent) 100%);
    border: 1px solid color-mix(in srgb, var(--app-primary) 30%, transparent);
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(217, 116, 89, 0.1);
}

.prompt-card header .el-button:hover {
    background: linear-gradient(135deg, var(--app-primary) 0%, #F4A261 100%);
    color: #fff;
    border-color: var(--app-primary);
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(217, 116, 89, 0.3);
}

.prompt-content {
    border-radius: 18px;
    border: 1px solid color-mix(in srgb, var(--app-primary) 18%, transparent);
    background: linear-gradient(135deg,
            color-mix(in srgb, var(--app-primary) 12%, transparent) 0%,
            color-mix(in srgb, var(--app-primary) 8%, transparent) 100%);
    padding: 18px;
    line-height: 1.7;
    white-space: pre-wrap;
    color: var(--el-text-color-primary);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    user-select: none;
}

.prompt-content::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg,
            transparent 0%,
            rgba(217, 116, 89, 0.1) 50%,
            transparent 100%);
    transition: left 0.5s ease;
    pointer-events: none;
}

.prompt-content:hover {
    border-color: color-mix(in srgb, var(--app-primary) 30%, transparent);
    background: linear-gradient(135deg,
            color-mix(in srgb, var(--app-primary) 15%, transparent) 0%,
            color-mix(in srgb, var(--app-primary) 10%, transparent) 100%);
    box-shadow: 0 4px 15px rgba(217, 116, 89, 0.1);
}

.prompt-content:hover::before {
    left: 100%;
}

.copy-hint {
    position: absolute;
    top: 12px;
    right: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
    background: rgba(0, 0, 0, 0.7);
    color: #fff;
    padding: 6px 10px;
    border-radius: 20px;
    font-size: 12px;
    opacity: 0;
    transform: translateY(-5px);
    transition: all 0.3s ease;
    pointer-events: none;
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.prompt-content:hover .copy-hint {
    opacity: 1;
    transform: translateY(0);
}

.copy-hint .el-icon {
    font-size: 14px;
    animation: copyIconPulse 2s ease-in-out infinite;
}

@keyframes copyIconPulse {

    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.1);
    }
}

.prompt-content:active {
    transform: scale(0.98);
    border-color: color-mix(in srgb, var(--app-primary) 40%, transparent);
}

.prompt-content.copy-success {
    background: linear-gradient(135deg,
            color-mix(in srgb, #67c23a 20%, transparent) 0%,
            color-mix(in srgb, #67c23a 15%, transparent) 100%) !important;
    border-color: color-mix(in srgb, #67c23a 40%, transparent) !important;
    animation: copySuccessFlash 0.6s ease-out;
}

.prompt-content.copy-success .copy-hint {
    background: rgba(103, 194, 58, 0.9) !important;
    opacity: 1 !important;
    transform: translateY(0) !important;
}

@keyframes copySuccessFlash {
    0% {
        box-shadow: 0 0 20px rgba(103, 194, 58, 0.8);
    }

    50% {
        box-shadow: 0 0 30px rgba(103, 194, 58, 0.6);
        transform: scale(1.02);
    }

    100% {
        box-shadow: 0 4px 15px rgba(217, 116, 89, 0.1);
        transform: scale(1);
    }
}

.prompt-content.empty {
    background: var(--app-surface-2);
    color: var(--el-text-color-secondary);
    border-style: dashed;
}

.meta-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 18px;
}

.meta-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 14px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--app-surface-2) 50%, transparent);
    border: 1px solid color-mix(in srgb, var(--el-border-color) 60%, transparent);
    transition: all 0.3s ease;
    animation: metaItemSlideIn 0.6s ease-out forwards;
    transform: translateX(-10px);
    opacity: 0;
}

.meta-item:hover {
    background: color-mix(in srgb, var(--app-surface-2) 80%, transparent);
    border-color: color-mix(in srgb, var(--app-primary) 40%, transparent);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(217, 116, 89, 0.1);
}

.meta-item:nth-child(1) {
    animation-delay: 0.1s;
}

.meta-item:nth-child(2) {
    animation-delay: 0.2s;
}

.meta-item:nth-child(3) {
    animation-delay: 0.3s;
}

.meta-item:nth-child(4) {
    animation-delay: 0.4s;
}

.meta-item:nth-child(5) {
    animation-delay: 0.5s;
}

.meta-item:nth-child(6) {
    animation-delay: 0.6s;
}

@keyframes metaItemSlideIn {
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.meta-item .label {
    font-size: 12px;
    background: linear-gradient(135deg, var(--el-text-color-secondary) 0%, color-mix(in srgb, var(--app-primary) 60%, var(--el-text-color-secondary) 40%) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    font-weight: 600;
    transition: all 0.3s ease;
}

.meta-item:hover .label {
    background: linear-gradient(135deg, var(--app-primary) 0%, #F4A261 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.meta-item .value {
    font-size: 14px;
    color: var(--el-text-color-primary);
    transition: all 0.3s ease;
    font-weight: 500;
}

.meta-item:hover .value {
    color: color-mix(in srgb, var(--app-primary) 80%, var(--el-text-color-primary) 20%);
    transform: translateX(2px);
}

.comment-panel {
    flex: 0 0 360px;
    background: linear-gradient(145deg, var(--app-surface) 0%, color-mix(in srgb, var(--app-surface) 95%, #D97459 5%) 100%);
    border-radius: 28px;
    border: 1px solid color-mix(in srgb, var(--el-border-color) 74%, transparent);
    padding: 20px;
    box-shadow:
        0 20px 50px rgba(92, 75, 58, 0.12),
        0 0 0 1px rgba(255, 255, 255, 0.05) inset,
        0 0 20px rgba(217, 116, 89, 0.1);
    display: flex;
    flex-direction: column;
    gap: 18px;
    max-height: clamp(560px, 85vh, 980px);
    position: relative;
    overflow: hidden;
}

.comment-panel::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
        radial-gradient(circle at 30% 20%, rgba(217, 116, 89, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 70% 80%, rgba(244, 162, 97, 0.08) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
}

.comment-panel>* {
    position: relative;
    z-index: 1;
}

.comment-panel header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.comment-panel header h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    background: linear-gradient(135deg, var(--el-text-color-primary) 0%, var(--app-primary) 70%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.comment-panel header .el-button {
    background: linear-gradient(135deg, var(--app-primary) 0%, color-mix(in srgb, var(--app-primary) 80%, #F4A261) 100%);
    border: none;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(217, 116, 89, 0.3);
}

.comment-panel header .el-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(217, 116, 89, 0.4);
}

.comment-panel header p {
    margin: 6px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
}

.comment-form {
    border-radius: 18px;
    padding: 16px;
    background: linear-gradient(135deg,
            color-mix(in srgb, var(--app-surface-2) 90%, #FDF9F6 10%) 0%,
            color-mix(in srgb, var(--app-surface-2) 85%, #D97459 15%) 100%);
    border: 1px solid color-mix(in srgb, var(--el-border-color) 70%, transparent);
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: all 0.3s ease;
    animation: formSlideDown 0.4s ease-out forwards;
    transform: translateY(-10px);
    opacity: 0;
    box-shadow: 0 8px 25px rgba(217, 116, 89, 0.1);
}

.comment-form:hover {
    border-color: color-mix(in srgb, var(--app-primary) 50%, transparent);
    box-shadow: 0 12px 35px rgba(217, 116, 89, 0.15);
}

@keyframes formSlideDown {
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

.comment-form.is-submitting {
    opacity: 0.8;
}

.comment-form__actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

.comment-form :deep(.el-textarea__inner) {
    min-height: 120px;
}

.comment-list {
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-right: 8px;
}

.comment-list :deep(.el-empty) {
    margin: 40px 0;
}

.comment-item {
    display: flex;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 18px;
    background: color-mix(in srgb, var(--app-surface-2) 92%, #FDF9F6 8%);
    border: 1px solid color-mix(in srgb, var(--el-border-color) 80%, transparent);
    transition: all 0.3s ease;
    animation: commentSlideIn 0.6s ease-out forwards;
    transform: translateY(10px);
    opacity: 0;
}

.comment-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(92, 75, 58, 0.12);
    border-color: color-mix(in srgb, var(--app-primary) 40%, transparent);
    background: color-mix(in srgb, var(--app-surface-2) 95%, #FDF9F6 5%);
}

@keyframes commentSlideIn {
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

/* 错开动画 - 让评论按顺序出现 */
.comment-item:nth-child(1) {
    animation-delay: 0.1s;
}

.comment-item:nth-child(2) {
    animation-delay: 0.2s;
}

.comment-item:nth-child(3) {
    animation-delay: 0.3s;
}

.comment-item:nth-child(4) {
    animation-delay: 0.4s;
}

.comment-item:nth-child(5) {
    animation-delay: 0.5s;
}

.comment-item:nth-child(n+6) {
    animation-delay: 0.6s;
}

.comment-avatar {
    flex: 0 0 36px;
    height: 36px;
    border-radius: 12px;
    background: linear-gradient(135deg, #D97459 0%, #F4A261 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 600;
    font-size: 14px;
    position: relative;
    transition: all 0.3s ease;
    animation: avatarPulse 2s ease-in-out infinite;
    box-shadow: 0 4px 15px rgba(217, 116, 89, 0.3);
}

.comment-avatar::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, #D97459, #F4A261, #E9C46A, #E89A84, #F0B9A7);
    border-radius: 14px;
    z-index: -1;
    animation: avatarGlow 3s ease-in-out infinite;
    opacity: 0.7;
}

.comment-avatar:hover {
    transform: scale(1.1);
    box-shadow: 0 8px 25px rgba(217, 116, 89, 0.5);
}

.comment-item:nth-child(2n) .comment-avatar {
    background: linear-gradient(135deg, #E89A84 0%, #D97459 100%);
    box-shadow: 0 4px 15px rgba(232, 154, 132, 0.3);
}

.comment-item:nth-child(3n) .comment-avatar {
    background: linear-gradient(135deg, #F4A261 0%, #E9C46A 100%);
    box-shadow: 0 4px 15px rgba(244, 162, 97, 0.3);
}

.comment-item:nth-child(4n) .comment-avatar {
    background: linear-gradient(135deg, #C86750 0%, #D97459 100%);
    box-shadow: 0 4px 15px rgba(200, 103, 80, 0.3);
}

.comment-item:nth-child(5n) .comment-avatar {
    background: linear-gradient(135deg, #F0B9A7 0%, #F4A261 100%);
    box-shadow: 0 4px 15px rgba(240, 185, 167, 0.3);
}

@keyframes avatarPulse {

    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.05);
    }
}

@keyframes avatarGlow {

    0%,
    100% {
        opacity: 0.3;
        transform: rotate(0deg);
    }

    50% {
        opacity: 0.8;
        transform: rotate(180deg);
    }
}

.comment-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
}

.comment-head {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: baseline;
}

.comment-author {
    font-weight: 600;
    background: linear-gradient(135deg, var(--el-text-color-primary) 0%, color-mix(in srgb, var(--app-primary) 80%, var(--el-text-color-primary) 20%) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: textShimmer 3s ease-in-out infinite;
}

@keyframes textShimmer {

    0%,
    100% {
        background-position: 0% 50%;
    }

    50% {
        background-position: 100% 50%;
    }
}

.comment-time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.comment-content {
    margin: 0;
    color: var(--el-text-color-primary);
    line-height: 1.6;
    word-break: break-word;
    transition: all 0.3s ease;
    position: relative;
}

.comment-item:hover .comment-content {
    text-shadow: 0 1px 3px rgba(217, 116, 89, 0.1);
    transform: translateX(2px);
}

.comment-time {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    transition: all 0.3s ease;
}

.comment-item:hover .comment-time {
    color: color-mix(in srgb, var(--app-primary) 70%, var(--el-text-color-secondary) 30%);
}

@media (max-width: 1200px) {
    .detail-board {
        padding: 18px 20px 24px;
    }

    .board-body {
        flex-direction: column;
        gap: 32px;
    }

    .comment-panel {
        flex: none;
        width: 100%;
        max-height: none;
    }

    .stage-row {
        flex-direction: column;
    }
}

@media (max-width: 768px) {
    .detail-container {
        padding: 16px;
    }

    .workflow {
        gap: 20px;
    }

    .stage-card,
    .prompt-card,
    .meta-card {
        border-radius: 22px;
        padding: 18px;
    }

    .media-frame {
        border-radius: 18px;
        height: clamp(200px, 50vw, 320px);
    }

    .comment-panel {
        padding: 18px 20px 24px;
        border-radius: 22px;
    }
}
</style>
