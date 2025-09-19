<template>
    <div class="prompt-manager-page">
        <div class="page-header">
            <div class="page-header__row">
                <div class="page-header__titles">
                    <h2 class="page-title">Prompt 管理</h2>
                    <p class="page-subtitle">维护提示词与分类，支持增删改查</p>
                </div>
                <div class="page-header__actions">
                    <el-button :icon="Refresh" @click="refreshAll" :loading="categoryLoading || promptsLoading">
                        刷新
                    </el-button>
                </div>
            </div>

            <!-- 使用指引：并入顶部卡片（始终显示） -->
            <div class="guide-banner" :class="{ 'is-collapsed': guideCollapsed }">
                <span class="guide-badge">指引</span>
                <div class="guide-content">
                    <div class="guide-title">先创建分类，再在该分类下编写一条条 Prompt。</div>
                    <ul class="guide-steps">
                        <li>点击「新建分类」创建一个分类；</li>
                        <li>在左侧选择分类；</li>
                        <li>右侧点击「新建 Prompt」填写提示词。</li>
                    </ul>
                </div>
                <div class="guide-actions">
                    <el-button v-show="!guideCollapsed" type="primary" size="small" :icon="Plus"
                        @click="openCategoryDialog()">立即新建分类</el-button>
                    <el-button size="small" link @click="guideCollapsed = !guideCollapsed">{{ guideCollapsed ? '展开' :
                        '收起' }}</el-button>
                </div>
            </div>
        </div>

        <el-row :gutter="16" class="content-row">
            <el-col :xs="24" :md="10">
                <el-card class="panel list-panel" shadow="never">
                    <template #header>
                        <div class="toolbar toolbar--simple">
                            <div class="panel-title" style="grid-area:title">分类管理</div>
                            <div class="actions" style="grid-area:actions">
                                <el-button type="primary" size="small" :icon="Plus" @click="openCategoryDialog()">
                                    新建分类
                                </el-button>
                            </div>
                        </div>
                    </template>

                    <div class="list-body" v-loading="categoryLoading">
                        <el-empty v-if="!categories.length && !categoryLoading" description="暂无分类" class="table-empty">
                            <template #extra>
                                <el-button type="primary" size="small" :icon="Plus"
                                    @click="openCategoryDialog()">新建分类</el-button>
                            </template>
                        </el-empty>

                        <div v-else class="list-container">
                            <div v-for="(item, idx) in categories" :key="item.id" class="list-item category-item"
                                :class="{ selected: item.id === selectedCategoryId }"
                                @click="handleCategoryChange(item)">
                                <div class="list-content">
                                    <div class="item-title">
                                        <span class="index-badge">#{{ idx + 1 }}</span>
                                        <span class="text">{{ item.categoryName }}</span>
                                    </div>
                                    <div class="meta">
                                        <el-tag size="small" effect="plain">{{ item.promptCount ?? 0 }} 个
                                            Prompt</el-tag>
                                        <span class="create-time">{{ formatTime(item.createTime) }}</span>
                                    </div>
                                </div>
                                <div class="list-actions" @click.stop>
                                    <el-button link type="primary" size="small" :icon="Edit"
                                        @click="openCategoryDialog(item)">编辑</el-button>
                                    <el-button link type="danger" size="small" :icon="Delete"
                                        @click="confirmRemoveCategory(item)">删除</el-button>
                                </div>
                            </div>
                        </div>
                    </div>
                </el-card>
            </el-col>
            <el-col :xs="24" :md="14">
                <el-card class="panel list-panel" shadow="never">
                    <template #header>
                        <div class="toolbar toolbar--with-subtitle">
                            <div class="panel-title" style="grid-area:title">Prompt 列表</div>
                            <div v-if="selectedCategoryName" class="panel-subtitle" style="grid-area:subtitle">当前分类：{{
                                selectedCategoryName }}</div>
                            <div class="actions" style="grid-area:actions">
                                <el-button type="primary" size="small" :icon="Plus" @click="openPromptDialog()"
                                    :disabled="!canCreatePrompt">
                                    新建 Prompt
                                </el-button>
                            </div>
                        </div>
                    </template>

                    <div class="list-body" v-loading="promptsLoading">
                        <el-empty v-if="!prompts.length && !promptsLoading" :description="promptsEmptyText"
                            class="table-empty">
                            <template #extra>
                                <el-button type="primary" size="small" :icon="Plus" :disabled="!canCreatePrompt"
                                    @click="openPromptDialog()">新建 Prompt</el-button>
                            </template>
                        </el-empty>

                        <div v-else class="list-container">
                            <div v-for="(p, idx) in prompts" :key="p.id" class="list-item prompt-item">
                                <div class="list-content">
                                    <div class="item-title">
                                        <span class="index-badge">#{{ idx + 1 }}</span>
                                        <span class="text">{{ p.content }}</span>
                                    </div>
                                    <div class="meta">
                                        <el-tag size="small" type="info" effect="plain">{{ p.categoryName || '未分类'
                                            }}</el-tag>
                                        <span class="create-time">{{ formatTime(p.createTime) }}</span>
                                    </div>
                                </div>
                                <div class="list-actions">
                                    <el-button link type="primary" size="small" :icon="DocumentCopy"
                                        @click="copyPrompt(p.content)">复制</el-button>
                                    <el-button link type="primary" size="small" :icon="Edit"
                                        @click="openPromptDialog(p)">编辑</el-button>
                                    <el-button link type="danger" size="small" :icon="Delete"
                                        @click="confirmRemovePrompt(p)">删除</el-button>
                                </div>
                            </div>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <el-dialog v-model="categoryDialogVisible" :title="categoryDialogTitle" :width="categoryDialogWidth"
            :top="dialogTop" class="responsive-dialog" destroy-on-close>
            <el-form ref="categoryFormRef" :model="categoryForm" :rules="categoryRules" label-width="90px">
                <el-form-item label="分类名称" prop="categoryName">
                    <el-input v-model="categoryForm.categoryName" maxlength="50" show-word-limit
                        placeholder="请输入分类名称" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="categoryDialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="categorySubmitting" @click="submitCategory">保存</el-button>
            </template>
        </el-dialog>

        <el-dialog v-model="promptDialogVisible" :title="promptDialogTitle" :width="promptDialogWidth" :top="dialogTop"
            class="responsive-dialog" destroy-on-close>
            <el-form ref="promptFormRef" :model="promptForm" :rules="promptRules" label-width="90px">
                <el-form-item label="所属分类" prop="categoryId">
                    <el-select v-model="promptForm.categoryId" placeholder="请选择分类" clearable class="category-select">
                        <el-option
                            v-for="item in categories"
                            :key="item.id"
                            :label="item.categoryName"
                            :value="item.id"
                        >
                            <div class="select-option">
                                <span class="select-option__name" :title="item.categoryName">{{ item.categoryName }}</span>
                                <span class="select-option__count">{{ item.promptCount ?? 0 }} 个模版</span>
                            </div>
                        </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="提示词内容" prop="content">
                    <el-input v-model="promptForm.content" type="textarea" :autosize="promptAutosize" maxlength="1000"
                        show-word-limit placeholder="请输入提示词内容" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="promptDialogVisible = false">取消</el-button>
                <el-button type="primary" :loading="promptSubmitting" @click="submitPrompt">保存</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Refresh, Edit, Delete, DocumentCopy } from '@element-plus/icons-vue';
