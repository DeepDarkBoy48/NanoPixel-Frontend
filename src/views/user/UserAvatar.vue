<script setup>
import { Plus, Upload } from '@element-plus/icons-vue'
import { ref, computed } from 'vue'
const uploadRef = ref()
import { useTokenStore } from '@/store/token.js'
const tokenStore = useTokenStore();

import useUserInfoStore from '@/store/userInfo.js'
const userInfoStore = useUserInfoStore();

//用户头像地址
const imgUrl = ref(userInfoStore.info.userPic)

const defaultAvatar = computed(() => {
    const seed = userInfoStore.info.nickname || 'default_user'
    return `https://api.dicebear.com/9.x/identicon/svg?seed=${seed}`
})

//图片上传成功的回调函数
const uploadSuccess = (result) => {
    imgUrl.value = result.data.fileUrl;
}

import { userAvatarUpdateService } from '@/api/user.js'
import { ElMessage } from 'element-plus'
//头像修改
const updateAvatar = async () => {
    //调用接口
    let result = await userAvatarUpdateService(imgUrl.value);

    ElMessage.success('修改成功')

    //修改pinia中的数据
    userInfoStore.info.userPic = imgUrl.value
}
</script>

<template>
    <el-card class="page-container warm-card">
        <template #header>
            <div class="header">
                <span>更换头像</span>
            </div>
        </template>
        <el-row>
            <el-col :span="12">
                <el-upload ref="uploadRef" class="avatar-uploader" :show-file-list="false" :auto-upload="true"
                    action="/api/upload" name="file" :headers="{ 'Authorization': tokenStore.token }"
                    :on-success="uploadSuccess">
                    <img v-if="imgUrl" :src="imgUrl" class="avatar" />
                    <img v-else :src="defaultAvatar" width="278" />
                </el-upload>
                <br />
                <el-button type="primary" :icon="Plus" size="large"
                    @click="uploadRef.$el.querySelector('input').click()">
                    选择图片
                </el-button>
                <el-button class="upload-btn" :icon="Upload" size="large" @click="updateAvatar">
                    上传头像
                </el-button>
            </el-col>
        </el-row>
    </el-card>
</template>

<style lang="scss" scoped>
.warm-card {
    background: linear-gradient(180deg, #FDF9F6 0%, #FAF4EF 100%);
    border: 1px solid rgba(217, 116, 89, 0.15);
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(92, 75, 58, 0.08);

    :deep(.el-card__header) {
        background: linear-gradient(135deg, rgba(217, 116, 89, 0.08) 0%, rgba(244, 162, 97, 0.05) 100%);
        border-bottom: 1px solid rgba(217, 116, 89, 0.12);
    }

    .header span {
        font-weight: 600;
        color: #5C4B3A;
    }
}

.avatar-uploader {
    :deep() {
        .avatar {
            width: 278px;
            height: 278px;
            display: block;
        }

        .el-upload {
            border: 2px dashed rgba(217, 116, 89, 0.3);
            border-radius: 12px;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            transition: var(--el-transition-duration-fast);
        }

        .el-upload:hover {
            border-color: #D97459;
            box-shadow: 0 4px 16px rgba(217, 116, 89, 0.15);
        }

        .el-icon.avatar-uploader-icon {
            font-size: 28px;
            color: #9C8B7A;
            width: 278px;
            height: 278px;
            text-align: center;
        }
    }
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

.upload-btn {
    background: linear-gradient(135deg, #5C4B3A 0%, #7A6B5C 100%) !important;
    border: none !important;
    color: #fff !important;
    box-shadow: 0 4px 12px rgba(92, 75, 58, 0.2);
}

.upload-btn:hover {
    background: linear-gradient(135deg, #4A3C2E 0%, #5C4B3A 100%) !important;
    box-shadow: 0 6px 16px rgba(92, 75, 58, 0.3);
}

.dark .warm-card {
    background: linear-gradient(180deg, #2A2420 0%, #231E1A 100%);
    border-color: rgba(244, 162, 97, 0.2);

    :deep(.el-card__header) {
        background: linear-gradient(135deg, rgba(244, 162, 97, 0.12) 0%, rgba(233, 196, 106, 0.08) 100%);
        border-bottom-color: rgba(244, 162, 97, 0.15);
    }

    .header span {
        color: #E8DED3;
    }
}

.dark :deep(.el-button--primary) {
    background: linear-gradient(135deg, #F4A261 0%, #E9C46A 100%);
    color: #2A2420;
}

.dark .upload-btn {
    background: linear-gradient(135deg, #F4A261 0%, #E9C46A 100%) !important;
    color: #2A2420 !important;
}

.dark .avatar-uploader :deep(.el-upload) {
    border-color: rgba(244, 162, 97, 0.3);
}

.dark .avatar-uploader :deep(.el-upload:hover) {
    border-color: #F4A261;
}
</style>