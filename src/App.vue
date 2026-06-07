<template>
  <div class="app-shell">
    <nav class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-mark">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <!-- 两个方块错位，构成内凹角落 -->
            <rect x="2" y="2" width="10" height="10" rx="2.5" fill="white" opacity="0.95"/>
            <rect x="8" y="8" width="10" height="10" rx="2.5" fill="white" opacity="0.55"/>
          </svg>
        </div>
      </div>

      <ul>
        <li v-for="r in navRoutes" :key="r.path">
          <router-link :to="r.path" :class="{ active: route.path === r.path }" :title="r.meta.label">
            <span class="icon-wrap" v-html="r.meta.icon"></span>
            <span class="nav-label">{{ r.meta.label }}</span>
          </router-link>
        </li>
      </ul>

      <div class="sidebar-footer">
        <router-link to="/settings" :class="{ active: route.path === '/settings' }" class="settings-btn" title="设置">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="2.2" stroke="currentColor" stroke-width="1.4"/>
            <path d="M8 1.5v1.2M8 13.3v1.2M1.5 8h1.2M13.3 8h1.2M3.4 3.4l.85.85M11.75 11.75l.85.85M3.4 12.6l.85-.85M11.75 4.25l.85-.85" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
        </router-link>
      </div>
    </nav>

    <main class="content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue"
import { useRoute } from "vue-router"
import { routes } from "./router"
import { useDeveloperStore } from "./stores/developer"

const route = useRoute()
const developerStore = useDeveloperStore()
// exclude settings from main nav — it lives in the footer
const navRoutes = computed(() =>
  routes.filter(
    (r): r is typeof r & { meta: { label: string; icon: string; developerOnly?: boolean } } =>
      !!r.meta &&
      r.path !== "/settings" &&
      (!r.meta.developerOnly || developerStore.enabled)
  )
)

function handleShortcut(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "d") {
    event.preventDefault()
    developerStore.toggle()
  }
}

onMounted(() => window.addEventListener("keydown", handleShortcut))
onUnmounted(() => window.removeEventListener("keydown", handleShortcut))
</script>

<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #f2f2f7;
  --sidebar-bg: rgba(255, 255, 255, 0.72);
  --sidebar-border: rgba(0, 0, 0, 0.08);
  --card-bg: rgba(255, 255, 255, 0.9);
  --card-shadow: 0 2px 16px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.05);
  --border: rgba(0, 0, 0, 0.08);
  --text: #1c1c1e;
  --text-secondary: #3c3c43;
  --text-muted: rgba(60, 60, 67, 0.45);
  --accent: #007aff;
  --accent-light: rgba(0, 122, 255, 0.1);
  --accent-hover: #0071e3;
  --hover: rgba(0, 0, 0, 0.04);
  --input-bg: rgba(118, 118, 128, 0.12);
  --destructive: #ff3b30;
  --success: #34c759;
  --warning: #ff9500;

  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif;
  font-size: 14px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* dark mode vars are now applied programmatically by useThemeStore */

html, body, #app { height: 100%; overflow: hidden; background: var(--bg); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.18s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

<style scoped>
.app-shell {
  display: flex;
  height: 100vh;
  background: var(--bg);
}

/* ── Sidebar ── */
.sidebar {
  width: 68px;
  flex-shrink: 0;
  background: var(--sidebar-bg);
  backdrop-filter: blur(24px) saturate(200%);
  -webkit-backdrop-filter: blur(24px) saturate(200%);
  border-right: 1px solid var(--sidebar-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0;
}

/* logo */
.sidebar-logo {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px 0 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.logo-mark {
  width: 34px;
  height: 34px;
  background: var(--accent);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  box-shadow: 0 2px 10px rgba(0, 122, 255, 0.4), 0 1px 3px rgba(0, 122, 255, 0.2);
  transition: transform 0.15s;
}
.logo-mark:hover { transform: scale(1.05); }

/* nav list */
.sidebar ul {
  list-style: none;
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  width: 100%;
}

.sidebar li {
  width: 100%;
  display: flex;
  justify-content: center;
}

.sidebar li a {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 52px;
  padding: 8px 0 7px;
  color: var(--text-muted);
  text-decoration: none;
  border-radius: 12px;
  transition: background 0.15s, color 0.15s;
  position: relative;
}

.sidebar li a:hover {
  background: var(--hover);
  color: var(--text-secondary);
}

.sidebar li a.active {
  background: var(--accent-light);
  color: var(--accent);
}

/* icon container */
.icon-wrap {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.15s;
}

.sidebar li a:hover .icon-wrap { transform: translateY(-1px); }

/* label */
.nav-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.1px;
  line-height: 1;
  white-space: nowrap;
}

/* active indicator dot */
.sidebar li a.active::before {
  content: "";
  position: absolute;
  left: -1px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: var(--accent);
  border-radius: 0 2px 2px 0;
}

/* footer settings */
.sidebar-footer {
  padding: 12px 0 16px;
  display: flex;
  justify-content: center;
  width: 100%;
  border-top: 1px solid var(--border);
}

.settings-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}
.settings-btn:hover { background: var(--hover); color: var(--text-secondary); }
.settings-btn.active { background: var(--accent-light); color: var(--accent); }

/* content */
.content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
