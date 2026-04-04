# Jenkins：配置与使用（NAS + Docker 内 Jenkins）

本文约定：**仅使用「Pipeline script from SCM」**；构建用 **项目 Dockerfile**；部署变量集中在 **`jenkins.properties`**（与 [Jenkinsfile.template](Jenkinsfile.template) 配套）。

---

## 1. Job 类型：Pipeline script from SCM

1. Jenkins 首页 → **新建任务** → 选择 **流水线（Pipeline）**。
2. 在 **流水线** 区域：
   - **定义**：选择 **Pipeline script from SCM**。
   - **SCM**：选 **Git**（或 GitHub）。
   - **Repository URL**：填写仓库地址（HTTPS 或 SSH）。
   - **Credentials**：选择已配置的凭据（见第 5 节）。
   - **分支**：如 `*/main` 或 `*/develop`。
   - **脚本路径**：填 **`Jenkinsfile`**（与仓库根目录文件名一致）。

这样 **Jenkinsfile 与 jenkins.properties 随代码版本管理**，无需在 Jenkins UI 里重复填变量。

---

## 2. Docker 内的 Jenkins：如何获得「操作 Docker」的权限

流水线需要执行：`docker build`、`docker create`、`docker cp`、`docker exec`（对 Nginx 容器 reload）。因此 **Jenkins 进程所在环境** 必须能调用本机 Docker 守护进程。

### 2.1 推荐做法：挂载 Docker 套接字（最常见）

在 **运行 Jenkins 的 `docker-compose.yml`**（或 `docker run`）中增加：

```yaml
services:
  jenkins:
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
```

含义：Jenkins 容器内的 `docker` 客户端通过 **与宿主机同一个 socket** 与 **宿主机上的 Docker 守护进程** 通信，从而可以：

- 在宿主机上创建构建用容器/镜像；
- 对宿主机上的其它容器执行 `docker exec`（如 `nginx`）。

**注意**：能访问 socket 的进程 **等价于高权限**，务必只给可信环境；镜像内需安装 **Docker CLI**（`docker` 可执行文件），与 [demo/Dockerfile.jenkins](../demo/Dockerfile.jenkins) 思路一致。

### 2.2 用户与权限（Linux / NAS 常见）

- 套接字文件通常属 **`root:docker`** 或类似组。
- 若 Jenkins 进程以 **非 root** 运行，需将运行用户加入 **docker 组**，或调整 socket 权限（不推荐放宽过大）。
- **Docker Desktop（Mac）**：对 socket 的权限规则与 Linux 不同，一般挂载后即可用；仍建议在 Jenkins 镜像内安装 `docker` CLI。

### 2.3 不推荐但可了解：/var/run/docker.sock 的风险

任何能使用该 socket 的容器内进程，理论上可创建特权容器、挂载宿主机目录等。**个人 NAS** 若仅内网访问，风险可控，但仍建议：

- Jenkins 与插件及时更新；
- 不将 Jenkins 管理端口无鉴权暴露到公网。

### 2.4 与「构建在 Dockerfile 内」的关系

- **Docker 守护进程**：在 **宿主机**（或 NAS 的 Docker 服务）。
- **`docker build`**：由 **Jenkins 容器内的 `docker` CLI** 发起，实际构建仍在宿主机引擎上执行。
- **部署 `cp` 到 HTML 卷**：若 Jenkins 与 Nginx **共享同一宿主挂载路径**，需保证 Jenkins 容器内路径与 [jenkins.properties](jenkins.properties.example) 中 `HTML_ROOT` 一致（与 [demo/docker-compose.yml](../demo/docker-compose.yml) 中双服务挂同一目录的思路一致）。

---

## 3. 变量只定义一次：`jenkins.properties`

