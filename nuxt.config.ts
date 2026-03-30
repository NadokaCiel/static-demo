// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
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
