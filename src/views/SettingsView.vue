<template>
  <div class="settings-page">
    <div class="page-header">
      <h1>设置</h1>
    </div>

    <div class="settings-body">
      <section class="settings-section">
        <div class="section-title">外观主题</div>

        <div class="system-row">
          <div class="system-info">
            <span class="system-label">跟随系统</span>
            <span class="system-desc">自动在浅色 / 深色间切换</span>
          </div>
          <button
            class="toggle"
            :class="{ on: themeStore.followSystem }"
            @click="themeStore.resetToSystem()"
          >
            <span class="toggle-knob" />
          </button>
        </div>

        <div class="theme-grid">
          <button
            v-for="theme in themeStore.themes"
            :key="theme.id"
            class="theme-card"
            :class="{ active: !themeStore.followSystem && themeStore.activeId === theme.id }"
            @click="themeStore.setTheme(theme.id)"
          >
            <div class="theme-preview" :style="previewStyle(theme)">
              <div class="preview-sidebar" :style="{ background: theme.vars['--sidebar-bg'] }" />
              <div class="preview-content">
                <div class="preview-card" :style="{ background: theme.vars['--card-bg'], borderColor: theme.vars['--border'] }">
                  <div class="preview-dot" :style="{ background: theme.vars['--accent'] }" />
                  <div class="preview-lines">
                    <div class="preview-line" :style="{ background: theme.vars['--text'], opacity: '0.7' }" />
                    <div class="preview-line short" :style="{ background: theme.vars['--text-muted'] }" />
                  </div>
                </div>
              </div>
            </div>
            <div class="theme-meta">
              <span class="theme-name">{{ theme.name }}</span>
              <span class="theme-mode-badge" :class="theme.mode">{{ theme.mode === 'light' ? '浅色' : '深色' }}</span>
            </div>
            <div class="check-mark" v-if="!themeStore.followSystem && themeStore.activeId === theme.id">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useThemeStore } from "../stores/theme"
import type { Theme } from "../stores/theme"

const themeStore = useThemeStore()

function previewStyle(theme: Theme) {
  return {
    background: theme.vars["--bg"],
    border: `1px solid ${theme.vars["--border"]}`,
  }
}
</script>

<style scoped>
.settings-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 28px 32px 20px;
  gap: 20px;
  overflow-y: auto;
}
.settings-page::-webkit-scrollbar { width: 4px; }
.settings-page::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

h1 {
  font-size: 26px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.5px;
}

.settings-body {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 720px;
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.4px;
  text-transform: uppercase;
}

/* system toggle row */
.system-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px 18px;
  box-shadow: var(--card-shadow);
}

.system-info { display: flex; flex-direction: column; gap: 2px; }
.system-label { font-size: 14px; font-weight: 500; color: var(--text); }
.system-desc { font-size: 12px; color: var(--text-muted); }

.toggle {
  width: 44px;
  height: 26px;
  border-radius: 13px;
  border: none;
  background: var(--input-bg);
  cursor: pointer;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
}
.toggle.on { background: var(--accent); }
.toggle-knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}
.toggle.on .toggle-knob { transform: translateX(18px); }

/* theme grid */
.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.theme-card {
  position: relative;
  background: var(--card-bg);
  border: 2px solid var(--border);
  border-radius: 14px;
  padding: 0;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;
  text-align: left;
  box-shadow: var(--card-shadow);
}
.theme-card:hover { border-color: var(--accent); }
.theme-card.active {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light), var(--card-shadow);
}

/* mini preview */
.theme-preview {
  height: 80px;
  display: flex;
  overflow: hidden;
  border-radius: 10px 10px 0 0;
}

.preview-sidebar {
  width: 28%;
  flex-shrink: 0;
  opacity: 0.9;
}

.preview-content {
  flex: 1;
  padding: 8px 6px;
  display: flex;
  align-items: flex-start;
}

.preview-card {
  width: 100%;
  border-radius: 5px;
  border: 1px solid;
  padding: 6px 7px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.preview-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.preview-lines { flex: 1; display: flex; flex-direction: column; gap: 3px; }
.preview-line { height: 3px; border-radius: 2px; width: 100%; }
.preview-line.short { width: 60%; }

.theme-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
}

.theme-name { font-size: 13px; font-weight: 500; color: var(--text); }

.theme-mode-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 6px;
  letter-spacing: 0.2px;
}
.theme-mode-badge.light { background: rgba(255,200,0,0.15); color: #b8860b; }
.theme-mode-badge.dark { background: rgba(100,100,200,0.15); color: var(--accent); }

.check-mark {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
