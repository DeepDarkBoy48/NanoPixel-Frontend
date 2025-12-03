<script setup>
import { ChatDotRound, ArrowDown } from '@element-plus/icons-vue'

import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { ElImageViewer, ElMessage } from 'element-plus'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import { clearChatMemoryService, listEmbedPdfService } from '@/api/ai'
// 导入用户信息存储
import useUserInfoStore from '@/store/userInfo'
//用于储存消息列表
const messageList = ref([])
//用于储存当前输入的消息
const currentMessage = ref('')
// AI 是否处于思考状态
const isAiThinking = ref(false)
// 清除聊天记录请求状态
const isClearingChat = ref(false)
//用于储存用户信息
const userInfo = useUserInfoStore();
// 加载状态：简单的加载动画控制
const isInitializing = ref(true)
// 存储每条消息的思考内容展开状态
const thinkingExpandedStates = ref(new Map())
//用于储存WebSocket连接
let ws = null;
// 心跳定时器
let heartbeatInterval = null;
// 原生滚动容器引用
const scrollbarRef = ref(null)

// 深度搜索开关
const deepSearch = ref(false)
const embedOptions = ref([])
const selectedFileIds = ref([])
// 互斥控制：选择知识库与网络搜索不可同时启用
const isSwitchDisabled = computed(() => selectedFileIds.value.length > 0)
const isSelectDisabled = computed(() => deepSearch.value === true)

watch(selectedFileIds, (val) => {
    if (Array.isArray(val) && val.length > 0) {
        // 选中文件后，自动关闭网络搜索
        deepSearch.value = false
    }
})

watch(deepSearch, (val) => {
    if (val === true) {
        // 开启网络搜索后，清空并禁用文件选择
        selectedFileIds.value = []
    }
})
const truncateLabel = (label) => {
    if (!label) return ''
    const maxLength = 18
    return label.length > maxLength ? `${label.slice(0, maxLength)}…` : label
}

// 图片预览（点击放大）相关状态
const imagePreviewVisible = ref(false)
const imagePreviewUrls = ref([])
const imagePreviewIndex = ref(0)

const openImagePreview = (urls = [], index = 0) => {
    if (!Array.isArray(urls) || urls.length === 0) return
    imagePreviewUrls.value = urls
    imagePreviewIndex.value = Math.max(0, Math.min(index, urls.length - 1))
    imagePreviewVisible.value = true
}

const closeImagePreview = () => {
    imagePreviewVisible.value = false
}

const fetchEmbedOptions = async () => {
    try {
        const response = await listEmbedPdfService()
        const data = Array.isArray(response?.data) ? response.data : []
        embedOptions.value = data.map(item => ({
            label: item.name || `文件${item.id}`,
            value: item.id
        }))
    } catch (error) {
        console.error('获取文件列表失败:', error)
    }
}

// 事件委托：捕获内容区 img 点击，打开预览
const handleContentClick = (e) => {
    const target = e.target
    if (!target || target.tagName?.toLowerCase() !== 'img') return

    // 找到同一条消息气泡中的所有图片，构建预览列表
    const bubbleContent = target.closest('.bubble .content')
    const imgs = bubbleContent ? Array.from(bubbleContent.querySelectorAll('img')) : [target]
    const urls = imgs.map((img) => img.getAttribute('src')).filter(Boolean)
    const index = imgs.findIndex((img) => img === target)
    openImagePreview(urls, index >= 0 ? index : 0)
}

// 获取当前用户昵称，用于判断消息归属
const currentUserName = computed(() => userInfo?.info?.nickname || '我')

// 判断消息类型的方法
const getMessageType = (from) => {
    if (from === 'server') return 'system'
    if (from === currentUserName.value) return 'self'
    return 'other'
}

// 判断是否由 AI 相关消息发出的辅助方法
const isAiSender = (from) => from === 'AI' || from === 'Think'

// Markdown 渲染器
const markdown = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: true
})

// 解析消息内容，分离正文和思考内容
const parseMessageContent = (text) => {
    if (typeof text !== 'string') return { content: '', thinking: '' }

    // 匹配 <think>内容</think> 或 <think>内容<think> 格式
    const thinkingRegex = /<think>([\s\S]*?)(?:<\/think>|<think>)/g
    const thinkingMatches = []
    let match

    while ((match = thinkingRegex.exec(text)) !== null) {
        thinkingMatches.push(match[1].trim())
    }

    // 移除思考内容标签，获取正文
    const content = text.replace(/<think>[\s\S]*?(?:<\/think>|<think>)/g, '').trim()

    return {
        content: content,
        thinking: thinkingMatches.join('\n\n') // 如果有多个思考块，用换行连接
    }
}

const renderMessageHtml = (msg) => {
    const text = typeof msg?.message === 'string' ? msg.message : ''

    // 如果是AI消息，解析思考内容
    if (isAiSender(msg.from)) {
        const parsed = parseMessageContent(text)
        // 只渲染正文部分
        return DOMPurify.sanitize(markdown.render(parsed.content))
    }

    if (getMessageType(msg.from) === 'system') {
        // 系统消息按 Markdown 渲染，并做 XSS 清洗
        return DOMPurify.sanitize(markdown.render(text))
    }
    // 其他消息如果本身包含 HTML，仅做清洗；保持现有行为
    return DOMPurify.sanitize(text)
}

// 获取消息的思考内容
const getThinkingContent = (msg) => {
    if (!isAiSender(msg.from)) return ''
    const text = typeof msg?.message === 'string' ? msg.message : ''
    const parsed = parseMessageContent(text)
    return parsed.thinking
}

// 切换思考内容展开状态
const toggleThinking = (msgIndex) => {
    const current = thinkingExpandedStates.value.get(msgIndex) || false
    const nextState = !current
    thinkingExpandedStates.value.set(msgIndex, nextState)

    if (nextState) {
        nextTick(() => {
            enhanceResponsiveTables()
        })
    }
}

// 获取思考内容展开状态
const isThinkingExpanded = (msgIndex) => {
    return thinkingExpandedStates.value.get(msgIndex) || false
}

// 渲染思考内容为HTML
const renderThinkingHtml = (msg) => {
    const thinkingText = getThinkingContent(msg)
    if (!thinkingText) return ''
    return DOMPurify.sanitize(markdown.render(thinkingText))
}

// 为表格单元格添加 data-label 属性，便于移动端展示
const enhanceResponsiveTables = () => {
    const wrap = scrollbarRef.value
    if (!wrap) return

    const tables = wrap.querySelectorAll('.bubble .content table, .thinking-content table')
    tables.forEach((table) => {
        if (!(table instanceof HTMLElement)) return
        if (table.dataset.mobileEnhanced === 'true') return

        const headerCells = Array.from(table.querySelectorAll('thead th'))
        let headerTexts = headerCells.map((th) => th.textContent?.trim() || '')

        if (!headerTexts.length) {
            const firstRowCells = Array.from(
                table.querySelectorAll('tbody tr:first-child th, tbody tr:first-child td')
            )
            headerTexts = firstRowCells.map((cell) => cell.textContent?.trim() || '')
        }

        if (!headerTexts.length) {
            table.dataset.mobileEnhanced = 'true'
            return
        }

        const bodyRows = Array.from(table.querySelectorAll('tbody tr'))
        bodyRows.forEach((row) => {
            Array.from(row.children).forEach((cell, index) => {
                if (!(cell instanceof HTMLElement)) return
                const label = headerTexts[index] || headerTexts[headerTexts.length - 1] || ''
                if (!label || cell.hasAttribute('data-label')) return
                cell.setAttribute('data-label', label)
            })
        })

        table.dataset.mobileEnhanced = 'true'
    })
}


