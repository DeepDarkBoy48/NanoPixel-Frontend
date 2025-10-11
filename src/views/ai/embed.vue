<template>
    <div class="embed-page">
        <el-card class="upload-card">
            <div class="upload-header">
                <h2 class="section-title">上传 PDF 文件</h2>
                <div class="upload-actions">
                    <el-button size="small" :disabled="uploading" @click="submitUpload" type="primary"
                        :loading="uploading">开始上传</el-button>
                    <el-button size="small" :loading="listLoading" @click="fetchEmbedList">刷新列表</el-button>
                </div>
            </div>
            <el-upload ref="uploadRef" class="upload-action" :file-list="fileList" accept="application/pdf"
                :before-upload="beforeUpload" :on-change="handleFileChange" :auto-upload="false">
                <el-button type="default" :disabled="uploading">选择 PDF 文件</el-button>
            </el-upload>
            <p class="tip-text">仅支持 PDF 格式文件，单次上传一个文件，且小于 5MB。</p>
        </el-card>

        <el-card class="list-card">
            <h3 class="section-title">已上传文件</h3>
            <template v-if="!isMobile">
                <el-table v-if="embeds.length || listLoading" v-loading="listLoading" :data="embeds" border>
                    <el-table-column prop="id" label="ID" width="140" show-overflow-tooltip />
                    <el-table-column prop="name" label="文件名称" min-width="160" show-overflow-tooltip>
                        <template #default="{ row }">
                            {{ row.name || '未命名' }}
                        </template>
                    </el-table-column>
                    <el-table-column label="链接地址" min-width="240">
                        <template #default="{ row }">
                            <a v-if="row.url" class="link" :href="row.url" target="_blank" rel="noopener noreferrer">
                                点击查看
                            </a>
                            <span v-else class="placeholder">无链接</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="嵌入状态" width="140">
                        <template #default="{ row }">
                            <el-tag :type="row.isEmbed ? 'success' : 'info'" size="small">
                                {{ row.isEmbed ? '已完成嵌入' : '处理中' }}
                            </el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column prop="createTime" label="上传时间" width="180">
                        <template #default="{ row }">
                            {{ formatTime(row.createTime) }}
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" width="120" fixed="right">
                        <template #default="{ row }">
                            <el-button type="danger" size="small" plain :loading="row._deleting"
                                @click="handleDelete(row)">删除</el-button>
                        </template>
                    </el-table-column>
                </el-table>
                <el-empty v-else description="暂无上传记录" />
            </template>
            <template v-else>
                <div v-if="listLoading" class="mobile-skeleton">
                    <el-skeleton v-for="i in 3" :key="i" animated>
                        <template #template>
                            <el-skeleton-item variant="text" style="width: 60%; margin-bottom: 8px;" />
                            <el-skeleton-item variant="text" style="width: 100%; margin-bottom: 6px;" />
                            <el-skeleton-item variant="rect" style="width: 100%; height: 32px; border-radius: 8px;" />
                        </template>
                    </el-skeleton>
                </div>
                <div v-else-if="embeds.length" class="mobile-card-list">
                    <div class="mobile-card" v-for="row in embeds" :key="row.id">
                        <div class="mobile-card-header">
                            <span class="mobile-file-name">{{ row.name || '未命名' }}</span>
                            <el-tag :type="row.isEmbed ? 'success' : 'info'" size="small">
                                {{ row.isEmbed ? '已完成嵌入' : '处理中' }}
                            </el-tag>
                        </div>
                        <div class="mobile-card-body">
                            <div class="mobile-card-row">
                                <span class="label">链接地址</span>
                                <a v-if="row.url" class="link" :href="row.url" target="_blank"
                                    rel="noopener noreferrer">点击查看</a>
                                <span v-else class="placeholder">无链接</span>
                            </div>
                            <div class="mobile-card-row">
                                <span class="label">上传时间</span>
                                <span class="value">{{ formatTime(row.createTime) }}</span>
                            </div>
                        </div>
                        <div class="mobile-card-actions">
                            <el-button type="danger" size="small" plain :loading="row._deleting"
                                @click="handleDelete(row)">删除</el-button>
                        </div>
                    </div>
                </div>
                <el-empty v-else description="暂无上传记录" />
            </template>
        </el-card>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { uploadEmbedPdfService, listEmbedPdfService, deleteEmbedPdfService } from '@/api/ai.js';
import { formatDate } from '@/utils/format.js';

const embeds = ref([]);
const listLoading = ref(false);
const uploading = ref(false);
const uploadRef = ref(null);
const fileList = ref([]);
const selectedFile = ref(null);
const isMobile = ref(false);
const updateIsMobile = () => {
    if (typeof window === 'undefined') return;
    isMobile.value = window.innerWidth <= 768;
};

const formatTime = (time) => {
    if (!time) return '';
    return formatDate(time, 'YYYY-MM-DD HH:mm');
};

const fetchEmbedList = async () => {
    try {
        listLoading.value = true;
        const response = await listEmbedPdfService();
        const data = Array.isArray(response?.data) ? response.data : [];
        embeds.value = data.map(item => ({
            ...item,
            _deleting: false,
        }));
    } catch (error) {
        console.error('Failed to fetch embed list:', error);
    } finally {
        listLoading.value = false;
    }
};

const MAX_PDF_SIZE = 5 * 1024 * 1024; // 5MB
const isPdf = (f) => {
    const typeOk = f?.type === 'application/pdf';
    const nameOk = typeof f?.name === 'string' && /\.pdf$/i.test(f.name);
    return typeOk || nameOk;
};