- 将 [jenkins.properties.example](jenkins.properties.example) 复制为仓库根目录 **`jenkins.properties`**，按项目修改。
- 流水线在 **Checkout** 之后读取该文件，注入 `env.*`，**Dockerfile** 通过 `docker build --build-arg NODE_VERSION=...` 与其中 **`NODE_VERSION`** 对齐。
- **Node 主版本号**在 `jenkins.properties` 写一次；**Dockerfile** 使用 `ARG NODE_VERSION` + `FROM node:${NODE_VERSION}-alpine`，避免 Jenkinsfile 与 Dockerfile 各写不同版本。

若未使用 `jenkins.properties`，需自行在 `Jenkinsfile` 的 `LoadJenkinsProperties` 阶段改为硬编码（不推荐）。

---

## 4. 凭据与 GitHub：SSH 密钥放在哪、如何配置

### 4.1 层级关系

| 层级 | 作用 |
|------|------|
| **GitHub 账户 / 仓库** | 决定 **谁有权克隆**、是否需部署密钥 |
| **NAS 或你的电脑** | 生成 **SSH 密钥对** 的场所（私钥不外传） |
| **Jenkins → Manage Credentials** | **私钥**仅存此处，供 Job 拉代码使用 |
| **Pipeline from SCM** | 在 Job 配置里 **选择对应 Credential**，与仓库 URL（SSH）绑定 |

### 4.2 生成密钥（在 NAS 或安全终端执行）

```bash
ssh-keygen -t ed25519 -C "jenkins-nas-static" -f ~/.ssh/jenkins_github_ed25519 -N ""
```

- **公钥**（`.pub`）：复制到 GitHub  
  - **单仓库只读**：仓库 **Settings → Deploy keys → Add deploy key**，粘贴公钥；或  
  - **账户下所有仓库**：GitHub **Settings → SSH and GPG keys → New SSH key**。
- **私钥**：**仅**导入 Jenkins（下一节），**不要**提交到 Git。

### 4.3 在 Jenkins 中新建凭据

1. **Manage Jenkins → Credentials → (global) → Add Credentials**。
2. **Kind**：**SSH Username with private key**。
3. **Username**：Git 使用 SSH 时一般为 `git`（GitHub 固定为 `git@github.com:owner/repo.git`）。
4. **Private Key**：**Enter directly**，粘贴私钥全文（含 `BEGIN/END`）。
5. **ID**：自定义，如 `github-ssh-jenkins`（Job 里选此项）。

### 4.4 在「Pipeline from SCM」里绑定

在 Job 的 Git 配置中：

- **Repository URL**：使用 SSH 形式，例如 `git@github.com:your-org/your-repo.git`。
- **Credentials**：选择刚创建的 `SSH Username with private key`。

构建时 Jenkins 用私钥与 GitHub 建立 SSH，**出站**连接。

### 4.5 若使用 HTTPS + PAT

- **Kind**：**Username with password**（用户名可为任意，密码填 **Personal Access Token**）。
- 仓库 URL 使用 `https://github.com/org/repo.git`。

---

## 5. 对 GitHub（外网）与 NAS：应暴露哪些服务与端口

### 5.1 Jenkins 需要「出站」访问 GitHub（一般无需你开端口）

| 方向 | 协议/端口 | 说明 |
|------|-----------|------|
| NAS / Jenkins → GitHub | **HTTPS 443** | `git clone https://...`、API |
| NAS / Jenkins → GitHub | **SSH 22** | `git@github.com:...` 克隆 |

这些是 **NAS 主动访问外网**，通常家庭/公司路由器 **无需为 GitHub 开入站端口**。

### 5.2 GitHub 需要「入站」访问 Jenkins 的情况（仅当你启用 Webhook 自动构建）

| 方向 | 协议/端口 | 说明 |
|------|-----------|------|
| GitHub → 你的公网地址 | **HTTPS 443** | Webhook POST 到 Jenkins（如 `/github-webhook/`） |

前提：GitHub 能访问到你的 Jenkins URL（域名 + 隧道/反代 + 证书）。**不需要**把 NAS 的 SSH（22）暴露给 GitHub；Git 拉取是 **Jenkins → GitHub**，不是反过来。

