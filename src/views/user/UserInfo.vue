<script setup>
import { ref } from 'vue'


const rules = {
    nickname: [
        { required: true, message: '请输入用户昵称', trigger: 'blur' },
        {
            pattern: /^\S{2,10}$/,
            message: '昵称必须是2-10位的非空字符串',
            trigger: 'blur'
        }
    ],
    email: [
        { required: true, message: '请输入用户邮箱', trigger: 'blur' },
        { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
    ]
}

//从pinia中获取个人信息并回显
import useUserInfoStore from '@/store/userInfo.js'
const userInfoStore = useUserInfoStore();
const userInfo = ref({ ...userInfoStore.info })

//修改个人信息
import { userInfoUpdateService } from '@/api/user.js'
import { ElMessage } from 'element-plus'
const updateUserInfo = async () => {
    //调用接口
    let result = await userInfoUpdateService(userInfo.value);
    ElMessage.success(result.message ? result.message : '修改成功');
    //修改pinia中的个人信息
    userInfoStore.setInfo(userInfo.value)
}
</script>
<template>
    <el-card class="page-container warm-card">
        <template #header>
            <div class="header">
                <span>基本资料</span>
            </div>
        </template>
        <el-row>
            <el-col :span="12">
                <el-form :model="userInfo" :rules="rules" label-width="100px" size="large">
                    <el-form-item label="登录名称">
                        <el-input v-model="userInfo.username" disabled></el-input>
                    </el-form-item>
                    <el-form-item label="用户昵称" prop="nickname">
                        <el-input v-model="userInfo.nickname"></el-input>
                    </el-form-item>
                    <el-form-item label="用户邮箱" prop="email">
                        <el-input v-model="userInfo.email"></el-input>
                    </el-form-item>
                    <el-form-item>
                        <el-button type="primary" @click="updateUserInfo">提交修改</el-button>
                    </el-form-item>
                </el-form>
            </el-col>
        </el-row>
    </el-card>
</template>

<style scoped>
.warm-card {
    background: linear-gradient(180deg, #FDF9F6 0%, #FAF4EF 100%);
    border: 1px solid rgba(217, 116, 89, 0.15);
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(92, 75, 58, 0.08);
}

.warm-card :deep(.el-card__header) {
    background: linear-gradient(135deg, rgba(217, 116, 89, 0.08) 0%, rgba(244, 162, 97, 0.05) 100%);
    border-bottom: 1px solid rgba(217, 116, 89, 0.12);
}

.header span {
    font-weight: 600;
    color: #5C4B3A;
}

:deep(.el-button--primary) {
    background: linear-gradient(135deg, #D97459 0%, #E89A84 100%);
    border: none;
    box-shadow: 0 4px 12px rgba(217, 116, 89, 0.25);
}

:deep(.el-button--primary:hover) {
    background: linear-gradient(135deg, #C86750 0%, #D97459 100%);
    box-shadow: 0 6px 16px rgba(217, 116, 89, 0.35);
}

:deep(.el-input__wrapper:focus-within) {
    box-shadow: 0 0 0 1px #D97459 inset;
}

.dark .warm-card {
    background: linear-gradient(180deg, #2A2420 0%, #231E1A 100%);
    border-color: rgba(244, 162, 97, 0.2);
}

.dark .warm-card :deep(.el-card__header) {
    background: linear-gradient(135deg, rgba(244, 162, 97, 0.12) 0%, rgba(233, 196, 106, 0.08) 100%);
    border-bottom-color: rgba(244, 162, 97, 0.15);
}

.dark .header span {
    color: #E8DED3;
}

.dark :deep(.el-button--primary) {
    background: linear-gradient(135deg, #F4A261 0%, #E9C46A 100%);
    color: #2A2420;
}

.dark :deep(.el-input__wrapper:focus-within) {
    box-shadow: 0 0 0 1px #F4A261 inset;
}
</style>