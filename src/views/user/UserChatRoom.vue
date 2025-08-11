<script setup>
import { ChatDotRound } from '@element-plus/icons-vue'

import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'
// 导入用户信息存储
import useUserInfoStore from '@/store/userInfo'
//用于储存消息列表
const messageList = ref([])
//用于储存当前输入的消息
const currentMessage = ref('')
//用于储存用户信息
const userInfo = useUserInfoStore();
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

// Markdown 渲染器，配置 highlight.js
const markdown = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: true,
    highlight: function (str, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return '<pre class="hljs"><code>' +
                    hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                    '</code></pre>';
            } catch (__) { }
        }

        return '<pre class="hljs"><code>' + markdown.utils.escapeHtml(str) + '</code></pre>';
    }
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

    // 本地开发环境，直接连接后端
    // const wsUrl = `ws://localhost:8081/chat/${userInfo.info.id}`;

    // 生产环境，部署时取消下面的注释，并注释掉上面的本地开发配置
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host;
    const wsUrl = `${protocol}://${host}/chat/${userInfo.info.id}`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('连接成功');
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
    }
    ws.onerror = (error) => {
        console.log(error);
    }
}

// 在组件挂载时连接
onMounted(() => {
    if (userInfo.info.id) {
        connectWs()
    }
})

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
                        <el-tag type="success" effect="plain">已连接</el-tag>
                    </div>
                </div>
            </template>

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
                    <el-button type="primary" @click="sendMessage">发送</el-button>
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
    /* 新增：允许内容溢出时滚动 */

    :deep(.el-scrollbar__view) {
        padding: 16px;
        box-sizing: border-box;
    }
}

.message-row {
    display: flex;
    align-items: flex-end;
    margin-bottom: 14px;

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
    background: #fff;
    border: 1px solid var(--el-border-color);
    border-radius: 12px;
    padding: 10px 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);

    .meta {
        display: flex;
        align-items: baseline;
        gap: 8px;
        margin-bottom: 6px;
        font-size: 12px;
        color: var(--el-text-color-secondary);

        .name {
            font-weight: 600;
            color: var(--el-text-color-primary);
        }
    }

    .content {
        line-height: 1.6;
        word-break: break-word;
    }
}

.bubble.self {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-7);
}

.bubble.ai {
    background: #f6ffed;
    border-color: #b7eb8f;
}

.bubble.system {
    background: #fff7e6;
    border-color: #ffd591;
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

@media (max-width: 768px) {
    .chat-room {
        padding: 0;
    }

    .chat-card {
        border: none;
        border-radius: 0;

        :deep(.el-card__header) {
            display: none;
        }
    }

    .message-list-scrollbar {
        :deep(.el-scrollbar__view) {
            padding: 12px 8px;
        }
    }

    .message-row {
        flex-direction: column;

        .bubble {
            max-width: 95%;
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
</style>