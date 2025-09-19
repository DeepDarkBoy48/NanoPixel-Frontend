<template>
    <div class="review-page">
        <el-card shadow="never" class="review-card">
            <template #header>
                <div class="card-header">
                    <div>
                        <h2>我的评论</h2>
                        <p>查看并管理你在灵感广场上的全部评论</p>
                    </div>
                    <el-button size="small" :loading="loading" @click="fetchReviews">刷新</el-button>
                </div>
            </template>

            <div class="review-list" v-loading="loading">
                <el-empty v-if="!loading && !normalizedReviews.length" description="暂时没有评论" />
                <div v-else class="review-item" v-for="item in normalizedReviews" :key="item.id">
                    <div class="review-item__main">
                        <p class="review-content">{{ item.content }}</p>
                        <div class="review-meta">
                            <span class="review-time">发表于 {{ item.time }}</span>
                            <span v-if="item.mediaId" class="review-media">关联素材：#{{ item.mediaId }}</span>
                        </div>
                    </div>
                    <div class="review-actions">
                        <el-button
                            size="small"
                            type="danger"
                            link
                            :loading="deletingId === item.id"
                            @click="confirmDelete(item)"
                        >
                            删除
                        </el-button>
                    </div>
                </div>
            </div>
        </el-card>
    </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteReviewService, listUserReviewsService } from '@/api/ai.js'
import { formatDate } from '@/utils/format'

const reviews = ref([])
const loading = ref(false)
const deletingId = ref(null)

const fetchReviews = async () => {
    try {
        loading.value = true
        const response = await listUserReviewsService()
        const list = Array.isArray(response?.data) ? response.data : []
        reviews.value = list
    } catch (error) {
        console.error('加载评论失败', error)
        ElMessage.error('加载评论失败')
    } finally {
        loading.value = false
    }
}

const confirmDelete = (review) => {
    if (!review?.id) return
    ElMessageBox.confirm('确定删除这条评论吗？', '提示', {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
    })
        .then(async () => {
            try {
                deletingId.value = review.id
                await deleteReviewService(review.id)
                ElMessage.success('评论已删除')
                await fetchReviews()
            } catch (error) {
                console.error('删除评论失败', error)
                ElMessage.error('删除评论失败')
            } finally {
                deletingId.value = null
            }
        })
        .catch(() => {
            deletingId.value = null
        })
}

const normalizedReviews = computed(() => {
    return reviews.value.map((item) => ({
        id: item?.id,
        content: item?.content ?? '',
        mediaId: item?.mediaId ?? item?.mediaid,
        time: formatReviewTime(item?.createTime || item?.createtime),
    }))
})

const formatReviewTime = (value) => {
    if (!value) return '时间未知'
    return formatDate(value, 'YYYY-MM-DD HH:mm')
}

onMounted(() => {
    fetchReviews()
})
</script>

<style scoped>
.review-page {
    padding: 24px;
}

.review-card {
    border-radius: 20px;
    border: 1px solid color-mix(in srgb, var(--el-border-color) 70%, transparent);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
}

.card-header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
}

.card-header p {
    margin: 4px 0 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
}

.review-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.review-item {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    border-radius: 16px;
    padding: 16px 18px;
    background: color-mix(in srgb, var(--app-surface-2) 92%, #101727 8%);
    border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
}

.review-item__main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 0;
}

.review-content {
    margin: 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--el-text-color-primary);
    word-break: break-word;
}

.review-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.review-actions {
    display: flex;
    align-items: flex-start;
}

@media (max-width: 768px) {
    .review-page {
        padding: 16px;
    }

    .review-item {
        flex-direction: column;
        align-items: flex-start;
    }

    .review-actions {
        align-self: flex-end;
    }
}
</style>
