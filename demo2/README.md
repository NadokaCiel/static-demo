# demo2：母版 Jenkins + 项目 Dockerfile 指定 Node 的方案说明

本目录描述一套 **NAS/本机构建** 下可维护的静态前端部署方式：

- **Job 类型**：统一为 **Pipeline script from SCM**（详见 [01-jenkins.md](01-jenkins.md)）。
- **母版 Jenkinsfile**：各项目复制 [Jenkinsfile.template](Jenkinsfile.template) 为 `Jenkinsfile`；变量集中在 **`jenkins.properties`**（见 [jenkins.properties.example](jenkins.properties.example)），做到 **项目维度只维护一份键值**。
- **Node 版本**：**不在 Jenkins Global Tool 维护**；`jenkins.properties` 中 `NODE_VERSION` → `docker build --build-arg` → **Dockerfile** 中 `FROM node:${NODE_VERSION}`；详见 [02-node-images.md](02-node-images.md)。

## 三个维度（文档入口）

| 维度 | 文档 |
|------|------|
| Jenkins 如何配置与使用 | [01-jenkins.md](01-jenkins.md) |
| Node 镜像如何管理（拉取、存储、使用） | [02-node-images.md](02-node-images.md) |
| 项目侧需提供哪些文档/约定 | [03-project-docs.md](03-project-docs.md) |

## 仓库内示例文件

| 文件 | 说明 |
|------|------|
| [Jenkinsfile.template](Jenkinsfile.template) | 母版流水线：检出后读 `jenkins.properties` → `docker build` + `docker cp` → 部署 |
| [jenkins.properties.example](jenkins.properties.example) | 部署路径、Nginx 容器名、`NODE_VERSION`、镜像名前缀等 **单处配置** |
| [Dockerfile.example](Dockerfile.example) | `ARG NODE_VERSION` + `npm ci` + `npm run` |

## 与 `demo/` 的差异

| 项 | demo/（Mac 验证） | demo2（本方案） |
|----|-------------------|-----------------|
| Node 从哪来 | Jenkins Global Tool `nodejs` | **项目 Dockerfile `FROM node:`** |
| 构建在哪执行 | Jenkins agent 直接 `npm` | **`docker build` 在 Dockerfile 内构建** |
| 依赖 | agent 装 Node | agent 需 **Docker CLI + 权限**（如 `docker.sock`） |

将 [Jenkinsfile.template](Jenkinsfile.template) 复制为 `Jenkinsfile`，将 [jenkins.properties.example](jenkins.properties.example) 复制为 `jenkins.properties` 并按项目填写；再准备 [Dockerfile.example](Dockerfile.example) 命名的 `Dockerfile`。
