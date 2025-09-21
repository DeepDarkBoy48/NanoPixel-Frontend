<template>
    <div class="page-container">
        <div class="guide-banner" :class="{ 'is-collapsed': guideCollapsed }">
            <span class="guide-badge">提示</span>
            <div class="guide-content">
                <div class="guide-title">如何使用魔法修图</div>
                <ul class="guide-steps">
                    <li>提交后通常 20~40 秒生成结果，期间请保持页面打开。</li>
                    <li>生成的图片会保存到「我的作品」，可随时发布到灵感库。</li>
                    <li>模版内容可去prompt管理页面中自定义。</li>
                </ul>
            </div>
            <div class="guide-actions">
                <el-button size="small" type="primary" plain @click="goToHistory">查看我的作品</el-button>
                <el-button size="small" link @click="guideCollapsed = !guideCollapsed">{{ guideCollapsed ? '展开提示' :
                    '收起提示' }}</el-button>
            </div>
        </div>
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
                                <h4 class="section-title">模板选择（可选）</h4>
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
                                        :loading="submitting" @click="onSubmit" class="magic-submit-btn">
                                        <span v-if="!submitting">✨ 开始魔法修图</span>
                                        <span v-else>🎨 魔法进行中...</span>
                                    </el-button>
                                    <el-button @click="onReset" :disabled="submitting" class="reset-btn">重置</el-button>
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
                                <el-image v-if="resultUrl" :src="resultUrl" fit="contain"
                                    class="preview-image result-image-animate" :preview-src-list="[resultUrl]"
                                    preview-teleported hide-on-click-modal />
                                <div v-if="submitting" class="generation-loading">
                                    <!-- 多层炫酷加载动画 -->
                                    <div class="magic-loader">
                                        <div class="loader-outer-ring"></div>
                                        <div class="loader-middle-ring"></div>
                                        <div class="loader-inner-core"></div>
                                        <div class="loader-particles">
                                            <span v-for="i in 8" :key="i" class="particle" :style="`--i: ${i}`"></span>
                                        </div>
                                    </div>
                                    <div class="generation-text" aria-live="polite">
                                        <strong class="pulsing-text">✨ 魔法修图中...</strong>
                                        <span class="loading-dots">预计耗时约30秒，请耐心等待</span>
                                        <div class="progress-bar">
                                            <div class="progress-fill"></div>
                                        </div>
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
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { imageEditService, listPromptCategoriesService, listSavedPromptsService } from '@/api/ai'

const guideCollapsed = ref(false)
const prompt = ref('')

const router = useRouter()

const goToHistory = () => {
    router.push('/ai/magicImageEdit/history')
}

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

