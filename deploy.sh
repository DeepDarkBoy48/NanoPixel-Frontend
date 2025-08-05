#!/bin/bash

# 部署脚本
echo "开始部署 RobinBlog 前端应用..."

# 停止并删除现有容器
echo "停止现有容器..."
docker-compose down

# 删除旧镜像（可选）
echo "删除旧镜像..."
docker rmi robinblog-robinblog:latest 2>/dev/null || true

# 构建新镜像
echo "构建新镜像..."
docker-compose build --no-cache

# 启动服务
echo "启动服务..."
docker-compose up -d

# 查看运行状态
echo "查看容器状态..."
docker-compose ps

echo "部署完成！访问 http://47.79.145.141 查看应用"