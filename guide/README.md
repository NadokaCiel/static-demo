# 个人微型 CI/CD 知识库（与 static-demo 配套）

本目录描述 **以 GitHub 为权威源**、在 **NAS 上完成构建与部署**、对外通过 **Nginx（隧道 + 域名）** 访问静态站点的约定。**主线方案为：GitHub Webhook → NAS 上的 Jenkins**；仓库内保留的 **GitHub Actions** 可作为云端构建的备选参考。

## 目录

| 文档 | 说明 |
|------|------|
| [01-对外服务与端口](01-external-services.md) | 站点、Jenkins Webhook、Git 访问各自需要哪些入站/出站 |
| [02-CI 触发方式](02-ci-triggers.md) | GitHub Webhook、Jenkins 手动重建、与 GitHub Actions 的取舍 |
| [03-GitHub 与 Jenkins 在 NAS 上的架构](03-github-jenkins-nas.md) | 数据流、为何不必再建 Gitea 镜像、Nginx 与 Docker |
| [04-路径部署与子域名](04-path-deployment.md) | `a.com/project/env` 与框架 `baseURL`、替代方案 |
| [05-Jenkins 约定](05-jenkins-conventions.md) | Global Tool 安装 Node、`docker exec` 权限、与 [Jenkinsfile](../Jenkinsfile) 的对应关系 |
| [06-static-demo 项目与流水线](06-static-demo-cicd.md) | 构建命令、分支与环境、可选 GitHub Actions、与 Jenkins 对齐要点 |

## 与本仓库的关系

- **Mac Docker 本地验证**（共享卷、compose、清单）：[demo/README.md](../demo/README.md)。
- 应用侧：[Nuxt 3 静态站](../)、按环境 [`.env.*`](../.env.development)、[`nuxt.config.ts`](../nuxt.config.ts) 中 `app.baseURL`。
- CI 侧：**推荐** 在 NAS 部署 Jenkins，使用仓库根目录 [Jenkinsfile](../Jenkinsfile)；GitHub 仓库设置 Webhook 指向 Jenkins 提供的 **公网可达的** URL（经隧道/反代）。
- 备选：[`.github/workflows/nuxt-static-deploy.yml`](../.github/workflows/nuxt-static-deploy.yml) 在 **GitHub 托管 Runner** 上构建，再通过 SSH 部署到 NAS（与「构建在 NAS」主线不同，见 [06](06-static-demo-cicd.md)）。
