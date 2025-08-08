<script setup>
import { ChatDotRound } from '@element-plus/icons-vue'

import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
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
// 纯原生滚动容器引用
const scrollbarRef = ref(null)

// 获取当前用户昵称，用于判断消息归属
const currentUserName = computed(() => userInfo?.info?.nickname || '我')

// 判断消息类型的方法
const getMessageType = (from) => {
    if (from === 'server') return 'system'
    if (from === currentUserName.value) return 'self'
    return 'other'
}

//连接WebSocket
const connectWs = () => {
    ws = new WebSocket('ws://discordbot:8081/chat/' + userInfo.info.id);
    ws.onopen = () => {
        console.log('连接成功');
    }
    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data)
            messageList.value.push(message)
            // 新消息后滚动到底部
            nextTick(() => {
                if (scrollbarRef.value) {
                    const wrap = scrollbarRef.value.wrapRef
                    const scrollHeight = wrap.scrollHeight
                    scrollbarRef.value.setScrollTop(scrollHeight)
                }
            })
        } catch (error) {
            console.error('解析消息失败:', error)
        }
    }
    ws.onclose = () => {
        console.log('连接关闭');
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
                            <div class="content" v-html="msg.message"></div>
                        </div>
                    </template>

                    <!-- 自己的消息：头像在右边 -->
                    <template v-else>
                        <div class="bubble self">
                            <div class="meta">
                                <span class="name">{{ msg.from }}</span>
                            </div>
                            <div class="content">{{ msg.message }}</div>
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
}

.input-actions {
    display: flex;
    gap: 8px;
}
</style>