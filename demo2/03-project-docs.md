# 项目侧需提供的文档与交付物（与 demo2 母版一致）

## 1. 必备（仓库根目录）

| 文件 | 说明 |
|------|------|
| **`Jenkinsfile`** | 由 [Jenkinsfile.template](Jenkinsfile.template) 复制；逻辑一般不改，仅随母版升级。 |
| **`jenkins.properties`** | 由 [jenkins.properties.example](jenkins.properties.example) 复制；**部署与 Node 版本号集中在此定义一次**。 |
| **`Dockerfile`** | 由 [Dockerfile.example](Dockerfile.example) 复制；`ARG NODE_VERSION` 与 `jenkins.properties` 中 `NODE_VERSION` 一致。 |
| **`package.json` + lockfile** | `npm ci` 必需。 |
| **`.env.*`** | 构建期 `NUXT_PUBLIC_BASE_URL` 等与部署路径一致。 |

## 2. 建议（便于协作）

| 文件 | 说明 |
|------|------|
| **`.nvmrc`** | 与 `NODE_VERSION` 对齐，便于本地开发。 |
| **`README` 中一节 CI/CD** | 分支与环境映射、访问 URL 形态、指向 [demo2/README.md](README.md)。 |

## 3. 不必每个项目重复写的全局内容

- Jenkins 插件安装、`docker.sock` 挂载方式：写在 **个人运维笔记** 或 [01-jenkins.md](01-jenkins.md)。

## 4. Job 类型约定

- 统一使用 **Pipeline script from SCM**，脚本路径 **`Jenkinsfile`**，与 [01-jenkins.md](01-jenkins.md) 一致。
