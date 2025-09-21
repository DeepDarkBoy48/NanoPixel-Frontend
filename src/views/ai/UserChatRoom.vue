<script setup>
import { ChatDotRound } from '@element-plus/icons-vue'

import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
// 导入用户信息存储
import useUserInfoStore from '@/store/userInfo'
//用于储存消息列表
const messageList = ref([])
//用于储存当前输入的消息
const currentMessage = ref('')
//用于储存用户信息
const userInfo = useUserInfoStore();
// 加载状态：简单的加载动画控制
const isInitializing = ref(true)
//用于储存WebSocket连接
let ws = null;
// 心跳定时器
let heartbeatInterval = null;
// El-scrollbar 组件引用
const scrollbarRef = ref(null)

// 获取当前用户昵称，用于判断消息归属
const currentUserName = computed(() => userInfo?.info?.nickname || '我')

// 判断消息类型的方法
const getMessageType = (from) => {
    if (from === 'server') return 'system'
    if (from === currentUserName.value) return 'self'
    return 'other'
}

// Markdown 渲染器
const markdown = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: true
})

const renderMessageHtml = (msg) => {
    const text = typeof msg?.message === 'string' ? msg.message : ''
    if (getMessageType(msg.from) === 'system' || msg.from === 'AI') {
        // 系统消息按 Markdown 渲染，并做 XSS 清洗
        return DOMPurify.sanitize(markdown.render(text))
    }
    // 其他消息如果本身包含 HTML，仅做清洗；保持现有行为
    return DOMPurify.sanitize(text)
}


