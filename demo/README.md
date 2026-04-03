# Mac Docker 本地验证（demo）

在 Mac 上用 Docker 快速验证：**Jenkins 拉取 GitHub 代码 → Node 构建静态站 → 写入与 Nginx 共享的目录 → `docker exec` 重载 Nginx**。与 [guide/](../guide/) 中的主线方案一致，路径按本机共享卷简化。

## 目录说明

| 文件 | 说明 |
|------|------|
| [CHECKLIST.md](CHECKLIST.md) | 分步流程清单（建议按顺序勾选） |
| [docker-compose.yml](docker-compose.yml) | `demo-nginx`（8080）+ `demo-jenkins`（8081） |
| [Dockerfile.jenkins](Dockerfile.jenkins) | Jenkins + Docker CLI，便于 `docker exec` |
| [Jenkinsfile.example](Jenkinsfile.example) | 与 compose 中容器名、卷路径对齐的流水线示例 |
| [.env.example](.env.example) | `DEMO_STATIC_ROOT` 示例 |

## 共享卷路径（Mac 宿主）

默认与 `DEMO_STATIC_ROOT` 一致：

```text
/Users/ciel.zhang/Desktop/nginx-static
```

在容器内均挂载为：`/usr/share/nginx/html`  
静态访问路径由**各项目在自己的 Jenkinsfile** 中通过 `PROJECT_SLUG`、各环境 `SEGMENT_*` 决定，须与 `.env` 里 `NUXT_PUBLIC_BASE_URL` 一致；示例：<http://localhost:8080/static-demo/dev/>（首次部署成功一次后即可访问）。

**无需**在 Mac 上手工创建 `static-demo/dev` 等子目录：流水线在部署阶段会 **`mkdir -p`** 自动创建。

## 快速命令

```bash
mkdir -p /Users/ciel.zhang/Desktop/nginx-static
cd demo
cp .env.example .env
docker compose build && docker compose up -d
```

然后打开 [CHECKLIST.md](CHECKLIST.md) 完成 Jenkins 初始化与一次手动构建。

## 与仓库根 Jenkinsfile 的差异

- 根目录 [Jenkinsfile](../Jenkinsfile) 面向真实 NAS，请在该文件 **environment** 中修改 **`HTML_ROOT` / `PROJECT_SLUG` / `SEGMENT_*` / `NGINX_CONTAINER`**（均由**项目**维护，非 Jenkins 全局约定）。
- 本目录 [Jenkinsfile.example](Jenkinsfile.example) 固定 **`demo-nginx`** 与 **容器内** `HTML_ROOT`，与 `docker-compose.yml` 挂载一致。

## 安全说明

- `demo-jenkins` 使用 **root** 与 **docker.sock** 仅为本地验证方便；生产环境请收紧权限与网络。
