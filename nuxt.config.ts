// https://nuxt.com/docs/api/configuration/nuxt-config

// 静态站部署到子目录时，需要让 Nuxt 在构建阶段生成正确的资源/链接前缀。
// 通过 .env.* 注入 NUXT_PUBLIC_BASE_URL（由 Jenkins 选择 dotenv 文件触发不同构建）。
// 这里避免直接使用 `process` 变量名，规避 IDE 因 `.nuxt/tsconfig.json` types 空置导致的类型报错。
const rawBaseURL =
  (globalThis as any).process?.env?.NUXT_PUBLIC_BASE_URL ||
  (globalThis as any).process?.env?.NUXT_BASE_URL ||
  '/'

let baseURL = rawBaseURL || '/'
if (!baseURL.startsWith('/')) baseURL = `/${baseURL}`
if (!baseURL.endsWith('/')) baseURL = `${baseURL}/`

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  app: {
    baseURL,
  },
  nitro: {
    preset: 'static',
  },
  runtimeConfig: {
    public: {
      /** 当前构建环境标识，由各 .env.* 中 NUXT_PUBLIC_APP_ENV 注入 */
      appEnv: '',
      /** 站点名称，可选 */
      siteName: '',
    },
  },
})
