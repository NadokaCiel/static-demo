# 对外服务与端口（GitHub + NAS Jenkins）

前提：静态站点已通过 **隧道 + 域名** 访问 **Nginx**。在此基础上区分：**谁需要被公网访问（入站）**、**谁只主动出站**。

## 清单

| 用途 | 典型协议/端口 | 是否通常需要对公网暴露 | 说明 |
|------|----------------|------------------------|------|
| 访客访问静态站 | HTTPS 443（经 Nginx） | 是 | 隧道指向 Nginx；TLS 可在 Nginx 或隧道侧终止 |
| **GitHub Webhook → Jenkins** | HTTPS 443（POST 到 Jenkins 注册的 URL） | **是**（Webhook 路径） | GitHub 云端需能 **访问** 你配置的 Payload URL；经隧道/反代转到 NAS 上 Jenkins |
| 开发者日常 Git 操作 | HTTPS 443 / SSH 22（连 **GitHub**） | 走 GitHub 公网 | **无需** 为 NAS 开放 Git 服务；权威在 GitHub |
| Jenkins 管理界面（可选） | HTTPS 443 | 视策略 | 若仅内网管理 Jenkins，可不对公网开放 UI，**仅** 暴露 Webhook 路径（需 Nginx 精细拆分或插件） |
| 构建产物落盘 + `docker exec` reload | 本机写卷、Docker | 否 | 全在 NAS 内完成 |
| 外网手动跑一次构建 | 在 **GitHub** 点 Webhook 重试 / 或 **Jenkins** 内网访问 | 若 Jenkins 仅内网，则本地/VPN 打开 Jenkins | 或仍用 GitHub Actions 手动触发（若启用） |

## 结论

- **最小对外**：站点 **443** + **Jenkins Webhook 可达的 HTTPS 入口**（可与站点同域不同路径，或不同子域名，取决于你的 Nginx 反代配置）。
- **不打算**为「自建 Git 服务」开端口时，**不必**部署 Gitea 也能完成「GitHub + NAS 构建部署」。

---

## GitHub Webhook 如何到达 NAS 内的 Jenkins

方向是 **入站**：GitHub → 你的公网 URL → 隧道/反代 → Jenkins 插件提供的端点（如 GitHub 插件常见为 `/github-webhook/`）。  
NAS 若无公网 IP，必须依赖 **隧道/反代**，与「静态站如何对外」是同一类基础设施。
