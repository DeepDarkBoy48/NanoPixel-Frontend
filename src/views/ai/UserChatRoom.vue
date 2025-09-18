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
// 加载状态：初始化阶段显示加载动画
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
            messageList.value.push(message)
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
        // 连接关闭时，清除心跳
        clearInterval(heartbeatInterval);
        heartbeatInterval = null
        ws = null
        isInitializing.value = false
    }
    ws.onerror = (error) => {
        console.log(error);
        isInitializing.value = false
    }
}

// 在组件挂载时连接
onMounted(() => {
    if (userInfo.info.id) {
        connectWs()
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
    // 确保定时器被清除
    clearInterval(heartbeatInterval);
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
        <el-card class="chat-card" shadow="never">
            <template #header>
                <div class="card-header">
                    <div class="title">
                        <el-icon class="title-icon">
                            <ChatDotRound />
                        </el-icon>
                        <span>聊天室</span>
                    </div>
                    <div class="actions">
                        <el-tag :type="isInitializing ? 'warning' : 'success'" effect="plain">
                            {{ isInitializing ? '连接中' : '已连接' }}
                        </el-tag>
                    </div>
                </div>
            </template>

            <div v-if="isInitializing" class="loading-overlay">
                <div class="loading-spinner"></div>
                <div class="loading-text">聊天加载中...</div>
            </div>

            <!-- 滚动容器 -->
            <el-scrollbar class="message-list-scrollbar" ref="scrollbarRef">
                <!-- 动态消息列表 -->
                <div v-for="(msg, index) in messageList" :key="index"
                    :class="['message-row', `message-${getMessageType(msg.from)}`]">

                    <!-- 其他人和系统消息：头像在左边 -->
                    <template v-if="getMessageType(msg.from) !== 'self'">
                        <el-avatar class="avatar" :class="{ 'ai': msg.from === 'AI', 'system': msg.from === 'server' }"
                            size="default">
                            {{ msg.from === 'server' ? '系' : (msg.from === 'AI' ? 'AI' : msg.from.charAt(0)) }}
                        </el-avatar>
                        <div class="bubble" :class="{ 'ai': msg.from === 'AI', 'system': msg.from === 'server' }">
                            <div class="meta">
                                <span class="name">{{ msg.from === 'server' ? '系统' : msg.from }}</span>
                            </div>
                            <div class="content" v-html="renderMessageHtml(msg)"></div>
                        </div>
                    </template>

                    <!-- 自己的消息：头像在右边 -->
                    <template v-else>
                        <div class="bubble self">
                            <div class="meta">
                                <span class="name">{{ msg.from }}</span>
                            </div>
                            <div class="content" v-html="renderMessageHtml(msg)"></div>
                        </div>
                        <el-avatar class="avatar" size="default" :src="userInfo.info.userPic">
                            {{ msg.from.charAt(0) }}
                        </el-avatar>
                    </template>
                </div>

                <!-- 空状态 -->
                <div v-if="messageList.length === 0" class="empty-state">
                    <p>暂无消息，开始聊天吧～</p>
                </div>
            </el-scrollbar>

            <div class="input-area">
                <el-input v-model="currentMessage" class="msg-input" type="textarea" placeholder="输入消息，支持 @指令 ……"
                    :autosize="{ minRows: 2, maxRows: 6 }" />
                <div class="input-actions">
                    <el-button type="primary" @click="sendMessage" @keyup.enter="sendMessage">发送</el-button>
                </div>
            </div>
        </el-card>
    </div>
</template>



<style lang="scss" scoped>
.chat-room {
    height: 100%;
    padding: 12px;
    box-sizing: border-box;
    display: flex;
}

.chat-card {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;

    /* 去掉默认 body 内边距，并让其参与弹性布局 */
    :deep(.el-card__body) {
        padding: 0;
        display: flex;
        flex: 1;
        flex-direction: column;
        min-height: 0;
        /* 关键：允许子元素按可用空间收缩，从而让滚动生效 */
    }
}

.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 2px;

    .title {
        display: flex;
        align-items: center;
        font-weight: 600;
        font-size: 16px;

        .title-icon {
            margin-right: 8px;
            color: var(--el-color-primary);
        }
    }
}

.message-list-scrollbar {
    flex: 1;
    overflow: auto;
    max-width: 100%;

    :deep(.el-scrollbar__view) {
        padding: 16px;
        box-sizing: border-box;
        max-width: 100%;
    }
}

.message-row {
    display: flex;
    align-items: flex-end;
    margin-bottom: 14px;
    width: 100%;

    .avatar {
        margin: 0 10px;
    }
}

.message-other {
    justify-content: flex-start;
}

.message-self {
    justify-content: flex-end;
}

.message-ai {
    justify-content: flex-start;

    .avatar.ai {
        background: var(--el-color-primary);
        color: #fff;
    }
}

.message-system {
    justify-content: flex-start;

    .avatar.system {
        background: var(--el-color-warning);
        color: #fff;
    }
}


.bubble {
    max-width: 55%;
    background: #1f2937;
    border: 1px solid rgba(148, 163, 184, 0.35);
    border-radius: 12px;
    padding: 10px 12px;
    box-shadow: 0 4px 18px rgba(15, 23, 42, 0.18);
    word-break: break-word;
    color: #fff;

    .meta {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin-bottom: 6px;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);

        .name {
            font-weight: 600;
            color: #fff;
        }
    }

    .content {
        line-height: 1.6;
        word-break: break-word;
        color: inherit;
    }
}

.bubble.self {
    background: #1d4ed8;
    border-color: rgba(59, 130, 246, 0.65);
}

.bubble.ai {
    background: #334155;
    border-color: rgba(148, 163, 184, 0.45);
}

.bubble.system {
    background: #4b5563;
    border-color: rgba(209, 213, 219, 0.4);
}

.empty-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--el-text-color-secondary);

    p {
        margin: 0;
        font-size: 14px;
    }
}