import {
    listPromptCategoriesService,
    createPromptCategoryService,
    updatePromptCategoryService,
    deletePromptCategoryService,
    listSavedPromptsService,
    createSavedPromptService,
    updateSavedPromptService,
    deleteSavedPromptService,
} from '@/api/ai.js';
import { formatDate } from '@/utils/format';

const categories = ref([]);
const guideCollapsed = ref(false);
const categoryLoading = ref(false);
const categorySubmitting = ref(false);
const categoryDialogVisible = ref(false);
const categoryFormRef = ref();
const categoryTableRef = ref();
const categoryForm = ref({
    id: null,
    categoryName: '',
});

const prompts = ref([]);
const promptsLoading = ref(false);
const promptSubmitting = ref(false);
const promptDialogVisible = ref(false);
const promptFormRef = ref();
const promptForm = ref({
    id: null,
    content: '',
    categoryId: null,
});

const selectedCategoryId = ref(null);

const categoryRules = {
    categoryName: [
        { required: true, message: '请输入分类名称', trigger: 'blur' },
        { min: 1, max: 50, message: '长度需在 1~50 个字符内', trigger: 'blur' },
    ],
};

const promptRules = {
    categoryId: [
        { required: true, message: '请选择分类', trigger: 'change' },
    ],
    content: [
        { required: true, message: '请输入提示词内容', trigger: 'blur' },
        { min: 1, max: 1000, message: '长度需在 1~1000 个字符内', trigger: 'blur' },
    ],
};

