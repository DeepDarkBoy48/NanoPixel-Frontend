<template>
    <div class="page-container">
        <el-card class="card" shadow="never">
            <template #header>
                <div class="header">
                    <div class="title">
                        <span>魔法修图</span>
                        <span class="subtitle">智能编辑 · 更清晰 · 去背景</span>
                    </div>
                </div>
            </template>

            <div class="content">
                <div class="left">
                    <div class="unified-form form">
                        <el-form>
                            <div class="form-section">
                                <h4 class="section-title">模板选择</h4>
                                <el-form-item>
                                    <el-select v-model="selectedPromptCategoryId" placeholder="请选择分类"
                                        style="width: 100%" size="large" :loading="promptCategoriesLoading"
                                        :disabled="promptCategoriesLoading" @change="handlePromptCategoryChange">
                                        <el-option v-for="item in promptCategories" :key="item.id"
                                            :label="item.categoryName" :value="item.id">
                                            <div class="category-option">
                                                <span class="category-option__name" :title="item.categoryName">{{
                                                    item.categoryName
                                                    }}</span>
                                                <span class="category-option__count">{{ item.promptCount ?? 0 }}
                                                    个模版</span>
                                            </div>
                                        </el-option>
                                    </el-select>
                                </el-form-item>
                                <el-form-item>
                                    <el-select v-model="selectedPromptId" placeholder="请选择模版" style="width: 100%"
                                        clearable size="large" :loading="promptOptionsLoading"
                                        :disabled="promptOptionsLoading || !promptOptions.length"
                                        @change="onPromptChange">
                                        <el-option v-for="item in promptDropdownOptions" :key="item.value"
                                            :label="item.label" :value="item.value" />
                                    </el-select>
                                    <div class="template-hint"
                                        v-if="selectedPromptCategoryId && !promptOptionsLoading && !promptOptions.length">
                                        当前分类暂无模版，请在 Prompt 管理中添加。
                                    </div>
                                </el-form-item>
                            </div>

                            <div class="form-section">
                                <h4 class="section-title">参数配置</h4>
                                <el-form-item>
                                    <el-select v-model="selectedModel" placeholder="选择模型" size="large"
                                        style="width: 100%">
                                        <el-option v-for="m in modelOptions" :key="m.value" :label="m.label"
                                            :value="m.value" />
                                    </el-select>
                                </el-form-item>
                                <el-form-item>
                                    <el-input v-model="prompt" type="textarea" :rows="7"
                                        placeholder="请选择上方模版/预设，或直接在此处输入提示词" clearable />
                                </el-form-item>
                                <el-form-item>
                                    <el-upload ref="uploaderRef" class="uploader" :auto-upload="false" :limit="1"
                                        :show-file-list="true" :on-change="handleFileChange"
                                        :on-remove="handleFileRemove" :on-exceed="handleFileExceed"
                                        :file-list="fileList" accept="image/*">
                                        <el-button type="primary">选择图片</el-button>
                                        <template #tip>
                                            <div class="el-upload__tip">仅支持单张图片，建议不超过 10MB</div>
                                        </template>
                                    </el-upload>
                                </el-form-item>
                                <el-form-item class="button-group">
                                    <el-button type="primary" size="large" :disabled="!canSubmit || submitting"
                                        :loading="submitting" @click="onSubmit">提交</el-button>
                                    <el-button @click="onReset" :disabled="submitting">重置</el-button>
                                </el-form-item>
                            </div>
                        </el-form>
                    </div>
                </div>

                <div class="right">
                    <div class="preview-grid">
                        <div class="preview-card">
                            <div class="preview-title">原图预览</div>
                            <div class="preview-body">
                                <el-empty v-if="!previewUrl" description="请先选择图片" />
                                <el-image v-else :src="previewUrl" fit="contain" class="preview-image"
                                    :preview-src-list="[previewUrl]" preview-teleported hide-on-click-modal />
                            </div>
                        </div>
                        <div class="preview-card">
                            <div class="preview-title">生成结果</div>
                            <div class="preview-body">
                                <el-empty v-if="!resultUrl" description="提交后查看生成结果" />
                                <el-image v-if="resultUrl" :src="resultUrl" fit="contain" class="preview-image"
                                    :preview-src-list="[resultUrl]" preview-teleported hide-on-click-modal />
                                <div v-if="submitting" class="generation-loading">
                                    <div class="generation-spinner" aria-hidden="true"></div>
                                    <div class="generation-text" aria-live="polite">
                                        <strong>正在生成…</strong>
                                        <span>预计耗时约30秒，请耐心等待</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </el-card>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { imageEditService, listPromptCategoriesService, listSavedPromptsService } from '@/api/ai'

const prompt = ref('')

// Prompt 分类与模版
const promptCategories = ref([])
const promptCategoriesLoading = ref(false)
const selectedPromptCategoryId = ref(null)

const promptOptions = ref([])
const promptOptionsLoading = ref(false)
const selectedPromptId = ref(null)