### 5.3 最小暴露面小结

- **仅拉代码构建、手动点构建**：可 **不配 Webhook**，则 **无需**对公网暴露 Jenkins。
- **要 push 自动构建**：只需让 **GitHub 能 HTTPS 访问你的 Jenkins Webhook URL**；仍 **不必**暴露 Git SSH 到公网。

---

## 6. 流水线阶段（与模板一致）

| 阶段 | 作用 |
|------|------|
| Checkout | 拉取含 `Jenkinsfile`、`jenkins.properties`、`Dockerfile` 的仓库 |
| LoadJenkinsProperties | 解析 `jenkins.properties` 注入环境变量 |
| BranchGuard | 仅允许指定分支执行（兜底：不在列表则 NOT_BUILT） |
| Prepare | 清理 `.output`、`.nuxt` |
| Build | `docker build`（传入 `NODE_VERSION`、`NPM_SCRIPT`）→ `docker cp` 取出静态产物 |
| Deploy | 写入 `HTML_ROOT/PROJECT_SLUG/SEGMENT` → `docker exec` Nginx reload |

---

## 7. 常见问题

| 现象 | 处理 |
|------|------|
| `docker: not found` | Jenkins 镜像内安装 Docker CLI，或换用含 `docker` 的镜像 |
| `Cannot connect to the Docker daemon` | 检查 `docker.sock` 是否挂载、用户是否有权访问 |
| `jenkins.properties not found` | 确认已提交到当前分支，且路径为仓库根目录 |
| 构建成功但部署路径错 | 核对 `jenkins.properties` 与 Nginx 挂载是否同一容器内路径 |

---

## 8. Webhook 配置与 Jenkins 对接（仅触发 develop/stg/main）

本母版模板提供了“最后一道兜底”：即便 webhook 把请求触发进来了，只要分支不在允许列表，就会在 `BranchGuard` 阶段被标记为 `NOT_BUILT` 并跳过后续构建/部署。

### 8.1 Jenkins 侧：允许分支列表在哪里配

在项目仓库根目录提交 `jenkins.properties`（与 `Jenkinsfile.template` 同级），其中：

- `ALLOWED_BRANCHES=develop,stg,main`
- 若不填 `SEGMENT_DEV / SEGMENT_STAGING / SEGMENT_PROD`，会分别默认用 `dev / staging / prod`

### 8.2 GitHub 侧：Webhook 需要怎么填

1. GitHub 仓库 → Settings → Webhooks → Add webhook
2. Payload URL 填你的 Jenkins Webhook 地址（常见形态取决于你安装的 Jenkins GitHub 插件；GitHub plugin 通常会使用类似 `/github-webhook/` 这样的 endpoint）
3. Secret：建议设置（如果 Jenkins 插件支持校验），避免被未授权请求触发
4. 事件选择建议：
   - 开启 `push`
   - 合并 PR 后会产生一次对目标分支的 `push`，因此通常只需要 `push` 事件即可

> 说明：GitHub Webhook 的“分支选择”能力通常有限（不保证能精确只对指定 3 个分支触发）。因此最终严格控制以 Jenkins 的 `BranchGuard` 为准。

### 8.3 Jenkins 侧 Job：如何让 webhook 能触发

由于你本方案要求使用 **Pipeline script from SCM**，你需要在 Jenkins Job 的触发器区域启用 GitHub 的 webhook 触发能力（插件命名可能略有差异）。常见做法是启用类似：

- `GitHub hook trigger for GITScm polling`

如果你启用了 webhook，但仍希望“只对 develop/stg/main 执行”，则无需在 Jenkins UI 再做复杂过滤：模板已在 `BranchGuard` 兜底。


docker run -d --name jenkins --restart=unless-stopped -p 8083:8080 -p 50000:50000 -v /vol1/1000/dev/docker/jenkins:/var/jenkins_home -v /var/run/docker.sock:/var/run/docker.sock -v $(which docker):/usr/bin/docker:ro jenkins/jenkins:latest