const OFFICIAL_TEMPLATE_KEYWORDS = ['官方模版', '官方模板'];
const isOfficialTemplateCategory = (name) =>
    typeof name === 'string' && OFFICIAL_TEMPLATE_KEYWORDS.some((keyword) => name.includes(keyword));

const selectedCategoryName = computed(() => {
    const target = categories.value.find((item) => item.id === selectedCategoryId.value);
    return target ? target.categoryName : '';
});

const canCreatePrompt = computed(() => categories.value.length > 0);

const promptsEmptyText = computed(() => {
    if (!categories.value.length) return '请先创建分类';
    if (!selectedCategoryId.value) return '暂无提示词';
    return '当前分类暂无提示词';
});

// 小屏自适应：弹窗尺寸与间距
const isMobile = ref(false);
let mediaQuery;
const handleMediaChange = (event) => {
    isMobile.value = event.matches;
};

if (typeof window !== 'undefined' && window.matchMedia) {
    mediaQuery = window.matchMedia('(max-width: 768px)');
    isMobile.value = mediaQuery.matches;
    if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleMediaChange);
    } else if (mediaQuery.addListener) {
        mediaQuery.addListener(handleMediaChange);
    }
}

onBeforeUnmount(() => {
    if (!mediaQuery) return;
    if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
    } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleMediaChange);
    }
});

const categoryDialogWidth = computed(() => (isMobile.value ? '94vw' : '420px'));
const promptDialogWidth = computed(() => (isMobile.value ? '94vw' : '520px'));
const dialogTop = computed(() => (isMobile.value ? '6vh' : '15vh'));
const promptAutosize = computed(() => (isMobile.value ? { minRows: 6, maxRows: 12 } : { minRows: 4, maxRows: 10 }));

const formatTime = (value) => {
    if (!value) return '';
    return formatDate(value, 'YYYY-MM-DD HH:mm:ss');
};

const refreshAll = async () => {
    await fetchCategories();
};

const fetchCategories = async () => {
    categoryLoading.value = true;
    const previousId = selectedCategoryId.value;
    try {
        const response = await listPromptCategoriesService();
        const list = Array.isArray(response?.data) ? response.data : [];
        const filteredList = list.filter((item) => !isOfficialTemplateCategory(item?.categoryName));
        categories.value = filteredList;

        if (!filteredList.length) {
            selectedCategoryId.value = null;
            prompts.value = [];
            return;
        }

        let targetId = previousId;
        if (!targetId || !filteredList.some((item) => item.id === targetId)) {
            targetId = filteredList[0].id;
        }
        selectedCategoryId.value = targetId;

        await nextTick(() => {
            const current = filteredList.find((item) => item.id === selectedCategoryId.value);
            if (current && categoryTableRef.value) {
                categoryTableRef.value.setCurrentRow(current);
            }
        });

        await fetchPrompts(targetId);
    } catch (error) {
        console.error('加载分类失败', error);
    } finally {
        categoryLoading.value = false;
    }
};

const fetchPrompts = async (categoryId = selectedCategoryId.value) => {
    if (!categories.value.length) {
        prompts.value = [];
        return;
    }

    const activeCategory = categories.value.find((item) => item.id === categoryId);
    if (!activeCategory || isOfficialTemplateCategory(activeCategory.categoryName)) {
        prompts.value = [];
        return;
    }
    promptsLoading.value = true;
    try {
        const response = await listSavedPromptsService(categoryId || undefined);
        const list = Array.isArray(response?.data) ? response.data : [];
        const filteredPrompts = list.filter((item) => !isOfficialTemplateCategory(item?.categoryName));
        prompts.value = filteredPrompts;
    } catch (error) {
        console.error('加载提示词失败', error);
    } finally {
        promptsLoading.value = false;
    }
};

const handleCategoryChange = async (row) => {
    const targetId = row?.id ?? null;
    selectedCategoryId.value = targetId;
    await fetchPrompts(targetId);
};

const openCategoryDialog = (category) => {
    if (category) {
        categoryForm.value = {
            id: category.id,
            categoryName: category.categoryName,
        };
    } else {
        categoryForm.value = {
            id: null,
            categoryName: '',
        };
    }
    categoryDialogVisible.value = true;
    nextTick(() => categoryFormRef.value?.clearValidate?.());
};

