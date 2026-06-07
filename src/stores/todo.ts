import { defineStore } from "pinia"
import { ref } from "vue"
import { getJsonValue, setStoredValue } from "../storage"

export interface TodoItem {
  id: string
  text: string
  done: boolean
  createdAt: number
  doneAt?: number
  date?: string  // "YYYY-MM-DD", optional — unscheduled if absent
}

const STORAGE_KEY = "wb_todos"

export const useTodoStore = defineStore("todo", () => {
  const todos = ref<TodoItem[]>([])

  async function load() {
    todos.value = await getJsonValue<TodoItem[]>(STORAGE_KEY, [])
  }

  function persist() {
    void setStoredValue(STORAGE_KEY, JSON.stringify(todos.value))
  }

  function add(text: string, date?: string) {
    todos.value.push({ id: crypto.randomUUID(), text, done: false, createdAt: Date.now(), date })
    persist()
  }

  function toggle(id: string) {
    const item = todos.value.find((t) => t.id === id)
    if (!item) return
    item.done = !item.done
    item.doneAt = item.done ? Date.now() : undefined
    persist()
  }

  function remove(id: string) {
    todos.value = todos.value.filter((t) => t.id !== id)
    persist()
  }

  function byDate(date: string) {
    return todos.value.filter((t) => t.date === date)
  }

  function datesWithTasks(): Set<string> {
    const s = new Set<string>()
    todos.value.forEach((t) => { if (t.date) s.add(t.date) })
    return s
  }

  const completed = () =>
    todos.value.filter((t) => t.done && t.doneAt).sort((a, b) => b.doneAt! - a.doneAt!)

  void load()

  return { todos, load, add, toggle, remove, completed, byDate, datesWithTasks }
})
