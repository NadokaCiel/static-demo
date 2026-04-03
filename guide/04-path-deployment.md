# 路径部署：`a.com/projectName/dev` 与框架改造

本文只讲 **前端构建与 URL 形态**；与 Jenkins / GitHub Actions 的衔接见 [README](README.md)。

## 结论

若对外 URL 为 **`域名 + 多级路径前缀`**（例如 `/static-demo/dev/`），现代前端构建栈（Vite、Webpack、Nuxt 等）一般需要在 **构建期** 配置 **publicPath / base / baseURL**，否则静态资源会请求站点根路径，导致 404。

这通常 **不是**「每个项目大改业务代码」，而是 **每个仓库固定一项配置**（或环境变量），由 CI 按环境注入。

本仓库通过 `.env.development` / `.env.staging` / `.env.production` 中的 `NUXT_PUBLIC_BASE_URL` 与 [nuxt.config.ts](../nuxt.config.ts) 的 `app.baseURL` 实现。

## 可选替代方案

| 方案 | URL 形态 | 构建是否常用根路径 `/` | 代价 |
|------|----------|-------------------------|------|
| 子路径部署（当前） | `a.com/project/env/` | 需配置 base | 单域名多项目清晰 |
| 子域名 | `dev.project.a.com` | 常可用 `/` | 多条 DNS/证书 |
| 多端口 | `a.com:8081` | 常可用 `/` | 穿透与防火墙复杂 |
| 仅靠 Nginx 不改构建 | — | 对 SPA 往往不可靠 | 易踩资源路径坑 |

若希望各项目尽量少配 base，可逐步改为 **子域名 per 项目/环境**。
