import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

import Layui from '@layui/layui-vue'
import '@layui/layui-vue/lib/index.css'

import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const app = createApp(App)

const store = createPinia();
store.use(piniaPluginPersistedstate);

app.use(store)
app.use(Layui)

app.mount('#app')