const submitCategory = async () => {
    if (!categoryFormRef.value) return;
    try {
        await categoryFormRef.value.validate();
        categorySubmitting.value = true;
        const payload = { categoryName: categoryForm.value.categoryName?.trim() };
        if (categoryForm.value.id) {
            await updatePromptCategoryService(categoryForm.value.id, payload);
        } else {
            await createPromptCategoryService(payload);
        }
        categoryDialogVisible.value = false;
        await fetchCategories();
    } catch (error) {
        console.error('提交分类失败', error);
    } finally {
        categorySubmitting.value = false;
    }
};

const confirmRemoveCategory = async (category) => {
    if (!category?.id) return;
    try {
        await ElMessageBox.confirm(
            `确认删除分类“${category.categoryName}”吗？删除后分类下的 Prompt 需要重新归类。`,
            '提示',
            {
                confirmButtonText: '删除',
                cancelButtonText: '取消',
                type: 'warning',
            },
        );
        await deletePromptCategoryService(category.id);
        await fetchCategories();
    } catch (error) {
        if (error !== 'cancel') {
            console.error('删除分类失败', error);
        }
    }
};

const openPromptDialog = (prompt) => {
    if (prompt) {
        promptForm.value = {
            id: prompt.id,
            content: prompt.content,
            categoryId: prompt.categoryId,
        };
    } else {
        promptForm.value = {
            id: null,
            content: '',
            categoryId: selectedCategoryId.value,
        };
    }
    promptDialogVisible.value = true;
    nextTick(() => promptFormRef.value?.clearValidate?.());
};

const submitPrompt = async () => {
    if (!promptFormRef.value) return;
    try {
        await promptFormRef.value.validate();
        promptSubmitting.value = true;
        const payload = {
            content: promptForm.value.content?.trim(),
            categoryId: promptForm.value.categoryId,
        };
        if (promptForm.value.id) {
            await updateSavedPromptService(promptForm.value.id, payload);
        } else {
            await createSavedPromptService(payload);
        }
        promptDialogVisible.value = false;
        await fetchCategories();
    } catch (error) {
        console.error('提交 Prompt 失败', error);
    } finally {
        promptSubmitting.value = false;
    }
};

const confirmRemovePrompt = async (prompt) => {
    if (!prompt?.id) return;
    try {
        await ElMessageBox.confirm(
            '确认删除该 Prompt 吗？',
            '提示',
            {
                confirmButtonText: '删除',
                cancelButtonText: '取消',
                type: 'warning',
            },
        );
        await deleteSavedPromptService(prompt.id);
        await fetchCategories();
    } catch (error) {
        if (error !== 'cancel') {
            console.error('删除 Prompt 失败', error);
        }
    }
};

const copyPrompt = async (content) => {
    if (!content) return;
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(content);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = content;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
        ElMessage.success('提示词已复制');
    } catch (error) {
        console.error('复制失败', error);
        ElMessage.error('复制失败，请手动复制');
    }
};

onMounted(async () => {
    await fetchCategories();
});
</script>

