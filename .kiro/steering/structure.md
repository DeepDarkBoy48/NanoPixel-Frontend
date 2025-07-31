# 项目结构

## 目录组织

```
robinblog/
├── public/                 # 静态资源目录
├── src/                    # 源代码目录
│   ├── assets/            # 静态资源（图片、样式等）
│   │   ├── *.jpg          # 图片资源
│   │   ├── *.png          # 图标资源
│   │   └── main.scss      # 全局样式
│   ├── components/        # 可复用组件
│   ├── utils/             # 工具函数
│   │   ├── format.js      # 格式化工具
│   │   └── request.js     # HTTP 请求封装
│   ├── views/             # 页面组件
│   │   └── login.vue      # 登录页面
│   ├── App.vue            # 根组件
│   └── main.js            # 应用入口
├── .kiro/                 # Kiro 配置目录
├── dist/                  # 构建输出目录
├── node_modules/          # 依赖包
├── index.html             # HTML 模板
├── package.json           # 项目配置
├── vite.config.js         # Vite 配置
└── jsconfig.json          # JavaScript 配置
```

## 文件命名规范

### Vue 组件
- **页面组件**: 小写 + `.vue` (如: `login.vue`)
- **通用组件**: PascalCase + `.vue` (如: `UserCard.vue`)
- **组件文件**: 放置在对应目录下

### JavaScript 文件
- **工具函数**: 小写 + `.js` (如: `request.js`, `format.js`)
- **配置文件**: 小写 + `.config.js` (如: `vite.config.js`)

### 样式文件
- **全局样式**: `main.scss`
- **组件样式**: 使用 `<style scoped>` 或 `<style lang="scss" scoped>`

## 架构模式

### 组件组织
- **views/**: 页面级组件，对应路由
- **components/**: 可复用的通用组件
- **utils/**: 工具函数和辅助方法

### 状态管理
- 目前使用 Vue 3 Composition API 的 `ref` 和 `reactive`
- 组件间通信通过 props 和 emit

### 样式架构
- 全局样式定义在 `src/assets/main.scss`
- 组件样式使用 scoped 避免污染
- 支持 SCSS 预处理器语法

### API 请求
- 统一使用 `src/utils/request.js` 封装的 axios 实例
- 基础 URL 配置为 `http://localhost:8080`
- 包含响应拦截器处理错误

## 开发约定

### 导入顺序
1. Vue 相关导入
2. 第三方库导入
3. 本地组件导入
4. 工具函数导入

### 组件结构
```vue
<script setup>
// 导入
// 响应式数据
// 计算属性
// 方法
// 生命周期
</script>

<template>
<!-- 模板内容 -->
</template>

<style lang="scss" scoped>
/* 组件样式 */
</style>
```