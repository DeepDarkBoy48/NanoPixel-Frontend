# 构建阶段 (builder stage)
FROM node:18 AS builder

# 设置工作目录
WORKDIR /vue

# 复制 package.json 和 package-lock.json (或 yarn.lock)
COPY . .

# 安装依赖
RUN npm install

# 构建项目
RUN npm run build

# 运行阶段 (runner stage)
FROM nginx:alpine

# 删除默认的 html 文件
RUN rm -rf /usr/share/nginx/html/*

# 从 builder 阶段复制构建产物到 Nginx 目录
COPY --from=builder /vue/dist /usr/share/nginx/html

# 复制 Nginx 配置文件 (可选，如果需要自定义 Nginx 配置)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露 80 端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]