<style scoped lang="scss">
.prompt-manager-page {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* 顶部指引 */
.guide-banner {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border: 1px solid var(--el-border-color-lighter);
    background: color-mix(in srgb, var(--el-color-danger-light-9) 70%, #fff 30%);
    border-left: 4px solid var(--el-color-danger-light-5);
    border-radius: 12px;
}

.guide-badge {
    font-size: 12px;
    color: #fff;
    background: #d92626;
    border-radius: 6px;
    padding: 2px 8px;
}

.guide-content {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.guide-content .guide-title {
    font-weight: 600;
    white-space: normal;
    word-break: break-word;
}

.guide-steps {
    margin: 0;
    padding-left: 18px;
    color: var(--el-text-color-secondary);
    list-style: disc;
    line-height: 1.6;
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

/* 移动端优化：指引换为三行布局 */
@media (max-width: 576px) {
    .guide-banner {
        grid-template-columns: 1fr;
        align-items: flex-start;
    }

    .guide-badge {
        align-self: flex-start;
    }

    .guide-actions {
        justify-content: flex-start;
        margin-top: 6px;
        flex-wrap: wrap;
    }

    .guide-content {
        font-size: 14px;
    }
}

/* 移动端弹窗优化：小屏下宽度与内容滚动 */
.responsive-dialog :deep(.el-dialog__body) {
    max-height: 65vh;
    overflow: auto;
}

@media (max-width: 576px) {
    .responsive-dialog :deep(.el-dialog) {
        margin: 0 auto;
    }

    .responsive-dialog :deep(.el-dialog__headerbtn) {
        top: 10px;
    }
}

.page-header {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 20px;
    background-color: var(--el-card-bg-color);
    border-radius: 12px;
    border: 1px solid var(--el-border-color-lighter);
}

.page-header__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.page-header__titles {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.page-header__actions {
    display: flex;
    gap: 12px;
}

.page-title {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
}

.page-subtitle {
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
}

.content-row {
    margin: 0;
}

.panel {
    height: 100%;

    .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
    }

    .panel-title-group {
        display: flex;
        align-items: baseline;
        gap: 8px;
    }

    .panel-title {
        font-weight: 600;
    }

    .panel-subtitle {
        font-size: 12px;
        color: var(--el-text-color-secondary);
    }

    .table-empty {
        padding: 24px 0;
    }
}

/* 列表式面板，参考 MagicHistory.vue */
.list-panel .toolbar {
    display: grid;
    grid-template-columns: 1fr auto;
    grid-template-areas: 'title actions';
    align-items: center;
    column-gap: 12px;
    row-gap: 4px;
}

.list-panel .toolbar--with-subtitle {
    grid-template-areas:
        'title actions'
        'subtitle actions';
}

.toolbar .panel-title {
    grid-area: title;
    font-weight: 600;
}

.toolbar .panel-subtitle {
    grid-area: subtitle;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.toolbar .actions {
    grid-area: actions;
    display: flex;
    gap: 8px;
}

.list-body {
    min-height: 420px;
}

.list-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.list-item {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid color-mix(in srgb, var(--el-border-color) 70%, transparent);
    background: var(--app-surface, var(--el-card-bg-color));
    transition: border-color .2s, box-shadow .2s, transform .2s;
}

.list-item:hover {
    transform: translateY(-1px);
    border-color: var(--el-border-color-light);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
}

.list-item.selected {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
}

.list-content {
    min-width: 0;
}

.item-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.item-title .text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.index-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 999px;
    font-size: 12px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
}

.meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 6px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.list-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

@media (max-width: 768px) {
    .list-item {
        grid-template-columns: 1fr;
    }

    .list-actions {
        justify-content: flex-end;
    }
}

@media (max-width: 991px) {
    .page-header__row {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
    }
}

.management-table {
    border-radius: 10px;

    :deep(.el-table__inner-wrapper) {
        border-radius: 10px;
    }

    :deep(.el-table__cell) {
        vertical-align: middle;
    }

    :deep(.action-column .cell) {
        display: flex;
        gap: 12px;
        justify-content: flex-start;
        flex-wrap: wrap;
    }

    &.is-mobile {
        :deep(.el-table__header-wrapper) {
            display: none;
        }

        :deep(.el-table__body-wrapper) {
            border-top: none;
        }

        :deep(.el-table__row) {
            display: block;
            border: 1px solid var(--el-border-color-lighter);
            border-radius: 10px;
            margin-bottom: 12px;
            overflow: hidden;
        }

        :deep(.el-table__cell) {
            display: block;
            padding: 12px;
            border-bottom: 1px solid var(--el-border-color-lighter);
        }

        :deep(.el-table__cell:last-child) {
            border-bottom: none;
        }

        :deep(.action-column .cell) {
            justify-content: flex-start;
            gap: 8px;
            flex-wrap: wrap;
        }

        :deep(.action-column .cell .el-button) {
            padding: 0;
        }
    }
}

.category-cell,
.prompt-cell {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.category-cell__primary,
.prompt-cell__primary {
    display: flex;
    align-items: center;
    gap: 8px;
}

.category-cell__index,
.prompt-cell__index {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 999px;
    font-size: 12px;
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
    font-weight: 600;
}

.category-cell__name,
.prompt-cell__content {
    font-weight: 600;
    color: var(--el-text-color-primary);
    line-height: 1.4;
    overflow: hidden;
    text-overflow: ellipsis;
}

.category-cell__meta,
.prompt-cell__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 12px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.6;
}

.prompt-cell__category {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--el-color-info-light-9);
    color: var(--el-color-info);
}

.management-table:not(.is-mobile) {

    .category-cell__index,
    .prompt-cell__index,
    .category-cell__meta,
    .prompt-cell__meta {
        display: none;
    }
}

/* 分类下拉项：显示“名称 + 计数”，长名称省略 */
.category-select :deep(.el-select-dropdown__item) {
    display: flex;
    align-items: center;
}

.select-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
}

.select-option__name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.select-option__count {
    flex: none;
    font-size: 12px;
    color: var(--el-text-color-secondary);
}
</style>
