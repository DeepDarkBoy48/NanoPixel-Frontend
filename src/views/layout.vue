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
    ArrowRight,
} from '@element-plus/icons-vue'

import { userInfoService } from '@/api/user.js'
import useUserInfoStore from '@/store/userInfo.js'
import { useTokenStore } from '@/store/token.js'
const tokenStore = useTokenStore();
const userInfoStore = useUserInfoStore();
const isCollapse = ref(false)
const isMobile = ref(false)
const drawerVisible = ref(false)

// 展开的子菜单
const expandedMenus = ref(['/ai', '/ai2'])

const checkIsMobile = () => {
    isMobile.value = window.innerWidth < 768
}

// 折叠状态下的弹出子菜单
const activePopover = ref(null)
const popoverPosition = ref({ top: 0 })

// 点击外部关闭弹出菜单
const handleClickOutside = (event) => {
    if (!event.target.closest('.submenu-popover-trigger') && !event.target.closest('.submenu-popover')) {
        activePopover.value = null
    }
}

onMounted(() => {
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    document.addEventListener('click', handleClickOutside, true)
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', checkIsMobile)
    document.removeEventListener('click', handleClickOutside, true)
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

// 计算当前激活的菜单
const activeMenu = computed(() => {
    const path = route.path || ''
    if (path.startsWith('/ai/magicImageEdit/history')) return '/ai/magicImageEdit/history'
    if (path.startsWith('/ai/magicImageEdit')) return '/ai/magicImageEdit'
    if (path.startsWith('/ai/library')) return '/ai/library'
    if (path.startsWith('/ai/prompt')) return '/ai/prompt'
    return path
})

// 计算用户头像
const currentAvatar = computed(() => {
    if (userInfoStore.info.userPic) {
        return userInfoStore.info.userPic
    }
    const seed = userInfoStore.info.nickname || 'default_user'
    return `https://api.dicebear.com/9.x/identicon/svg?seed=${seed}`
})

import { ElMessage, ElMessageBox } from 'element-plus'
const handleCommand = (command) => {
    if (command === 'logout') {
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
                tokenStore.removeToken()
                userInfoStore.removeInfo()
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

// 切换子菜单展开状态
const toggleSubMenu = (index) => {
    const idx = expandedMenus.value.indexOf(index)
    if (idx > -1) {
        expandedMenus.value.splice(idx, 1)
    } else {
        expandedMenus.value.push(index)
    }
}

// 检查子菜单是否展开
const isExpanded = (index) => expandedMenus.value.includes(index)

// 点击切换弹出菜单
const togglePopover = (index, event) => {
    if (isCollapse.value) {
        if (activePopover.value === index) {
            activePopover.value = null
        } else {
            activePopover.value = index
            const rect = event.currentTarget.getBoundingClientRect()
            popoverPosition.value = { top: rect.top }
        }
    }
}

// 关闭弹出菜单
const closePopover = () => {
    activePopover.value = null
}

// 检查菜单项是否激活
const isActive = (path) => activeMenu.value === path

// 检查子菜单是否有激活项
const hasActiveChild = (paths) => paths.some(p => activeMenu.value.startsWith(p))

// 导航到路由
const navigateTo = (path) => {
    router.push(path)
    if (isMobile.value) {
        drawerVisible.value = false
    }
}

// 菜单数据
const menuItems = computed(() => [
    {
        type: 'item',
        index: '/ai/smashEnglish',
        icon: EditPen,
        label: 'AI 英语语法分析',
        hot: true
    },
    {
        type: 'submenu',
        index: '/ai2',
        icon: MagicStick,
        label: 'RAG知识库',
        children: [
            { index: '/ai/chatRoom', icon: ChatLineRound, label: 'ChatBot', hot: true },
            { index: '/ai/embed', icon: ChatLineRound, label: '知识库Embed' }
        ]
    },
    {
        type: 'submenu',
        index: '/ai',
        icon: MagicStick,
        label: 'AI绘图',
        children: [
            { index: '/ai/magicImageEdit', icon: Crop, label: '魔法绘图', hot: true },
            { index: '/ai/library', icon: Promotion, label: '灵感广场' },
            { index: '/ai/magicImageEdit/history', icon: Picture, label: '绘图历史' },
            { index: '/ai/prompt', icon: EditPen, label: '绘图提示词' }
        ]
    },
    {
        type: 'submenu',
        index: '/user',
        icon: UserFilled,
        label: '个人中心',
        children: [
            { index: '/user/info', icon: User, label: '基本资料' },
            { index: '/user/avatar', icon: Crop, label: '更换头像' },
            { index: '/user/resetPassword', icon: EditPen, label: '重置密码' },
            { index: '/user/review', icon: ChatLineRound, label: '我的评论' }
        ]
    }
])

</script>
<template>
    <!-- 主容器 -->
    <div class="flex h-[var(--app-vh,100vh)] overflow-hidden bg-[var(--app-main-bg)]">

        <!-- 桌面端侧边栏 -->
        <aside v-if="!isMobile"
            class="sidebar-warm flex flex-col border-r overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-10"
            :style="{ width: isCollapse ? '64px' : '260px' }">

            <!-- 用户信息区域 -->
            <div class="flex flex-col items-center py-5 px-2.5 border-b border-[var(--app-sider-border)] mb-2.5 transition-all duration-300 user-info-glow"
                :class="isCollapse ? 'px-2' : 'px-4'">
                <div class="transition-all duration-300 ease-out" :class="isCollapse ? 'scale-75' : 'scale-100'">
                    <img :src="currentAvatar" :alt="userInfoStore.info.nickname"
                        class="rounded-full object-cover ring-2 ring-[var(--app-sider-primary)]/25 shadow-md transition-all duration-300"
                        :class="isCollapse ? 'w-8 h-8' : 'w-12 h-12'" />
                </div>
                <div class="overflow-hidden transition-all duration-300 ease-out"
                    :class="isCollapse ? 'max-h-0 opacity-0 mt-0' : 'max-h-16 opacity-100 mt-2.5'">
                    <span class="text-base font-semibold text-[var(--app-sider-text)] whitespace-nowrap">
                        {{ userInfoStore.info.nickname || '用户' }}
                    </span>
                </div>
            </div>

            <!-- 菜单滚动区域 -->
            <div class="flex-1 overflow-y-auto overflow-x-hidden px-2.5 scrollbar-thin">
                <nav class="space-y-1">
                    <template v-for="item in menuItems" :key="item.index">
                        <!-- 普通菜单项 -->
                        <div v-if="item.type === 'item'" @click="navigateTo(item.index)" :class="[
                            'group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ease-out menu-item-warm',
                            isActive(item.index)
                                ? 'menu-item-active text-[var(--app-sider-primary)] font-semibold'
                                : 'text-[var(--app-sider-text)] hover:bg-[var(--app-sider-hover-bg)]',
                            isCollapse ? 'justify-center' : ''
                        ]">
                            <el-icon class="text-lg shrink-0 transition-transform duration-200 group-hover:scale-110">
                                <component :is="item.icon" />
                            </el-icon>
                            <span v-if="!isCollapse" class="flex-1 truncate transition-all duration-200">{{ item.label
                                }}</span>
                            <span v-if="!isCollapse && item.hot"
                                class="hot-badge px-1.5 py-0.5 text-[10px] font-semibold text-white rounded-full shadow-sm">
                                🔥 HOT
                            </span>
                        </div>

                        <!-- 子菜单 -->
                        <div v-else class="space-y-0.5 relative">
                            <!-- 子菜单标题 -->
                            <div class="submenu-popover-trigger"
                                @click="isCollapse ? togglePopover(item.index, $event) : toggleSubMenu(item.index)"
                                :class="[
                                    'group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ease-out',
                                    hasActiveChild(item.children.map(c => c.index)) || activePopover === item.index
                                        ? 'text-[var(--app-sider-primary)] bg-[var(--app-sider-hover-bg)]'
                                        : 'text-[var(--app-sider-text)] hover:bg-[var(--app-sider-hover-bg)]',
                                    isCollapse ? 'justify-center' : ''
                                ]">
                                <el-icon
                                    class="text-lg shrink-0 transition-transform duration-200 group-hover:scale-110">
                                    <component :is="item.icon" />
                                </el-icon>
                                <span v-if="!isCollapse" class="flex-1 truncate">{{ item.label }}</span>
                                <el-icon v-if="!isCollapse"
                                    class="text-xs transition-transform duration-300 ease-out text-[var(--app-sider-text-muted)]"
                                    :class="isExpanded(item.index) ? 'rotate-90' : 'rotate-0'">
                                    <ArrowRight />
                                </el-icon>
                            </div>

                            <!-- 展开状态：子菜单内容 -->
                            <div v-if="!isCollapse"
                                class="overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                                :style="isExpanded(item.index) ? { maxHeight: (item.children.length * 50) + 'px' } : { maxHeight: '0px' }">
                                <div class="pl-4 space-y-0.5 py-1">
                                    <div v-for="child in item.children" :key="child.index"
                                        @click="navigateTo(child.index)" :class="[
                                            'group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ease-out menu-item-warm',
                                            isActive(child.index)
                                                ? 'menu-item-active text-[var(--app-sider-primary)] font-semibold'
                                                : 'text-[var(--app-sider-text)] hover:bg-[var(--app-sider-hover-bg)] hover:translate-x-1'
                                        ]">
                                        <el-icon
                                            class="text-base shrink-0 transition-transform duration-200 group-hover:scale-110">
                                            <component :is="child.icon" />
                                        </el-icon>
                                        <span class="flex-1 truncate text-sm">{{ child.label }}</span>
                                        <span v-if="child.hot"
                                            class="hot-badge px-1.5 py-0.5 text-[10px] font-semibold text-white rounded-full shadow-sm">
                                            🔥 HOT
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- 折叠状态：点击弹出子菜单 -->
                            <Transition name="popover">
                                <div v-if="isCollapse && activePopover === item.index"
                                    class="submenu-popover fixed left-[68px] z-50 min-w-[180px] py-2 rounded-xl shadow-xl border popover-warm"
                                    :style="{ top: popoverPosition.top + 'px' }">
                                    <div
                                        class="px-3 py-1.5 mb-1 text-xs font-medium text-[var(--app-sider-text-muted)] border-b border-[var(--app-sider-border)]">
                                        {{ item.label }}
                                    </div>
                                    <div v-for="child in item.children" :key="child.index"
                                        @click="navigateTo(child.index); closePopover()" :class="[
                                            'group flex items-center gap-3 px-3 py-2 mx-1 rounded-lg cursor-pointer transition-all duration-200 ease-out menu-item-warm',
                                            isActive(child.index)
                                                ? 'menu-item-active text-[var(--app-sider-primary)] font-semibold'
                                                : 'text-[var(--app-sider-text)] hover:bg-[var(--app-sider-hover-bg)]'
                                        ]">
                                        <el-icon class="text-base shrink-0">
                                            <component :is="child.icon" />
                                        </el-icon>
                                        <span class="flex-1 text-sm whitespace-nowrap">{{ child.label }}</span>
                                        <span v-if="child.hot"
                                            class="hot-badge px-1.5 py-0.5 text-[10px] font-semibold text-white rounded-full shadow-sm">
                                            🔥
                                        </span>
                                    </div>
                                </div>
                            </Transition>
                        </div>
                    </template>
                </nav>
            </div>

            <!-- 底部操作区 -->
            <div class="border-t border-[var(--app-sider-border)] p-2.5 space-y-1 bg-[var(--app-sider-bg-solid)]/50">
                <!-- 主题切换 -->
                <div @click="toggleTheme" :class="[
                    'group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ease-out text-[var(--app-sider-text)] hover:bg-[var(--app-sider-hover-bg)]',
                    isCollapse ? 'justify-center' : ''
                ]" :title="isDark ? '切换为浅色' : '切换为深色'">
                    <el-icon class="text-lg transition-all duration-300 group-hover:rotate-180 text-amber-500">
                        <component :is="isDark ? Moon : Sunny" />
                    </el-icon>
                    <span v-if="!isCollapse" class="text-sm">主题模式</span>
                </div>

                <!-- 退出登录 -->
                <div @click="handleCommand('logout')" :class="[
                    'group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ease-out text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20',
                    isCollapse ? 'justify-center' : ''
                ]" title="退出登录">
                    <el-icon class="text-lg transition-transform duration-200 group-hover:scale-110">
                        <SwitchButton />
                    </el-icon>
                    <span v-if="!isCollapse" class="text-sm">退出登录</span>
                </div>

                <!-- 折叠按钮 -->
                <div @click="handleMenuClick"
                    class="flex items-center justify-center py-3 mt-1 border-t border-[var(--app-sider-border)] cursor-pointer text-[var(--app-sider-text-muted)] hover:text-[var(--app-sider-primary)] transition-all duration-200"
                    :title="isCollapse ? '展开' : '折叠'">
                    <el-icon class="text-lg transition-transform duration-300 ease-out"
                        :class="isCollapse ? 'rotate-180' : 'rotate-0'">
                        <Fold />
                    </el-icon>
                </div>
            </div>
        </aside>

        <!-- 移动端遮罩层 -->
        <Transition name="fade">
            <div v-if="isMobile && drawerVisible" @click="drawerVisible = false"
                class="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300">
            </div>
        </Transition>

        <!-- 移动端抽屉菜单 -->
        <Transition name="slide">
            <aside v-if="isMobile && drawerVisible"
                class="sidebar-warm fixed left-0 top-0 bottom-0 w-[260px] z-50 flex flex-col shadow-2xl transform transition-transform duration-300 ease-out">

                <!-- 移动端用户信息 -->
                <div
                    class="flex flex-col items-center py-6 px-4 border-b border-[var(--app-sider-border)] user-info-glow">
                    <img :src="currentAvatar" :alt="userInfoStore.info.nickname"
                        class="w-14 h-14 rounded-full object-cover ring-2 ring-[var(--app-sider-primary)]/25 shadow-md" />
                    <span class="mt-3 text-base font-semibold text-[var(--app-sider-text)]">
                        {{ userInfoStore.info.nickname || '用户' }}
                    </span>
                </div>

                <!-- 移动端菜单 -->
                <div class="flex-1 overflow-y-auto px-3 py-2">
                    <nav class="space-y-1">
                        <template v-for="item in menuItems" :key="item.index">
                            <!-- 普通菜单项 -->
                            <div v-if="item.type === 'item'" @click="navigateTo(item.index)" :class="[
                                'group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.98] menu-item-warm',
                                isActive(item.index)
                                    ? 'menu-item-active text-[var(--app-sider-primary)] font-semibold'
                                    : 'text-[var(--app-sider-text)] hover:bg-[var(--app-sider-hover-bg)]'
                            ]">
                                <el-icon class="text-xl">
                                    <component :is="item.icon" />
                                </el-icon>
                                <span class="flex-1">{{ item.label }}</span>
                                <span v-if="item.hot"
                                    class="hot-badge px-2 py-0.5 text-[10px] font-semibold text-white rounded-full shadow-sm">
                                    🔥 HOT
                                </span>
                            </div>

                            <!-- 子菜单 -->
                            <div v-else class="space-y-0.5">
                                <div @click="toggleSubMenu(item.index)" :class="[
                                    'group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 active:scale-[0.98]',
                                    hasActiveChild(item.children.map(c => c.index))
                                        ? 'text-[var(--app-sider-primary)]'
                                        : 'text-[var(--app-sider-text)] hover:bg-[var(--app-sider-hover-bg)]'
                                ]">
                                    <el-icon class="text-xl">
                                        <component :is="item.icon" />
                                    </el-icon>
                                    <span class="flex-1">{{ item.label }}</span>
                                    <el-icon
                                        class="text-sm transition-transform duration-300 text-[var(--app-sider-text-muted)]"
                                        :class="isExpanded(item.index) ? 'rotate-90' : 'rotate-0'">
                                        <ArrowRight />
                                    </el-icon>
                                </div>

                                <div class="overflow-hidden transition-all duration-300 ease-out"
                                    :style="isExpanded(item.index) ? { maxHeight: (item.children.length * 56) + 'px' } : { maxHeight: '0px' }">
                                    <div class="pl-5 space-y-0.5 py-1">
                                        <div v-for="child in item.children" :key="child.index"
                                            @click="navigateTo(child.index)" :class="[
                                                'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 active:scale-[0.98] menu-item-warm',
                                                isActive(child.index)
                                                    ? 'menu-item-active text-[var(--app-sider-primary)] font-semibold'
                                                    : 'text-[var(--app-sider-text)] hover:bg-[var(--app-sider-hover-bg)]'
                                            ]">
                                            <el-icon class="text-lg">
                                                <component :is="child.icon" />
                                            </el-icon>
                                            <span class="flex-1 text-sm">{{ child.label }}</span>
                                            <span v-if="child.hot"
                                                class="hot-badge px-1.5 py-0.5 text-[10px] font-semibold text-white rounded-full shadow-sm">
                                                🔥 HOT
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </nav>
                </div>

                <!-- 移动端底部操作区 -->
                <div class="border-t border-[var(--app-sider-border)] p-4 space-y-2 bg-[var(--app-sider-bg-solid)]/50">
                    <div @click="toggleTheme"
                        class="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer text-[var(--app-sider-text)] hover:bg-[var(--app-sider-hover-bg)] transition-all duration-200 active:scale-[0.98]">
                        <el-icon class="text-xl text-amber-500">
                            <component :is="isDark ? Moon : Sunny" />
                        </el-icon>
                        <span>主题模式</span>
                    </div>
                    <div @click="handleCommand('logout')"
                        class="flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all duration-200 active:scale-[0.98]">
                        <el-icon class="text-xl">
                            <SwitchButton />
                        </el-icon>
                        <span>退出登录</span>
                    </div>
                </div>
            </aside>
        </Transition>

        <!-- 右侧主区域 -->
        <div class="flex-1 flex flex-col min-w-0">
            <!-- 移动端头部 -->
            <header v-if="isMobile"
                class="h-[50px] bg-[var(--app-header-bg)] border-b border-[var(--app-header-border)] flex items-center px-4 shrink-0">
                <el-icon @click="drawerVisible = true"
                    class="text-2xl text-[var(--app-header-icon)] cursor-pointer mr-4 transition-transform duration-200 hover:scale-110 active:scale-95">
                    <Fold />
                </el-icon>
                <span class="text-lg font-semibold text-[var(--app-header-text,var(--app-sider-text))]">Robin
                    Blog</span>
            </header>

            <!-- 主内容区 -->
            <main class="flex-1 overflow-y-auto flex flex-col min-h-0"
                :class="route.path.startsWith('/ai/smashEnglish') ? 'p-0' : 'p-5 max-md:p-3'">
                <RouterView />
            </main>
        </div>
    </div>