const promptDropdownOptions = computed(() => {
    return promptOptions.value.map(item => ({
        value: item.id,
        label: item.label,
    }))
})


const buildPromptLabel = (text = '') => {
    const plain = String(text)
    return plain.length > 20 ? `${plain.slice(0, 20)}…` : plain
}

const fetchPromptOptions = async (categoryId) => {
    if (!categoryId) {
        promptOptions.value = []
        selectedPromptId.value = null
        return
    }
    promptOptionsLoading.value = true
    try {
        const response = await listSavedPromptsService(categoryId)
        const list = Array.isArray(response?.data) ? response.data : []
        const previousId = selectedPromptId.value
        promptOptions.value = list.map(item => ({
            id: item.id,
            categoryId: item.categoryId,
            content: item.content,
            label: buildPromptLabel(item.content),
        }))
        selectedPromptId.value = promptOptions.value.some(opt => opt.id === previousId)
            ? previousId
            : null
    } catch (error) {
        console.error('加载 Prompt 模版失败', error)
        promptOptions.value = []
    } finally {
        promptOptionsLoading.value = false
    }
}

const fetchPromptCategories = async () => {
    promptCategoriesLoading.value = true
    try {
        const response = await listPromptCategoriesService()
        const list = Array.isArray(response?.data) ? response.data : []
        promptCategories.value = list
        if (!list.length) {
            selectedPromptCategoryId.value = null
            promptOptions.value = []
            selectedPromptId.value = null
            return
        }
        const exists = list.some(item => item.id === selectedPromptCategoryId.value)
        if (exists) {
            await fetchPromptOptions(selectedPromptCategoryId.value)
        } else {
            selectedPromptCategoryId.value = null
            promptOptions.value = []
            selectedPromptId.value = null
        }
    } catch (error) {
        console.error('加载 Prompt 分类失败', error)
    } finally {
        promptCategoriesLoading.value = false
    }
}

const handlePromptCategoryChange = async (categoryId) => {
    if (!categoryId) {
        promptOptions.value = []
        selectedPromptId.value = null
        return
    }
    selectedPromptId.value = null
    await fetchPromptOptions(categoryId)
}

const onPromptChange = (val) => {
    if (!val) {
        selectedPromptId.value = null
        return
    }
    const target = promptOptions.value.find(item => item.id === val)
    if (target?.content) {
        applyText(target.content)
    }
}


// 直接覆盖生成的提示词（不追加）
function applyText(text) {
    prompt.value = text
}


const uploaderRef = ref(null)
const fileList = ref([])
const selectedFile = ref(null)
const submitting = ref(false)
const resultUrl = ref('')
const previewUrl = ref('')
// 模型选择（默认 nanobanana）
const selectedModel = ref('nanobanana')
const modelOptions = [
    { value: 'nanobanana', label: 'NanoBanana（默认）' },
    { value: 'seedream4', label: 'Seedream4' },
]

const canSubmit = computed(() => {
    return !!selectedFile.value && !!prompt.value.trim()
})

const handleFileChange = (uploadFile, uploadFiles) => {
    selectedFile.value = uploadFile?.raw || null
    fileList.value = uploadFiles.slice(-1)
    previewUrl.value = selectedFile.value ? URL.createObjectURL(selectedFile.value) : ''
    resultUrl.value = ''
}

const handleFileRemove = () => {
    selectedFile.value = null
    fileList.value = []
    previewUrl.value = ''
}

const handleFileExceed = (files) => {
    const file = files?.[0]
    if (!file) return
    const upload = uploaderRef.value
    if (!upload) return
    if (typeof upload.clearFiles === 'function') {
        upload.clearFiles()
    }
    if (typeof upload.handleStart === 'function') {
        upload.handleStart(file)
    }
}

const onReset = () => {
    prompt.value = ''
    selectedPromptId.value = null
    handleFileRemove()
    resultUrl.value = ''
}

const onSubmit = async () => {
    if (!canSubmit.value || submitting.value) return
    submitting.value = true
    ElMessage.info('已提交，请等待大约30秒生成结果…')
    try {
        const formData = new FormData()
        // 新增 originFile 参数：上传用户原图
        formData.append('originFile', selectedFile.value)
        // 保持兼容：继续传原有的 file 字段
        formData.append('file', selectedFile.value)
        formData.append('prompt', prompt.value.trim())
        // 传递模型参数：未选择时默认 nanobanana
        formData.append('model', selectedModel.value || 'nanobanana')

        const res = await imageEditService(formData)
        resultUrl.value = typeof res.data === 'string' ? res.data : (res.data?.url || '')
    } catch (e) {
        ElMessage.error('生成失败，请稍后重试')
    } finally {
        submitting.value = false
    }
}

watch(previewUrl, (_, oldUrl) => {
    if (oldUrl && oldUrl.startsWith('blob:')) {
        URL.revokeObjectURL(oldUrl)
    }
})

onBeforeUnmount(() => {
    if (previewUrl.value && previewUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl.value)
    }
})