.guide-banner {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    margin-bottom: 16px;
    border: 1px solid var(--el-border-color-lighter);
    background: color-mix(in srgb, var(--el-color-primary-light-9) 70%, #fff 30%);
    border-left: 4px solid var(--el-color-primary-light-5);
    border-radius: 12px;
}

.guide-badge {
    font-size: 12px;
    color: #fff;
    background: var(--el-color-primary);
    border-radius: 6px;
    padding: 2px 8px;
}

.guide-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.guide-title {
    font-weight: 600;
    white-space: normal;
    word-break: break-word;
}

.guide-steps {
    margin: 0;
    padding-left: 18px;
    color: var(--el-text-color-secondary);
    line-height: 1.6;
    list-style: disc;
}

.guide-actions {
    display: flex;
    gap: 8px;
}

.guide-banner.is-collapsed .guide-content {
    display: none;
}

.guide-banner.is-collapsed {
    background: color-mix(in srgb, var(--app-surface-2, #f6f7f9) 85%, #fff 15%);
}

@media (max-width: 576px) {
    .guide-banner {
        grid-template-columns: 1fr;
        align-items: flex-start;
    }

    .guide-actions {
        justify-content: flex-start;
        flex-wrap: wrap;
        margin-top: 6px;
    }
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
    transition: all 0.3s ease;
    position: relative;
}

.preview-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent, rgba(64, 158, 255, 0.1), transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    z-index: 1;
}

.preview-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
    border-color: rgba(64, 158, 255, 0.3);
}

.preview-card:hover::before {
    opacity: 1;
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
    transition: all 0.3s ease;
    cursor: pointer;
    position: relative;
    z-index: 2;
}

.preview-image:hover {
    transform: scale(1.02);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
}

/* ensure inner img fits container properly */
.preview-image :deep(img) {
    object-fit: contain;
    transition: all 0.3s ease;
}

.preview-image:hover :deep(img) {
    filter: brightness(1.05) contrast(1.05);
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

/* 炫酷加载动画效果 */
.generation-loading {
    position: absolute;
    inset: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    background: linear-gradient(135deg,
            rgba(64, 158, 255, 0.1) 0%,
            rgba(147, 51, 234, 0.1) 50%,
            rgba(245, 101, 101, 0.1) 100%);
    border: 2px solid rgba(64, 158, 255, 0.3);
    border-radius: 16px;
    backdrop-filter: blur(8px);
    box-shadow:
        0 8px 32px rgba(64, 158, 255, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    z-index: 5;
    animation: loading-glow 2s ease-in-out infinite alternate;
}

@keyframes loading-glow {
    0% {
        box-shadow:
            0 8px 32px rgba(64, 158, 255, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    100% {
        box-shadow:
            0 12px 40px rgba(64, 158, 255, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
    }
}

/* 魔法加载器 */
.magic-loader {
    position: relative;
    width: 100px;
    height: 100px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.loader-outer-ring {
    position: absolute;
    width: 100px;
    height: 100px;
    border: 3px solid transparent;
    border-top: 3px solid #4F46E5;
    border-right: 3px solid #7C3AED;
    border-radius: 50%;
    animation: magic-spin-outer 2s linear infinite;
}

.loader-middle-ring {
    position: absolute;
    width: 70px;
    height: 70px;
    border: 2px solid transparent;
    border-left: 2px solid #EC4899;
    border-bottom: 2px solid #F59E0B;
    border-radius: 50%;
    animation: magic-spin-middle 1.5s linear infinite reverse;
}

.loader-inner-core {
    position: absolute;
    width: 40px;
    height: 40px;
    background: linear-gradient(45deg, #4F46E5, #7C3AED, #EC4899, #F59E0B);
    border-radius: 50%;
    animation: magic-pulse 1s ease-in-out infinite alternate;
}

.loader-particles {
    position: absolute;
    width: 100%;
    height: 100%;
}

.particle {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 4px;
    height: 4px;
    background: linear-gradient(45deg, #4F46E5, #EC4899);
    border-radius: 50%;
    transform-origin: 0 0;
    animation: magic-particles 2s ease-in-out infinite;
    animation-delay: calc(var(--i) * 0.2s);
}

@keyframes magic-spin-outer {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

@keyframes magic-spin-middle {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(-360deg);
    }
}

@keyframes magic-pulse {
    0% {
        transform: scale(1);
        box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.7);
    }

    100% {
        transform: scale(1.2);
        box-shadow: 0 0 0 10px rgba(79, 70, 229, 0);
    }
}

@keyframes magic-particles {

    0%,
    100% {
        transform: translate(-50%, -50%) rotate(calc(var(--i) * 45deg)) translateY(-30px) scale(0);
        opacity: 0;
    }

    50% {
        transform: translate(-50%, -50%) rotate(calc(var(--i) * 45deg)) translateY(-50px) scale(1);
        opacity: 1;
    }
}

/* 加载文字效果 */
.generation-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
}

.pulsing-text {
    color: #4F46E5;
    font-size: 16px;
    font-weight: 600;
    animation: text-pulse 1.5s ease-in-out infinite;
}

.loading-dots {
    position: relative;
    animation: loading-dots-animation 1.5s ease-in-out infinite;
}

.loading-dots::after {
    content: '';
    animation: dots 1.5s steps(4, end) infinite;
}

@keyframes text-pulse {

    0%,
    100% {
        transform: scale(1);
        text-shadow: 0 0 10px rgba(79, 70, 229, 0.3);
    }

    50% {
        transform: scale(1.05);
        text-shadow: 0 0 20px rgba(79, 70, 229, 0.6);
    }
}

@keyframes loading-dots-animation {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.7;
    }
}

@keyframes dots {

    0%,
    20% {
        content: '';
    }

    40% {
        content: '.';
    }

    60% {
        content: '..';
    }

    80%,
    100% {
        content: '...';
    }
}

/* 进度条 */
.progress-bar {
    width: 200px;
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
    overflow: hidden;
    margin-top: 8px;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4F46E5, #7C3AED, #EC4899, #F59E0B);
    background-size: 200% 100%;
    border-radius: 2px;
    animation: progress-animation 3s ease-in-out infinite;
}

@keyframes progress-animation {
    0% {
        transform: translateX(-100%);
        background-position: 0% 50%;
    }

    50% {
        background-position: 100% 50%;
    }

    100% {
        transform: translateX(100%);
        background-position: 0% 50%;
    }
}

/* 生成结果图片动画 */
.result-image-animate {
    animation: result-appear 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}

@keyframes result-appear {
    0% {
        opacity: 0;
        transform: scale(0.3) rotate(-10deg);
        filter: blur(10px);
    }

    50% {
        opacity: 0.8;
        transform: scale(1.1) rotate(2deg);
        filter: blur(2px);
    }

    100% {
        opacity: 1;
        transform: scale(1) rotate(0deg);
        filter: blur(0px);
    }
}

/* 魔法提交按钮样式 */
.magic-submit-btn {
    position: relative;
    overflow: hidden;
    background: linear-gradient(45deg, #4F46E5, #7C3AED) !important;
    border: none !important;
    transition: all 0.3s ease !important;
}

.magic-submit-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
}

.magic-submit-btn:hover::before {
    left: 100%;
}

.magic-submit-btn:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 25px rgba(79, 70, 229, 0.4) !important;
}

.magic-submit-btn:active {
    transform: scale(0.98) !important;
}

.magic-submit-btn.is-loading {
    background: linear-gradient(45deg, #EC4899, #F59E0B) !important;
    animation: button-pulse 1.5s ease-in-out infinite !important;
}

@keyframes button-pulse {

    0%,
    100% {
        box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.7);
    }

    50% {
        box-shadow: 0 0 0 10px rgba(236, 72, 153, 0);
    }
}

/* 重置按钮样式 */
.reset-btn:hover {
    transform: translateY(-1px);
    transition: all 0.3s ease;
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