//连接WebSocket
const connectWs = () => {
    if (ws) return; // 防止重复连接

    isInitializing.value = true

    // 本地开发环境，直接连接后端
    const wsUrl = `ws://localhost:8081/chat/${userInfo.info.id}`;

    // 生产环境，部署时取消下面的注释，并注释掉上面的本地开发配置
    // const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    // const host = window.location.host;
    // const wsUrl = `${protocol}://${host}/chat/${userInfo.info.id}`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('连接成功');
        isInitializing.value = false

        // 连接成功后，启动心跳机制
        heartbeatInterval = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                // 发送一个心跳包到服务器
                ws.send(JSON.stringify({ type: "ping" }));
            }
        }, 30000); // 每30秒发送一次
    }

    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data)

            // 如果是心跳响应，不处理
            if (message.type === 'pong') {
                return
            }

            if (message.from === 'AI') {
                // 移除正在思考中的占位气泡
                messageList.value = messageList.value.filter((item) => item.from !== 'Think')
                isAiThinking.value = false
            }

            if (message.from === 'Think') {
                // 只保留一条最新的思考提示
                const existingIndex = messageList.value.findIndex((item) => item.from === 'Think')
                if (existingIndex !== -1) {
                    messageList.value.splice(existingIndex, 1, message)
                } else {
                    messageList.value.push(message)
                }
                isAiThinking.value = true
            } else {
                messageList.value.push(message)
            }

            // 第一次收到消息时结束加载
            if (isInitializing.value) {
                isInitializing.value = false
            }

            // 新消息后滚动到底部
            nextTick(() => {
                if (scrollbarRef.value) {
                    scrollbarRef.value.scrollTop = scrollbarRef.value.scrollHeight
                }
                enhanceResponsiveTables()
            })
        } catch (error) {
            console.error('解析消息失败:', error)
        }
    }

    ws.onclose = () => {
        console.log('连接关闭');
        clearInterval(heartbeatInterval);
        heartbeatInterval = null
        ws = null
        isInitializing.value = false
        isAiThinking.value = false
    }

    ws.onerror = (error) => {
        console.error('WebSocket连接错误:', error);
        isInitializing.value = false
        isAiThinking.value = false
    }
}

// 在组件挂载时连接
onMounted(() => {
    fetchEmbedOptions()

    if (userInfo.info.id) {
        connectWs()
    } else {
        isInitializing.value = false
    }

    // 绑定点击事件委托到滚动容器
    nextTick(() => {
        if (scrollbarRef.value) {
            scrollbarRef.value.addEventListener('click', handleContentClick)
        }
        enhanceResponsiveTables()
    })
})

// 当用户信息在挂载后才可用时，等待 ID 后再发起连接
watch(
    () => userInfo.info.id,
    (id) => {
        if (id && !ws) {
            connectWs()
        }
    }
)

// 在组件卸载时关闭连接
onBeforeUnmount(() => {
    if (ws) {
        ws.close()
        ws = null
    }
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
        heartbeatInterval = null
    }

    // 移除图片点击事件
    if (scrollbarRef.value) {
        scrollbarRef.value.removeEventListener('click', handleContentClick)
    }
})

const sendMessage = () => {
    if (isAiThinking.value) {
        return
    }

    const raw = currentMessage.value.trim()
    if (!raw) return

    // 深度搜索开关：自动在消息前加上前缀
    let textToSend = raw
    if (deepSearch.value && !/^请搜索[:：]/.test(textToSend)) {
        textToSend = `请搜索：${textToSend}`
    }

    if (selectedFileIds.value.length > 0) {
        const idsText = selectedFileIds.value.join(', ')
        textToSend = `${textToSend} 从fileId为${idsText}中的文件检索相关信息。`
    }

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(textToSend)
        // 发送的消息会通过 WebSocket 回来，不需要手动添加到列表
        currentMessage.value = ''
    } else {
        console.log('连接未建立');
    }
}

// 在输入框中按下回车发送，Shift+Enter 换行；中文输入法合成中不触发
const handleInputKeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault()
        if (isAiThinking.value) {
            return
        }
        sendMessage()
    }
}

const clearChatMemory = async () => {
    if (isClearingChat.value) return

    // 校验用户ID是否存在
    const sid = userInfo?.info?.id
    if (!sid) {
        ElMessage.error('无法清空记忆：未获取到用户ID')
        return
    }

    isClearingChat.value = true
    try {
        // 传递 sid 给后端
        const response = await clearChatMemoryService(sid)
        const message = typeof response?.data === 'string' ? response.data.trim() : response?.message
        const displayText = message || '记忆已清空'

        // 追加一条系统提示消息
        messageList.value.push({
            from: 'server',
            message: displayText,
            timestamp: Date.now()
        })

        nextTick(() => {
            if (scrollbarRef.value) {
                scrollbarRef.value.scrollTop = scrollbarRef.value.scrollHeight
            }
            enhanceResponsiveTables()
        })

        ElMessage.success(displayText)
    } catch (error) {
        console.error('清除聊天记忆失败:', error)
        ElMessage.error('清除聊天记忆失败，请稍后重试')
    } finally {
        isClearingChat.value = false
    }
}
</script>