onMounted(() => {
    fetchPromptCategories()
})
</script>

<style scoped>
.page-container {
    padding: 16px;
    box-sizing: border-box;
}

.card {
    width: 100%;
    border-radius: 12px;
}

.header {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.title {
    display: flex;
    align-items: baseline;
    gap: 12px;
}

.title>span:first-child {
    font-weight: 700;
}

.subtitle {
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

.content {
    display: grid;
    grid-template-columns: minmax(280px, 0.6fr) minmax(0, 2.4fr);
    gap: 48px;
}

.left {
    display: flex;
    flex-direction: column;
}

.form {
    background: var(--app-surface-2);
    padding: 16px;
    border-radius: 10px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04) inset;
}

.unified-form {
    width: 100%;
}

.unified-form .el-form-item {
    margin-bottom: 12px;
}

.form-section {
    margin-bottom: 20px;
}

.form-section:not(:last-child) {
    padding-bottom: 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.section-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    margin: 0 0 16px 0;
    padding: 0;
}


.uploader :deep(.el-upload) {
    margin-right: 8px;
}

.right {
    min-width: 0;
}

.preview-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.preview-card {
    background: var(--app-surface);
    border: 1px solid var(--el-border-color);
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.preview-title {
    padding: 10px 12px;
    font-weight: 600;
    background: var(--app-surface-2);
    border-bottom: 1px solid var(--el-border-color);
}

.preview-body {
    position: relative;
    padding: 12px;
    min-height: 280px;
}

.preview-image {
    width: 100%;
    height: 60vh;
    max-height: 70vh;
    display: block;
    border-radius: 6px;
}

/* ensure inner img fits container properly */
.preview-image :deep(img) {
    object-fit: contain;
}


.category-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    line-height: 1.2;
}

.category-option__name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
}

.category-option__count {
    flex: none;
    white-space: nowrap;
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.template-hint {
    margin-top: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.preview-body :deep(.el-empty) {
    margin: 0;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.generation-loading {
    position: absolute;
    inset: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(64, 158, 255, 0.25);
    border-radius: 8px;
    backdrop-filter: blur(2px);
    z-index: 5;
}

.generation-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(64, 158, 255, 0.2);
    border-top-color: var(--el-color-primary);
    border-radius: 50%;
    animation: generation-spin 0.9s linear infinite;
}

.generation-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
}

.generation-text strong {
    color: var(--el-text-color-primary);
}

@keyframes generation-spin {
    to {
        transform: rotate(360deg);
    }
}


/* 响应式 */
@media (max-width: 1200px) {
    .content {
        grid-template-columns: 280px 1fr;
    }

    .preview-image {
        height: 50vh;
    }
}

@media (max-width: 900px) {
    .content {
        grid-template-columns: 1fr;
    }

    .preview-grid {
        grid-template-columns: 1fr;
    }

    .preview-image {
        height: 45vh;
    }
}

@media (max-width: 768px) {
    .page-container {
        padding: 10px;
    }

    .content {
        gap: 16px;
    }

    .form {
        padding: 10px;
    }

    .card {
        border-radius: 10px;
    }

    .title {
        gap: 8px;
    }

    .subtitle {
        font-size: 11px;
    }

    .unified-form :deep(.el-form-item) {
        flex-direction: column;
        align-items: stretch;
        gap: 4px;
        margin-bottom: 8px;
    }

    .unified-form :deep(.el-form-item__label) {
        width: auto !important;
        padding-bottom: 0;
        text-align: left;
        line-height: 1.4;
    }

    .unified-form :deep(.el-form-item__content) {
        margin-left: 0 !important;
        flex-direction: column;
        align-items: stretch;
        width: 100%;
        gap: 8px;
    }

    /* 按钮组在手机端保持横向排列 */
    .unified-form .button-group :deep(.el-form-item__content) {
        flex-direction: row !important;
        align-items: center;
        gap: 8px;
    }

    .unified-form .button-group :deep(.el-button) {
        flex: 1;
        min-width: 0;
    }

    .unified-form :deep(.el-select),
    .unified-form :deep(.el-input),
    .unified-form :deep(.el-textarea),
    .unified-form :deep(.el-upload) {
        width: 100%;
    }

    /* 紧凑化输入高度 */
    .unified-form :deep(.el-input__wrapper) {
        padding: 0 10px;
    }

    .unified-form :deep(.el-button--large) {
        --el-button-size-height: 36px;
    }

    .unified-form :deep(.el-textarea__inner) {
        min-height: 110px;
    }

    .form-section {
        margin-bottom: 14px;
    }

    .form-section:not(:last-child) {
        padding-bottom: 12px;
    }

    .section-title {
        margin-bottom: 8px;
        font-size: 13px;
    }

    .preview-image {
        height: 42vh;
    }
}

@media (max-width: 520px) {
    .subtitle {
        display: none;
    }

    .preview-title {
        padding: 8px 10px;
    }

    .preview-body {
        padding: 10px;
    }
}
</style>
