# Node 版本号由构建参数 NODE_VERSION 注入（与 jenkins.properties 中 NODE_VERSION 一致，实现「一处定义」）
# 官方镜像索引：https://hub.docker.com/_/node

ARG NODE_VERSION=22.19.0
FROM node:${NODE_VERSION}-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG NPM_SCRIPT=build:prod
RUN npm run ${NPM_SCRIPT}
