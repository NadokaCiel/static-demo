# static-demo：构建约定与两种 CI 方式

## 构建与产物（与 CI 实现无关）

- **框架**：Nuxt 3，`nitro.preset: static`，产物目录为 **`.output/public`**。
- **按环境构建**（见 [package.json](../package.json)）：
  - `npm run build:dev` → [.env.development](../.env.development)
  - `npm run build:staging` → [.env.staging](../.env.staging)
  - `npm run build:prod` → [.env.production](../.env.production)
- **子路径**：各环境通过 `NUXT_PUBLIC_BASE_URL` 设置（如 `/static-demo/dev/`），与 [nuxt.config.ts](../nuxt.config.ts) 中 `app.baseURL` 一致。

## 方式 A（推荐）：NAS 上 Jenkins + GitHub Webhook

- 流水线定义：[Jenkinsfile](../Jenkinsfile)（部署路径由该文件中的 `HTML_ROOT`、`PROJECT_SLUG`、`SEGMENT_*` 决定，与 `.env` 中 `NUXT_PUBLIC_BASE_URL` 对齐；目录不存在时由流水线 `mkdir -p` 创建）。
- **分支与 `TARGET_ENV=auto` 映射**：`develop` → dev，`stg` → staging，`main` → production（与 Jenkinsfile 内逻辑一致）。
- **部署**：将 `.output/public` 复制到 `${HTML_ROOT}/${PROJECT_SLUG}/${SEGMENT}`，并 `docker exec $NGINX_CONTAINER nginx -s reload`。
- **前置条件**：[Jenkins 约定](05-jenkins-conventions.md)、[对外服务](01-external-services.md)、[架构说明](03-github-jenkins-nas.md)。

## 方式 B（备选）：GitHub Actions 云端构建 + SSH 部署 NAS

- Workflow：[`.github/workflows/nuxt-static-deploy.yml`](../.github/workflows/nuxt-static-deploy.yml)。
- **触发**：push 到 `develop` / `stg` / `main`；或 `workflow_dispatch` 可选 `target_env`。
- **部署**：rsync 到远端 `MOUNT_PATH/static-demo/{dev|staging|prod}/`，再 SSH 执行 `docker exec nginx nginx -s reload`。
- **Secrets**：`DEPLOY_SSH_HOST`、`DEPLOY_SSH_USER`、`DEPLOY_SSH_KEY`、可选 `DEPLOY_SSH_PORT`。
- **说明**：构建发生在 **GitHub 托管 Runner**，不在 NAS；与「构建在 NAS」主线不同，**勿与 Jenkins 对同一分支重复触发** unless intentional。

## 访问 URL（示例）

在 Nginx `root` 指向挂载的 `html` 且与 `NUXT_PUBLIC_BASE_URL` 一致时：

- `https://你的域名/static-demo/dev/`
- `https://你的域名/static-demo/staging/`
- `https://你的域名/static-demo/prod/`

## 与 guide 主线的关系

当前知识库以 **方式 A（Jenkins）** 为主线；方式 B 保留为参考实现，便于对比或过渡。
