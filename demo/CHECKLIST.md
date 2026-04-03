# Mac Docker 可行性验证：流程清单

共享卷（宿主）：`/Users/ciel.zhang/Desktop/nginx-static`（可通过 `demo/.env` 中的 `DEMO_STATIC_ROOT` 修改）。

## 一、准备工作

- [ ] 安装 **Docker Desktop for Mac**（或等价运行时），能执行 `docker` / `docker compose`。
- [ ] 为 Docker 分配足够内存（建议 ≥ 4GB）。
- [ ] 确保共享卷**根目录**存在（`项目名/环境` 子目录**不必**手工创建，由项目 [Jenkinsfile.example](Jenkinsfile.example) 部署阶段 `mkdir -p` 兜底）：

  ```bash
  mkdir -p /Users/ciel.zhang/Desktop/nginx-static
  ```

- [ ] 在 `demo/` 下复制环境文件：

  ```bash
  cd demo
  cp .env.example .env
  # 若路径不同，编辑 .env 中的 DEMO_STATIC_ROOT
  ```

- [ ]（可选）GitHub 测试仓库：用于 Jenkins 从公网 clone；需 **PAT** 或 SSH 密钥，在 Jenkins 凭据中配置。

## 二、启动容器

```bash
cd demo
docker compose build
docker compose up -d
```

- Nginx：<http://localhost:8080>（应能看到目录下已有文件或 403/空目录）。
- Jenkins：<http://localhost:8081>，首次启动在日志中查看 **初始管理员密码**：

  ```bash
  docker logs demo-jenkins 2>&1 | head -80
  ```

## 三、Jenkins 首次配置

- [ ] 安装推荐插件（或自定义安装 **Pipeline**、**Git**）。
- [ ] **Manage Jenkins → Tools → NodeJS**：新增安装器，**名称**与 [Jenkinsfile.example](Jenkinsfile.example) 中 `nodejs 'node22.19.0'` 一致（可按需改名并同步修改示例文件）。
- [ ] **凭据**：添加 GitHub 访问方式（Username+Password(PAT) 或 SSH）。
- [ ] 新建 **Pipeline** 任务：SCM 指向本仓库或 fork，脚本路径使用仓库根目录 `Jenkinsfile`，或粘贴 `Jenkinsfile.example` 内容并调整 `checkout` 为你的仓库。

## 四、验证「构建 → 写卷 → reload」

- [ ] 手动 **Build with Parameters**，`TARGET_ENV` 选 `dev`（或与分支对应）。
- [ ] 构建成功后检查宿主目录是否出现产物：

  `/Users/ciel.zhang/Desktop/nginx-static/static-demo/dev/`

- [ ] 浏览器访问：<http://localhost:8080/static-demo/dev/>（需与 Nuxt `NUXT_PUBLIC_BASE_URL` 一致）。

## 五、（可选）GitHub Webhook

- [ ] 使用 **ngrok** / **Cloudflare Tunnel** 等将 `http://localhost:8081` 暴露为 **HTTPS 公网 URL**。
- [ ] 在 GitHub 仓库 **Webhooks** 中填写 Jenkins GitHub 插件提供的 Payload URL（路径常为 `/github-webhook/`）。
- [ ] 先用手动构建跑通，再加 Webhook，便于排错。

## 六、收尾

```bash
cd demo
docker compose down
# 如需删除 Jenkins 数据卷：先 docker volume ls 查找包含 jenkins_home 的卷名，再 docker volume rm <卷名>
```

---

## 常见问题

| 现象 | 可能原因 |
|------|----------|
| Jenkins 内 `docker exec` 失败 | 未挂载 `docker.sock` 或容器内无 `docker` 命令（本 demo 镜像已装 CLI） |
| 产物未出现在宿主目录 | `DEMO_STATIC_ROOT` 与 mkdir 路径不一致，或 Jenkins 未挂载同一卷 |
| Node 找不到 | 未在 Global Tool 中配置与 Jenkinsfile 同名的 NodeJS |
| 页面 404 | `NUXT_PUBLIC_BASE_URL` 与访问路径不一致，或子目录未生成 `index.html` |
