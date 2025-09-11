<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import {
    Management,
    Promotion,
    UserFilled,
    User,
    Crop,
    EditPen,
    SwitchButton,
    CaretBottom,
    ChatLineRound,
    Fold,
    Expand,
    Menu
} from '@element-plus/icons-vue'
import avatar from '@/assets/default.png'
import { userInfoService } from '@/api/user.js'
import useUserInfoStore from '@/store/userInfo.js'
import { useTokenStore } from '@/store/token.js'
const tokenStore = useTokenStore();
const userInfoStore = useUserInfoStore();
const isCollapse = ref(false)
const isMobile = ref(false)
const drawerVisible = ref(false)

const checkIsMobile = () => {
    isMobile.value = window.innerWidth < 768
}

onMounted(() => {
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', checkIsMobile)
})

// 监听 isMobile 变化，如果从移动端切换到桌面端，确保抽屉关闭
watch(isMobile, (newVal) => {
    if (!newVal) {
        drawerVisible.value = false
    }
})

//调用函数,获取用户详细信息
const getUserInfo = async () => {
    //调用接口
    let result = await userInfoService();
    //数据存储到pinia中
    userInfoStore.setInfo(result.data);
}
getUserInfo();

import { useRouter, useRoute } from 'vue-router'
const router = useRouter();
const route = useRoute();

// 顶部模块导航（核心）：
// 根据当前路由前缀选择要渲染的“模块导航组件”，
// 这样不同模块可以在同一布局头部呈现不同的二级导航。
import NavMagicImageEdit from '@/components/navbars/NavMagicImageEdit.vue'
import NavLibrary from '@/components/navbars/NavLibrary.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
const handleCommand = (command) => {
    //判断指令
    if (command === 'logout') {
        //退出登录
        ElMessageBox.confirm(
            '您确认要退出吗?',
            '温馨提示',
            {
                confirmButtonText: '确认',
                cancelButtonText: '取消',
                type: 'warning',
            }
        )
            .then(async () => {
                //退出登录
                //1.清空pinia中存储的token以及个人信息
                tokenStore.removeToken()
                userInfoStore.removeInfo()

                //2.跳转到登录页面
                router.push('/login')
                ElMessage({
                    type: 'success',
                    message: '退出登录成功',
                })

            })
            .catch(() => {
                ElMessage({
                    type: 'info',
                    message: '用户取消了退出登录',
                })
            })
    } else {
        //路由
        router.push('/user/' + command)
    }
}

const handleMenuClick = () => {
    if (isMobile.value) {
        drawerVisible.value = !drawerVisible.value
    } else {
        isCollapse.value = !isCollapse.value
    }
}

// 当前显示的模块导航组件（核心）：
// 通过路由前缀匹配来确定头部中部区域展示哪个导航组件。
// 注意：按需扩展时只需要在下面增加一个分支并导入组件即可。
const currentHeaderNav = computed(() => {
    const path = route.path || ''
    if (path.startsWith('/ai/magicImageEdit')) return NavMagicImageEdit
    if (path.startsWith('/ai/library')) return NavLibrary
    return null
})

