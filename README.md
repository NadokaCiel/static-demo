# static-demo

个人微型 CI/CD 相关说明见 [guide/README.md](guide/README.md)。

在 Mac 上用 Docker 做本地验证的步骤与示例见 [demo/README.md](demo/README.md)。

**母版 Jenkins + 项目 Dockerfile 指定 Node** 的方案说明见 [demo2/README.md](demo2/README.md)（含 Jenkins 配置、镜像管理、项目文档清单）。

部署路径由**各项目 Jenkinsfile** 中的 `PROJECT_SLUG` / `SEGMENT_*` 定义，首次部署时由流水线 `mkdir -p` 创建，无需手工建子目录。
