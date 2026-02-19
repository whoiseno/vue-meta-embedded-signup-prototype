import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useFacebookSDK } from './composable/use-facebook-sdk-v2'

const app = createApp(App)

app.use(createPinia())

const { loadSDK } = useFacebookSDK({
  appId: import.meta.env.VITE_META_APP_ID,
  version: 'v25.0',
  xfbml: false,
  cookie: false,
  debug: import.meta.env.DEV,
})

try {
  await loadSDK()
} catch (error) {
  console.error('[main.ts] Failed to load Facebook SDK:', error)
}

app.mount('#app')
