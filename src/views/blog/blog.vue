<template>
    <div class="blog-page">
        <el-container>
            <el-main>
                <div class="page-header">
                    <h1>探索与发现</h1>
                    <p>在这里，我们分享见解、故事和最新的技术动态。</p>
                </div>
                <el-row :gutter="20">
                    <el-col :xs="24" :sm="12" :md="8" v-for="article in articles" :key="article.id">
                        <el-card class="article-card" shadow="hover">
                            <template #header>
                                <div class="card-header">
                                    <span>{{ article.category }}</span>
                                </div>
                            </template>
                            <div class="card-body">
                                <img :src="article.coverImg" class="article-image" alt="文章封面">
                                <h3 class="article-title">{{ article.title }}</h3>
                                <p class="article-summary">{{ article.summary }}</p>
                            </div>
                            <template #footer>
                                <div class="card-footer">
                                    <span>{{ article.createTime }}</span>
                                    <el-button type="primary" link>阅读全文</el-button>
                                </div>
                            </template>
                        </el-card>
                    </el-col>
                </el-row>
                <div class="pagination-container">
                    <el-pagination background layout="prev, pager, next" :total="50" />
                </div>
            </el-main>
        </el-container>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const articles = ref([
    {
        id: 1,
        title: '深入探索 Vue 3 的组合式 API',
        summary: '组合式 API 是 Vue 3 的一大特色，它为我们带来了更灵活、更强大的代码组织方式。本文将带你深入了解它的魅力所在。',
        coverImg: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
        category: '技术深潜',
        createTime: '2023-10-26'
    },
    {
        id: 2,
        title: 'UI 设计趋势：新拟态主义的崛起',
        summary: '新拟态（Neumorphism）风格以其柔和的界面和微妙的质感，正成为设计界的新宠。我们来一探究竟。',
        coverImg: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
        category: '设计美学',
        createTime: '2023-10-22'
    },
    {
        id: 3,
        title: '我的第一次远程工作经历分享',
        summary: '从办公室到家庭办公室，远程工作带来了自由，也带来了挑战。分享我的心路历程和高效工作的秘诀。',
        coverImg: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
        category: '生活方式',
        createTime: '2023-10-18'
    },
    {
        id: 4,
        title: '探索C语言的嵌入式系统开发',
        summary: 'C语言在嵌入式开发中扮演着至关重要的角色，本指南将帮助你开始你的第一个嵌入式项目。',
        coverImg: 'https://images.unsplash.com/photo-1555949963-ff98c8726715?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
        category: '嵌入式开发',
        createTime: '2023-10-15'
    },
    {
        id: 5,
        title: '高效后端架构：微服务与 Node.js',
        summary: '微服务架构如何通过 Node.js 实现高并发和可扩展性？本文将探讨最佳实践和常见模式。',
        coverImg: 'https://images.unsplash.com/photo-1542903660-eedba2cda473?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
        category: '后端架构',
        createTime: '2023-10-11'
    },
    {
        id: 6,
        title: '项目管理心得：敏捷开发的力量',
        summary: '敏捷不仅仅是一种方法论，更是一种文化。分享我们在团队中实践敏捷，并提升交付效率的经验。',
        coverImg: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60',
        category: '团队协作',
        createTime: '2023-10-07'
    }
]);
</script>

<style lang="scss" scoped>
.blog-page {
    background-color: #f4f5f7;
}

.page-header {
    text-align: center;
    padding: 40px 0;
    margin-bottom: 20px;

    h1 {
        font-size: 2.5rem;
        color: #333;
        margin-bottom: 10px;
    }

    p {
        font-size: 1.1rem;
        color: #666;
    }
}

.article-card {
    margin-bottom: 20px;
    border: none;
    border-radius: 10px;
    transition: transform 0.3s, box-shadow 0.3s;
    cursor: pointer;

    &:hover {
        transform: translateY(-5px);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    }

    .card-header {
        font-size: 0.9rem;
        color: #999;
    }

    .card-body {
        padding: 0;
    }

    .article-image {
        width: 100%;
        height: 200px;
        object-fit: cover;
    }

    .article-title {
        font-size: 1.25rem;
        margin: 15px 20px 10px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .article-summary {
        font-size: 0.95rem;
        color: #666;
        margin: 0 20px 20px;
        line-height: 1.6;
        height: 55px;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
    }

    .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.9rem;
        color: #999;
    }
}

.pagination-container {
    display: flex;
    justify-content: center;
    padding: 30px 0;
}
</style>