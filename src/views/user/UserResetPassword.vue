<script setup>
import { ref } from 'vue'
import { userPasswordResetService } from '@/api/user.js'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()

//表单数据模型
const passwordForm = ref({
    old_pwd: '',      // 当前密码
    new_pwd: '',      // 新密码
    re_pwd: ''        // 确认新密码
})

//表单引用
const formRef = ref()

//自定义确认密码验证规则
const checkRePassword = (rule, value, callback) => {
    if (value === '') {
        callback(new Error('请再次输入新密码'))
    } else if (value !== passwordForm.value.new_pwd) {
        callback(new Error('两次输入的密码不一致'))
    } else {
        callback()
    }
}

//表单验证规则
const rules = {
    old_pwd: [
        { required: true, message: '请输入当前密码', trigger: 'blur' },
        {
            min: 5,
            max: 16,
            message: '密码长度应为5-16位',
            trigger: 'blur'
        }
    ],
    new_pwd: [
        { required: true, message: '请输入新密码', trigger: 'blur' },
        {
            min: 5,
            max: 16,
            message: '密码长度应为5-16位',
            trigger: 'blur'
        },
        {
            pattern: /^[a-zA-Z0-9\S]{5,16}$/,
            message: '密码必须是5-16位的字母、数字或特殊字符',
            trigger: 'blur'
        }
    ],
    re_pwd: [
        { required: true, message: '请确认新密码', trigger: 'blur' },
        { validator: checkRePassword, trigger: 'blur' }
    ]
}

//重置密码提交处理
const submitPasswordReset = async () => {
    //先进行表单验证
    const isValid = await formRef.value.validate().catch(() => false)
    if (!isValid) {
        return
    }

    try {
        //调用重置密码接口
        const result = await userPasswordResetService({
            old_pwd: passwordForm.value.old_pwd,
            new_pwd: passwordForm.value.new_pwd,
            re_pwd: passwordForm.value.re_pwd
        })

        ElMessage.success(result.message || '密码修改成功！请重新登录')

        //重置表单
        passwordForm.value = {
            old_pwd: '',
            new_pwd: '',
            re_pwd: ''
        }

        //3秒后跳转到登录页面
        setTimeout(() => {
            router.push('/login')
        }, 2000)

    } catch (error) {
        console.error('密码重置失败：', error)
        ElMessage.error(error.message || '密码修改失败，请重试')
    }
}

//重置表单
const resetForm = () => {
    formRef.value?.resetFields()
    passwordForm.value = {
        old_pwd: '',
        new_pwd: '',
        re_pwd: ''
    }
}
</script>

<template>
    <el-card class="page-container warm-card">
        <template #header>
            <div class="header">
                <span>重置密码</span>
            </div>
        </template>
        <el-row>
            <el-col :span="12">
                <el-form ref="formRef" :model="passwordForm" :rules="rules" label-width="100px" size="large">
                    <el-form-item label="当前密码" prop="old_pwd">
                        <el-input v-model="passwordForm.old_pwd" type="password" placeholder="请输入当前密码" show-password
                            clearable />
                    </el-form-item>

                    <el-form-item label="新密码" prop="new_pwd">
                        <el-input v-model="passwordForm.new_pwd" type="password" placeholder="请输入新密码" show-password
                            clearable />
                    </el-form-item>

                    <el-form-item label="确认新密码" prop="re_pwd">
                        <el-input v-model="passwordForm.re_pwd" type="password" placeholder="请再次输入新密码" show-password
                            clearable />
                    </el-form-item>

                    <el-form-item>
                        <el-button type="primary" @click="submitPasswordReset" :loading="false">
                            确认修改
                        </el-button>
                        <el-button type="info" @click="resetForm">
                            重置表单
                        </el-button>
                    </el-form-item>
                </el-form>
            </el-col>
        </el-row>
    </el-card>
</template>

<style lang="scss" scoped>
.page-container {
    min-height: 400px;
}

.warm-card {
    background: linear-gradient(180deg, #FDF9F6 0%, #FAF4EF 100%);
    border: 1px solid rgba(217, 116, 89, 0.15);
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(92, 75, 58, 0.08);

    :deep(.el-card__header) {
        background: linear-gradient(135deg, rgba(217, 116, 89, 0.08) 0%, rgba(244, 162, 97, 0.05) 100%);
        border-bottom: 1px solid rgba(217, 116, 89, 0.12);
    }
}

.header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    span {
        font-weight: 600;
        color: #5C4B3A;
    }
}

:deep(.el-form-item__label) {
    font-weight: 500;
}

:deep(.el-input__wrapper) {
    border-radius: 8px;
}

:deep(.el-input__wrapper:focus-within) {
    box-shadow: 0 0 0 1px #D97459 inset;
}

:deep(.el-button) {
    border-radius: 8px;
    margin-right: 12px;
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

:deep(.el-button--info) {
    background: #FBF7F3;
    border: 1px solid rgba(217, 116, 89, 0.2);
    color: #5C4B3A;
}

:deep(.el-button--info:hover) {
    background: #F5E6DC;
    border-color: rgba(217, 116, 89, 0.3);
}

// 密码强度提示样式
.password-strength {
    margin-top: 5px;
    font-size: 12px;

    &.weak {
        color: #D97459;
    }

    &.medium {
        color: #F4A261;
    }

    &.strong {
        color: #9C8B7A;
    }
}

.dark .warm-card {
    background: linear-gradient(180deg, #2A2420 0%, #231E1A 100%);
    border-color: rgba(244, 162, 97, 0.2);

    :deep(.el-card__header) {
        background: linear-gradient(135deg, rgba(244, 162, 97, 0.12) 0%, rgba(233, 196, 106, 0.08) 100%);
        border-bottom-color: rgba(244, 162, 97, 0.15);
    }
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

.dark :deep(.el-button--info) {
    background: #3D342A;
    border-color: rgba(244, 162, 97, 0.2);
    color: #E8DED3;
}
</style>