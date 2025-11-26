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

import { userInfoService } from '@/api/user.js'
import useUserInfoStore from '@/store/userInfo.js'
import { useTokenStore } from '@/store/token.js'
const tokenStore = useTokenStore();
const userInfoStore = useUserInfoStore();
const isCollapse = ref(false)
const isMobile = ref(false)
const drawerVisible = ref(false)
const defaultOpenedMenus = ['/ai', '/ai2']

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

// 计算用户头像：如果有设置头像则使用设置的，否则使用基于昵称的随机图片
const currentAvatar = computed(() => {
    if (userInfoStore.info.userPic) {
        return userInfoStore.info.userPic
    }
    const seed = userInfoStore.info.nickname || 'default_user'
    return `https://api.dicebear.com/9.x/identicon/svg?seed=${seed}`
})

</script>
<template>
    <!-- el-container 容器 -->
    <el-container class="layout-container">
        <!-- 左侧菜单 (桌面端) -->
        <el-aside v-if="!isMobile" :width="isCollapse ? '64px' : '260px'" class="desktop-aside">
            
            <!-- 用户信息区域 (展开时显示) -->
            <div class="user-info-section" v-if="!isCollapse">
                <el-avatar :size="50" :src="currentAvatar" />
                <div class="user-details">
                    <span class="username">{{ userInfoStore.info.nickname || '用户' }}</span>
                </div>
            </div>
            <!-- 折叠时的简略用户信息 -->
            <div class="user-info-mini" v-else>
                <el-avatar :size="32" :src="currentAvatar" />
            </div>

            <!-- 菜单 -->
            <el-scrollbar class="aside-menu-scroll">
                <el-menu :default-active="activeMenu" :default-openeds="defaultOpenedMenus"
                    :active-text-color="'var(--app-primary)'" :background-color="'transparent'"
                    :text-color="'var(--app-sider-text)'" router :collapse="isCollapse" :collapse-transition="false">

                    <el-sub-menu index="/ai">
                        <template #title>
                            <el-icon>
                                <MagicStick />
                            </el-icon>
                            <span>AI绘图</span>
                        </template>

                        <el-menu-item index="/ai/magicImageEdit">
                            <el-icon>
                                <Crop />
                            </el-icon>
                            <span class="menu-label">魔法修图</span>
                            <span class="hot-badge">🔥 HOT</span>
                        </el-menu-item>
                        <el-menu-item index="/ai/library">
                            <el-icon>
                                <Promotion />
                            </el-icon>
                            <span class="menu-label">灵感广场</span>
                            <span class="hot-badge">🔥 HOT</span>
                        </el-menu-item>

                        <el-menu-item index="/ai/magicImageEdit/history">
                            <el-icon>
                                <Picture />
                            </el-icon>
                            <span class="menu-label">我的图集</span>
                        </el-menu-item>
                        <el-menu-item index="/ai/prompt">
                            <el-icon>
                                <EditPen />
                            </el-icon>
                            <span class="menu-label">提示词管理</span>
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

                    <el-sub-menu index="/ai2">
                        <template #title>
                            <el-icon>
                                <MagicStick />
                            </el-icon>
                            <span>AI知识库</span>
                        </template>
                        <el-menu-item index="/ai/chatRoom">
                            <el-icon>
                                <ChatLineRound />
                            </el-icon>
                            <span class="menu-label">AI对话</span>
                            <span class="hot-badge">🔥 HOT</span>
                        </el-menu-item>
                        <el-menu-item index="/ai/embed">
                            <el-icon>
                                <ChatLineRound />
                            </el-icon>
                            <span class="menu-label">知识库</span>
                        </el-menu-item>

                    </el-sub-menu>

                    <el-sub-menu index="/youtube">
                        <template #title>
                            <el-icon>
                                <UserFilled />
                            </el-icon>
                            <span>SmashEnglish</span>
                        </template>
                        <el-menu-item index="/ai/smashEnglish">
                            <el-icon>
                                <EditPen />
                            </el-icon>
                            <span class="menu-label">英语语法分析</span>
                            <span class="hot-badge">NEW</span>
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

                        <el-menu-item index="/user/review">
                            <el-icon>
                                <ChatLineRound />
                            </el-icon>
                            <span>我的评论</span>
                        </el-menu-item>
                    </el-sub-menu>
                </el-menu>
            </el-scrollbar>

            <!-- 底部操作区 -->
            <div class="aside-footer">
                <!-- 主题切换 -->
                <div class="footer-item" @click="toggleTheme" :title="isDark ? '切换为浅色' : '切换为深色'">
                    <el-icon>
                        <component :is="isDark ? Moon : Sunny" />
                    </el-icon>
                    <span v-if="!isCollapse">主题模式</span>
                </div>
                <!-- 退出登录 -->
                <div class="footer-item danger" @click="handleCommand('logout')" title="退出登录">
                    <el-icon>
                        <SwitchButton />
                    </el-icon>
                    <span v-if="!isCollapse">退出登录</span>
                </div>
                <!-- 折叠按钮 -->
                <div class="footer-item collapse-btn" @click="handleMenuClick" :title="isCollapse ? '展开' : '折叠'">
                    <el-icon>
                        <component :is="isCollapse ? Expand : Fold" />
                    </el-icon>
                </div>
            </div>
        </el-aside>

        <!-- 抽屉菜单 (移动端) -->
        <el-drawer v-if="isMobile" v-model="drawerVisible" title="菜单" direction="ltr" size="240px" :with-header="false"
            class="mobile-drawer">
            <div class="mobile-drawer-content">
                
                 <!-- 移动端用户信息 -->
                <div class="user-info-section">
                    <el-avatar :size="50" :src="currentAvatar" />
                    <div class="user-details">
                        <span class="username">{{ userInfoStore.info.nickname || '用户' }}</span>
                    </div>
                </div>

                <el-menu :default-active="activeMenu" :default-openeds="defaultOpenedMenus"
                    :active-text-color="'var(--app-primary)'" :background-color="'transparent'"
                    :text-color="'var(--app-sider-text)'" router @select="drawerVisible = false">
                    <el-sub-menu index="/ai">
                        <template #title>
                            <el-icon>
                                <MagicStick />
                            </el-icon>
                            <span>AI绘图</span>
                        </template>

                        <el-menu-item index="/ai/magicImageEdit">
                            <el-icon>
                                <Crop />
                            </el-icon>
                            <span class="menu-label">魔法修图</span>
                            <span class="hot-badge">🔥 HOT</span>
                        </el-menu-item>
                        <el-menu-item index="/ai/library">
                            <el-icon>
                                <Promotion />
                            </el-icon>
                            <span class="menu-label">灵感广场</span>
                            <span class="hot-badge">🔥 HOT</span>
                        </el-menu-item>

                        <el-menu-item index="/ai/magicImageEdit/history">
                            <el-icon>
                                <Picture />
                            </el-icon>
                            <span class="menu-label">我的图集</span>
                        </el-menu-item>
                        <el-menu-item index="/ai/prompt">
                            <el-icon>
                                <EditPen />
                            </el-icon>
                            <span class="menu-label">提示词管理</span>
                        </el-menu-item>
                    </el-sub-menu>

                    <el-sub-menu index="/ai2">
                        <template #title>
                            <el-icon>
                                <MagicStick />
                            </el-icon>
                            <span>AI知识库</span>
                        </template>
                        <el-menu-item index="/ai/chatRoom">
                            <el-icon>
                                <ChatLineRound />
                            </el-icon>
                            <span class="menu-label">AI对话</span>
                            <span class="hot-badge">🔥 HOT</span>
                        </el-menu-item>
                        <el-menu-item index="/ai/embed">
                            <el-icon>
                                <ChatLineRound />
                            </el-icon>
                            <span class="menu-label">知识库</span>
                        </el-menu-item>
                    </el-sub-menu>

                    <el-sub-menu index="/youtube">
                        <template #title>
                            <el-icon>
                                <UserFilled />
                            </el-icon>
                            <span>SmashEnglish</span>
                        </template>
                        <el-menu-item index="/ai/smashEnglish">
                            <el-icon>
                                <EditPen />
                            </el-icon>
                            <span class="menu-label">英语语法分析</span>
                            <span class="hot-badge">NEW</span>
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

                        <el-menu-item index="/user/review">
                            <el-icon>
                                <ChatLineRound />
                            </el-icon>
                            <span>我的评论</span>
                        </el-menu-item>
                    </el-sub-menu>
                </el-menu>
                
                 <div class="aside-footer">
                    <div class="footer-item" @click="toggleTheme">
                        <el-icon>
                            <component :is="isDark ? Moon : Sunny" />
                        </el-icon>
                        <span>主题模式</span>
                    </div>
                    <div class="footer-item danger" @click="handleCommand('logout')">
                        <el-icon>
                            <SwitchButton />
                        </el-icon>
                        <span>退出登录</span>
                    </div>
                </div>
            </div>
        </el-drawer>

        <!-- 右侧主区域 -->
        <el-container class="main-container">
            <!-- 移动端头部 (仅在移动端显示) -->
            <div class="mobile-header" v-if="isMobile">
                <el-icon @click="drawerVisible = true" class="menu-trigger">
                    <Fold />
                </el-icon>
                <span class="mobile-title">Robin Blog</span>
            </div>

            <!-- 中间区域 -->
            <el-main>
                <RouterView />
            </el-main>
        </el-container>
    </el-container>