<template>
    <div class="chat-room">
        <div class="chat-container">
            <!-- 状态指示器 -->
            <div v-if="!isInitializing" class="connection-status">
                <div class="status-indicator">
                    <div class="online-dot"></div>
                    <span>在线</span>
                </div>
                <el-button class="clear-chat-btn" type="warning" plain size="small" :loading="isClearingChat"
                    :disabled="isClearingChat" @click="clearChatMemory">清空记忆</el-button>
            </div>

            <!-- 滚动容器 -->
            <div class="message-list-scrollbar" ref="scrollbarRef">
                <!-- 动态消息列表 -->
                <div v-for="(msg, index) in messageList" :key="index"
                    :class="['message-row', `message-${getMessageType(msg.from)}`]">

                    <!-- 头像显示在上方 -->
                    <div class="avatar-wrapper">
                        <el-avatar class="avatar"
                            :class="{ 'ai': isAiSender(msg.from), 'system': msg.from === 'server' }" size="default"
                            :src="getMessageType(msg.from) === 'self' ? userInfo.info.userPic : ''">
                            {{ msg.from === 'server' ? '系' : (msg.from === 'AI' ? 'AI' : msg.from.charAt(0)) }}
                        </el-avatar>
                        <span class="user-name">{{ msg.from === 'server' ? '系统' : msg.from }}</span>
                    </div>

                    <!-- 消息气泡显示在下方 -->
                    <div class="bubble"
                        :class="{ 'ai': isAiSender(msg.from), 'system': msg.from === 'server', 'self': getMessageType(msg.from) === 'self' }">

                        <!-- AI消息的思考内容展示（移到正文上方） -->
                        <div v-if="isAiSender(msg.from) && getThinkingContent(msg)" class="thinking-section">
                            <!-- 思考内容控制按钮 -->
                            <div class="thinking-toggle" @click="toggleThinking(index)">
                                <span class="thinking-label">Show thinking</span>
                                <el-icon class="thinking-icon" :class="{ 'expanded': isThinkingExpanded(index) }">
                                    <ArrowDown />
                                </el-icon>
                            </div>

                            <!-- 思考内容区域 -->
                            <div v-if="isThinkingExpanded(index)" class="thinking-content">
                                <div v-html="renderThinkingHtml(msg)"></div>
                            </div>
                        </div>

                        <div class="content" v-html="renderMessageHtml(msg)"></div>
                    </div>
                </div>

                <!-- 加载动画状态 -->
                <div v-if="messageList.length === 0 && isInitializing" class="chat-loading-state">
                    <div class="loading-animation">
                        <div class="loading-spinner">
                            <div class="spinner-ring"></div>
                        </div>
                        <div class="loading-text">聊天加载中...</div>
                    </div>
                </div>

                <!-- 空状态 -->
                <div v-if="messageList.length === 0 && !isInitializing" class="empty-state">
                    <div class="empty-icon">💬</div>
                    <p>加载中</p>
                </div>
            </div>

            <div class="input-area">
                <div class="input-main">
                    <el-select v-model="selectedFileIds" class="embed-select" multiple filterable collapse-tags
                        :disabled="isSelectDisabled" collapse-tags-tooltip :max-collapse-tags="1" placeholder="选择知识库的文件"
                        size="small">
                        <el-option v-for="item in embedOptions" :key="item.value" :label="item.label"
                            :value="item.value">
                            <span class="option-text">{{ truncateLabel(item.label) }}</span>
                        </el-option>
                    </el-select>
                    <el-input v-model="currentMessage" class="msg-input" type="textarea" placeholder="输入消息"
                        :autosize="{ minRows: 2, maxRows: 6 }" @keydown="handleInputKeydown" />
                </div>
                <div class="input-actions">
                    <el-switch v-model="deepSearch" :disabled="isSwitchDisabled" class="deep-search-switch"
                        inline-prompt active-text="网络搜索" inactive-text="网络搜索" />
                    <el-button type="primary" :disabled="isAiThinking" @click="sendMessage">发送</el-button>
                </div>
            </div>
        </div>
    </div>

    <!-- 图片预览（点击放大） -->
    <ElImageViewer v-if="imagePreviewVisible" :url-list="imagePreviewUrls" :initial-index="imagePreviewIndex"
        hide-on-click-modal teleported @close="closeImagePreview" />
</template>



