# Jenkins 约定（Global Tool Node + Docker 部署权限）

本节与仓库根目录 [Jenkinsfile](../Jenkinsfile) 配套：**构建**在 Jenkins 执行节点用 **预装 Node**；**部署**阶段通过 **Docker** 对 Nginx 容器执行 `nginx -s reload`。

## 1. Node：使用全局工具（Global Tool Configuration）

1. **Manage Jenkins → Tools**（或 Global Tool Configuration）→ **NodeJS**。
2. 新增安装项：**名称**须与 Jenkinsfile 中一致，例如 `node22.19.0`（与项目 [.nvmrc](../.nvmrc)、[package.json](../package.json) `engines` 对齐）。
3. 使用 NodeJS 安装器拉取对应版本；首次使用该工具的 Job 会自动下载，之后复用。
4. 流水线中：

```groovy
tools {
    nodejs 'node22.19.0'
}
```

5. 构建步骤建议：`npm ci`（存在 `package-lock.json` 时）→ `npm run build:dev|build:staging|build:prod`。

**暂不使用**「在 `node:xx` Docker 镜像里跑 npm」作为构建环境；若日后多项目 Node 版本冲突严重，再考虑改为 Docker agent 构建。

## 2. Docker：赋予 Jenkins 执行部署命令的权限

部署阶段需要执行类似：

```bash
docker exec <nginx容器名> nginx -s reload
```

因此运行 Jenkins Job 的用户须能访问 Docker：

- 常见做法：将 `jenkins` 用户加入 **`docker` 组**，或 Jenkins 以容器运行时挂载 **`/var/run/docker.sock`**（按你的安装方式二选一）。
- **安全**：能操作 Docker 即具备较高主机权限，仅给可信任务使用，并保持 Jenkins 与插件更新。

## 3. 与 Jenkinsfile 中的变量对齐（由「各项目」在自己的 Jenkinsfile 中维护）

**不在 Jenkins 全局写死业务目录名**；每个仓库在 [Jenkinsfile](../Jenkinsfile) 的 `environment` 中定义：

| 变量 | 含义 |
|------|------|
| `nodejs '...'` | 与 Global Tool 中 Node 名称一致 |
| `HTML_ROOT` | Nginx 容器内静态根（与挂载到容器的 html 目录一致） |
| `PROJECT_SLUG` | 本项目在 URL/磁盘上的路径段（与 `NUXT_PUBLIC_BASE_URL` 中项目段一致，如 `static-demo`） |
| `SEGMENT_DEV` / `SEGMENT_STAGING` / `SEGMENT_PROD` | 各环境在 `PROJECT_SLUG` 下的子目录名（可按项目自定义） |
| `NGINX_CONTAINER` | `docker exec` 的目标容器名 |

部署阶段使用 **`mkdir -p "${HTML_ROOT}/${PROJECT_SLUG}/${SEGMENT}"`**，**无需**在服务器上手工创建项目子目录。

若 Jenkins 跑在 **Docker** 内而静态目录在 **宿主**，需挂载与 Nginx 相同的 html 卷，或让 Jenkins 跑在宿主上直接写卷。

## 4. GitHub 集成

- 安装 **GitHub** 相关插件；在 Job 中配置 **SCM** 指向 GitHub 仓库，使用 **GitHub Webhook** 触发。
- Webhook URL 为 **公网可达** 的 Jenkins 端点（经隧道/反代），详见 [01-external-services.md](01-external-services.md)。