</template>
<style lang="scss" scoped>
.layout-container {
    height: var(--app-vh, 100vh);
    overflow: hidden;
    display: flex;

    .desktop-aside {
        display: flex;
        flex-direction: column;
        background-color: var(--app-sider-bg);
        border-right: 1px solid var(--app-header-border);
        transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
        z-index: 10;
        box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);

        .aside-header {
            padding: 20px 0;
            display: flex;
            justify-content: center;
            align-items: center;
            
            .el-aside__logo {
                height: 40px;
                width: 120px;
                background: url('@/assets/logo.png') no-repeat center / contain;
                transition: all 0.3s;
            }
        }

        .user-info-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px 10px;
            border-bottom: 1px solid var(--app-header-border);
            margin-bottom: 10px;

            .user-details {
                margin-top: 10px;
                text-align: center;
                
                .username {
                    display: block;
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--app-sider-text);
                    margin-bottom: 4px;
                }
                
                .user-role {
                    display: inline-block;
                    font-size: 12px;
                    padding: 2px 8px;
                    background: var(--app-primary);
                    color: white;
                    border-radius: 10px;
                    opacity: 0.8;
                }
            }
        }

        .user-info-mini {
            display: flex;
            justify-content: center;
            padding: 20px 0;
            border-bottom: 1px solid var(--app-header-border);
        }

        .aside-menu-scroll {
            flex: 1;
            
            .el-menu {
                border-right: none;
                --el-menu-bg-color: transparent;
                --el-menu-text-color: var(--app-sider-text);
                --el-menu-active-color: var(--app-primary);
                --el-menu-hover-bg-color: var(--app-sider-hover-bg);
            }
        }

        .aside-footer {
            padding: 10px;
            border-top: 1px solid var(--app-header-border);
            display: flex;
            flex-direction: column;
            gap: 4px;

            .footer-item {
                display: flex;
                align-items: center;
                padding: 10px 14px;
                cursor: pointer;
                border-radius: 8px;
                color: var(--app-sider-text);
                transition: all 0.2s;
                
                .el-icon {
                    font-size: 18px;
                    margin-right: 12px;
                }
                
                span {
                    font-size: 14px;
                    white-space: nowrap;
                }

                &:hover {
                    background-color: var(--app-sider-hover-bg);
                }

                &.danger {
                    color: #f56c6c;
                    &:hover {
                        background-color: rgba(245, 108, 108, 0.1);
                    }
                }
                
                &.collapse-btn {
                    justify-content: center;
                    margin-top: 4px;
                    border-top: 1px solid var(--app-header-border);
                    padding-top: 14px;
                    
                    .el-icon {
                        margin-right: 0;
                    }
                }
            }
        }
    }

    /* 菜单项样式优化 */
    :deep(.el-menu-item) {
        margin: 4px 10px;
        border-radius: 8px;
        height: 44px;
        line-height: 44px;
        
        &.is-active {
            background-color: var(--app-sider-active-bg);
            font-weight: 600;
        }
    }
    
    :deep(.el-sub-menu__title) {
        margin: 4px 10px;
        border-radius: 8px;
        height: 44px;
        line-height: 44px;
    }

    .hot-badge {
        margin-left: auto;
        padding: 1px 6px;
        border-radius: 999px;
        font-size: 10px;
        line-height: 1.2;
        color: #d4380d;
        background: color-mix(in srgb, #fa8c16 18%, transparent);
        border: 1px solid color-mix(in srgb, #fa8c16 45%, transparent);
    }

    .main-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 0;
        background: var(--app-main-bg);
        
        .mobile-header {
            height: 50px;
            background: var(--app-header-bg);
            border-bottom: 1px solid var(--app-header-border);
            display: flex;
            align-items: center;
            padding: 0 16px;
            
            .menu-trigger {
                font-size: 24px;
                color: var(--app-header-icon);
                margin-right: 16px;
            }
            
            .mobile-title {
                font-size: 18px;
                font-weight: 600;
                color: var(--app-header-text);
            }
        }

        .el-main {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            
            @media (max-width: 768px) {
                padding: 12px;
            }
        }
    }
}

/* 移动端抽屉样式 */
:deep(.mobile-drawer) {
    .el-drawer__body {
        padding: 0;
        background-color: var(--app-sider-bg);
    }
    
    .mobile-drawer-content {
        height: 100%;
        display: flex;
        flex-direction: column;
        
        .el-aside__logo {
            height: 60px;
            background: url('@/assets/logo.png') no-repeat center / 100px auto;
            margin-top: 10px;
        }
        
        .user-info-section {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
            
            .username {
                margin-top: 10px;
                font-weight: 600;
                color: var(--app-sider-text);
            }
        }
        
        .el-menu {
            flex: 1;
            border: none;
            --el-menu-bg-color: transparent;
        }
        
        .aside-footer {
            padding: 16px;
            border-top: 1px solid var(--app-header-border);
            
            .footer-item {
                display: flex;
                align-items: center;
                padding: 12px;
                color: var(--app-sider-text);
                
                .el-icon {
                    font-size: 20px;
                    margin-right: 12px;
                }
                
                &.danger {
                    color: #f56c6c;
                }
            }
        }
    }
}
</style>