<style lang="scss" scoped>
// 主题变量定义 - 暖色风格
:root {
    // 光亮模式 - 奶油暖色
    --chat-bg: linear-gradient(135deg, #FDF9F6 0%, #FAF4EF 100%);
    --chat-surface: rgba(251, 247, 243, 0.95);
    --chat-border: rgba(92, 75, 58, 0.12);
    --chat-text: #5C4B3A;
    --chat-text-secondary: #9C8B7A;

    // AI消息 - 温暖橙色系
    --ai-bubble: linear-gradient(135deg, #D97459 0%, #E89A84 100%);
    --ai-border: rgba(217, 116, 89, 0.3);
    --ai-text: #ffffff;
    --ai-glow: 0 8px 32px rgba(217, 116, 89, 0.3);

    // 自己的消息 - 温暖琥珀色
    --self-bubble: linear-gradient(135deg, #F4A261 0%, #E9C46A 100%);
    --self-border: rgba(244, 162, 97, 0.3);
    --self-text: #ffffff;
    --self-glow: 0 8px 32px rgba(244, 162, 97, 0.3);

    // 其他用户消息 - 柔和暖色
    --other-bubble: linear-gradient(135deg, #F5D4C8 0%, #FDF2EE 100%);
    --other-border: rgba(245, 212, 200, 0.5);
    --other-text: #5C4B3A;
    --other-glow: 0 8px 32px rgba(245, 212, 200, 0.2);

    // 系统消息 - 温暖提示色
    --system-bubble: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
    --system-border: rgba(255, 236, 210, 0.3);
    --system-text: #5C4B3A;
    --system-glow: 0 8px 32px rgba(255, 236, 210, 0.2);

    // 表格主题色 - 暖色调
    --chat-table-surface: rgba(251, 247, 243, 0.9);
    --chat-table-header: rgba(250, 244, 239, 0.96);
    --chat-table-border: rgba(92, 75, 58, 0.12);
    --chat-table-zebra: rgba(217, 116, 89, 0.05);
    --chat-table-label: rgba(92, 75, 58, 0.75);
}

.dark {
    // 黑暗模式 - 暖棕色调
    --chat-bg: linear-gradient(135deg, #2A2420 0%, #231E1A 100%);
    --chat-surface: rgba(38, 32, 25, 0.95);
    --chat-border: rgba(156, 139, 122, 0.25);
    --chat-text: #E8DED3;
    --chat-text-secondary: #9C8B7A;

    // AI消息 - 温暖橙色系
    --ai-bubble: linear-gradient(135deg, #F4A261 0%, #E9C46A 100%);
    --ai-border: rgba(244, 162, 97, 0.4);
    --ai-text: #2A2420;
    --ai-glow: 0 0 20px rgba(244, 162, 97, 0.4), 0 8px 32px rgba(244, 162, 97, 0.2);

    // 自己的消息 - 珊瑚橙色
    --self-bubble: linear-gradient(135deg, #D97459 0%, #E89A84 100%);
    --self-border: rgba(217, 116, 89, 0.4);
    --self-text: #ffffff;
    --self-glow: 0 0 20px rgba(217, 116, 89, 0.3), 0 8px 32px rgba(217, 116, 89, 0.2);

    // 其他用户消息 - 暖色调
    --other-bubble: linear-gradient(135deg, #B08968 0%, #9C6644 100%);
    --other-border: rgba(176, 137, 104, 0.4);
    --other-text: #ffffff;
    --other-glow: 0 0 20px rgba(176, 137, 104, 0.3), 0 8px 32px rgba(176, 137, 104, 0.2);

    // 系统消息 - 温暖提示色
    --system-bubble: linear-gradient(135deg, #E9C46A 0%, #F4A261 100%);
    --system-border: rgba(233, 196, 106, 0.4);
    --system-text: #2A2420;
    --system-glow: 0 0 20px rgba(233, 196, 106, 0.3), 0 8px 32px rgba(233, 196, 106, 0.2);

    // 表格主题色（暗色暖调）
    --chat-table-surface: rgba(38, 32, 25, 0.85);
    --chat-table-header: rgba(61, 52, 42, 0.9);
    --chat-table-border: rgba(156, 139, 122, 0.35);
    --chat-table-zebra: rgba(244, 162, 97, 0.1);
    --chat-table-label: rgba(232, 222, 211, 0.8);
}

.chat-room {
    flex: 1;
    min-height: 400px;
    background: var(--chat-bg);
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
}

.chat-container {
    flex: 1;
    min-height: 400px;
    display: flex;
    flex-direction: column;
    position: relative;
    backdrop-filter: blur(20px);
    background: var(--chat-surface);
    border: 1px solid var(--chat-border);
    border-radius: 16px;
    box-shadow: 0 20px 80px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
}

/* 渐变描边美化容器边框 */
.chat-container::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.6),
            rgba(79, 172, 254, 0.3),
            rgba(139, 92, 246, 0.3),
            rgba(255, 255, 255, 0.5));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    pointer-events: none;
}

.connection-status {
    position: absolute;
    top: 16px;
    right: 20px;
    z-index: 100;
    display: flex;
    align-items: center;
    gap: 12px;

    .status-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        backdrop-filter: blur(10px);

        &.connecting {
            background: rgba(245, 158, 11, 0.1);
            border: 1px solid rgba(245, 158, 11, 0.3);
            color: #f59e0b;
        }

        &.connected {
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid rgba(34, 197, 94, 0.3);
            color: #22c55e;
        }
    }
}

.clear-chat-btn {
    font-size: 12px;
}

.pulse-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #f59e0b;
    animation: pulse 2s infinite;
}

.online-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 10px rgba(34, 197, 94, 0.5);
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
        transform: scale(1);
    }

    50% {
        opacity: 0.5;
        transform: scale(1.2);
    }
}

.message-list-scrollbar {
    flex: 1;
    min-height: 200px;
    overflow-y: auto;
    overflow-x: hidden;
    max-width: 100%;
    padding: 8px 12px;
    box-sizing: border-box;
}

.message-row {
    display: flex;
    flex-direction: column;
    margin-bottom: 16px;
    width: 100%;
    animation: messageSlideIn 0.3s ease-out;
}

.avatar-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;

    .avatar {
        border: 2px solid transparent;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        cursor: pointer;

        // 基础光环效果
        &::before {
            content: '';
            position: absolute;
            inset: -3px;
            border-radius: 50%;
            padding: 3px;
            background: linear-gradient(45deg,
                    rgba(255, 255, 255, 0.3),
                    rgba(79, 172, 254, 0.3),
                    rgba(139, 92, 246, 0.3),
                    rgba(255, 255, 255, 0.3));
            mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
            mask-composite: exclude;
            opacity: 0;
            transition: all 0.4s ease;
            animation: avatarRotate 3s linear infinite;
        }

        // 外发光环
        &::after {
            content: '';
            position: absolute;
            inset: -6px;
            border-radius: 50%;
            background: radial-gradient(circle,
                    rgba(79, 172, 254, 0.2) 0%,
                    rgba(139, 92, 246, 0.1) 50%,
                    transparent 70%);
            opacity: 0;
            transition: all 0.4s ease;
            animation: avatarPulse 2s ease-in-out infinite;
        }

        &:hover {
            transform: scale(1.1) rotate(5deg);
            filter: brightness(1.2);

            &::before {
                opacity: 1;
                transform: scale(1.1);
            }

            &::after {
                opacity: 1;
                transform: scale(1.2);
            }
        }
    }

    .user-name {
        font-size: 12px;
        font-weight: 600;
        color: var(--chat-text-secondary);
        letter-spacing: 0.5px;
        transition: all 0.3s ease;

        &:hover {
            color: var(--chat-text);
            transform: translateX(2px);
        }
    }
}

@keyframes avatarRotate {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

@keyframes avatarPulse {

    0%,
    100% {
        opacity: 0;
        transform: scale(1);
    }

    50% {
        opacity: 1;
        transform: scale(1.1);
    }
}

.message-self {
    align-items: flex-end;

    .avatar-wrapper {
        flex-direction: row-reverse;

        .avatar {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: #fff;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
            border: 2px solid rgba(59, 130, 246, 0.4);
            animation: selfGlow 3s ease-in-out infinite alternate;

            &::before {
                background: linear-gradient(45deg,
                        rgba(59, 130, 246, 0.6),
                        rgba(29, 78, 216, 0.6),
                        rgba(59, 130, 246, 0.6));
                opacity: 0.9;
            }

            &::after {
                background: radial-gradient(circle,
                        rgba(59, 130, 246, 0.3) 0%,
                        rgba(29, 78, 216, 0.2) 50%,
                        transparent 70%);
                opacity: 0.9;
            }

            &:hover {
                animation-duration: 1.5s;
                box-shadow: 0 0 35px rgba(59, 130, 246, 0.6),
                    0 0 60px rgba(59, 130, 246, 0.3);
                transform: scale(1.15) rotate(-5deg);
            }
        }

        .user-name {
            color: var(--self-text);
            opacity: 0.9;
            text-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
            font-weight: 700;
        }
    }
}

@keyframes selfGlow {
    0% {
        box-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
        filter: brightness(1) saturate(1);
    }

    100% {
        box-shadow: 0 0 30px rgba(59, 130, 246, 0.6),
            0 0 50px rgba(59, 130, 246, 0.3);
        filter: brightness(1.1) saturate(1.2);
    }
}

.message-other,
.message-ai,
.message-system {
    align-items: flex-start;
}

.message-ai {
    .avatar.ai {
        background: linear-gradient(135deg, #8b5cf6, #a855f7);
        color: #fff;
        box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
        border: 2px solid rgba(139, 92, 246, 0.3);
        animation: aiGlow 2.5s ease-in-out infinite alternate;

        &::before {
            background: linear-gradient(45deg,
                    rgba(139, 92, 246, 0.6),
                    rgba(168, 85, 247, 0.6),
                    rgba(139, 92, 246, 0.6));
            opacity: 1;
        }

        &::after {
            background: radial-gradient(circle,
                    rgba(139, 92, 246, 0.3) 0%,
                    rgba(168, 85, 247, 0.2) 50%,
                    transparent 70%);
            opacity: 1;
        }

        &:hover {
            animation-duration: 1s;
            box-shadow: 0 0 30px rgba(139, 92, 246, 0.6),
                0 0 60px rgba(139, 92, 246, 0.3);
        }
    }

    .user-name {
        color: #8b5cf6;
        font-weight: 700;
        text-shadow: 0 0 10px rgba(139, 92, 246, 0.3);
    }
}

@keyframes aiGlow {
    0% {
        box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
        filter: brightness(1);
    }

    100% {
        box-shadow: 0 0 30px rgba(139, 92, 246, 0.6),
            0 0 50px rgba(139, 92, 246, 0.2);
        filter: brightness(1.1);
    }
}

.message-system {
    .avatar.system {
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: #fff;
        box-shadow: 0 0 20px rgba(245, 158, 11, 0.4);
        border: 2px solid rgba(245, 158, 11, 0.3);
        animation: systemPulse 3s ease-in-out infinite;

        &::before {
            background: linear-gradient(45deg,
                    rgba(245, 158, 11, 0.6),
                    rgba(217, 119, 6, 0.6),
                    rgba(245, 158, 11, 0.6));
            opacity: 0.8;
        }

        &::after {
            background: radial-gradient(circle,
                    rgba(245, 158, 11, 0.3) 0%,
                    rgba(217, 119, 6, 0.2) 50%,
                    transparent 70%);
            opacity: 0.8;
        }

        &:hover {
            animation-duration: 1.5s;
            box-shadow: 0 0 30px rgba(245, 158, 11, 0.6);
        }
    }

    .user-name {
        color: #f59e0b;
        font-weight: 700;
        text-shadow: 0 0 8px rgba(245, 158, 11, 0.3);
    }
}

@keyframes systemPulse {

    0%,
    100% {
        transform: scale(1);
        box-shadow: 0 0 20px rgba(245, 158, 11, 0.4);
    }

    50% {
        transform: scale(1.05);
        box-shadow: 0 0 25px rgba(245, 158, 11, 0.6),
            0 0 40px rgba(245, 158, 11, 0.2);
    }
}

.message-other {
    .avatar:not(.ai):not(.system) {
        background: linear-gradient(135deg, #06b6d4, #0891b2);
        color: #fff;
        box-shadow: 0 0 15px rgba(6, 182, 212, 0.3);
        border: 2px solid rgba(6, 182, 212, 0.3);
        animation: otherShimmer 4s ease-in-out infinite;

        &::before {
            background: linear-gradient(45deg,
                    rgba(6, 182, 212, 0.4),
                    rgba(8, 145, 178, 0.4),
                    rgba(6, 182, 212, 0.4));
            opacity: 0.6;
        }

        &::after {
            background: radial-gradient(circle,
                    rgba(6, 182, 212, 0.2) 0%,
                    rgba(8, 145, 178, 0.1) 50%,
                    transparent 70%);
            opacity: 0.6;
        }

        &:hover {
            box-shadow: 0 0 25px rgba(6, 182, 212, 0.5);
        }
    }

    .user-name {
        color: #06b6d4;
        font-weight: 700;
        text-shadow: 0 0 6px rgba(6, 182, 212, 0.2);
    }
}

@keyframes otherShimmer {

    0%,
    100% {
        box-shadow: 0 0 15px rgba(6, 182, 212, 0.3);
        filter: brightness(1);
    }

    50% {
        box-shadow: 0 0 20px rgba(6, 182, 212, 0.4),
            0 0 35px rgba(6, 182, 212, 0.2);
        filter: brightness(1.05);
    }
}

@keyframes messageSlideIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}


.bubble {
    max-width: 70%;
    border-radius: 20px;
    padding: 16px 20px;
    word-break: break-word;
    position: relative;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    border: 1px solid transparent;
    align-self: flex-start;

    &:hover {
        transform: translateY(-2px);
        filter: brightness(1.1);
    }

    .content {
        line-height: 1.7;
        word-break: break-word;

        // Markdown样式优化
        :deep(p) {
            margin: 0 0 8px 0;

            &:last-child {
                margin-bottom: 0;
            }
        }

        // 标题样式
        :deep(h1),
        :deep(h2),
        :deep(h3),
        :deep(h4),
        :deep(h5),
        :deep(h6) {
            margin: 16px 0 8px 0;
            font-weight: 700;
            line-height: 1.4;
            color: inherit;

            &:first-child {
                margin-top: 0;
            }
        }

        :deep(h1) {
            font-size: 1.6em;
            border-bottom: 2px solid currentColor;
            padding-bottom: 6px;
            opacity: 0.95;
        }

        :deep(h2) {
            font-size: 1.4em;
            border-bottom: 1px solid currentColor;
            padding-bottom: 4px;
            opacity: 0.9;
        }

        :deep(h3) {
            font-size: 1.25em;
        }

        :deep(h4) {
            font-size: 1.1em;
        }

        :deep(h5) {
            font-size: 1em;
        }

        :deep(h6) {
            font-size: 0.9em;
            opacity: 0.85;
        }

        // 链接样式
        :deep(a) {
            color: #3b82f6;
            text-decoration: underline;
            text-underline-offset: 2px;
            transition: all 0.2s ease;
            font-weight: 500;

            &:hover {
                color: #60a5fa;
                text-decoration-color: #60a5fa;
            }

            &:visited {
                color: #8b5cf6;
            }
        }

        // 表格样式：在消息气泡内更好地显示 Markdown 表格
        :deep(table) {
            width: 100%;
            min-width: min(520px, 100%); // 保持桌面完整列宽，小屏自动收敛
            display: block; // 允许横向滚动
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            border-collapse: collapse;
            border-spacing: 0;
            table-layout: fixed; // 防止列过度挤压，便于换行
            margin: 8px 0;
            border: 1px solid var(--chat-table-border);
            border-radius: 12px;
            background: var(--chat-table-surface);
            box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
        }

        :deep(thead) {
            position: sticky;
            top: 0; // 若出现滚动，表头更易辨认
            background: var(--chat-table-header);
            backdrop-filter: blur(10px);
            z-index: 1;
        }

        :deep(th),
        :deep(td) {
            padding: 8px 10px;
            border: 1px solid var(--chat-table-border);
            text-align: left;
            vertical-align: top;
            word-break: break-word;
            overflow-wrap: anywhere;
            white-space: normal;
            line-height: 1.5;
            font-size: 14px;
            background: transparent;
            color: var(--chat-text);
        }

        :deep(th) {
            font-weight: 600;
        }

        :deep(tr:nth-child(odd) td) {
            background: var(--chat-table-zebra);
        }

        // 图片样式：限制尺寸并自适应容器
        :deep(img) {
            display: block;
            max-width: 100%;
            width: auto;
            height: auto;
            max-height: 380px;
            object-fit: contain;
            border-radius: 10px;
            margin: 8px auto;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
            cursor: zoom-in;
        }

        :deep(code) {
            background: rgba(0, 0, 0, 0.1);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.9em;
        }

        :deep(pre) {
            background: rgba(0, 0, 0, 0.1);
            padding: 12px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 8px 0;
        }
    }
}

// 思考内容样式 - 暖色风格
.thinking-section {
    margin-bottom: 12px;
    border: 2px solid rgba(217, 116, 89, 0.4);
    border-radius: 10px;
    background: rgba(217, 116, 89, 0.05);
    overflow: hidden;
    transition: all 0.3s ease;

    &:hover {
        border-color: rgba(217, 116, 89, 0.6);
        background: rgba(217, 116, 89, 0.08);
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(217, 116, 89, 0.2);
    }
}

.thinking-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    background: linear-gradient(135deg, rgba(217, 116, 89, 0.15), rgba(244, 162, 97, 0.1));
    cursor: pointer;
    transition: all 0.3s ease;
    border-bottom: 1px solid rgba(217, 116, 89, 0.2);

    &:hover {
        background: linear-gradient(135deg, rgba(217, 116, 89, 0.2), rgba(244, 162, 97, 0.15));
    }

    .thinking-label {
        font-size: 13px;
        font-weight: 600;
        color: #D97459;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        letter-spacing: 0.5px;
    }

    .thinking-icon {
        transition: transform 0.3s ease;
        font-size: 18px;
        color: #D97459;
        filter: drop-shadow(0 1px 2px rgba(217, 116, 89, 0.3));

        &.expanded {
            transform: rotate(180deg);
        }
    }
}

.thinking-content {
    padding: 14px 16px;
    background: rgba(255, 255, 255, 0.6);
    animation: thinkingSlideIn 0.3s ease-out;
    border-top: none;

    // 思考内容中的文本样式
    :deep(p) {
        margin: 0 0 8px 0;
        line-height: 1.6;
        font-size: 13px;
        opacity: 0.9;

        &:last-child {
            margin-bottom: 0;
        }
    }

    :deep(h1),
    :deep(h2),
    :deep(h3),
    :deep(h4),
    :deep(h5),
    :deep(h6) {
        margin: 8px 0 4px 0;
        font-size: 14px;
        font-weight: 600;
        opacity: 0.95;
    }

    :deep(ul),
    :deep(ol) {
        margin: 4px 0;
        padding-left: 16px;

        li {
            margin: 2px 0;
            font-size: 13px;
            line-height: 1.5;
        }
    }

    :deep(code) {
        background: rgba(0, 0, 0, 0.15);
        padding: 2px 4px;
        border-radius: 3px;
        font-size: 12px;
    }

    :deep(pre) {
        background: rgba(0, 0, 0, 0.15);
        padding: 8px;
        border-radius: 6px;
        overflow-x: auto;
        margin: 6px 0;
        font-size: 12px;
    }

    // 思考内容中的表格样式（与正文保持一致、稍微紧凑）
    :deep(table) {
        width: 100%;
        min-width: min(520px, 100%);
        display: block;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        border-collapse: collapse;
        border-spacing: 0;
        table-layout: fixed;
        margin: 6px 0;
        border: 1px solid var(--chat-table-border);
        border-radius: 10px;
        background: var(--chat-table-surface);
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
    }

    :deep(th),
    :deep(td) {
        padding: 6px 8px;
        border: 1px solid var(--chat-table-border);
        text-align: left;
        vertical-align: top;
        word-break: break-word;
        overflow-wrap: anywhere;
        white-space: normal;
        line-height: 1.5;
        font-size: 12px;
        background: transparent;
        color: var(--chat-text);
    }
}

@keyframes thinkingSlideIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
        max-height: 0;
    }

    to {
        opacity: 1;
        transform: translateY(0);
        max-height: 1000px;
    }
}

