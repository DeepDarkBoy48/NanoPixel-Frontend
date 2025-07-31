# 技术栈

## 构建系统
- **构建工具**: Vite 7.0.0
- **包管理器**: npm
- **模块系统**: ES Modules

## 前端框架
- **Vue**: 3.5.17 (Composition API)
- **UI 组件库**: Element Plus 2.10.3
- **HTTP 客户端**: Axios 1.10.0

## 样式处理
- **CSS 预处理器**: Sass 1.89.2
- **CSS 框架**: Tailwind CSS 4.1.11
- **PostCSS**: 8.5.6 + Autoprefixer 10.4.21

## 开发工具
- **Vue 开发工具**: @vitejs/plugin-vue 6.0.0
- **调试工具**: vite-plugin-vue-devtools 7.7.7

## 常用命令

### 开发环境
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 项目配置
- **路径别名**: `@` 指向 `src` 目录
- **开发服务器**: 默认端口由 Vite 自动分配
- **后端 API**: 默认指向 `http://localhost:8080`

## 代码规范
- 使用 ES6+ 语法
- Vue 3 Composition API 优先
- 组件采用 `<script setup>` 语法
- 样式使用 SCSS 预处理器