.input-area {
    border-top: 1px solid var(--el-border-color);
    padding: 12px;
    display: flex;
    gap: 12px;
    align-items: flex-end;
    box-sizing: border-box;
}

.msg-input {
    flex: 1;

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
}

.loading-overlay {
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.85);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 10;
    backdrop-filter: blur(2px);
}

.loading-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(64, 158, 255, 0.2);
    border-top-color: var(--el-color-primary);
    border-radius: 50%;
    animation: chat-spinner 0.9s linear infinite;
}

.loading-text {
    margin-top: 12px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
}

@keyframes chat-spinner {
    to {
        transform: rotate(360deg);
    }
}

@media (max-width: 768px) {
    .chat-room {
        padding: 0;
        overflow-x: hidden;
    }

    .chat-card {
        border: none;
        border-radius: 0;

        :deep(.el-card__header) {
            display: none;
        }
    }

    .message-list-scrollbar {
        :deep(.el-scrollbar__wrap) {
            overflow-x: hidden !important;
        }

        :deep(.el-scrollbar__view) {
            padding: 12px 8px;
        }
    }

    .message-row {
        flex-direction: column;
        width: 100%;

        .bubble {
            max-width: 100%;
        }

        .avatar {
            margin: 0 0 8px 0;
        }

        &.message-self {
            flex-direction: column-reverse;
            align-items: flex-end;
        }

        &.message-other,
        &.message-system,
        &.message-ai {
            align-items: flex-start;
        }
    }
}

:global(.dark) .chat-room {
    .chat-card {
        background: color-mix(in srgb, var(--app-surface) 92%, #000 8%);
    }

    .bubble {
        background: rgba(42, 54, 75, 0.88);
        border-color: rgba(112, 136, 176, 0.45);
        color: rgba(255, 255, 255, 0.88);
        box-shadow: 0 8px 22px rgba(0, 0, 0, 0.32);

        .meta {
            color: rgba(255, 255, 255, 0.6);

            .name {
                color: rgba(255, 255, 255, 0.88);
            }
        }
    }

    .bubble.self {
        background: rgba(70, 124, 214, 0.9);
        border-color: rgba(123, 172, 255, 0.55);
    }

    .bubble.ai {
        background: rgba(42, 54, 75, 0.88);
        border-color: rgba(112, 136, 176, 0.45);
    }

    .bubble.system {
        background: rgba(42, 54, 75, 0.88);
        border-color: rgba(112, 136, 176, 0.45);
    }

    .input-area {
        border-top-color: rgba(255, 255, 255, 0.12);
        background: rgba(255, 255, 255, 0.02);
    }
}
</style>
