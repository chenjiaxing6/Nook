<template>
  <div class="plugins-page">
    <header class="page-header">
      <div>
        <h1>插件市场</h1>
        <p>{{ installedPlugins.length }} 个已安装，{{ enabledPlugins.length }} 个正在启用</p>
      </div>
      <div class="view-switch" role="tablist" aria-label="插件视图">
        <button type="button" :class="{ active: activeView === 'market' }" @click="activeView = 'market'">
          市场
        </button>
        <button type="button" :class="{ active: activeView === 'installed' }" @click="activeView = 'installed'">
          已安装
        </button>
      </div>
    </header>

    <section class="toolbar">
      <input v-model.trim="query" type="search" placeholder="搜索插件、分类或作者" />
      <span class="stats-badge">{{ visiblePlugins.length }} 个插件</span>
    </section>

    <div class="plugins-layout">
      <aside class="market-list">
        <button
          v-for="plugin in visiblePlugins"
          :key="plugin.id"
          type="button"
          class="market-card"
          :class="{ active: activePluginId === plugin.id }"
          @click="activePluginId = plugin.id"
        >
          <span class="plugin-icon">{{ plugin.icon }}</span>
          <span class="plugin-info">
            <strong>{{ plugin.name }}</strong>
            <small>{{ plugin.category }} · v{{ plugin.version }}</small>
          </span>
          <span class="install-state" :class="{ installed: plugin.installed }">
            {{ plugin.installed ? "已安装" : "未安装" }}
          </span>
        </button>

        <div v-if="visiblePlugins.length === 0" class="empty-list">
          没有找到匹配的插件
        </div>
      </aside>

      <main class="detail-panel" v-if="activePlugin">
        <section class="plugin-detail">
          <div class="detail-heading">
            <span class="detail-icon">{{ activePlugin.icon }}</span>
            <div>
              <h2>{{ activePlugin.name }}</h2>
              <p>{{ activePlugin.description }}</p>
            </div>
          </div>

          <div class="meta-row">
            <span>{{ activePlugin.category }}</span>
            <span>v{{ activePlugin.version }}</span>
            <span>{{ activePlugin.author }}</span>
          </div>

          <div class="detail-actions">
            <button
              v-if="!activePlugin.installed"
              type="button"
              class="primary-button"
              @click="install(activePlugin.id)"
            >
              安装
            </button>
            <button
              v-else
              type="button"
              class="secondary-button"
              @click="uninstall(activePlugin.id)"
            >
              卸载
            </button>
            <label class="enable-toggle" :class="{ disabled: !activePlugin.installed }">
              <input
                type="checkbox"
                :checked="activePlugin.enabled"
                :disabled="!activePlugin.installed"
                @change="toggleEnabled(activePlugin.id, ($event.target as HTMLInputElement).checked)"
              />
              <span></span>
              启用
            </label>
          </div>
        </section>

        <section class="preview-panel">
          <component
            :is="activePlugin.component"
            v-if="activePlugin.installed && activePlugin.enabled"
          />
          <div v-else class="preview-placeholder">
            <strong>{{ activePlugin.installed ? "插件已停用" : "安装后可使用此插件" }}</strong>
            <p>{{ activePlugin.installed ? "启用插件即可在这里运行。" : "市场插件会先进入目录，安装后再加载运行。" }}</p>
          </div>
        </section>
      </main>

      <main class="detail-panel empty-detail" v-else>
        <strong>请选择一个插件</strong>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue"
import {
  getPluginEntries,
  installPlugin,
  setPluginEnabled,
  uninstallPlugin,
  type PluginEntry,
} from "../plugins/registry"

const query = ref("")
const activeView = ref<"market" | "installed">("market")
const plugins = ref<PluginEntry[]>(getPluginEntries())
const activePluginId = ref<string | null>(plugins.value[0]?.id ?? null)

const installedPlugins = computed(() => plugins.value.filter((plugin) => plugin.installed))
const enabledPlugins = computed(() => plugins.value.filter((plugin) => plugin.installed && plugin.enabled))
const visiblePlugins = computed(() => {
  const keyword = query.value.toLowerCase()
  return plugins.value.filter((plugin) => {
    const inView = activeView.value === "market" || plugin.installed
    const matches =
      !keyword ||
      [plugin.name, plugin.description, plugin.category, plugin.author]
        .some((text) => text.toLowerCase().includes(keyword))
    return inView && matches
  })
})
const activePlugin = computed(() => plugins.value.find((plugin) => plugin.id === activePluginId.value) ?? null)

watch(visiblePlugins, (list) => {
  if (!list.some((plugin) => plugin.id === activePluginId.value)) {
    activePluginId.value = list[0]?.id ?? null
  }
})

function refreshPlugins() {
  plugins.value = getPluginEntries()
}

