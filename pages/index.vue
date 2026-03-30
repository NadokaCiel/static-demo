<script setup lang="ts">
import { computed, useRuntimeConfig } from '#imports'

const config = useRuntimeConfig()
const appEnv = computed(() => config.public.appEnv || 'local')
const siteName = computed(() => config.public.siteName || 'Static Demo')
</script>

<template>
  <main class="page">
    <h1>欢迎访问</h1>
    <p class="lead">
      这是 {{ siteName }} 的演示首页。
    </p>
    <p class="env">
      当前环境：<strong>{{ appEnv }}</strong>
    </p>
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  font-family: system-ui, sans-serif;
  background: linear-gradient(160deg, #f8fafc 0%, #e2e8f0 100%);
  color: #0f172a;
}

h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 600;
}

.lead {
  margin: 0;
  font-size: 1.125rem;
  color: #334155;
}

.env {
  margin: 0;
  font-size: 0.875rem;
  color: #64748b;
}

.env strong {
  color: #0ea5e9;
}
</style>
