import FocusTimer from "./FocusTimer.vue"
import ProductivityInsights from "./ProductivityInsights.vue"
import { registerPlugin } from "./registry"

registerPlugin({
  id: "productivity-insights",
  name: "效率洞察",
  icon: "📊",
  description: "汇总待办、完成记录和最近笔记，快速查看工作台当前状态。",
  version: "1.0.0",
  author: "Workbench",
  category: "数据分析",
  defaultInstalled: true,
  defaultEnabled: true,
  component: ProductivityInsights,
})

registerPlugin({
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
})
