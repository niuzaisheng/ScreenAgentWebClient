import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

import Layui from '@layui/layui-vue'
import '@layui/layui-vue/lib/index.css'

const app = createApp(App)
app.use(Layui).mount('#app')