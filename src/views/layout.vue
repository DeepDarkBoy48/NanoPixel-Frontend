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
    Sunny,
    Moon,
    Picture,
    MagicStick,
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
import useThemeStore from '@/store/theme.js'
const themeStore = useThemeStore()
const isDark = computed(() => themeStore.theme === 'dark')
const toggleTheme = () => themeStore.toggle()

// 顶部模块导航（核心）：
// 根据当前路由前缀选择要渲染的“模块导航组件”，
// 这样不同模块可以在同一布局头部呈现不同的二级导航。
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

// 侧边菜单高亮同步（核心）：
// 当处于模块内的子路由时，让左侧菜单仍高亮该模块的“入口路径”。
// 这样点击模块导航切换子页时，左侧不会跳到其它高亮。
const activeMenu = computed(() => {
    const path = route.path || ''
    if (path.startsWith('/ai/magicImageEdit/history')) return '/ai/magicImageEdit/history'
    if (path.startsWith('/ai/magicImageEdit')) return '/ai/magicImageEdit'
    if (path.startsWith('/ai/library')) return '/ai/library'
    if (path.startsWith('/ai/prompt')) return '/ai/prompt'
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
            <el-menu :default-active="activeMenu" :active-text-color="'var(--app-primary)'"
                :background-color="'var(--app-sider-bg)'" :text-color="'var(--app-sider-text)'" router
                :collapse="isCollapse" :collapse-transition="false">




                <el-sub-menu index="/ai">
                    <template #title>
                        <el-icon>
                            <MagicStick />
                        </el-icon>
                        <span>AI创作</span>
                    </template>

                    <el-menu-item index="/ai/magicImageEdit">
                        <el-icon>
                            <Crop />
                        </el-icon>
                        <span class="menu-label">魔法修图</span>
                        <span class="hot-badge">🔥 HOT</span>
                    </el-menu-item>

                    <el-menu-item index="/ai/magicImageEdit/history">
                        <el-icon>
                            <Picture />
                        </el-icon>
                        <span class="menu-label">我的图集</span>
                    </el-menu-item>

                    <el-menu-item index="/ai/library">
                        <el-icon>
                            <Promotion />
                        </el-icon>
                        <span class="menu-label">灵感广场</span>
                        <span class="hot-badge">🔥 HOT</span>
                    </el-menu-item>
                    <el-menu-item index="/ai/prompt">
                        <el-icon>
                            <EditPen />
                        </el-icon>
                        <span class="menu-label">提示词管理</span>
                    </el-menu-item>
                    <!-- <el-menu-item index="/ai/canvas">
                        <el-icon>
                            <ChatLineRound />
                        </el-icon>
                        <span>Canvas</span>
                    </el-menu-item> -->
                    <el-menu-item index="/ai/chatRoom">
                        <el-icon>
                            <ChatLineRound />
                        </el-icon>
                        <span class="menu-label">智能对话</span>
                    </el-menu-item>
                </el-sub-menu>

                <!-- <el-sub-menu index="/article">
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
                </el-sub-menu> -->


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

                    <el-menu-item index="/user/review">
                        <el-icon>
                            <ChatLineRound />
                        </el-icon>
                        <span>我的评论</span>
                    </el-menu-item>
                </el-sub-menu>
            </el-menu>
        </el-aside>

        <!-- 抽屉菜单 (移动端) -->
        <el-drawer v-if="isMobile" v-model="drawerVisible" title="菜单" direction="ltr" size="200px" :with-header="false"
            class="mobile-drawer">
            <div class="el-aside__logo"></div>
            <el-menu :default-active="activeMenu" :active-text-color="'var(--app-primary)'"
                :background-color="'var(--app-sider-bg)'" :text-color="'var(--app-sider-text)'" router
                @select="drawerVisible = false">
                <el-sub-menu index="/ai">
                    <template #title>
                        <el-icon>
                            <MagicStick />
                        </el-icon>
                        <span>AI创作</span>
                    </template>

                    <el-menu-item index="/ai/magicImageEdit">
                        <el-icon>
                            <Crop />
                        </el-icon>
                        <span class="menu-label">魔法修图</span>
                        <span class="hot-badge">🔥 HOT</span>
                    </el-menu-item>
                    <el-menu-item index="/ai/magicImageEdit/history">
                        <el-icon>
                            <Picture />
                        </el-icon>
                        <span class="menu-label">我的图集</span>
                    </el-menu-item>
                    <el-menu-item index="/ai/library">
                        <el-icon>
                            <Promotion />
                        </el-icon>
                        <span class="menu-label">灵感广场</span>
                        <span class="hot-badge">🔥 HOT</span>
                    </el-menu-item>
                    <el-menu-item index="/ai/prompt">
                        <el-icon>
                            <EditPen />
                        </el-icon>
                        <span class="menu-label">提示词管理</span>
                    </el-menu-item>
                    <!-- <el-menu-item index="/ai/canvas">
                        <el-icon>
                            <ChatLineRound />
                        </el-icon>
                        <span>Canvas</span>
                    </el-menu-item> -->
                    <el-menu-item index="/ai/chatRoom">
                        <el-icon>
                            <ChatLineRound />
                        </el-icon>
                        <span class="menu-label">智能对话</span>
                    </el-menu-item>
                </el-sub-menu>
                <!-- 
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
                </el-sub-menu> -->

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

                    <el-menu-item index="/user/review">
                        <el-icon>
                            <ChatLineRound />
                        </el-icon>
                        <span>我的评论</span>
                    </el-menu-item>


                </el-sub-menu>
            </el-menu>
        </el-drawer>

        <!-- 右侧主区域 -->
        <el-container>
            <!-- 头部区域 -->
            <el-header>
                <div class="header-left">
                    <el-icon @click="handleMenuClick" class="header-icon" role="button"
                        :aria-label="isMobile ? (drawerVisible ? '关闭菜单' : '打开菜单') : (isCollapse ? '展开侧边栏' : '折叠侧边栏')">
                        <template v-if="isMobile">
                            <span class="hamburger-icon" :class="{ 'is-open': drawerVisible }"></span>
                        </template>
                        <template v-else>
                            <component :is="isCollapse ? Expand : Fold" />
                        </template>
                    </el-icon>
                    <span class="header-title"></span><strong>{{ userInfoStore.info.nickname }}</strong>
                </div>
                <div class="header-center"></div>
                <div class="header-right">
                    <!-- 主题切换按钮 -->
                    <el-icon class="header-icon theme-toggle" @click="toggleTheme" :title="isDark ? '切换为浅色' : '切换为深色'">
                        <component :is="isDark ? Moon : Sunny" />
                    </el-icon>
                    <!-- 用户菜单 -->
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
                </div>
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
    height: var(--app-vh, 100vh);
    overflow-x: hidden;

    .el-aside {
        background-color: var(--app-sider-bg);
        /* 侧边栏背景随主题 */
        transition: width 0.3s;

        &__logo {
            height: 120px;
            background: url('@/assets/logo.png') no-repeat center / 120px auto;
        }

        .el-menu {
            border-right: none;
            /* Element Plus 菜单主题变量（统一浅/深） */
            --el-menu-bg-color: var(--app-sider-bg);
            --el-menu-text-color: var(--app-sider-text);
            --el-menu-active-color: var(--app-primary);
            --el-menu-hover-bg-color: var(--app-sider-hover-bg);
            --el-menu-hover-text-color: var(--app-sider-text);
        }

        /* 菜单项文字与 HOT 徽标 */
        :deep(.el-menu-item) {
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .hot-badge {
            margin-left: 4px;
            padding: 1px 6px;
            border-radius: 999px;
            font-size: 10px;
            line-height: 1.2;
            color: #d4380d;
            background: color-mix(in srgb, #fa8c16 18%, transparent);
            border: 1px solid color-mix(in srgb, #fa8c16 45%, transparent);
            user-select: none;
        }

        :deep(.el-menu-item.is-active),
        :deep(.el-sub-menu.is-active),
        :deep(.el-sub-menu__title.is-active) {
            background-color: var(--app-sider-active-bg) !important;
            color: var(--app-primary) !important;
        }

        :deep(.el-menu-item:hover) {
            background-color: var(--app-sider-hover-bg);
        }

        :deep(.el-sub-menu__title:hover) {
            background-color: var(--app-sider-hover-bg);
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
        /* 主区域背景与边框色（随主题） */
        background: var(--app-main-bg);
        --el-border-color: var(--app-header-border);
        --el-border-color-light: var(--app-header-border);
        --el-border-color-lighter: var(--app-header-border);

        @media (max-width: 768px) {
            padding: 8px;
            /* 将底部安全区并入滚动容器，避免始终露出空白 */
            padding-bottom: calc(8px + env(safe-area-inset-bottom));
        }
    }

    .el-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: var(--app-header-bg);
        border-bottom: 1px solid var(--app-header-border);

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
                color: var(--app-header-icon);
                transition: color 0.3s;

                &:hover {
                    color: var(--el-color-primary);
                }

                /* 经典三横杠（移动端） */
                .hamburger-icon {
                    position: relative;
                    display: inline-block;
                    width: 22px;
                    height: 2px;
                    background-color: currentColor;
                    border-radius: 2px;
                }

                .hamburger-icon::before,
                .hamburger-icon::after {
                    content: '';
                    position: absolute;
                    left: 0;
                    width: 100%;
                    height: 2px;
                    background-color: currentColor;
                    border-radius: 2px;
                }

                .hamburger-icon::before {
                    top: -6px;
                }

                .hamburger-icon::after {
                    top: 6px;
                }
            }
        }

        .el-dropdown__box {
            display: flex;
            align-items: center;

            .el-icon {
                color: var(--app-header-icon-weak);
                margin-left: 10px;
            }

            &:active,
            &:focus {
                outline: none;
            }
        }

        .header-right {
            display: flex;
            align-items: center;
            gap: 14px;
            /* 拉开与头像的距离 */
            margin-left: 8px;
        }
    }
}

:deep(.mobile-drawer) {
    .el-drawer__body {
        padding: 0;
        background-color: var(--app-sider-bg);
    }

    .el-menu {
        border-right: none;
        /* Element Plus 菜单主题变量（统一浅/深） */
        --el-menu-bg-color: var(--app-sider-bg);
        --el-menu-text-color: var(--app-sider-text);
        --el-menu-active-color: var(--app-primary);
        --el-menu-hover-bg-color: var(--app-sider-hover-bg);
        --el-menu-hover-text-color: var(--app-sider-text);
    }

    /* 移动端抽屉菜单项激活状态样式 */
    .el-menu-item.is-active,
    .el-sub-menu.is-active,
    .el-sub-menu__title.is-active {
        background-color: var(--app-sider-active-bg) !important;
        color: var(--app-primary) !important;
    }

    /* 移动端抽屉菜单项悬停状态样式 */
    .el-menu-item:hover {
        background-color: var(--app-sider-hover-bg);
    }

    .el-sub-menu__title:hover {
        background-color: var(--app-sider-hover-bg);
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
        background: var(--app-main-bg);
        /* 适配 iOS 安全区域：顶部交由 header 处理；
           底部安全区转移到 .el-main，避免始终露出一块空白。 */
        padding-left: env(safe-area-inset-left);
        padding-right: env(safe-area-inset-right);
        box-sizing: border-box;
    }

    .layout-container .el-header {
        position: sticky;
        /* 头部自己承担顶部安全区内边距，避免双倍空白 */
        top: 0;
        padding-top: env(safe-area-inset-top);
        z-index: 100;
        background: var(--app-header-bg);
    }
}
</style>