</template>

<style scoped>
/* ========== 侧边栏温暖风格样式 ========== */

/* 侧边栏主容器 */
.sidebar-warm {
    background: var(--app-sider-bg);
    border-color: var(--app-sider-border);
    box-shadow:
        1px 0 0 var(--app-sider-border),
        4px 0 16px -4px rgba(92, 75, 58, 0.08);
}

/* 用户信息区域柔和发光 */
.user-info-glow {
    position: relative;
}

.user-info-glow::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    height: 1px;
    background: linear-gradient(90deg,
            transparent,
            var(--app-sider-primary) 20%,
            var(--app-sider-primary) 80%,
            transparent);
    opacity: 0.3;
}

/* 菜单项激活状态 */
.menu-item-active {
    background: var(--app-sider-active-bg);
    box-shadow: var(--app-sider-shadow);
    position: relative;
}

.menu-item-active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 60%;
    background: var(--app-sider-primary);
    border-radius: 0 2px 2px 0;
}

/* 菜单项温暖过渡效果 */
.menu-item-warm {
    position: relative;
}

.menu-item-warm::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(135deg, rgba(217, 116, 89, 0.04) 0%, transparent 100%);
    opacity: 0;
    transition: opacity 0.2s ease;
    pointer-events: none;
}

.menu-item-warm:hover::after {
    opacity: 1;
}