// 侧边菜单高亮同步（核心）：
// 当处于模块内的子路由时，让左侧菜单仍高亮该模块的“入口路径”。
// 这样点击模块导航切换子页时，左侧不会跳到其它高亮。
const activeMenu = computed(() => {
    const path = route.path || ''
    if (path.startsWith('/ai/magicImageEdit')) return '/ai/magicImageEdit'
    if (path.startsWith('/ai/library')) return '/ai/library'
    return path
})
</script>
<template>
    <!-- el-container 容器 -->
    <el-container class="layout-container">
        <!-- 左侧菜单 (桌面端) -->
        <el-aside v-if="!isMobile" :width="isCollapse ? '64px' : '200px'">
            <div class="el-aside__logo"></div>
            <!-- 菜单 -->
            <el-menu :default-active="activeMenu" active-text-color="#ffd04b" background-color="#232323"
                text-color="#fff" router :collapse="isCollapse" :collapse-transition="false">




                <el-sub-menu index="/ai">
                    <template #title>
                        <el-icon>
                            <ChatLineRound />
                        </el-icon>
                        <span>AI创作</span>
                    </template>

                    <el-menu-item index="/ai/magicImageEdit">
                        <el-icon>
                            <ChatLineRound />
                        </el-icon>
                        <span>魔法修图</span>
                    </el-menu-item>

                    <el-menu-item index="/ai/library">
                        <el-icon>
                            <ChatLineRound />
                        </el-icon>
                        <span>图片库</span>
                    </el-menu-item>
                    <el-menu-item index="/ai/chatRoom">
                        <el-icon>
                            <ChatLineRound />
                        </el-icon>
                        <span>聊天室</span>
                    </el-menu-item>
                </el-sub-menu>

                <el-sub-menu index="/article">
                    <template #title>
                        <el-icon>
                            <UserFilled />
                        </el-icon>
                        <span>文章中心</span>
                    </template>
                    <el-menu-item index="/article/category">
                        <el-icon>
                            <Management />
                        </el-icon>
                        <span>文章分类</span>
                    </el-menu-item>

                    <el-menu-item index="/article/manage">
                        <el-icon>
                            <Promotion />
                        </el-icon>
                        <span>文章管理</span>
                    </el-menu-item>
                </el-sub-menu>


                <el-sub-menu index="/user">
                    <template #title>
                        <el-icon>
                            <UserFilled />
                        </el-icon>
                        <span>个人中心</span>
                    </template>

                    <el-menu-item index="/user/info">
                        <el-icon>
                            <User />
                        </el-icon>
                        <span>基本资料</span>
                    </el-menu-item>

                    <el-menu-item index="/user/avatar">
                        <el-icon>
                            <Crop />
                        </el-icon>
                        <span>更换头像</span>
                    </el-menu-item>

                    <el-menu-item index="/user/resetPassword">
                        <el-icon>
                            <EditPen />
                        </el-icon>
                        <span>重置密码</span>
                    </el-menu-item>
                </el-sub-menu>
            </el-menu>
        </el-aside>

        <!-- 抽屉菜单 (移动端) -->
        <el-drawer v-if="isMobile" v-model="drawerVisible" title="菜单" direction="ltr" size="200px" :with-header="false"
            class="mobile-drawer">
            <div class="el-aside__logo"></div>
            <el-menu :default-active="activeMenu" active-text-color="#ffd04b" background-color="#232323"
                text-color="#fff" router @select="drawerVisible = false">
                <el-sub-menu index="/ai">
                    <template #title>
                        <el-icon>
                            <ChatLineRound />
                        </el-icon>
                        <span>AI创作</span>
                    </template>
                    <el-menu-item index="/ai/chatRoom">
                        <el-icon>
                            <ChatLineRound />
                        </el-icon>
                        <span>聊天室</span>
                    </el-menu-item>
                    <el-menu-item index="/ai/magicImageEdit">
                        <el-icon>
                            <ChatLineRound />
                        </el-icon>
                        <span>魔法修图</span>
                    </el-menu-item>
                    <el-menu-item index="/ai/library">
                        <el-icon>
                            <ChatLineRound />
                        </el-icon>
                        <span>图片库</span>
                    </el-menu-item>
                </el-sub-menu>

                <el-sub-menu index="/article">
                    <template #title>
                        <el-icon>
                            <UserFilled />
                        </el-icon>
                        <span>文章中心</span>
                    </template>
                    <el-menu-item index="/article/category">
                        <el-icon>
                            <Management />
                        </el-icon>
                        <span>文章分类</span>
                    </el-menu-item>
                    <el-menu-item index="/article/manage">
                        <el-icon>
                            <Promotion />
                        </el-icon>
                        <span>文章管理</span>
                    </el-menu-item>
                </el-sub-menu>

                <el-sub-menu index="/user">
                    <template #title>
                        <el-icon>
                            <UserFilled />
                        </el-icon>
                        <span>个人中心</span>
                    </template>

                    <el-menu-item index="/user/info">
                        <el-icon>
                            <User />
                        </el-icon>
                        <span>基本资料</span>
                    </el-menu-item>

                    <el-menu-item index="/user/avatar">
                        <el-icon>
                            <Crop />
                        </el-icon>
                        <span>更换头像</span>
                    </el-menu-item>

                    <el-menu-item index="/user/resetPassword">
                        <el-icon>
                            <EditPen />
                        </el-icon>
                        <span>重置密码</span>
                    </el-menu-item>


                </el-sub-menu>
            </el-menu>
        </el-drawer>

        <!-- 右侧主区域 -->
        <el-container>
            <!-- 头部区域 -->
            <el-header>
                <div class="header-left">
                    <el-icon @click="handleMenuClick" class="header-icon">
                        <component :is="isMobile ? Menu : (isCollapse ? Expand : Fold)" />
                    </el-icon>
                    <span class="header-title"></span><strong>{{ userInfoStore.info.nickname }}</strong>
                </div>
                <div class="header-center">
                    <component v-if="currentHeaderNav" :is="currentHeaderNav" />
                </div>
                <!-- 下拉菜单 -->
                <!-- command: 条目被点击后会触发,在事件函数上可以声明一个参数,接收条目对应的指令 -->
                <el-dropdown placement="bottom-end" @command="handleCommand">
                    <span class="el-dropdown__box">
                        <el-avatar :src="userInfoStore.info.userPic ? userInfoStore.info.userPic : avatar" />
                        <el-icon>
                            <CaretBottom />
                        </el-icon>
                    </span> <template #dropdown>
                        <el-dropdown-menu>
                            <el-dropdown-item command="info" :icon="User">
                                基本资料
                            </el-dropdown-item>
                            <el-dropdown-item command="avatar" :icon="Crop">
                                更换头像
                            </el-dropdown-item>
                            <el-dropdown-item command="resetPassword" :icon="EditPen">
                                重置密码
                            </el-dropdown-item>
                            <el-dropdown-item command="logout" :icon="SwitchButton">
                                退出登录
                            </el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </el-header>

            <!-- 中间区域 -->
            <el-main>
                <RouterView />
            </el-main>

            <!-- 底部区域
            <el-footer>
                大事件 ©2023 Created by 黑马程序员
            </el-footer> -->
        </el-container>
    </el-container>
