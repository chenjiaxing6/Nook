import { createApp } from "vue"
import { createPinia } from "pinia"
import { router } from "./router"
import { useThemeStore } from "./stores/theme"
import App from "./App.vue"
import "./plugins"

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.mount("#app")

// init theme before first paint
useThemeStore().init()
