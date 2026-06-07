import { defineStore } from "pinia"
import { ref } from "vue"
import { getStoredValue, removeStoredValue, setStoredValue } from "../storage"

export type ThemeMode = "light" | "dark" | "system"

export interface Theme {
  id: string
  name: string
  mode: "light" | "dark"
  vars: Record<string, string>
}

export const themes: Theme[] = [
  {
    id: "apple-light",
    name: "Apple 浅色",
    mode: "light",
    vars: {
      "--bg": "#f2f2f7",
      "--sidebar-bg": "rgba(255,255,255,0.72)",
      "--sidebar-border": "rgba(0,0,0,0.08)",
      "--card-bg": "rgba(255,255,255,0.9)",
      "--card-shadow": "0 2px 16px rgba(0,0,0,0.07),0 1px 3px rgba(0,0,0,0.05)",
      "--border": "rgba(0,0,0,0.08)",
      "--text": "#1c1c1e",
      "--text-secondary": "#3c3c43",
      "--text-muted": "rgba(60,60,67,0.45)",
      "--accent": "#007aff",
      "--accent-light": "rgba(0,122,255,0.1)",
      "--accent-hover": "#0071e3",
      "--hover": "rgba(0,0,0,0.04)",
      "--input-bg": "rgba(118,118,128,0.12)",
      "--destructive": "#ff3b30",
      "--success": "#34c759",
      "--warning": "#ff9500",
    },
  },
  {
    id: "apple-dark",
    name: "Apple 深色",
    mode: "dark",
    vars: {
      "--bg": "#000000",
      "--sidebar-bg": "rgba(28,28,30,0.85)",
      "--sidebar-border": "rgba(255,255,255,0.08)",
      "--card-bg": "rgba(28,28,30,0.9)",
      "--card-shadow": "0 2px 16px rgba(0,0,0,0.4),0 1px 3px rgba(0,0,0,0.3)",
      "--border": "rgba(255,255,255,0.1)",
      "--text": "#ffffff",
      "--text-secondary": "rgba(255,255,255,0.85)",
      "--text-muted": "rgba(235,235,245,0.3)",
      "--accent": "#0a84ff",
      "--accent-light": "rgba(10,132,255,0.15)",
      "--accent-hover": "#409cff",
      "--hover": "rgba(255,255,255,0.06)",
      "--input-bg": "rgba(118,118,128,0.24)",
      "--destructive": "#ff453a",
      "--success": "#30d158",
      "--warning": "#ffd60a",
    },
  },
  {
    id: "forest",
    name: "森林",
    mode: "dark",
    vars: {
      "--bg": "#0d1f17",
      "--sidebar-bg": "rgba(15,30,22,0.9)",
      "--sidebar-border": "rgba(255,255,255,0.07)",
      "--card-bg": "rgba(18,36,26,0.95)",
      "--card-shadow": "0 2px 16px rgba(0,0,0,0.4),0 1px 3px rgba(0,0,0,0.3)",
      "--border": "rgba(255,255,255,0.08)",
      "--text": "#e8f5e9",
      "--text-secondary": "rgba(232,245,233,0.85)",
      "--text-muted": "rgba(232,245,233,0.35)",
      "--accent": "#4caf7d",
      "--accent-light": "rgba(76,175,125,0.15)",
      "--accent-hover": "#66bb8f",
      "--hover": "rgba(76,175,125,0.07)",
      "--input-bg": "rgba(76,175,125,0.1)",
      "--destructive": "#ef5350",
      "--success": "#4caf7d",
      "--warning": "#ffb74d",
    },
  },
  {
    id: "ocean",
    name: "海洋",
    mode: "dark",
    vars: {
      "--bg": "#0a1628",
      "--sidebar-bg": "rgba(10,22,44,0.9)",
      "--sidebar-border": "rgba(255,255,255,0.07)",
      "--card-bg": "rgba(13,28,54,0.95)",
      "--card-shadow": "0 2px 16px rgba(0,0,0,0.5),0 1px 3px rgba(0,0,0,0.3)",
      "--border": "rgba(255,255,255,0.08)",
      "--text": "#e3f2fd",
      "--text-secondary": "rgba(227,242,253,0.85)",
      "--text-muted": "rgba(227,242,253,0.35)",
      "--accent": "#29b6f6",
      "--accent-light": "rgba(41,182,246,0.15)",
      "--accent-hover": "#4fc3f7",
      "--hover": "rgba(41,182,246,0.07)",
      "--input-bg": "rgba(41,182,246,0.1)",
      "--destructive": "#ef5350",
      "--success": "#26c6da",
      "--warning": "#ffa726",
    },
  },
  {
    id: "rose",
    name: "玫瑰",
    mode: "light",
    vars: {
      "--bg": "#fdf2f4",
      "--sidebar-bg": "rgba(255,245,247,0.85)",
      "--sidebar-border": "rgba(0,0,0,0.07)",
      "--card-bg": "rgba(255,255,255,0.92)",
      "--card-shadow": "0 2px 16px rgba(0,0,0,0.06),0 1px 3px rgba(0,0,0,0.04)",
      "--border": "rgba(0,0,0,0.07)",
      "--text": "#2d1a1e",
      "--text-secondary": "#5c3a40",
      "--text-muted": "rgba(92,58,64,0.45)",
      "--accent": "#e91e63",
      "--accent-light": "rgba(233,30,99,0.1)",
      "--accent-hover": "#c2185b",
      "--hover": "rgba(233,30,99,0.04)",
      "--input-bg": "rgba(233,30,99,0.07)",
      "--destructive": "#f44336",
      "--success": "#4caf50",
      "--warning": "#ff9800",
    },
  },
  {
    id: "nord",
    name: "Nord",
    mode: "dark",
    vars: {
      "--bg": "#2e3440",
      "--sidebar-bg": "rgba(39,44,54,0.95)",
      "--sidebar-border": "rgba(255,255,255,0.06)",
      "--card-bg": "rgba(46,52,64,0.97)",
      "--card-shadow": "0 2px 16px rgba(0,0,0,0.3),0 1px 3px rgba(0,0,0,0.2)",
      "--border": "rgba(255,255,255,0.08)",
      "--text": "#eceff4",
      "--text-secondary": "#e5e9f0",
      "--text-muted": "rgba(236,239,244,0.4)",
      "--accent": "#88c0d0",
      "--accent-light": "rgba(136,192,208,0.15)",
      "--accent-hover": "#81a1c1",
      "--hover": "rgba(136,192,208,0.07)",
      "--input-bg": "rgba(59,66,82,0.8)",
      "--destructive": "#bf616a",
      "--success": "#a3be8c",
      "--warning": "#ebcb8b",
    },
  },
]