</template>
<style lang="scss" scoped>
.layout-container {
    height: 100vh;
    overflow-x: hidden;

    .el-aside {
        background-color: #232323;
        transition: width 0.3s;

        &__logo {
            height: 120px;
            background: url('@/assets/logo.png') no-repeat center / 120px auto;
        }

        .el-menu {
            border-right: none;
        }
    }

    .el-main {
        flex: 1;
        /* 让 el-main 充满剩余空间 */
        display: flex;
        /* 内部也使用 flex 布局 */
        flex-direction: column;
        /* 纵向排列 */
        min-height: 0;
        /* 关键：允许 flex item 收缩 */
        padding: 12px;
        overflow-y: auto;
        overflow-x: hidden;
        box-sizing: border-box;

        @media (max-width: 768px) {
            padding: 8px;
        }
    }

    .el-header {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .header-left {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .header-center {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 8px;
            min-width: 0;
        }

        div {
            display: flex;
            align-items: center;

            .header-icon {
                font-size: 24px;
                margin-right: 12px;
                cursor: pointer;
                color: #555;
                transition: color 0.3s;

                &:hover {
                    color: var(--el-color-primary);
                }
            }
        }

        .el-dropdown__box {
            display: flex;
            align-items: center;

            .el-icon {
                color: #999;
                margin-left: 10px;
            }

            &:active,
            &:focus {
                outline: none;
            }
        }
    }
}

:deep(.mobile-drawer) {
    .el-drawer__body {
        padding: 0;
        background-color: #232323;
    }

    .el-menu {
        border-right: none;
    }
}


@media (max-width: 767px) {
    .el-header {
        .header-title {
            display: none;
        }

        .header-center {
            display: none;
            /* 移动端隐藏模块导航，避免拥挤 */
        }
    }
}

/* 移动端：固定整体布局并让头部粘在顶部 */
@media (max-width: 768px) {
    .layout-container {
        position: fixed;
        inset: 0;
        height: 100dvh;
        width: 100%;
        overflow: hidden;
        /* 禁止整体横向滚动 */
        background: var(--el-bg-color, #fff);
        /* 适配 iOS 安全区域 */
        padding-top: env(safe-area-inset-top);
        padding-bottom: env(safe-area-inset-bottom);
        padding-left: env(safe-area-inset-left);
        padding-right: env(safe-area-inset-right);
        box-sizing: border-box;
    }

    .layout-container .el-header {
        position: sticky;
        top: env(safe-area-inset-top);
        z-index: 100;
        background: var(--el-bg-color, #fff);
    }
}
</style>