.bubble.self {
    background: var(--self-bubble);
    border: 1px solid var(--self-border);
    color: var(--self-text);
    box-shadow: var(--self-glow);
    align-self: flex-end;
    position: relative;
    overflow: hidden;

    // 用户消息特殊炫酷效果
    &::before {
        content: '';
        position: absolute;
        inset: -1px;
        border-radius: 20px;
        padding: 1px;
        background: linear-gradient(45deg,
                rgba(79, 172, 254, 0.4),
                rgba(29, 78, 216, 0.4),
                rgba(79, 172, 254, 0.4));
        mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        mask-composite: exclude;
        opacity: 0.7;
        animation: selfBorderGlow 2s ease-in-out infinite alternate;
        pointer-events: none;
    }

    // 内发光效果
    &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 40%;
        background: linear-gradient(180deg,
                rgba(255, 255, 255, 0.15) 0%,
                transparent 100%);
        border-radius: 20px 20px 0 0;
        pointer-events: none;
    }

    // 自己消息气泡内链接样式（深色背景时用浅色）
    .content :deep(a) {
        color: #bfdbfe;
        text-decoration-color: rgba(191, 219, 254, 0.6);

        &:hover {
            color: #ffffff;
            text-decoration-color: #ffffff;
        }

        &:visited {
            color: #c4b5fd;
        }
    }
}