//连接WebSocket
const connectWs = () => {
    if (ws) return; // 防止重复连接

    isInitializing.value = true

    // 本地开发环境，直接连接后端
    // const wsUrl = `ws://localhost:8081/chat/${userInfo.info.id}`;

    // 生产环境，部署时取消下面的注释，并注释掉上面的本地开发配置
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host;
    const wsUrl = `${protocol}://${host}/chat/${userInfo.info.id}`;

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

            messageList.value.push(message)

            // 第一次收到消息时结束加载
            if (isInitializing.value) {
                isInitializing.value = false
            }

            // 新消息后滚动到底部
            nextTick(() => {
                if (scrollbarRef.value) {
                    const scrollContainer = scrollbarRef.value.wrapRef
                    if (scrollContainer) {
                        scrollContainer.scrollTop = scrollContainer.scrollHeight
                    }
                }
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
    }

    ws.onerror = (error) => {
        console.error('WebSocket连接错误:', error);
        isInitializing.value = false
    }
}

// 在组件挂载时连接
onMounted(() => {
    if (userInfo.info.id) {
        connectWs()
    } else {
        isInitializing.value = false
    }
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
})

const sendMessage = () => {
    if (!currentMessage.value.trim()) return

    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(currentMessage.value)
        // 发送的消息会通过 WebSocket 回来，不需要手动添加到列表
        currentMessage.value = ''
    } else {
        console.log('连接未建立');
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
            </div>

            <!-- 滚动容器 -->
            <el-scrollbar class="message-list-scrollbar" ref="scrollbarRef">
                <!-- 动态消息列表 -->
                <div v-for="(msg, index) in messageList" :key="index"
                    :class="['message-row', `message-${getMessageType(msg.from)}`]">

                    <!-- 头像显示在上方 -->
                    <div class="avatar-wrapper">
                        <el-avatar class="avatar" :class="{ 'ai': msg.from === 'AI', 'system': msg.from === 'server' }"
                            size="default" :src="getMessageType(msg.from) === 'self' ? userInfo.info.userPic : ''">
                            {{ msg.from === 'server' ? '系' : (msg.from === 'AI' ? 'AI' : msg.from.charAt(0)) }}
                        </el-avatar>
                        <span class="user-name">{{ msg.from === 'server' ? '系统' : msg.from }}</span>
                    </div>

                    <!-- 消息气泡显示在下方 -->
                    <div class="bubble"
                        :class="{ 'ai': msg.from === 'AI', 'system': msg.from === 'server', 'self': getMessageType(msg.from) === 'self' }">
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
            </el-scrollbar>

            <div class="input-area">
                <el-input v-model="currentMessage" class="msg-input" type="textarea" placeholder="输入消息，支持 @指令 ……"
                    :autosize="{ minRows: 2, maxRows: 6 }" />
                <div class="input-actions">
                    <el-button type="primary" @click="sendMessage" @keyup.enter="sendMessage">发送</el-button>
                </div>
            </div>
        </div>
    </div>
</template>



<style lang="scss" scoped>
// 主题变量定义
:root {
    // 光亮模式
    --chat-bg: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    --chat-surface: rgba(255, 255, 255, 0.9);
    --chat-border: rgba(15, 23, 42, 0.12);
    --chat-text: #0f172a;
    --chat-text-secondary: #64748b;

    // AI消息
    --ai-bubble: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --ai-border: rgba(102, 126, 234, 0.3);
    --ai-text: #ffffff;
    --ai-glow: 0 8px 32px rgba(102, 126, 234, 0.3);

    // 自己的消息
    --self-bubble: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    --self-border: rgba(79, 172, 254, 0.3);
    --self-text: #ffffff;
    --self-glow: 0 8px 32px rgba(79, 172, 254, 0.3);

    // 其他用户消息
    --other-bubble: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
    --other-border: rgba(168, 237, 234, 0.3);
    --other-text: #0f172a;
    --other-glow: 0 8px 32px rgba(168, 237, 234, 0.2);

    // 系统消息
    --system-bubble: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
    --system-border: rgba(255, 236, 210, 0.3);
    --system-text: #0f172a;
    --system-glow: 0 8px 32px rgba(255, 236, 210, 0.2);
}

.dark {
    // 黑暗模式
    --chat-bg: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    --chat-surface: rgba(30, 41, 59, 0.95);
    --chat-border: rgba(148, 163, 184, 0.2);
    --chat-text: #f1f5f9;
    --chat-text-secondary: #94a3b8;

    // AI消息 - 紫色系
    --ai-bubble: linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%);
    --ai-border: rgba(139, 92, 246, 0.4);
    --ai-text: #ffffff;
    --ai-glow: 0 0 20px rgba(139, 92, 246, 0.4), 0 8px 32px rgba(139, 92, 246, 0.2);

    // 自己的消息 - 蓝色系
    --self-bubble: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    --self-border: rgba(59, 130, 246, 0.4);
    --self-text: #ffffff;
    --self-glow: 0 0 20px rgba(59, 130, 246, 0.3), 0 8px 32px rgba(59, 130, 246, 0.2);

    // 其他用户消息 - 青色系
    --other-bubble: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
    --other-border: rgba(6, 182, 212, 0.4);
    --other-text: #ffffff;
    --other-glow: 0 0 20px rgba(6, 182, 212, 0.3), 0 8px 32px rgba(6, 182, 212, 0.2);

    // 系统消息 - 橙色系
    --system-bubble: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    --system-border: rgba(245, 158, 11, 0.4);
    --system-text: #ffffff;
    --system-glow: 0 0 20px rgba(245, 158, 11, 0.3), 0 8px 32px rgba(245, 158, 11, 0.2);
}

.chat-room {
    height: 100vh;
    min-height: 600px;
    background: var(--chat-bg);
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
}

.chat-container {
    height: 100vh;
    min-height: 600px;
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
    overflow: auto;
    max-width: 100%;
    padding: 8px 0;

    :deep(.el-scrollbar__view) {
        padding: 0 12px;
        box-sizing: border-box;
        max-width: 100%;
        min-height: 200px;
    }

    :deep(.el-scrollbar__bar) {
        opacity: 0.3;
        border-radius: 6px;

        .el-scrollbar__thumb {
            background: var(--chat-text-secondary);
            border-radius: 6px;
        }
    }
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
}

.bubble.system {
    background: var(--system-bubble);
    border: 1px solid var(--system-border);
    color: var(--system-text);
    box-shadow: var(--system-glow);
}

// 其他用户消息样式
.message-other .bubble:not(.ai):not(.system) {
    background: var(--other-bubble);
    border: 1px solid var(--other-border);
    color: var(--other-text);
    box-shadow: var(--other-glow);
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
        border-top: 3px solid #4facfe;
        border-right: 3px solid #00f2fe;
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
            border-top: 2px solid rgba(79, 172, 254, 0.3);
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

.msg-input {
    flex: 1;

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
    gap: 8px;

    .el-button {
        border-radius: 12px;
        padding: 12px 24px;
        font-weight: 600;
        background: linear-gradient(135deg, var(--el-color-primary) 0%, #1d4ed8 100%);
        border: none;
        box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
        transition: all 0.3s ease;

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(64, 158, 255, 0.4);
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
        height: 100vh;
    }

    .chat-container {
        min-height: 300px;
        height: 100vh;
    }

    .connection-status {
        display: none; // 极小屏幕隐藏状态指示器以节省空间
    }

    .message-list-scrollbar {
        padding: 10px 0;

        :deep(.el-scrollbar__view) {
            padding: 0 16px;
        }
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
        height: 100vh;
        min-height: 500px;
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

        height: 100vh;
        min-height: 500px;
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
        padding: 8px 0;

        :deep(.el-scrollbar__wrap) {
            overflow-x: hidden !important;
        }

        :deep(.el-scrollbar__view) {
            padding: 0 8px;
        }
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
    }

    .input-area {
        padding: 12px;
        gap: 10px;

        .msg-input :deep(.el-textarea__inner) {
            border-radius: 14px;
            padding: 8px 12px;
        }

        .input-actions .el-button {
            padding: 8px 16px;
            border-radius: 10px;
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
.message-list-scrollbar :deep(.el-scrollbar__wrap),
.message-list-scrollbar :deep(.el-scrollbar__view),
.message-row,
.bubble,
.bubble .content {
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
    user-select: text;
}

// 黑暗模式样式增强
.dark {

    // 黑暗模式加载动画
    .chat-loading-state {
        .loading-spinner .spinner-ring {
            border-top-color: #8b5cf6;
            border-right-color: #a855f7;

            &::before {
                border-top-color: rgba(139, 92, 246, 0.4);
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
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);

        &:hover {
            box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
        }
    }

    // 黑暗模式下的头像炫酷增强
    .avatar-wrapper .avatar {
        &::before {
            background: linear-gradient(45deg,
                    rgba(255, 255, 255, 0.1),
                    rgba(59, 130, 246, 0.4),
                    rgba(139, 92, 246, 0.4),
                    rgba(255, 255, 255, 0.1));
        }

        &::after {
            background: radial-gradient(circle,
                    rgba(59, 130, 246, 0.3) 0%,
                    rgba(139, 92, 246, 0.2) 50%,
                    transparent 70%);
        }
    }

    .message-self {
        .avatar {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8) !important;
            box-shadow: 0 0 25px rgba(59, 130, 246, 0.5) !important;
            border: 2px solid rgba(59, 130, 246, 0.5) !important;

            &::before {
                background: linear-gradient(45deg,
                        rgba(59, 130, 246, 0.8),
                        rgba(29, 78, 216, 0.8),
                        rgba(59, 130, 246, 0.8)) !important;
            }

            &::after {
                background: radial-gradient(circle,
                        rgba(59, 130, 246, 0.4) 0%,
                        rgba(29, 78, 216, 0.3) 50%,
                        transparent 70%) !important;
            }
        }

        .user-name {
            color: rgba(255, 255, 255, 0.95) !important;
            text-shadow: 0 0 12px rgba(59, 130, 246, 0.5) !important;
        }
    }

    .message-ai {
        .avatar.ai {
            box-shadow: 0 0 25px rgba(139, 92, 246, 0.6) !important;

            &::before {
                opacity: 1 !important;
            }

            &::after {
                opacity: 1 !important;
            }
        }

        .user-name {
            color: #c084fc !important;
            text-shadow: 0 0 12px rgba(139, 92, 246, 0.4) !important;
        }
    }

    .message-system {
        .avatar.system {
            box-shadow: 0 0 25px rgba(245, 158, 11, 0.6) !important;
        }

        .user-name {
            color: #fbbf24 !important;
            text-shadow: 0 0 10px rgba(245, 158, 11, 0.4) !important;
        }
    }

    .message-other {
        .avatar:not(.ai):not(.system) {
            background: linear-gradient(135deg, #06b6d4, #0891b2) !important;
            box-shadow: 0 0 20px rgba(6, 182, 212, 0.5) !important;
            border: 2px solid rgba(6, 182, 212, 0.4) !important;
        }

        .user-name {
            color: #22d3ee !important;
            text-shadow: 0 0 8px rgba(6, 182, 212, 0.3) !important;
        }
    }
}
</style>