/* HOT 徽章温暖渐变 */
.hot-badge {
    background: linear-gradient(135deg, #E07C55 0%, #F4A261 100%);
    box-shadow: 0 2px 8px -2px rgba(224, 124, 85, 0.5);
}

.dark .hot-badge {
    background: linear-gradient(135deg, #F4A261 0%, #E9C46A 100%);
    box-shadow: 0 2px 8px -2px rgba(244, 162, 97, 0.4);
}

/* 弹出菜单温暖风格 */
.popover-warm {
    background: var(--app-sider-bg);
    border-color: var(--app-sider-border);
    box-shadow:
        0 4px 24px -4px rgba(92, 75, 58, 0.15),
        0 0 1px rgba(92, 75, 58, 0.1);
}

.dark .popover-warm {
    box-shadow:
        0 4px 24px -4px rgba(0, 0, 0, 0.4),
        0 0 1px rgba(244, 162, 97, 0.1);
}

/* Vue Transition 动画 */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from,
.slide-leave-to {
    transform: translateX(-100%);
}

/* 悬浮子菜单动画 */
.popover-enter-active,
.popover-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.popover-enter-from,
.popover-leave-to {
    opacity: 0;
    transform: translateX(-8px);
}

/* 自定义滚动条 - 温暖风格 */
.scrollbar-thin::-webkit-scrollbar {
    width: 4px;
}

.scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
}

.scrollbar-thin::-webkit-scrollbar-thumb {
    background: var(--app-sider-border);
    border-radius: 2px;
}

.scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: var(--app-sider-primary);
}

/* 侧边栏内容区滚动条 */
.sidebar-warm ::-webkit-scrollbar {
    width: 4px;
}

.sidebar-warm ::-webkit-scrollbar-track {
    background: transparent;
}

.sidebar-warm ::-webkit-scrollbar-thumb {
    background: var(--app-sider-border);
    border-radius: 2px;
}

.sidebar-warm ::-webkit-scrollbar-thumb:hover {
    background: var(--app-sider-primary);
}
</style>