@keyframes selfBorderGlow {
    0% {
        opacity: 0.5;
        transform: scale(1);
    }

    100% {
        opacity: 0.9;
        transform: scale(1.01);
    }
}

.bubble.ai {
    background: var(--ai-bubble);
    border: 1px solid var(--ai-border);
    color: var(--ai-text);
    box-shadow: var(--ai-glow);

    // AI消息特殊效果
    &::before {
        content: '';
        position: absolute;
        inset: -1px;
        border-radius: 20px;
        padding: 1px;
        background: linear-gradient(45deg, rgba(139, 92, 246, 0.3), rgba(168, 85, 247, 0.3));
        mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        mask-composite: exclude;
        opacity: 0.6;
        pointer-events: none;
    }

    // AI气泡内链接样式（浅色背景时）
    .content :deep(a) {
        color: #1d4ed8;
        text-decoration-color: rgba(29, 78, 216, 0.5);

        &:hover {
            color: #1e40af;
            text-decoration-color: #1e40af;
        }

        &:visited {
            color: #6d28d9;
        }
    }
}

.bubble.system {
    background: var(--system-bubble);
    border: 1px solid var(--system-border);
    color: var(--system-text);
    box-shadow: var(--system-glow);

    // 系统消息气泡内链接样式
    .content :deep(a) {
        color: #7c2d12;
        text-decoration-color: rgba(124, 45, 18, 0.5);

        &:hover {
            color: #9a3412;
            text-decoration-color: #9a3412;
        }

        &:visited {
            color: #6b21a8;
        }
    }
}

// 其他用户消息样式
.message-other .bubble:not(.ai):not(.system) {
    background: var(--other-bubble);
    border: 1px solid var(--other-border);
    color: var(--other-text);
    box-shadow: var(--other-glow);

    // 其他用户消息气泡内链接样式
    .content :deep(a) {
        color: #1d4ed8;
        text-decoration-color: rgba(29, 78, 216, 0.5);

        &:hover {
            color: #1e40af;
            text-decoration-color: #1e40af;
        }

        &:visited {
            color: #6d28d9;
        }
    }
}

// 聊天加载动画
.chat-loading-state {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    padding: 40px 20px;
}

.loading-animation {
    text-align: center;
    position: relative;
}

.loading-spinner {
    margin-bottom: 16px;

    .spinner-ring {
        width: 40px;
        height: 40px;
        border: 3px solid transparent;
        border-top: 3px solid #D97459;
        border-right: 3px solid #F4A261;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto;
        position: relative;

        &::before {
            content: '';
            position: absolute;
            top: 2px;
            left: 2px;
            right: 2px;
            bottom: 2px;
            border: 2px solid transparent;
            border-top: 2px solid rgba(217, 116, 89, 0.3);
            border-radius: 50%;
            animation: spin 1.5s linear infinite reverse;
        }
    }
}

.loading-text {
    font-size: 14px;
    font-weight: 500;
    color: var(--chat-text-secondary);
    letter-spacing: 0.5px;
    opacity: 0.8;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}


.empty-state {
    text-align: center;
    padding: 40px 16px;
    color: var(--chat-text-secondary);
    background: radial-gradient(circle at center, rgba(0, 0, 0, 0.02) 0%, transparent 70%);
    border-radius: 20px;
    margin: 12px;

    .empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.7;
        animation: iconFloat 3s ease-in-out infinite;
    }

    p {
        margin: 0;
        font-size: 16px;
        font-weight: 500;
        opacity: 0.8;
        letter-spacing: 0.5px;
    }
}

@keyframes iconFloat {

    0%,
    100% {
        transform: translateY(0px);
    }

    50% {
        transform: translateY(-8px);
    }
}

.input-area {
    border-top: 1px solid var(--chat-border);
    padding: 12px 16px;
    display: flex;
    gap: 12px;
    align-items: flex-end;
    box-sizing: border-box;
    background: var(--chat-surface);
    backdrop-filter: blur(20px);
    position: relative;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg,
                transparent 0%,
                var(--chat-border) 20%,
                var(--chat-border) 80%,
                transparent 100%);
    }
}

