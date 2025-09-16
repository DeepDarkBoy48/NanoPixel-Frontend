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

                    <div class="connector">
                        <div class="arrow"></div>
                        <div class="arrow"></div>
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
                            <h3>协作评论</h3>
                            <p>团队围绕此素材的讨论</p>
                        </div>
                        <el-button size="small" plain type="primary">新增评论</el-button>
                    </header>
                    <div class="comment-list">
                        <div class="comment-item" v-for="comment in comments" :key="comment.id">
                            <div class="comment-meta">
                                <div class="avatar">{{ comment.initials }}</div>
                                <div>
                                    <div class="name-row">
                                        <span class="name">{{ comment.author }}</span>
                                        <span class="role">{{ comment.role }}</span>
                                    </div>
                                    <span class="time">{{ comment.time }}</span>
                                </div>
                            </div>
                            <p class="comment-text">{{ comment.content }}</p>
                            <div class="comment-actions">
                                <el-button size="small" link>回复</el-button>
                                <el-button size="small" link type="danger">标记</el-button>
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
import { getMediaByIdService } from '@/api/ai.js';
import { formatDate } from '@/utils/format';

const route = useRoute();
const router = useRouter();

const detail = ref(null);
const loading = ref(false);

const comments = ref([
    {
        id: 1,
        author: '设计组 · 阿辰',
        role: '视觉设计',
        initials: 'AC',
        time: '今天 10:32',
        content: '构图已经满足 Web 封面尺寸，需要在 AI 图上补充一层轻微颗粒感增加质感。'
    },
    {
        id: 2,
        author: '产品 · Lili',
        role: '产品经理',
        initials: 'PL',
        time: '今天 09:58',
        content: '提示词里的场景氛围不错，想再强调人物的交互动作，可以补充“注视镜头、侧身挥手”等描述。'
    },
    {
        id: 3,
        author: '运营 · Ken',
        role: '内容运营',
        initials: 'K',
        time: '昨天 18:40',
        content: '计划把该素材用于首页活动 Banner，请在导出时保留 4K 分辨率原图。'
    }
]);

const mediaId = computed(() => route.params.mediaId);

const loadDetail = async (id) => {
    if (!id) {
        detail.value = null;
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
    } catch (error) {
        console.error(error);
        detail.value = null;
        ElMessage.error('获取媒体详情失败');
    } finally {
        loading.value = false;
    }
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

.connector {
    display: flex;
    justify-content: space-around;
    gap: 30%;
    padding: 4px 12px 0;
}

.arrow {
    width: 36px;
    height: 48px;
    background: linear-gradient(180deg, color-mix(in srgb, var(--app-primary) 45%, transparent), transparent 90%);
    clip-path: polygon(50% 0, 0 70%, 35% 70%, 35% 100%, 65% 100%, 65% 70%, 100% 70%);
    opacity: 0.8;
}

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
    flex: 0 0 340px;
    background: var(--app-surface);
    border-radius: 28px;
    border: 1px solid color-mix(in srgb, var(--el-border-color) 80%, transparent);
    padding: 20px;
    box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12);
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: clamp(420px, 70vh, 640px);
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

.comment-list {
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-right: 6px;
}

.comment-item {
    border-radius: 18px;
    padding: 16px 18px;
    background: color-mix(in srgb, var(--app-surface-2) 92%, #101727 8%);
    border: 1px solid color-mix(in srgb, var(--el-border-color) 80%, transparent);
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.comment-meta {
    display: flex;
    gap: 12px;
    align-items: center;
}

.avatar {
    width: 34px;
    height: 34px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--app-primary) 28%, #3840ff 72%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-weight: 600;
}

.name-row {
    display: flex;
    gap: 8px;
    align-items: center;
}

.name {
    font-weight: 600;
}

.role {
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--app-primary) 14%, transparent);
    color: var(--app-primary);
}

.time {
    display: block;
    margin-top: 2px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.comment-text {
    margin: 0;
    color: var(--el-text-color-primary);
    line-height: 1.6;
}

.comment-actions {
    display: flex;
    gap: 8px;
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
