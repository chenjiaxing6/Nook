import { defineStore } from "pinia"
import { computed, ref } from "vue"
import { getJsonValue, setStoredValue } from "../storage"

export interface Note {
  id: string
  title: string
  content: string
  folderId: string
  folderPath?: string
  order: number
  updatedAt: number
}

export interface NoteFolder {
  id: string
  name: string
  parentId: string
  order: number
  createdAt: number
  updatedAt: number
}

export interface NoteTreeFolder {
  kind: "folder"
  id: string
  name: string
  path: string
  parentId: string
  depth: number
  order: number
  noteCount: number
  descendantNoteCount: number
}

const NOTES_KEY = "wb_notes"
const FOLDERS_KEY = "wb_note_folders"
const ROOT_FOLDER_ID = "root"

type LegacyNote = Omit<Partial<Note>, "folderId"> & { id: string; folderId?: string; folderPath?: string }
type LegacyFolder = string | Partial<NoteFolder> & { id?: string; name?: string; parentId?: string }

export const useNotesStore = defineStore("notes", () => {
  const notes = ref<Note[]>([])
  const folderNodes = ref<NoteFolder[]>([])
  const activeId = ref<string | null>(null)

  const folders = computed(() => treeFolders.value.map((folder) => folder.path))

  const treeFolders = computed<NoteTreeFolder[]>(() => {
    const folderById = new Map(folderNodes.value.map((folder) => [folder.id, folder]))
    const childrenByParent = new Map<string, NoteFolder[]>()
    for (const folder of folderNodes.value) {
      if (!folderById.has(folder.parentId) && folder.parentId !== ROOT_FOLDER_ID) folder.parentId = ROOT_FOLDER_ID
      const children = childrenByParent.get(folder.parentId) ?? []
      children.push(folder)
      childrenByParent.set(folder.parentId, children)
    }
    for (const children of childrenByParent.values()) {
      children.sort(compareOrderThenName)
    }

    const directCounts = new Map<string, number>()
    for (const note of notes.value) {
      directCounts.set(note.folderId, (directCounts.get(note.folderId) ?? 0) + 1)
    }

    const result: NoteTreeFolder[] = []
    const visit = (parentId: string, depth: number, parentPath: string) => {
      for (const folder of childrenByParent.get(parentId) ?? []) {
        const path = parentPath ? `${parentPath}/${folder.name}` : folder.name
        const item: NoteTreeFolder = {
          kind: "folder",
          id: folder.id,
          name: folder.name,
          path,
          parentId: folder.parentId,
          depth,
          order: folder.order,
          noteCount: directCounts.get(folder.id) ?? 0,
          descendantNoteCount: 0,
        }
        result.push(item)
        visit(folder.id, depth + 1, path)
        item.descendantNoteCount = result
          .filter((candidate) => candidate.path === path || candidate.path.startsWith(`${path}/`))
          .reduce((total, candidate) => total + candidate.noteCount, 0)
      }
    }
    visit(ROOT_FOLDER_ID, 0, "")
    return result
  })

  async function load() {
    const storedNotes = await getJsonValue<LegacyNote[]>(NOTES_KEY, [])
    const storedFolders = await getJsonValue<LegacyFolder[]>(FOLDERS_KEY, [])
    const migrated = migrateNotesData(storedNotes, storedFolders)
    notes.value = migrated.notes
    folderNodes.value = migrated.folders
    activeId.value = notes.value[0]?.id ?? null
    persist()
    persistFolders()
  }

  function persist() {
    void setStoredValue(NOTES_KEY, JSON.stringify(notes.value))
  }

  function persistFolders() {
    void setStoredValue(FOLDERS_KEY, JSON.stringify(folderNodes.value))
  }

  const active = () => notes.value.find((note) => note.id === activeId.value) ?? null

  function normalizeFolderPath(path: string) {
    return path
      .split("/")
      .map((part) => part.trim())
      .filter(Boolean)
      .join("/")
  }

  function create(folderPathOrId = "") {
    const folderId = resolveFolderTarget(folderPathOrId, true)
    const note: Note = {
      id: crypto.randomUUID(),
      title: "新建笔记",
      content: "",
      folderId,
      folderPath: folderPathById(folderId),
      order: nextNoteOrder(folderId),
      updatedAt: Date.now(),
    }
    notes.value.unshift(note)
    activeId.value = note.id
    persist()
    return note
  }

  function update(id: string, patch: Partial<Pick<Note, "title" | "content" | "folderId" | "folderPath" | "order">>) {
    const note = notes.value.find((item) => item.id === id)
    if (!note) return
    const nextPatch = { ...patch }
    if (nextPatch.folderId !== undefined) {
      nextPatch.folderId = resolveFolderTarget(nextPatch.folderId, false)
      nextPatch.folderPath = folderPathById(nextPatch.folderId)
    } else if (nextPatch.folderPath !== undefined) {
      nextPatch.folderId = resolveFolderTarget(nextPatch.folderPath, true)
      nextPatch.folderPath = folderPathById(nextPatch.folderId)
    }
    Object.assign(note, nextPatch, { updatedAt: Date.now() })
    persist()
  }

  function remove(id: string) {
    notes.value = notes.value.filter((note) => note.id !== id)
    activeId.value = notes.value.some((note) => note.id === activeId.value) ? activeId.value : notes.value[0]?.id ?? null
    persist()
  }

  function createFolder(path: string) {
    return ensureFolderPath(path)
  }

  function createFolderIn(parentIdOrPath: string, name: string) {
    const parentId = resolveFolderTarget(parentIdOrPath, true)
    const folderId = ensureFolderChild(parentId, name)
    persistFolders()
    return folderId
  }

  function renameFolder(oldPathOrId: string, nextPathOrName: string) {
    const folder = findFolder(oldPathOrId)
    if (!folder) return
    const normalizedNext = normalizeFolderPath(nextPathOrName)
    if (!normalizedNext) return
    const parts = normalizedNext.split("/")
    const nextName = parts[parts.length - 1]
    const explicitParentPath = parts.length > 1 ? parts.slice(0, -1).join("/") : ""
    const nextParentId = parts.length > 1 ? ensureFolderPath(explicitParentPath) : folder.parentId
    if (folder.id === nextParentId || isFolderDescendant(nextParentId, folder.id)) return
    const duplicate = folderNodes.value.find(
      (candidate) => candidate.id !== folder.id && candidate.parentId === nextParentId && sameName(candidate.name, nextName)
    )
    if (duplicate) return
    folder.name = nextName
    folder.parentId = nextParentId
    folder.updatedAt = Date.now()
    syncNoteFolderPaths()
    persist()
    persistFolders()
  }

  function removeFolder(pathOrId: string, deleteNotes = false) {
    const folder = findFolder(pathOrId)
    if (!folder) return
    const ids = descendantFolderIds(folder.id)
    folderNodes.value = folderNodes.value.filter((item) => !ids.has(item.id))
    if (deleteNotes) {
      notes.value = notes.value.filter((note) => !ids.has(note.folderId))
      activeId.value = notes.value.some((note) => note.id === activeId.value) ? activeId.value : notes.value[0]?.id ?? null
    } else {
      notes.value = notes.value.map((note) => {
        if (!ids.has(note.folderId)) return note
        return { ...note, folderId: ROOT_FOLDER_ID, folderPath: "", updatedAt: Date.now() }
      })
    }
    persist()
    persistFolders()
  }

  function moveNote(id: string, targetFolderIdOrPath: string) {
    const note = notes.value.find((item) => item.id === id)
    if (!note) return
    const folderId = resolveFolderTarget(targetFolderIdOrPath, true)
    note.folderId = folderId
    note.folderPath = folderPathById(folderId)
    note.order = nextNoteOrder(folderId)
    note.updatedAt = Date.now()
    persist()
  }

  function moveFolder(idOrPath: string, targetParentIdOrPath: string) {
    const folder = findFolder(idOrPath)
    if (!folder) return
    const targetParentId = resolveFolderTarget(targetParentIdOrPath, true)
    if (folder.parentId === targetParentId || folder.id === targetParentId || isFolderDescendant(targetParentId, folder.id)) return
    const duplicate = folderNodes.value.find(
      (candidate) => candidate.id !== folder.id && candidate.parentId === targetParentId && sameName(candidate.name, folder.name)
    )
    if (duplicate) return
    folder.parentId = targetParentId
    folder.order = nextFolderOrder(targetParentId)
    folder.updatedAt = Date.now()
    syncNoteFolderPaths()
    persist()
    persistFolders()
  }

  function folderIdByPath(path: string) {
    const normalizedPath = normalizeFolderPath(path)
    if (!normalizedPath) return ROOT_FOLDER_ID
    return treeFolders.value.find((folder) => folder.path === normalizedPath)?.id ?? ROOT_FOLDER_ID
  }

  function folderPathById(id: string) {
    if (!id || id === ROOT_FOLDER_ID) return ""
    return treeFolders.value.find((folder) => folder.id === id)?.path ?? ""
  }

  function notesInFolder(folderIdOrPath: string) {
    const folderId = resolveFolderTarget(folderIdOrPath, false)
    return notes.value
      .filter((note) => note.folderId === folderId)
      .sort((a, b) => b.updatedAt - a.updatedAt || a.order - b.order)
  }

  function resolveFolderTarget(idOrPath: string, createMissing: boolean) {
    const target = idOrPath.trim()
    if (!target) return ROOT_FOLDER_ID
    if (target === ROOT_FOLDER_ID) return ROOT_FOLDER_ID
    const byId = folderNodes.value.find((folder) => folder.id === target)
    if (byId) return byId.id
    const normalizedPath = normalizeFolderPath(target)
    if (!normalizedPath) return ROOT_FOLDER_ID
    const byPath = treeFolders.value.find((folder) => folder.path === normalizedPath)
    if (byPath) return byPath.id
    return createMissing ? ensureFolderPath(normalizedPath) : ROOT_FOLDER_ID
  }

  function ensureFolderPath(path: string) {
    const normalizedPath = normalizeFolderPath(path)
    if (!normalizedPath) return ROOT_FOLDER_ID
    let parentId = ROOT_FOLDER_ID
    for (const part of normalizedPath.split("/")) {
      parentId = ensureFolderChild(parentId, part)
    }
    persistFolders()
    return parentId
  }

  function ensureFolderChild(parentId: string, rawName: string) {
    const name = rawName.trim()
    if (!name) return parentId
    const existing = folderNodes.value.find((folder) => folder.parentId === parentId && sameName(folder.name, name))
    if (existing) return existing.id
    const now = Date.now()
    const folder: NoteFolder = {
      id: crypto.randomUUID(),
      name,
      parentId,
      order: nextFolderOrder(parentId),
      createdAt: now,
      updatedAt: now,
    }
    folderNodes.value.push(folder)
    return folder.id
  }

  function findFolder(idOrPath: string) {
    const target = idOrPath.trim()
    if (!target) return null
    return folderNodes.value.find((folder) => folder.id === target)
      ?? folderNodes.value.find((folder) => folder.id === folderIdByPath(target))
      ?? null
  }

  function descendantFolderIds(folderId: string) {
    const ids = new Set([folderId])
    let changed = true
    while (changed) {
      changed = false
      for (const folder of folderNodes.value) {
        if (ids.has(folder.id) || !ids.has(folder.parentId)) continue
        ids.add(folder.id)
        changed = true
      }
    }
    return ids
  }

  function isFolderDescendant(folderId: string, ancestorId: string) {
    if (folderId === ROOT_FOLDER_ID) return false
    let current = folderNodes.value.find((folder) => folder.id === folderId)
    while (current) {
      if (current.parentId === ancestorId) return true
      current = folderNodes.value.find((folder) => folder.id === current?.parentId)
    }
    return false
  }

  function syncNoteFolderPaths() {
    for (const note of notes.value) {
      note.folderPath = folderPathById(note.folderId)
    }
  }

  function nextFolderOrder(parentId: string) {
    return Math.max(-1, ...folderNodes.value.filter((folder) => folder.parentId === parentId).map((folder) => folder.order)) + 1
  }

  function nextNoteOrder(folderId: string) {
    return Math.max(-1, ...notes.value.filter((note) => note.folderId === folderId).map((note) => note.order)) + 1
  }

  function sameName(a: string, b: string) {
    return a.localeCompare(b, "zh-CN", { sensitivity: "accent" }) === 0
  }

  function compareOrderThenName(a: NoteFolder, b: NoteFolder) {
    return a.order - b.order || a.name.localeCompare(b.name, "zh-CN")
  }

  function migrateNotesData(storedNotes: LegacyNote[], storedFolders: LegacyFolder[]) {
    const migratedFolders: NoteFolder[] = []
    const pathToId = new Map<string, string>()
    const now = Date.now()

    const ensureMigratedPath = (path: string) => {
      const normalizedPath = normalizeFolderPath(path)
      if (!normalizedPath) return ROOT_FOLDER_ID
      let parentId = ROOT_FOLDER_ID
      let currentPath = ""
      for (const part of normalizedPath.split("/")) {
        currentPath = currentPath ? `${currentPath}/${part}` : part
        const existingId = pathToId.get(currentPath)
        if (existingId) {
          parentId = existingId
          continue
        }
        const id = crypto.randomUUID()
        pathToId.set(currentPath, id)
        migratedFolders.push({
          id,
          name: part,
          parentId,
          order: migratedFolders.filter((folder) => folder.parentId === parentId).length,
          createdAt: now,
          updatedAt: now,
        })
        parentId = id
      }
      return parentId
    }

    for (const folder of storedFolders) {
      if (typeof folder === "string") {
        ensureMigratedPath(folder)
        continue
      }
      if (folder.name) {
        const parent = folder.parentId && folder.parentId !== ROOT_FOLDER_ID
          ? migratedFolders.find((item) => item.id === folder.parentId)?.id ?? ROOT_FOLDER_ID
          : ROOT_FOLDER_ID
        migratedFolders.push({
          id: folder.id ?? crypto.randomUUID(),
          name: folder.name,
          parentId: parent,
          order: typeof folder.order === "number" ? folder.order : nextMigratedFolderOrder(migratedFolders, parent),
          createdAt: typeof folder.createdAt === "number" ? folder.createdAt : now,
          updatedAt: typeof folder.updatedAt === "number" ? folder.updatedAt : now,
        })
      }
    }

    const migratedNotes = storedNotes.map((note, index): Note => {
      const folderId = note.folderId && migratedFolders.some((folder) => folder.id === note.folderId)
        ? note.folderId
        : ensureMigratedPath(note.folderPath ?? "")
      return {
        id: note.id,
        title: note.title ?? "新建笔记",
        content: note.content ?? "",
        folderId,
        folderPath: folderPathFromMigratedFolders(migratedFolders, folderId),
        order: typeof note.order === "number" ? note.order : index,
        updatedAt: typeof note.updatedAt === "number" ? note.updatedAt : now,
      }
    })

    return { notes: migratedNotes, folders: migratedFolders }
  }

  function nextMigratedFolderOrder(existing: NoteFolder[], parentId: string) {
    return Math.max(-1, ...existing.filter((folder) => folder.parentId === parentId).map((folder) => folder.order)) + 1
  }

  function folderPathFromMigratedFolders(existing: NoteFolder[], folderId: string) {
    if (folderId === ROOT_FOLDER_ID) return ""
    const names: string[] = []
    let current = existing.find((folder) => folder.id === folderId)
    while (current) {
      names.unshift(current.name)
      current = existing.find((folder) => folder.id === current?.parentId)
    }
    return names.join("/")
  }

  void load()

  return {
    ROOT_FOLDER_ID,
    notes,
    folders,
    folderNodes,
    treeFolders,
    activeId,
    load,
    active,
    create,
    update,
    remove,
    createFolder,
    createFolderIn,
    renameFolder,
    removeFolder,
    moveNote,
    moveFolder,
    folderIdByPath,
    folderPathById,
    notesInFolder,
    normalizeFolderPath,
  }
})