.input-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.embed-select {
    width: 100%;

    :deep(.el-select__wrapper) {
        min-height: 34px;
        padding: 2px 8px;
        gap: 4px;
    }

    :deep(.el-select__selection) {
        gap: 4px;
    }

    :deep(.el-tag) {
        max-width: 110px;
        font-size: 12px;
        margin: 0;
    }

    :deep(.el-select-dropdown__item) {
        max-width: 100%;
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    :deep(.el-select-dropdown__item span) {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    :deep(.option-text) {
        display: block;
        max-width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    :deep(.el-select__tags-text) {
        max-width: 80px;
        display: inline-block;
        overflow: hidden;
        text-overflow: ellipsis;
        vertical-align: bottom;
    }

    @media (max-width: 768px) {
        :deep(.el-select__wrapper) {
            min-height: 32px;
            padding: 2px 6px;
        }

        :deep(.el-tag) {
            max-width: 70px;
        }
    }
}

.msg-input {
    flex: 1;
    width: 100%;

    :deep(.el-textarea__inner) {
        background: rgba(255, 255, 255, 0.8);
        border: 2px solid var(--chat-border);
        border-radius: 16px;
        padding: 12px 16px;
        font-size: 14px;
        line-height: 1.6;
        resize: none;
        transition: all 0.3s ease;

        &:focus {
            border-color: var(--el-color-primary);
            box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
            background: rgba(255, 255, 255, 0.95);
        }

        &::placeholder {
            color: var(--chat-text-secondary);
            opacity: 0.6;
        }
    }

    // 解决移动端输入框点击自动放大的问题
    @media (max-width: 768px) {
        :deep(textarea) {
            font-size: 16px;
        }
    }
}

.input-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-width: 120px;

    .deep-search-switch {
        display: inline-flex;
        align-items: center;
        justify-content: center;

        :deep(.el-switch__core) {
            box-shadow: 0 2px 8px rgba(217, 116, 89, 0.25);
        }

        // 提高开关内文字对比度
        :deep(.el-switch__core .el-switch__inner) {
            color: #000 !important;
            font-weight: 600;
        }
    }

    .el-button {
        border-radius: 12px;
        padding: 12px 20px;
        font-weight: 600;
        background: linear-gradient(135deg, #D97459 0%, #C86750 100%);
        border: none;
        box-shadow: 0 4px 16px rgba(217, 116, 89, 0.3);
        transition: all 0.3s ease;
        width: 100%;

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(217, 116, 89, 0.4);
        }

        &:active {
            transform: translateY(0);
        }
    }
}


// 小高度屏幕适配
@media (max-height: 600px) {
    .chat-room {
        min-height: 400px;
    }

    .chat-container {
        min-height: 400px;
    }
}

// 极小屏幕适配
@media (max-height: 400px) {
    .chat-room {
        min-height: 300px;
    }

    .chat-container {
        min-height: 300px;
    }

    .connection-status {
        display: none; // 极小屏幕隐藏状态指示器以节省空间
    }

    .message-list-scrollbar {
        padding: 10px 16px;
    }

    .input-area {
        padding: 12px;
    }

    .chat-loading-state {
        min-height: 120px;
        padding: 16px 12px;

        .loading-spinner .spinner-ring {
            width: 28px;
            height: 28px;
            border-width: 2px;

            &::before {
                border-width: 1px;
            }
        }

        .loading-text {
            font-size: 12px;
        }
    }
}

// 移动端适配
@media (max-width: 768px) {
    .chat-room {
        min-height: 400px;
        padding: 0;
        overflow-x: hidden;
    }

    .chat-container {
        border-radius: 0;
        border: none;

        /* 移动端不需要外层渐变描边 */
        &::before {
            display: none;
        }

        min-height: 400px;
    }

    .connection-status {
        top: 10px;
        right: 16px;

        .status-indicator {
            padding: 6px 10px;
            font-size: 11px;
        }
    }

    .message-list-scrollbar {
        padding: 8px;
    }

    .message-row {
        margin-bottom: 12px;

        .avatar-wrapper {
            margin-bottom: 4px;

            .avatar {
                width: 32px;
                height: 32px;
            }

            .user-name {
                font-size: 11px;
            }
        }

        .bubble {
            max-width: 88%;
            padding: 12px 14px;
            border-radius: 16px;
        }

        // 移动端进一步收敛图片高度
        .bubble .content :deep(img) {
            max-height: 260px;
        }

        .bubble .content,
        .thinking-content {
            :deep(table) {
                min-width: 100%;
                display: block;
                border: none;
                background: var(--chat-table-surface);
                box-shadow: 0 6px 18px rgba(15, 23, 42, 0.12);
                overflow: hidden;
            }

            :deep(thead) {
                display: none;
            }

            :deep(tbody) {
                display: block;
            }

            :deep(tr) {
                display: block;
                margin-bottom: 10px;
                border: 1px solid var(--chat-table-border);
                border-radius: 12px;
                overflow: hidden;
                background: var(--chat-table-surface);
            }

            :deep(tr:last-child) {
                margin-bottom: 0;
            }

            :deep(tr:nth-child(odd) td) {
                background: transparent;
            }

            :deep(td),
            :deep(th) {
                display: flex;
                align-items: flex-start;
                gap: 8px;
                border: none;
                border-bottom: 1px solid var(--chat-table-border);
                padding: 10px 14px;
                font-size: 13px;
                line-height: 1.6;
                background: transparent;
                color: var(--chat-text);
            }

            :deep(td:last-child),
            :deep(th:last-child) {
                border-bottom: none;
            }

            :deep(td::before),
            :deep(th::before) {
                content: attr(data-label);
                flex: 0 0 110px;
                max-width: 45%;
                font-weight: 600;
                color: var(--chat-table-label);
                letter-spacing: 0.3px;
                white-space: normal;
                line-height: 1.5;
                font-size: 12px;
            }

            :deep(td[data-label='']::before),
            :deep(th[data-label='']::before) {
                content: '';
            }
        }
    }

    .input-area {
        padding: 12px;
        gap: 10px;

        .msg-input :deep(.el-textarea__inner) {
            border-radius: 14px;
            padding: 8px 12px;
        }

        .input-actions {
            min-width: 100px;

            .el-button {
                padding: 8px 16px;
                border-radius: 10px;
            }
        }
    }

    .chat-loading-state {
        min-height: 150px;
        padding: 20px 16px;

        .loading-spinner .spinner-ring {
            width: 32px;
            height: 32px;
            border-width: 2px;

            &::before {
                border-width: 1px;
            }
        }

        .loading-text {
            font-size: 13px;
        }
    }

    .empty-state {
        margin: 8px;
        padding: 24px 12px;

        .empty-icon {
            font-size: 36px;
            margin-bottom: 12px;
        }

        p {
            font-size: 14px;
        }
    }
}

/* 强制允许聊天内容文本可选择（避免外层样式影响） */
.message-list-scrollbar,
.message-row,
.bubble,
.bubble .content {
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
    user-select: text;
}

// 黑暗模式样式增强 - 暖色风格
.dark {

    // 黑暗模式加载动画
    .chat-loading-state {
        .loading-spinner .spinner-ring {
            border-top-color: #F4A261;
            border-right-color: #E9C46A;

            &::before {
                border-top-color: rgba(244, 162, 97, 0.4);
            }
        }

        .loading-text {
            color: var(--chat-text);
        }
    }

    .empty-state {
        background: radial-gradient(circle at center, rgba(255, 255, 255, 0.02) 0%, transparent 70%);

        .empty-icon {
            filter: brightness(1.2);
        }
    }


    // 增强用户消息框在黑暗模式下的效果
    .bubble.self {
        &::before {
            background: linear-gradient(45deg,
                    rgba(59, 130, 246, 0.6),
                    rgba(29, 78, 216, 0.6),
                    rgba(59, 130, 246, 0.6));
            opacity: 0.9;
        }

        &::after {
            background: linear-gradient(180deg,
                    rgba(255, 255, 255, 0.25) 0%,
                    transparent 100%);
        }
    }

    .msg-input {
        :deep(.el-textarea__inner) {
            background: rgba(30, 41, 59, 0.8);
            border-color: var(--chat-border);
            color: var(--chat-text);

            &:focus {
                background: rgba(30, 41, 59, 0.95);
                border-color: var(--el-color-primary);
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
            }

            &::placeholder {
                color: var(--chat-text-secondary);
            }
        }
    }

    .input-actions .el-button {
        background: linear-gradient(135deg, #F4A261 0%, #E09254 100%);
        box-shadow: 0 4px 16px rgba(244, 162, 97, 0.3);

        &:hover {
            box-shadow: 0 8px 24px rgba(244, 162, 97, 0.4);
        }
    }

    // 黑暗模式下的头像炫酷增强 - 暖色风格
    .avatar-wrapper .avatar {
        &::before {
            background: linear-gradient(45deg,
                    rgba(255, 255, 255, 0.1),
                    rgba(217, 116, 89, 0.4),
                    rgba(244, 162, 97, 0.4),
                    rgba(255, 255, 255, 0.1));
        }

        &::after {
            background: radial-gradient(circle,
                    rgba(217, 116, 89, 0.3) 0%,
                    rgba(244, 162, 97, 0.2) 50%,
                    transparent 70%);
        }
    }

    .message-self {
        .avatar {
            background: linear-gradient(135deg, #D97459, #C86750) !important;
            box-shadow: 0 0 25px rgba(217, 116, 89, 0.5) !important;
            border: 2px solid rgba(217, 116, 89, 0.5) !important;

            &::before {
                background: linear-gradient(45deg,
                        rgba(217, 116, 89, 0.8),
                        rgba(200, 103, 80, 0.8),
                        rgba(217, 116, 89, 0.8)) !important;
            }

            &::after {
                background: radial-gradient(circle,
                        rgba(217, 116, 89, 0.4) 0%,
                        rgba(200, 103, 80, 0.3) 50%,
                        transparent 70%) !important;
            }
        }

        .user-name {
            color: rgba(255, 255, 255, 0.95) !important;
            text-shadow: 0 0 12px rgba(217, 116, 89, 0.5) !important;
        }
    }

    .message-ai {
        .avatar.ai {
            box-shadow: 0 0 25px rgba(244, 162, 97, 0.6) !important;

            &::before {
                opacity: 1 !important;
            }

            &::after {
                opacity: 1 !important;
            }
        }

        .user-name {
            color: #F4A261 !important;
            text-shadow: 0 0 12px rgba(244, 162, 97, 0.4) !important;
        }
    }

    .message-system {
        .avatar.system {
            box-shadow: 0 0 25px rgba(233, 196, 106, 0.6) !important;
        }

        .user-name {
            color: #E9C46A !important;
            text-shadow: 0 0 10px rgba(233, 196, 106, 0.4) !important;
        }
    }

    .message-other {
        .avatar:not(.ai):not(.system) {
            background: linear-gradient(135deg, #B08968, #9C6644) !important;
            box-shadow: 0 0 20px rgba(176, 137, 104, 0.5) !important;
            border: 2px solid rgba(176, 137, 104, 0.4) !important;
        }

        .user-name {
            color: #DDB892 !important;
            text-shadow: 0 0 8px rgba(176, 137, 104, 0.3) !important;
        }
    }

    // 黑暗模式下的思考内容样式 - 暖色风格
    .thinking-section {
        border-color: rgba(244, 162, 97, 0.6);
        background: rgba(244, 162, 97, 0.08);

        &:hover {
            border-color: rgba(244, 162, 97, 0.8);
            background: rgba(244, 162, 97, 0.12);
            box-shadow: 0 4px 16px rgba(244, 162, 97, 0.3);
        }
    }

    .thinking-toggle {
        background: linear-gradient(135deg, rgba(244, 162, 97, 0.2), rgba(233, 196, 106, 0.15));
        border-bottom-color: rgba(244, 162, 97, 0.3);

        &:hover {
            background: linear-gradient(135deg, rgba(244, 162, 97, 0.25), rgba(233, 196, 106, 0.2));
        }

        .thinking-label {
            color: #F4A261;
            text-shadow: 0 1px 2px rgba(244, 162, 97, 0.5);
        }

        .thinking-icon {
            color: #F4A261;
            filter: drop-shadow(0 1px 2px rgba(244, 162, 97, 0.5));
        }
    }

    .thinking-content {
        background: rgba(30, 41, 59, 0.7);

        :deep(p) {
            color: rgba(255, 255, 255, 0.9);
        }

        :deep(h1),
        :deep(h2),
        :deep(h3),
        :deep(h4),
        :deep(h5),
        :deep(h6) {
            color: rgba(255, 255, 255, 0.95);
        }

        :deep(ul),
        :deep(ol) {
            li {
                color: rgba(255, 255, 255, 0.85);
            }
        }

        :deep(code) {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.9);
        }

        :deep(pre) {
            background: rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.9);
        }

        // 思考内容中的表格（黑暗模式）
        :deep(table) {
            background: var(--chat-table-surface);
            border-color: var(--chat-table-border);
        }

        :deep(th),
        :deep(td) {
            border-color: var(--chat-table-border);
            color: rgba(255, 255, 255, 0.93);
        }

        :deep(tr:nth-child(odd) td) {
            background: var(--chat-table-zebra);
        }
    }

    // 表格在黑暗模式下的可读性优化
    .bubble .content :deep(table) {
        background: var(--chat-table-surface);
        border-color: var(--chat-table-border);
        box-shadow: 0 14px 30px rgba(8, 47, 73, 0.35);
    }

    .bubble .content :deep(th),
    .bubble .content :deep(td) {
        border-color: var(--chat-table-border);
        color: var(--chat-text);
    }

    .bubble .content :deep(tr:nth-child(odd) td) {
        background: var(--chat-table-zebra);
    }

    // 黑暗模式下链接颜色优化
    .bubble .content :deep(a) {
        color: #60a5fa;
        text-decoration-color: rgba(96, 165, 250, 0.5);

        &:hover {
            color: #93c5fd;
            text-decoration-color: #93c5fd;
        }

        &:visited {
            color: #a78bfa;
        }
    }

    // AI气泡在黑暗模式下的链接（深色文字背景）
    .bubble.ai .content :deep(a) {
        color: #1e40af;
        text-decoration-color: rgba(30, 64, 175, 0.5);

        &:hover {
            color: #1e3a8a;
            text-decoration-color: #1e3a8a;
        }

        &:visited {
            color: #5b21b6;
        }
    }

    // 黑暗模式下标题样式增强
    .bubble .content :deep(h1),
    .bubble .content :deep(h2),
    .bubble .content :deep(h3),
    .bubble .content :deep(h4),
    .bubble .content :deep(h5),
    .bubble .content :deep(h6) {
        color: inherit;
    }

    .bubble .content :deep(h1),
    .bubble .content :deep(h2) {
        border-color: rgba(255, 255, 255, 0.3);
    }
}
</style>