const beforeUpload = (file) => {
    if (Array.isArray(fileList.value) && fileList.value.length > 0) {
        fileList.value = [];
    }
    if (!isPdf(file)) {
        ElMessage.error('仅支持上传 PDF 文件');
        return false;
    }
    if (file.size > MAX_PDF_SIZE) {
        ElMessage.error('文件大小需小于 5MB');
        return false;
    }
    selectedFile.value = file;
    return true;
};

const handleFileChange = (file, files) => {
    if (files.length > 1) {
        files.splice(0, files.length - 1);
    }
    const raw = file?.raw;
    if (!raw || !isPdf(raw)) {
        ElMessage.error('仅支持上传 PDF 文件');
        uploadRef.value?.clearFiles();
        selectedFile.value = null;
        fileList.value = [];
        return;
    }
    if (raw.size > MAX_PDF_SIZE) {
        ElMessage.error('文件大小需小于 5MB');
        uploadRef.value?.clearFiles();
        selectedFile.value = null;
        fileList.value = [];
        return;
    }
    selectedFile.value = raw;
    fileList.value = files;
};

const submitUpload = async () => {
    if (!selectedFile.value) {
        ElMessage.warning('请先选择一个 PDF 文件');
        return;
    }
    if (!isPdf(selectedFile.value)) {
        ElMessage.error('仅支持上传 PDF 文件');
        return;
    }
    if (selectedFile.value.size > MAX_PDF_SIZE) {
        ElMessage.error('文件大小需小于 5MB');
        return;
    }
    try {
        uploading.value = true;
        await uploadEmbedPdfService(selectedFile.value);
        await fetchEmbedList();
        uploadRef.value?.clearFiles();
        selectedFile.value = null;
        fileList.value = [];
    } catch (error) {
        console.error('Failed to upload PDF:', error);
    } finally {
        uploading.value = false;
    }
};

const handleDelete = async (row) => {
    try {
        await ElMessageBox.confirm('确定要删除该 PDF 吗？', '提示', {
            type: 'warning',
            confirmButtonText: '删除',
            cancelButtonText: '取消',
        });
    } catch {
        return;
    }

    try {
        row._deleting = true;
        await deleteEmbedPdfService(row.id);
        await fetchEmbedList();
    } catch (error) {
        console.error('Failed to delete PDF:', error);
    } finally {
        row._deleting = false;
    }
};

onMounted(() => {
    fetchEmbedList();
    updateIsMobile();
    if (typeof window !== 'undefined') {
        window.addEventListener('resize', updateIsMobile);
    }
});

onBeforeUnmount(() => {
    if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updateIsMobile);
    }
});
</script>

<style scoped>
.embed-page {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 24px;
    color: var(--app-sider-text);
    --embed-card-bg: var(--app-surface);
    --embed-secondary-surface: var(--app-surface-2);
    --embed-card-border: rgba(15, 23, 42, 0.12);
    --embed-card-shadow: 0 6px 20px rgba(31, 45, 61, 0.08);
    --embed-muted-text: #909399;
    --embed-placeholder-text: #c0c4cc;
}

.upload-card,
.list-card {
    border-radius: 12px;
    background: var(--embed-card-bg);
    border: 1px solid var(--embed-card-border);
    box-shadow: var(--embed-card-shadow);
}

.upload-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
}

.upload-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.section-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--app-sider-text);
}

.upload-action {
    margin-bottom: 12px;
}

.tip-text {
    margin: 0;
    color: var(--embed-muted-text);
    font-size: 12px;
}

.link {
    color: var(--app-primary);
    text-decoration: none;
}

.link:hover {
    text-decoration: underline;
}

.placeholder {
    color: var(--embed-placeholder-text);
}

.mobile-skeleton {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.mobile-card-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.mobile-card {
    border: 1px solid var(--embed-card-border);
    border-radius: 12px;
    padding: 12px 14px;
    background: var(--embed-card-bg);
    box-shadow: var(--embed-card-shadow);
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.mobile-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
}

.mobile-file-name {
    font-weight: 600;
    font-size: 16px;
    color: var(--app-sider-text);
    flex: 1;
    min-width: 0;
}

.mobile-card-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.mobile-card-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    font-size: 14px;
}

.mobile-card-row .label {
    color: var(--embed-muted-text);
    flex-shrink: 0;
}

.mobile-card-row .value {
    color: var(--app-sider-text);
    text-align: right;
}

.mobile-card-actions {
    display: flex;
    justify-content: flex-end;
}

:global(.dark) .embed-page {
    --embed-card-bg: rgba(22, 27, 34, 0.92);
    --embed-secondary-surface: rgba(13, 17, 23, 0.96);
    --embed-card-border: rgba(110, 118, 129, 0.55);
    --embed-card-shadow: 0 12px 28px rgba(1, 4, 9, 0.55);
    --embed-muted-text: #8b949e;
    --embed-placeholder-text: #6e7681;
}

@media (max-width: 768px) {
    .embed-page {
        padding: 16px 12px;
        gap: 16px;
    }

    .upload-card,
    .list-card {
        border-radius: 10px;
    }

    .upload-header {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
    }

    .upload-actions {
        width: 100%;
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
    }

    .upload-actions .el-button {
        width: 100%;
    }

    .upload-action {
        width: 100%;
    }

    .mobile-card {
        padding: 14px 16px;
    }
}
</style>
