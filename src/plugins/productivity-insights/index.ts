import ProductivityInsights from "./ProductivityInsights.vue"
import type { Plugin } from "../registry"

const plugin: Plugin = {
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
}

export default plugin
