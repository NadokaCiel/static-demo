# CI/CD 触发方式（主线：Jenkins on NAS）

## 推荐主线：GitHub Webhook → Jenkins

| 方式 | 适用场景 | 说明 |
|------|----------|------|
| **Push 自动** | 推送到 `develop` / `stg` / `main` 后自动构建部署 | 在 GitHub 仓库 **Webhooks** 中配置 Payload URL，指向 Jenkins 上 **GitHub 插件** 提供的地址；推送事件触发 Multibranch Pipeline 或 Pipeline Job |
| **Jenkins 内手动** | 重跑、指定参数 | 在 Jenkins 界面 **Build with Parameters**（与 [Jenkinsfile](../Jenkinsfile) 中 `TARGET_ENV` 等） |
| **GitHub 上 Redeliver** | 补触发一次 | 在仓库 Webhook 最近交付记录里 **Redeliver**（仍走同一 HTTPS 入口） |

构建与部署均在 **NAS 上的 Jenkins** 执行，**无需** Gitea 镜像同步。

## 备选：GitHub Actions（云端构建）

本仓库 [`.github/workflows/nuxt-static-deploy.yml`](../.github/workflows/nuxt-static-deploy.yml) 在 **GitHub 托管 Runner** 上执行 `npm ci` / `nuxt generate`，再通过 **SSH/rsync** 把产物推到 NAS。

| 维度 | Jenkins on NAS | GitHub Actions |
|------|----------------|----------------|
| 构建位置 | NAS | GitHub 云端 |
| 触发 | Webhook → Jenkins | `on.push` / `workflow_dispatch` |
| 依赖 | Jenkins + Node + 隧道暴露 Webhook | Secrets（SSH）+ 能连 NAS |

**建议**：若以「构建在 NAS、依赖与缓存本地化」为主，**主线用 Jenkins**；GitHub Actions 可作备份或过渡期方案。**不要**让同一 push 同时触发两套流水线，除非刻意设计去重。

---

## 与「权威在 GitHub」的配合

- 所有提交、PR、分支保护在 **GitHub** 完成。
- Jenkins **只从 GitHub clone**（凭据用 Jenkins 凭据管理中的 GitHub PAT/SSH），不在 NAS 维护第二套 Git 服务。
