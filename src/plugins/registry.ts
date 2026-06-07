import type { Component } from "vue"
import { getJsonValue, setStoredValue } from "../storage"

export interface Plugin {
  id: string
  name: string
  icon: string
  description: string
  version: string
  author: string
  category: string
  defaultInstalled?: boolean
  defaultEnabled?: boolean
  component: Component
}

export interface PluginEntry extends Plugin {
  installed: boolean
  enabled: boolean
}

interface PluginState {
  installed: boolean
  enabled: boolean
}

const STORAGE_KEY = "wb_plugin_market_state"
const plugins: Map<string, Plugin> = new Map()
let pluginStateCache: Record<string, PluginState> = {}

void loadPluginState()

export function registerPlugin(plugin: Plugin) {
  plugins.set(plugin.id, plugin)
}

export function getPlugins(): Plugin[] {
  return Array.from(plugins.values())
}

export function getPluginEntries(): PluginEntry[] {
  const state = readState()
  return getPlugins().map((plugin) => {
    const saved = state[plugin.id]
    return {
      ...plugin,
      installed: saved?.installed ?? plugin.defaultInstalled ?? false,
      enabled: saved?.enabled ?? plugin.defaultEnabled ?? true,
    }
  })
}

export function getPlugin(id: string): Plugin | undefined {
  return plugins.get(id)
}

export function installPlugin(id: string) {
  updatePluginState(id, { installed: true, enabled: true })
}

export function uninstallPlugin(id: string) {
  updatePluginState(id, { installed: false, enabled: false })
}

export function setPluginEnabled(id: string, enabled: boolean) {
  updatePluginState(id, { enabled })
}

function updatePluginState(id: string, patch: Partial<PluginState>) {
  const plugin = plugins.get(id)
  if (!plugin) return

  const state = readState()
  const current = state[id] ?? {
    installed: plugin.defaultInstalled ?? false,
    enabled: plugin.defaultEnabled ?? true,
  }
  state[id] = { ...current, ...patch }
  pluginStateCache = state
  void setStoredValue(STORAGE_KEY, JSON.stringify(state))
}

function readState(): Record<string, PluginState> {
  return pluginStateCache
}

async function loadPluginState() {
  pluginStateCache = await getJsonValue<Record<string, PluginState>>(STORAGE_KEY, {})
}
