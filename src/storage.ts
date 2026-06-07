import { invoke } from "@tauri-apps/api/core"

export async function getStoredValue(key: string): Promise<string | null> {
  if (!isTauriRuntime()) return localStorage.getItem(key)
  const value = await invoke<string | null>("db_get", { key })
  if (value !== null) return value

  const legacy = localStorage.getItem(key)
  if (legacy !== null) {
    await setStoredValue(key, legacy)
    localStorage.removeItem(key)
  }
  return legacy
}

export async function setStoredValue(key: string, value: string) {
  if (!isTauriRuntime()) {
    localStorage.setItem(key, value)
    return
  }
  await invoke("db_set", { key, value })
}

export async function removeStoredValue(key: string) {
  if (!isTauriRuntime()) {
    localStorage.removeItem(key)
    return
  }
  await invoke("db_remove", { key })
}

export async function getJsonValue<T>(key: string, fallback: T): Promise<T> {
  const value = await getStoredValue(key)
  if (value === null) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function isTauriRuntime() {
  return "__TAURI_INTERNALS__" in window
}
