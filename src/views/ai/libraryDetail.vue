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
                        <div class="prompt-content" v-if="detail.prompt">{{ detail.prompt }}</div>
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
import { ArrowLeft } from '@element-plus/icons-vue';
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
    background: color-mix(in srgb, var(--app-surface) 94%, #fff 6%);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--el-border-color) 35%, transparent);
}

.board-header {
    display: flex;
    justify-content: flex-start;
    margin-bottom: 12px;
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
    background: var(--app-surface);
    box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
    padding: 16px 18px 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.stage-card header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
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
    top: 12px;
    left: 12px;
    z-index: 2;
    background: rgba(26, 79, 255, 0.86);
    color: #fff;
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 999px;
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
    background: var(--app-surface);
    box-shadow: 0 14px 34px rgba(15, 23, 42, 0.07);
    padding: 18px 20px 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
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
}

.prompt-content {
    border-radius: 18px;
    border: 1px solid color-mix(in srgb, var(--app-primary) 18%, transparent);
    background: color-mix(in srgb, var(--app-primary) 12%, transparent);
    padding: 18px;
    line-height: 1.7;
    white-space: pre-wrap;
    color: var(--el-text-color-primary);
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
}

.meta-item .label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    letter-spacing: 0.5px;
    text-transform: uppercase;
}

.meta-item .value {
    font-size: 14px;
    color: var(--el-text-color-primary);
}

.comment-panel {
    flex: 0 0 360px;
    background: var(--app-surface);
    border-radius: 28px;
    border: 1px solid color-mix(in srgb, var(--el-border-color) 74%, transparent);
    padding: 20px;
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12);
    display: flex;
    flex-direction: column;
    gap: 18px;
    max-height: clamp(560px, 85vh, 980px);
}

.comment-panel header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
}

.comment-panel header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
}

.comment-panel header p {
    margin: 6px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
}

.comment-form {
    border-radius: 18px;
    padding: 16px;
    background: color-mix(in srgb, var(--app-surface-2) 90%, #101727 10%);
    border: 1px solid color-mix(in srgb, var(--el-border-color) 70%, transparent);
    display: flex;
    flex-direction: column;
    gap: 10px;
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
    background: color-mix(in srgb, var(--app-surface-2) 92%, #101727 8%);
    border: 1px solid color-mix(in srgb, var(--el-border-color) 80%, transparent);
}

.comment-avatar {
    flex: 0 0 36px;
    height: 36px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--app-primary) 28%, #3840ff 72%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 600;
    font-size: 14px;
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
    color: var(--el-text-color-primary);
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
