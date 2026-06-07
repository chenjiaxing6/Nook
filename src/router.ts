import { createRouter, createWebHashHistory } from "vue-router"
import DashboardView from "./views/DashboardView.vue"
import HistoryView from "./views/HistoryView.vue"
import NotesView from "./views/NotesView.vue"
import PluginsView from "./views/PluginsView.vue"
import DatabaseView from "./views/DatabaseView.vue"
import SettingsView from "./views/SettingsView.vue"

export const routes = [
  { path: "/", redirect: "/dashboard" },
  {
    path: "/dashboard", component: DashboardView,
    meta: { label: "工作台", icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="9" y="9" width="5.5" height="5.5" rx="1.5" stroke="currentColor" stroke-width="1.4"/></svg>` },
  },
  {
    path: "/notes", component: NotesView,
    meta: { label: "笔记", icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 2.5A1.5 1.5 0 014.5 1h7A1.5 1.5 0 0113 2.5v11a.5.5 0 01-.8.4L8 11.1l-4.2 2.8A.5.5 0 013 13.5v-11z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M6 5.5h4M6 8h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>` },
  },
  {
    path: "/history", component: HistoryView,
    meta: { label: "完成记录", icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><polyline points="2,11 5.5,7 8.5,9.5 13,4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 14h12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>` },
  },
  {
    path: "/plugins", component: PluginsView,
    meta: { label: "插件", icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 2v2H3.5A1.5 1.5 0 002 5.5v7A1.5 1.5 0 003.5 14h9a1.5 1.5 0 001.5-1.5v-7A1.5 1.5 0 0012.5 4H10V2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 2h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M8 8v4M6 10h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>` },
  },
  {
    path: "/settings", component: SettingsView,
    meta: { label: "设置", icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.2" stroke="currentColor" stroke-width="1.4"/><path d="M8 1.5v1.2M8 13.3v1.2M1.5 8h1.2M13.3 8h1.2M3.4 3.4l.85.85M11.75 11.75l.85.85M3.4 12.6l.85-.85M11.75 4.25l.85-.85" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>` },
  },
  {
    path: "/database", component: DatabaseView,
    meta: { label: "数据库", developerOnly: true, icon: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><ellipse cx="8" cy="3.5" rx="5.5" ry="2" stroke="currentColor" stroke-width="1.4"/><path d="M2.5 3.5v9c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2v-9M2.5 8c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2" stroke="currentColor" stroke-width="1.4"/></svg>` },
  },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})
