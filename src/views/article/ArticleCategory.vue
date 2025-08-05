<script setup>
import { ElMessageBox, ElMessage } from 'element-plus'
import {
    Edit,
    Delete
} from '@element-plus/icons-vue'

import { ref } from 'vue'
const categorys = ref([
    {
        "id": 3,
        "categoryName": "美食",
        "categoryAlias": "my",
        "createTime": "2023-09-02 12:06:59",
        "updateTime": "2023-09-02 12:06:59"
    },
    {
        "id": 4,
        "categoryName": "娱乐",
        "categoryAlias": "yl",
        "createTime": "2023-09-02 12:08:16",
        "updateTime": "2023-09-02 12:08:16"
    },
    {
        "id": 5,
        "categoryName": "军事",
        "categoryAlias": "js",
        "createTime": "2023-09-02 12:08:33",
        "updateTime": "2023-09-02 12:08:33"
    }

])

import { getCategoryListService } from '@/api/article'
const getCategoryList = async () => {
    const result = await getCategoryListService();
    categorys.value = result.data;
}
getCategoryList();

//控制添加分类弹窗
const dialogVisible = ref(false)
//添加分类数据模型
const categoryModel = ref({
    categoryName: '',
    categoryAlias: ''
})
//添加分类表单校验
const rules = {
    categoryName: [
        { required: true, message: '请输入分类名称', trigger: 'blur' },
    ],
    categoryAlias: [
        { required: true, message: '请输入分类别名', trigger: 'blur' },
    ]
}

//清除表单数据
const clearCategoryModel = () => {
    categoryModel.value = {
        categoryName: '',
        categoryAlias: ''
    }
}
//调用添加分类接口
import { addCategoryService } from '@/api/article'
const addCategory = async () => {
    const result = await addCategoryService(categoryModel.value);
    console.log(result);

    //刷新分类列表
    getCategoryList();
    //关闭弹窗
    dialogVisible.value = false;
    //清除表单数据
    clearCategoryModel();       
}

//调用更新分类接口 showDialog中获取的id已经赋值给categoryModel.value.id，所以不需要再传入id
import { updateCategoryService } from '@/api/article'
const updateCategory = async (row) => {
    const result = await updateCategoryService(categoryModel.value);
    dialogVisible.value = false;
    clearCategoryModel();//清除表单数据
    getCategoryList();//刷新分类列表
    console.log(result);
}

//调用删除分类接口
import { deleteCategoryService } from '@/api/article'
const deleteCategory = async (row) => {
    ElMessageBox.confirm(
    'proxy will permanently delete the file. Continue?',
    'Warning',
    {
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
      type: 'warning',
    }
  )
    .then(async  () => {
    const result = await deleteCategoryService(row.id);
    getCategoryList();
    console.log(result);
      ElMessage({
        type: 'success',
        message: 'Delete completed',
      })
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: 'Delete canceled',
      })
    })
   
}

//控制弹窗标题
const title = ref('添加分类')

//获取当前行数据并赋值给categoryModel用于在编辑弹窗中回显,在updateCategory同样需要id
const showDialog = (row) => {
    title.value = '编辑分类'
    dialogVisible.value = true
    categoryModel.value.categoryName = row.categoryName
    categoryModel.value.categoryAlias = row.categoryAlias
    categoryModel.value.id = row.id
}
</script>
<template>
    <el-card class="page-container">
        <template #header>
            <div class="header">
                <span>文章分类</span>
                <div class="extra">
                    <el-button type="primary" @click=" title = '添加分类',dialogVisible = true">添加分类</el-button>
                </div>
            </div>
        </template>
        <el-table :data="categorys" style="width: 100%">
            <el-table-column label="序号" width="100" type="index"> </el-table-column>
            <el-table-column label="分类名称" prop="categoryName"></el-table-column>
            <el-table-column label="分类别名" prop="categoryAlias"></el-table-column>
            <el-table-column label="操作" width="100">
                <!-- #default="{row}" 获取当前行数据 -->
                <template #default="{row}">
                    <el-button :icon="Edit" circle plain type="primary" @click="showDialog(row)"></el-button>
                    <el-button :icon="Delete" circle plain type="danger" @click="deleteCategory(row)"></el-button>
                </template>
            </el-table-column>
            <template #empty>
                <el-empty description="没有数据" />
            </template>
        </el-table>
    </el-card>

        <!-- 添加分类弹窗 -->
    <el-dialog v-model="dialogVisible" :title="title" width="30%">
        <el-form :model="categoryModel" :rules="rules" label-width="100px" style="padding-right: 30px">
            <el-form-item label="分类名称" prop="categoryName">
                <el-input v-model="categoryModel.categoryName" minlength="1" maxlength="10"></el-input>
            </el-form-item>
            <el-form-item label="分类别名" prop="categoryAlias">
                <el-input v-model="categoryModel.categoryAlias" minlength="1" maxlength="15"></el-input>
            </el-form-item>
        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="dialogVisible = false; clearCategoryModel()">取消</el-button>
                <el-button type="primary" @click="title === '添加分类' ? addCategory() : updateCategory()"> 确认 </el-button>
            </span>
        </template>
    </el-dialog>
</template>

<style lang="scss" scoped>
.page-container {
    min-height: 100%;
    box-sizing: border-box;

    .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
}
</style>