function install(id: string) {
  installPlugin(id)
  refreshPlugins()
}

function uninstall(id: string) {
  uninstallPlugin(id)
  refreshPlugins()
}

function toggleEnabled(id: string, enabled: boolean) {
  setPluginEnabled(id, enabled)
  refreshPlugins()
}
</script>

<style scoped>
.plugins-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px 24px 24px;
  gap: 16px;
  overflow: hidden;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
}

h1 {
  font-size: 30px;
  font-weight: 760;
  color: var(--text);
  letter-spacing: 0;
}

.page-header p {
  color: var(--text-muted);
  font-size: 13px;
  margin-top: 4px;
}

.view-switch {
  display: flex;
  padding: 3px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--input-bg);
}

.view-switch button {
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  padding: 7px 13px;
}

.view-switch button.active {
  background: var(--card-bg);
  color: var(--accent);
  box-shadow: var(--card-shadow);
}

.toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-shrink: 0;
}

.toolbar input {
  width: min(420px, 100%);
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card-bg);
  color: var(--text);
  font: inherit;
  padding: 10px 12px;
  outline: none;
  box-shadow: var(--card-shadow);
}

.toolbar input:focus {
  border-color: var(--accent);
}

.stats-badge {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--input-bg);
  padding: 6px 10px;
  border-radius: 999px;
}

.plugins-layout {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 14px;
}

.market-list,
.detail-panel {
  min-height: 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
}

.market-list {
  padding: 10px;
  overflow: auto;
}

.market-card {
  width: 100%;
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  font: inherit;
  padding: 10px;
  text-align: left;
}

.market-card:hover,
.market-card.active {
  background: var(--input-bg);
  border-color: var(--border);
}

.market-card.active {
  border-color: var(--accent);
}

.plugin-icon,
.detail-icon {
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: var(--accent-light);
}

.plugin-icon {
  width: 38px;
  height: 38px;
  font-size: 20px;
}

.plugin-info {
  min-width: 0;
}

.plugin-info strong {
  display: block;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plugin-info small {
  display: block;
  color: var(--text-muted);
  font-size: 12px;
  margin-top: 3px;
}

.install-state {
  border-radius: 999px;
  background: var(--input-bg);
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
}

.install-state.installed {
  background: color-mix(in srgb, var(--success) 14%, transparent);
  color: var(--success);
}

.empty-list,
.empty-detail {
  display: grid;
  place-items: center;
  color: var(--text-muted);
  font-size: 13px;
}

.detail-panel {
  overflow: hidden;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
}

.plugin-detail {
  padding: 18px;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--card-bg) 88%, var(--bg) 12%);
}

.detail-heading {
  display: flex;
  gap: 13px;
  align-items: flex-start;
}

.detail-icon {
  width: 48px;
  height: 48px;
  flex: 0 0 auto;
  font-size: 25px;
}

.detail-heading h2 {
  font-size: 20px;
  margin-bottom: 5px;
}

.detail-heading p {
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 14px 0;
}

.meta-row span {
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text-muted);
  background: var(--input-bg);
  font-size: 12px;
  font-weight: 600;
  padding: 5px 9px;
}

.detail-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.primary-button,
.secondary-button {
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  padding: 9px 16px;
}

.primary-button {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.secondary-button {
  background: var(--card-bg);
  color: var(--text-secondary);
}

.enable-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.enable-toggle.disabled {
  color: var(--text-muted);
  cursor: not-allowed;
}

.enable-toggle input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.enable-toggle span {
  width: 38px;
  height: 22px;
  border-radius: 999px;
  background: var(--input-bg);
  border: 1px solid var(--border);
  position: relative;
  transition: background 0.15s;
}

.enable-toggle span::after {
  content: "";
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--card-bg);
  position: absolute;
  top: 2px;
  left: 2px;
  box-shadow: var(--card-shadow);
  transition: transform 0.15s;
}

.enable-toggle input:checked + span {
  background: var(--accent);
  border-color: var(--accent);
}

.enable-toggle input:checked + span::after {
  transform: translateX(16px);
}

.preview-panel {
  min-height: 0;
  overflow: hidden;
  background: color-mix(in srgb, var(--card-bg) 78%, var(--bg) 22%);
}

.preview-placeholder {
  height: 100%;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  color: var(--text-muted);
  text-align: center;
  padding: 24px;
}

.preview-placeholder strong {
  color: var(--text);
  font-size: 16px;
}

.preview-placeholder p {
  font-size: 13px;
}

@media (max-width: 900px) {
  .plugins-page {
    padding: 18px;
  }

  .page-header,
  .toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .toolbar input {
    width: 100%;
  }

  .plugins-layout {
    grid-template-columns: 1fr;
  }

  .market-list {
    max-height: 220px;
  }
}
</style>