const STORAGE_KEY = "wb_theme"

export const useThemeStore = defineStore("theme", () => {
  const activeId = ref<string>("apple-light")
  // system mode: auto-follow OS
  const followSystem = ref<boolean>(true)

  function apply(id: string) {
    const theme = themes.find((t) => t.id === id)
    if (!theme) return
    const root = document.documentElement
    for (const [k, v] of Object.entries(theme.vars)) {
      root.style.setProperty(k, v)
    }
    root.setAttribute("data-theme-mode", theme.mode)
  }

  function setTheme(id: string) {
    activeId.value = id
    followSystem.value = false
    void setStoredValue(STORAGE_KEY, id)
    apply(id)
  }

  function initSystemTheme() {
    const dark = window.matchMedia("(prefers-color-scheme: dark)").matches
    apply(dark ? "apple-dark" : "apple-light")
  }

  async function init() {
    const saved = await getStoredValue(STORAGE_KEY)
    activeId.value = saved ?? "apple-light"
    followSystem.value = !saved
    if (followSystem.value) {
      initSystemTheme()
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        if (followSystem.value) apply(e.matches ? "apple-dark" : "apple-light")
      })
    } else {
      apply(activeId.value)
    }
  }

  function resetToSystem() {
    followSystem.value = true
    activeId.value = "apple-light"
    void removeStoredValue(STORAGE_KEY)
    initSystemTheme()
  }

  return { activeId, followSystem, themes, setTheme, init, resetToSystem }
})
