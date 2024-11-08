import 'uno.css'
import 'virtual:uno.css'
import '@unocss/reset/tailwind.css';
import { createApp } from 'vue'
import Notifications from 'notiwind'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router/index.js'
import vue3GoogleLogin from 'vue3-google-login'



const app = createApp(App).use(router).use(Notifications)


app.use(createPinia())
app.use(vue3GoogleLogin, {clientId: '789140008513-3d5egqt5b78km6l0aa1nsss5nh17chnq.apps.googleusercontent.com', popupType: 'TOKEN', prompt: false})

app.mount('#app')

