import { defineStore } from "pinia"
import { ref } from "vue"
import { getJsonValue, setStoredValue } from "../storage"

export interface Note {
  id: string
  title: string
  content: string
  updatedAt: number
}

const STORAGE_KEY = "wb_notes"

export const useNotesStore = defineStore("notes", () => {
  const notes = ref<Note[]>([])
  const activeId = ref<string | null>(null)

  async function load() {
    notes.value = await getJsonValue<Note[]>(STORAGE_KEY, [])
    activeId.value = notes.value[0]?.id ?? null
  }

  function persist() {
    void setStoredValue(STORAGE_KEY, JSON.stringify(notes.value))
  }

  const active = () => notes.value.find((n) => n.id === activeId.value) ?? null

  function create() {
    const note: Note = { id: crypto.randomUUID(), title: "新建笔记", content: "", updatedAt: Date.now() }
    notes.value.unshift(note)
    activeId.value = note.id
    persist()
  }

  function update(id: string, patch: Partial<Pick<Note, "title" | "content">>) {
    const note = notes.value.find((n) => n.id === id)
    if (!note) return
    Object.assign(note, patch, { updatedAt: Date.now() })
    persist()
  }

  function remove(id: string) {
    notes.value = notes.value.filter((n) => n.id !== id)
    activeId.value = notes.value[0]?.id ?? null
    persist()
  }

  void load()

  return { notes, activeId, load, active, create, update, remove }
})
