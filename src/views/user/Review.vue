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
    border: 1px solid rgba(217, 116, 89, 0.15);
    background: linear-gradient(180deg, #FDF9F6 0%, #FAF4EF 100%);
    box-shadow: 0 4px 20px rgba(92, 75, 58, 0.08);
}

.review-card :deep(.el-card__header) {
    background: linear-gradient(135deg, rgba(217, 116, 89, 0.08) 0%, rgba(244, 162, 97, 0.05) 100%);
    border-bottom: 1px solid rgba(217, 116, 89, 0.12);
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
    color: #5C4B3A;
}

.card-header p {
    margin: 4px 0 0;
    color: #9C8B7A;
    font-size: 13px;
}

.card-header :deep(.el-button) {
    background: linear-gradient(135deg, #D97459 0%, #E89A84 100%);
    border: none;
    color: #fff;
    box-shadow: 0 3px 10px rgba(217, 116, 89, 0.2);
}

.card-header :deep(.el-button:hover) {
    background: linear-gradient(135deg, #C86750 0%, #D97459 100%);
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
    background: linear-gradient(135deg, rgba(251, 247, 243, 0.9) 0%, rgba(250, 244, 239, 0.9) 100%);
    border: 1px solid rgba(217, 116, 89, 0.12);
    box-shadow: 0 2px 8px rgba(92, 75, 58, 0.06);
    transition: all 0.3s ease;
}

.review-item:hover {
    border-color: rgba(217, 116, 89, 0.25);
    box-shadow: 0 4px 16px rgba(92, 75, 58, 0.1);
    transform: translateY(-2px);
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
    color: #5C4B3A;
    word-break: break-word;
}

.review-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 12px;
    color: #9C8B7A;
}

.review-actions {
    display: flex;
    align-items: flex-start;
}

.review-actions :deep(.el-button--danger) {
    color: #D97459;
}

.review-actions :deep(.el-button--danger:hover) {
    color: #C86750;
}

/* Dark mode */
.dark .review-card {
    background: linear-gradient(180deg, #2A2420 0%, #231E1A 100%);
    border-color: rgba(244, 162, 97, 0.2);
}

.dark .review-card :deep(.el-card__header) {
    background: linear-gradient(135deg, rgba(244, 162, 97, 0.12) 0%, rgba(233, 196, 106, 0.08) 100%);
    border-bottom-color: rgba(244, 162, 97, 0.15);
}

.dark .card-header h2 {
    color: #E8DED3;
}

.dark .card-header p {
    color: #9C8B7A;
}

.dark .card-header :deep(.el-button) {
    background: linear-gradient(135deg, #F4A261 0%, #E9C46A 100%);
    color: #2A2420;
}

.dark .review-item {
    background: linear-gradient(135deg, rgba(38, 32, 25, 0.9) 0%, rgba(35, 30, 26, 0.9) 100%);
    border-color: rgba(244, 162, 97, 0.15);
}

.dark .review-item:hover {
    border-color: rgba(244, 162, 97, 0.3);
}

.dark .review-content {
    color: #E8DED3;
}

.dark .review-meta {
    color: #9C8B7A;
}

.dark .review-actions :deep(.el-button--danger) {
    color: #F4A261;
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
