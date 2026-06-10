import FocusTimer from "./FocusTimer.vue"
import type { Plugin } from "../registry"

const plugin: Plugin = {
  id: "focus-timer",
  name: "专注计时器",
  icon: "⏱",
  description: "提供专注、短休息和长休息计时，记录今日完成的专注时长。",
  version: "1.0.0",
  author: "Workbench",
  category: "效率工具",
  defaultInstalled: true,
  defaultEnabled: true,
  component: FocusTimer,
}

export default plugin
