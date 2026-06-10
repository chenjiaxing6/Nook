<template>
  <div class="notes-page" :class="{ reading: readingMode }">
    <div v-if="current && readingMode" class="reading-shell">
      <aside class="reading-toc">
        <div class="reading-toc-header">
          <span>目录</span>
          <button class="reading-icon-btn" @click="readingMode = false" title="返回编辑">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M8.8 2.2L12 5.4M2 12l3.2-.7L12 3.4 10.6 2 3.3 9.7 2 12z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <nav class="reading-toc-list">
          <button
            v-for="h in headings"
            :key="h.index"
            class="reading-toc-item"
            :class="`toc-h${h.level}`"
            @click="scrollToReadHeading(h)"
          >
            {{ h.text }}
          </button>
          <div v-if="headings.length === 0" class="toc-empty">暂无标题</div>
        </nav>
      </aside>
      <main ref="readContentEl" class="reading-content">
        <div class="reading-topbar">
          <div>
            <h1>{{ current.title || "无标题" }}</h1>
            <span>{{ formatDate(current.updatedAt) }} 更新 · {{ wordCount(current.content) }} 字</span>
          </div>
          <button class="reading-exit-btn" @click="readingMode = false">
            返回编辑
          </button>
        </div>
        <article class="markdown-body" v-html="renderedContent" @click="handleMarkdownClick"></article>
      </main>
    </div>

    <template v-else>
    <aside class="notes-sidebar" @contextmenu.prevent="openSidebarContextMenu">
      <div class="sidebar-header">
        <span class="sidebar-title">笔记</span>
        <div class="sidebar-actions">
          <button class="folder-btn" @click="createFolder" title="新建文件夹">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1.5 4.5V3.2c0-.7.5-1.2 1.2-1.2h2.4l1.2 1.5h5c.7 0 1.2.5 1.2 1.2v5.6c0 .7-.5 1.2-1.2 1.2H2.7c-.7 0-1.2-.5-1.2-1.2V4.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
              <path d="M7 6v4M5 8h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
          </button>
          <button class="new-btn" @click="createNote(selectedFolderId)" title="新建笔记">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="folder-create" v-if="folderInputVisible">
        <input
          ref="folderInputEl"
          v-model="folderDraft"
          placeholder="文件夹/子文件夹"
          @keydown.enter.prevent="confirmFolder"
          @keydown.esc="cancelFolder"
        />
        <button @click="confirmFolder">创建</button>
      </div>
      <div class="sidebar-view-tabs">
        <button :class="{ active: noteDisplayMode === 'compact' }" @click="noteDisplayMode = 'compact'">精简</button>
        <button :class="{ active: noteDisplayMode === 'list' }" @click="noteDisplayMode = 'list'">列表</button>
      </div>
      <div
        class="notes-list"
        :class="{ 'root-drop': dragOverFolder === store.ROOT_FOLDER_ID }"
        :data-drop-folder-id="store.ROOT_FOLDER_ID"
      >
        <template v-for="note in uncategorizedNotes" :key="note.id">
          <div
            class="note-item"
            :class="{ active: note.id === store.activeId, compact: noteDisplayMode !== 'list' }"
            :style="{ paddingLeft: '24px' }"
            @pointerdown="startPointerDrag($event, 'note', note.id)"
            @contextmenu.prevent.stop="openContextMenu($event, { kind: 'note', id: note.id })"
            @click="selectNoteFromClick(note.id)"
          >
            <div class="note-content">
              <div class="note-item-title">{{ note.title || "无标题" }}</div>
              <template v-if="noteDisplayMode === 'list'">
                <div class="note-item-preview">{{ preview(note.content) }}</div>
                <div class="note-item-date">{{ formatDate(note.updatedAt) }}</div>
              </template>
            </div>
            <button class="note-delete-btn" @pointerdown.stop @click.stop="removeNote(note.id)" title="删除笔记">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 3.5h9M5 3.5V2.2c0-.4.3-.7.7-.7h1.6c.4 0 .7.3.7.7v1.3M4.2 5.4v4.1M6.5 5.4v4.1M8.8 5.4v4.1M3 3.5l.6 7.2c.1.5.5.8 1 .8h3.8c.5 0 .9-.3 1-.8l.6-7.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </template>

        <template v-for="item in treeItems" :key="item.key">
          <div v-if="item.kind === 'folder'" class="folder-row-wrap" @contextmenu.prevent.stop="openContextMenu($event, { kind: 'folder', id: item.id })">
            <button
              class="folder-row"
              :class="{ active: selectedFolderId === item.id, drop: dragOverFolder === item.id }"
              :style="{ paddingLeft: `${10 + item.depth * 14}px` }"
              :data-drop-folder-id="item.id"
              @pointerdown="startPointerDrag($event, 'folder', item.id)"
              @click="selectFolderFromClick(item.id)"
            >
              <svg class="folder-chevron" :class="{ open: isFolderOpen(item.id) }" width="12" height="12" viewBox="0 0 12 12" fill="none" @pointerdown.stop @click.stop="selectFolderFromClick(item.id)">
                <path d="M4 2.8L7.2 6 4 9.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M1.5 4.5h10v5.2c0 .7-.5 1.2-1.2 1.2H2.7c-.7 0-1.2-.5-1.2-1.2V4.5zM1.5 4.5V3.3c0-.7.5-1.2 1.2-1.2h2l1.2 1.4h4.4c.7 0 1.2.5 1.2 1.2" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
              </svg>
              <input
                v-if="renamingFolderId === item.id"
                class="folder-rename-input"
                v-model="renameDraft"
                @pointerdown.stop
                @click.stop
                @keydown.enter.prevent.stop="confirmRenameFolder"
                @keydown.esc.prevent.stop="cancelRenameFolder"
                @blur="confirmRenameFolder"
              />
              <span v-else>{{ item.name }}</span>
              <small>{{ item.descendantNoteCount }}</small>
            </button>
            <button class="folder-note-btn" @pointerdown.stop @click="createNote(item.id)" title="在此文件夹中新建笔记">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <div
            v-else
            class="note-item child-note"
            :class="{ active: item.note.id === store.activeId, compact: noteDisplayMode !== 'list' }"
            :style="{ paddingLeft: `${24 + item.depth * 14}px`, '--note-guide-left': `${13 + item.depth * 14}px` }"
            @pointerdown="startPointerDrag($event, 'note', item.note.id)"
            @contextmenu.prevent.stop="openContextMenu($event, { kind: 'note', id: item.note.id })"
            @click="selectNoteFromClick(item.note.id)"
          >
            <div class="note-content">
              <div class="note-item-title">{{ item.note.title || "无标题" }}</div>
              <template v-if="noteDisplayMode === 'list'">
                <div class="note-item-preview">{{ preview(item.note.content) }}</div>
                <div class="note-item-date">{{ formatDate(item.note.updatedAt) }}</div>
              </template>
            </div>
            <button class="note-delete-btn" @pointerdown.stop @click.stop="removeNote(item.note.id)" title="删除笔记">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 3.5h9M5 3.5V2.2c0-.4.3-.7.7-.7h1.6c.4 0 .7.3.7.7v1.3M4.2 5.4v4.1M6.5 5.4v4.1M8.8 5.4v4.1M3 3.5l.6 7.2c.1.5.5.8 1 .8h3.8c.5 0 .9-.3 1-.8l.6-7.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </template>
        <div v-if="store.notes.length === 0" class="notes-empty-hint">
          点击右上角 + 新建笔记
        </div>
      </div>
      <div v-if="pointerDrag.dragging" class="drag-float" :style="{ left: `${pointerDrag.x}px`, top: `${pointerDrag.y}px` }">
        {{ pointerDrag.label }}
      </div>
    </aside>

    <div class="editor-pane" v-if="current">
      <div class="editor-header">
        <input
          class="title-input"
          :value="current.title"
          placeholder="标题"
          @input="store.update(current!.id, { title: ($event.target as HTMLInputElement).value })"
        />
        <button class="read-mode-btn" @click="readingMode = true" title="阅读模式">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M2 3.3c0-.7.5-1.1 1.2-1.1h3c.6 0 1.1.2 1.5.6.4-.4.9-.6 1.5-.6h3c.7 0 1.2.5 1.2 1.1v8.8c0 .4-.4.6-.7.4-.7-.4-1.6-.7-2.5-.7H9c-.6 0-1.1.2-1.5.6-.4-.4-.9-.6-1.5-.6H4.8c-.9 0-1.8.2-2.5.7-.3.2-.7 0-.7-.4V3.3z" stroke="currentColor" stroke-width="1.35" stroke-linejoin="round"/>
            <path d="M7.5 2.8v9.5" stroke="currentColor" stroke-width="1.35" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="editor-body">
        <div class="editor-wrap">
          <VditorEditor :key="current.id" :content="current.content" @change="onContentChange" />
        </div>
        <aside class="toc-panel" :class="{ collapsed: tocCollapsed }">
          <div class="toc-header">
            <span v-if="!tocCollapsed" class="toc-title">目录</span>
            <button class="toc-toggle" @click="tocCollapsed = !tocCollapsed" :title="tocCollapsed ? '展开目录' : '收起目录'">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path :d="tocCollapsed ? 'M9 3L5 7l4 4' : 'M5 3l4 4-4 4'" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <nav v-if="!tocCollapsed" class="toc-list">
            <div v-if="headings.length === 0" class="toc-empty">暂无标题</div>
            <a
              v-for="h in headings"
              :key="h.index"
              class="toc-item"
              :class="`toc-h${h.level}`"
              @click="scrollToHeading(h)"
            >{{ h.text }}</a>
          </nav>
        </aside>
      </div>
      <div class="editor-footer">
        {{ formatDate(current.updatedAt) }} 更新 · {{ wordCount(current.content) }} 字
      </div>
    </div>

    <div class="editor-empty" v-else>
      <div class="empty-icon">📝</div>
      <p>选择或新建一篇笔记</p>
    </div>
    </template>
    <Teleport to="body">
      <div
        v-if="contextMenu"
        class="context-menu"
        :style="{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px`, width: 'fit-content' }"
        @click.stop
      >
        <button v-for="action in contextActions" :key="action.label" @click="runContextAction(action.run)">
          {{ action.label }}
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue"
import { Marked, Renderer } from "marked"
import mermaidScriptUrl from "vditor/dist/js/mermaid/mermaid.min.js?url"
import echartsScriptUrl from "vditor/dist/js/echarts/echarts.min.js?url"
import hljs from "highlight.js/lib/core"
import javascript from "highlight.js/lib/languages/javascript"
import typescript from "highlight.js/lib/languages/typescript"
import python from "highlight.js/lib/languages/python"
import rust from "highlight.js/lib/languages/rust"
import go from "highlight.js/lib/languages/go"
import java from "highlight.js/lib/languages/java"
import css from "highlight.js/lib/languages/css"
import xml from "highlight.js/lib/languages/xml"
import json from "highlight.js/lib/languages/json"
import bash from "highlight.js/lib/languages/bash"
import sql from "highlight.js/lib/languages/sql"
import markdown from "highlight.js/lib/languages/markdown"
import { useNotesStore } from "../stores/notes"
import type { Note, NoteTreeFolder } from "../stores/notes"
import VditorEditor from "../components/VditorEditor.vue"

hljs.registerLanguage("javascript", javascript)
hljs.registerLanguage("js", javascript)
hljs.registerLanguage("typescript", typescript)
hljs.registerLanguage("ts", typescript)
hljs.registerLanguage("python", python)
hljs.registerLanguage("py", python)
hljs.registerLanguage("rust", rust)
hljs.registerLanguage("rs", rust)
hljs.registerLanguage("go", go)
hljs.registerLanguage("java", java)
hljs.registerLanguage("css", css)
hljs.registerLanguage("xml", xml)
hljs.registerLanguage("html", xml)
hljs.registerLanguage("json", json)
hljs.registerLanguage("bash", bash)
hljs.registerLanguage("shell", bash)
hljs.registerLanguage("sh", bash)
hljs.registerLanguage("sql", sql)
hljs.registerLanguage("markdown", markdown)
hljs.registerLanguage("md", markdown)

const store = useNotesStore()
const current = computed(() => store.active())
const tocCollapsed = ref(false)
const readingMode = ref(false)
const readContentEl = ref<HTMLElement>()
const selectedFolderId = ref(store.ROOT_FOLDER_ID)
const folderDraft = ref("")
const folderInputVisible = ref(false)
const folderInputEl = ref<HTMLInputElement>()
const noteDisplayMode = ref<"compact" | "list">("compact")
const openFolders = ref<Set<string>>(new Set())
const dragOverFolder = ref<string | null>(null)
const contextMenu = ref<ContextMenuState | null>(null)
const renamingFolderId = ref("")
const renameDraft = ref("")
const pointerDrag = reactive<PointerDragState>({
  active: false,
  dragging: false,
  kind: null,
  id: "",
  label: "",
  startX: 0,
  startY: 0,
  x: 0,
  y: 0,
})
let mermaidLoadPromise: Promise<void> | null = null
let echartsLoadPromise: Promise<void> | null = null

interface Heading { level: number; text: string; index: number }
type ContextTarget = { kind: "root" } | { kind: "folder"; id: string } | { kind: "note"; id: string }
type ContextMenuState = ContextTarget & { x: number; y: number }
type DragKind = "note" | "folder"
interface PointerDragState {
  active: boolean
  dragging: boolean
  kind: DragKind | null
  id: string
  label: string
  startX: number
  startY: number
  x: number
  y: number
}
type TreeItem =
  | NoteTreeFolder & { key: string }
  | { kind: "note"; key: string; note: Note; depth: number }

const sortedNotes = computed(() => [...store.notes].sort((a, b) => b.updatedAt - a.updatedAt))
const uncategorizedNotes = computed(() => sortedNotes.value.filter((note) => note.folderId === store.ROOT_FOLDER_ID))

const treeItems = computed<TreeItem[]>(() => {
  const items: TreeItem[] = []
  for (const folder of store.treeFolders) {
    if (!isVisibleFolder(folder.id)) continue
    items.push({
      ...folder,
      key: `folder:${folder.id}`,
    })
    if (!isFolderOpen(folder.id)) continue
    for (const note of sortedNotes.value.filter((item) => item.folderId === folder.id)) {
      items.push({ kind: "note", key: `note:${note.id}`, note, depth: folder.depth + 1 })
    }
  }
  return items
})

const contextActions = computed(() => {
  const menu = contextMenu.value
  if (!menu) return []
  if (menu.kind === "note") {
    const id = menu.id
    return [
      { label: "打开", run: () => selectNote(id) },
      { label: "移动到当前文件夹", run: () => moveNote(id, selectedFolderId.value) },
      { label: "删除笔记", run: () => removeNote(id) },
    ]
  }
  if (menu.kind === "root") {
    return [
      { label: "新建笔记", run: () => createNote(store.ROOT_FOLDER_ID) },
      { label: "新建文件夹", run: () => startFolderInput(store.ROOT_FOLDER_ID) },
      ...(current.value ? [
        { label: "当前笔记移到未分类", run: () => moveCurrentNote(store.ROOT_FOLDER_ID) },
      ] : []),
    ]
  }
  const folder = store.treeFolders.find((item) => item.id === menu.id)
  const path = folder?.path ?? ""
  return [
    { label: "新建笔记", run: () => createNote(menu.id) },
    { label: path ? "新建子文件夹" : "新建文件夹", run: () => startFolderInput(menu.id) },
    ...(path ? [
      { label: "重命名文件夹", run: () => startRenameFolder(menu.id) },
      { label: "删除文件夹，保留笔记", run: () => deleteFolder(menu.id, false) },
      { label: "删除文件夹和笔记", run: () => deleteFolder(menu.id, true) },
    ] : []),
  ]
})

const headings = computed<Heading[]>(() => {
  if (!current.value) return []
  return extractHeadings(current.value.content)
})

const renderedContent = computed(() => {
  if (!current.value) return ""
  const renderer = new Renderer()
  const headingOrder = new Map<string, number>()
  renderer.heading = ({ tokens, depth }) => {
    const text = tokens.map((token) => "text" in token ? String(token.text) : "").join("").trim()
    const count = headingOrder.get(text) ?? 0
    headingOrder.set(text, count + 1)
    const id = headingId({ index: headingIndexForRender(text, count), text })
    return `<h${depth} id="${id}">${text}</h${depth}>`
  }
  renderer.code = ({ text, lang }) => {
    const language = (lang ?? "").trim().split(/\s+/)[0]
    if (language === "mermaid" || language === "echarts") {
      return `<div class="language-${language}">${escapeHtml(text)}</div>`
    }
    const highlighted = highlightCode(text, language)
    const className = ` class="hljs${language ? ` language-${escapeHtml(language)}` : ""}"`
    return `<div class="code-block-wrap"><button class="code-copy-btn" data-copy-code="${escapeAttribute(text)}" type="button">复制</button><pre><code${className}>${highlighted}</code></pre></div>`
  }
  return new Marked({ renderer }).parse(current.value.content, { async: false }) as string
})

onMounted(() => {
  window.addEventListener("click", closeContextMenu)
})

watch([renderedContent, readingMode], async () => {
  await nextTick()
  renderReadingBlocks()
}, { flush: "post" })

onBeforeUnmount(() => {
  window.removeEventListener("click", closeContextMenu)
  window.removeEventListener("pointermove", handlePointerMove)
  document.body.classList.remove("notes-pointer-dragging")
})

function extractHeadings(content: string) {
  const lines = content.split("\n")
  const result: Heading[] = []
  lines.forEach((line, i) => {
    const m = line.match(/^(#{1,6})\s+(.+)/)
    if (m) result.push({ level: m[1].length, text: m[2].trim(), index: i })
  })
  return result
}

function scrollToHeading(h: Heading) {
  const editor = document.querySelector(".vditor-reset")
  if (!editor) return
  const headingEls = editor.querySelectorAll("h1,h2,h3,h4,h5,h6")
  let count = 0
  for (const el of headingEls) {
    if (el.tagName.toLowerCase() === `h${h.level}`) {
      if (count === headings.value.filter(x => x.level === h.level && x.index <= h.index).length - 1) {
        el.scrollIntoView({ behavior: "smooth", block: "start" })
        return
      }
      count++
    }
  }
}

function scrollToReadHeading(h: Heading) {
  const id = headingId(h)
  readContentEl.value?.querySelector<HTMLElement>(`#${CSS.escape(id)}`)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  })
}

async function handleMarkdownClick(event: MouseEvent) {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".code-copy-btn")
  if (!button) return
  const code = button.dataset.copyCode ?? ""
  await navigator.clipboard.writeText(code)
  button.textContent = "已复制"
  window.setTimeout(() => {
    button.textContent = "复制"
  }, 1200)
}

async function renderReadingBlocks() {
  await renderReadingDiagrams()
  await renderReadingCharts()
}

async function renderReadingDiagrams() {
  if (!readingMode.value || !readContentEl.value) return
  const blocks = [...readContentEl.value.querySelectorAll<HTMLElement>(".language-mermaid")]
    .filter((block) => block.dataset.processed !== "true")
  if (blocks.length === 0) return
  await ensureMermaid()
  const mermaid = (window as any).mermaid
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    theme: mermaidTheme(),
    flowchart: { htmlLabels: true, useMaxWidth: true },
    sequence: { useMaxWidth: true, showSequenceNumbers: true },
  })
  for (const block of blocks) {
    const code = block.textContent?.trim() ?? ""
    if (!code) continue
    const id = `mermaid-${crypto.randomUUID()}`
    try {
      const result = await mermaid.render(id, code)
      block.innerHTML = result.svg
      block.dataset.processed = "true"
    } catch (error) {
      block.classList.add("mermaid-error")
      block.innerHTML = escapeHtml(error instanceof Error ? error.message : String(error))
      block.dataset.processed = "true"
    }
  }
}

function ensureMermaid() {
  if ((window as any).mermaid) return Promise.resolve()
  if (!mermaidLoadPromise) {
    mermaidLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script")
      script.src = mermaidScriptUrl
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("Mermaid 加载失败"))
      document.head.appendChild(script)
    })
  }
  return mermaidLoadPromise
}

async function renderReadingCharts() {
  if (!readingMode.value || !readContentEl.value) return
  const blocks = [...readContentEl.value.querySelectorAll<HTMLElement>(".language-echarts")]
    .filter((block) => block.dataset.processed !== "true")
  if (blocks.length === 0) return
  await ensureEcharts()
  const echarts = (window as any).echarts
  for (const block of blocks) {
    const code = block.textContent?.trim() ?? ""
    if (!code) continue
    try {
      const option = JSON.parse(code)
      block.innerHTML = ""
      block.dataset.processed = "true"
      const chart = echarts.init(block, mermaidTheme() === "dark" ? "dark" : undefined)
      chart.setOption(option)
      requestAnimationFrame(() => chart.resize())
    } catch (error) {
      block.classList.add("chart-error")
      block.innerHTML = escapeHtml(error instanceof Error ? error.message : String(error))
      block.dataset.processed = "true"
    }
  }
}

function ensureEcharts() {
  if ((window as any).echarts) return Promise.resolve()
  if (!echartsLoadPromise) {
    echartsLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script")
      script.src = echartsScriptUrl
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("ECharts 加载失败"))
      document.head.appendChild(script)
    })
  }
  return echartsLoadPromise
}

function mermaidTheme() {
  const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim()
  if (!bg) return "light"
  const color = bg.startsWith("#") ? bg.slice(1) : ""
  if (color.length !== 6) return "light"
  const r = parseInt(color.slice(0, 2), 16)
  const g = parseInt(color.slice(2, 4), 16)
  const b = parseInt(color.slice(4, 6), 16)
  return (r * 0.299 + g * 0.587 + b * 0.114) < 128 ? "dark" : "light"
}

function headingId(h: Pick<Heading, "index" | "text">) {
  return `note-heading-${h.index}-${h.text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || "title"}`
}

function headingIndexForRender(text: string, occurrence: number) {
  return headings.value.filter((heading) => heading.text === text)[occurrence]?.index ?? occurrence
}

function highlightCode(code: string, language: string) {
  if (language && hljs.getLanguage(language)) {
    return hljs.highlight(code, { language, ignoreIllegals: true }).value
  }
  return hljs.highlightAuto(code).value
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/\n/g, "&#10;")
}

function onContentChange(markdown: string) {
  if (current.value) store.update(current.value.id, { content: markdown })
}

function createNote(folderPath = "") {
  const note = store.create(folderPath)
  selectedFolderId.value = note.folderId
  if (note.folderId !== store.ROOT_FOLDER_ID) openFolderPath(note.folderId)
}

async function createFolder() {
  await startFolderInput(selectedFolderId.value)
}

async function startFolderInput(parentId = store.ROOT_FOLDER_ID) {
  const parentPath = store.folderPathById(parentId)
  folderDraft.value = parentPath ? `${parentPath}/` : ""
  folderInputVisible.value = true
  await nextTick()
  folderInputEl.value?.focus()
}

function confirmFolder() {
  const path = store.normalizeFolderPath(folderDraft.value)
  if (!path) return cancelFolder()
  const folderId = store.createFolder(path)
  selectedFolderId.value = folderId
  openFolderPath(folderId)
  folderDraft.value = ""
  folderInputVisible.value = false
}

function cancelFolder() {
  folderDraft.value = ""
  folderInputVisible.value = false
}

function moveCurrentNote(folderId: string) {
  if (!current.value) return
  store.moveNote(current.value.id, folderId)
  selectedFolderId.value = folderId || store.ROOT_FOLDER_ID
}

function removeNote(id: string) {
  store.remove(id)
  closeContextMenu()
}

function selectNote(id: string) {
  store.activeId = id
  selectedFolderId.value = store.notes.find((note) => note.id === id)?.folderId ?? store.ROOT_FOLDER_ID
  if (selectedFolderId.value !== store.ROOT_FOLDER_ID) openFolderPath(selectedFolderId.value)
  closeContextMenu()
}

function selectNoteFromClick(id: string) {
  if (pointerDrag.dragging) return
  selectNote(id)
}

function selectFolderFromClick(id: string) {
  if (pointerDrag.dragging) return
  selectedFolderId.value = id
  toggleFolder(id)
  closeContextMenu()
}

function isFolderOpen(id: string) {
  return openFolders.value.has(id)
}

function isVisibleFolder(id: string) {
  const folder = store.treeFolders.find((item) => item.id === id)
  if (!folder) return false
  let parentId = folder.parentId
  while (parentId && parentId !== store.ROOT_FOLDER_ID) {
    if (!openFolders.value.has(parentId)) return false
    parentId = store.folderNodes.find((item) => item.id === parentId)?.parentId ?? store.ROOT_FOLDER_ID
  }
  return true
}

function toggleFolder(id: string, forceOpen = false) {
  const next = new Set(openFolders.value)
  if (forceOpen || !next.has(id)) next.add(id)
  else next.delete(id)
  openFolders.value = next
}

function openFolderPath(id: string) {
  const next = new Set(openFolders.value)
  let current = store.folderNodes.find((folder) => folder.id === id)
  while (current) {
    next.add(current.id)
    current = store.folderNodes.find((folder) => folder.id === current?.parentId)
  }
  openFolders.value = next
}

function startPointerDrag(event: PointerEvent, kind: DragKind, id: string) {
  if (event.button !== 0 || renamingFolderId.value) return
  const target = event.target as HTMLElement
  if (target.closest("button, input, select, textarea")) return
  closeContextMenu()
  pointerDrag.active = true
  pointerDrag.dragging = false
  pointerDrag.kind = kind
  pointerDrag.id = id
  pointerDrag.label = dragLabel(kind, id)
  pointerDrag.startX = event.clientX
  pointerDrag.startY = event.clientY
  pointerDrag.x = event.clientX
  pointerDrag.y = event.clientY
  window.addEventListener("pointermove", handlePointerMove)
  window.addEventListener("pointerup", finishPointerDrag, { once: true })
  window.addEventListener("pointercancel", cancelPointerDrag, { once: true })
}

function handlePointerMove(event: PointerEvent) {
  if (!pointerDrag.active) return
  pointerDrag.x = event.clientX + 10
  pointerDrag.y = event.clientY + 10
  const distance = Math.hypot(event.clientX - pointerDrag.startX, event.clientY - pointerDrag.startY)
  if (!pointerDrag.dragging && distance < 6) return
  pointerDrag.dragging = true
  document.body.classList.add("notes-pointer-dragging")
  dragOverFolder.value = findPointerDropFolder(event.clientX, event.clientY)
}

function finishPointerDrag(event: PointerEvent) {
  window.removeEventListener("pointermove", handlePointerMove)
  document.body.classList.remove("notes-pointer-dragging")
  if (pointerDrag.dragging) {
    const targetFolderId = findPointerDropFolder(event.clientX, event.clientY)
    if (targetFolderId) {
      if (pointerDrag.kind === "note") moveNote(pointerDrag.id, targetFolderId)
      else if (pointerDrag.kind === "folder") moveFolder(pointerDrag.id, targetFolderId)
    }
  }
  resetPointerDrag()
}

function cancelPointerDrag() {
  window.removeEventListener("pointermove", handlePointerMove)
  document.body.classList.remove("notes-pointer-dragging")
  resetPointerDrag()
}

function resetPointerDrag() {
  pointerDrag.active = false
  pointerDrag.dragging = false
  pointerDrag.kind = null
  pointerDrag.id = ""
  pointerDrag.label = ""
  dragOverFolder.value = null
}

function findPointerDropFolder(x: number, y: number) {
  const element = document.elementFromPoint(x, y) as HTMLElement | null
  const dropEl = element?.closest<HTMLElement>("[data-drop-folder-id]")
  const folderId = dropEl?.dataset.dropFolderId
  if (!folderId) return null
  if (pointerDrag.kind === "folder" && (folderId === pointerDrag.id || isDescendantFolder(folderId, pointerDrag.id))) return null
  return folderId
}

function dragLabel(kind: DragKind, id: string) {
  if (kind === "note") return store.notes.find((note) => note.id === id)?.title || "无标题"
  return store.treeFolders.find((folder) => folder.id === id)?.name || "文件夹"
}

function moveNote(id: string, folderId: string) {
  store.moveNote(id, folderId)
  selectedFolderId.value = folderId || store.ROOT_FOLDER_ID
  if (selectedFolderId.value !== store.ROOT_FOLDER_ID) openFolderPath(selectedFolderId.value)
  closeContextMenu()
}

function moveFolder(id: string, targetFolderId: string) {
  store.moveFolder(id, targetFolderId)
  selectedFolderId.value = id
  openFolderPath(id)
}

function openContextMenu(event: MouseEvent, target: ContextTarget) {
  const menuWidth = 128
  const menuHeight = 190
  const x = Math.min(event.clientX + 8, window.innerWidth - menuWidth - 8)
  const y = Math.min(event.clientY + 8, window.innerHeight - menuHeight - 8)
  contextMenu.value = {
    ...target,
    x: Math.max(8, x),
    y: Math.max(8, y),
  }
}

function openSidebarContextMenu(event: MouseEvent) {
  openContextMenu(event, { kind: "root" })
}

function closeContextMenu() {
  contextMenu.value = null
}

function runContextAction(run: () => void) {
  run()
  closeContextMenu()
}

async function startRenameFolder(id: string) {
  renamingFolderId.value = id
  renameDraft.value = store.treeFolders.find((folder) => folder.id === id)?.name ?? ""
  await nextTick()
  const input = document.querySelector<HTMLInputElement>(".folder-rename-input")
  input?.focus()
  input?.select()
}

function confirmRenameFolder() {
  const id = renamingFolderId.value
  if (!id) return
  const name = renameDraft.value.trim()
  if (!name) return cancelRenameFolder()
  store.renameFolder(id, name)
  selectedFolderId.value = id
  openFolderPath(id)
  cancelRenameFolder()
}

function cancelRenameFolder() {
  renamingFolderId.value = ""
  renameDraft.value = ""
}

function deleteFolder(id: string, deleteNotes: boolean) {
  const descendantIds = new Set(store.treeFolders.filter((folder) => folder.id === id || isDescendantFolder(folder.id, id)).map((folder) => folder.id))
  store.removeFolder(id, deleteNotes)
  selectedFolderId.value = store.ROOT_FOLDER_ID
  const next = new Set(openFolders.value)
  for (const folder of next) {
    if (descendantIds.has(folder)) next.delete(folder)
  }
  openFolders.value = next
}

function isDescendantFolder(id: string, ancestorId: string) {
  let current = store.folderNodes.find((folder) => folder.id === id)
  while (current) {
    if (current.parentId === ancestorId) return true
    current = store.folderNodes.find((folder) => folder.id === current?.parentId)
  }
  return false
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
}

function preview(content: string) {
  return content.replace(/\n/g, " ").slice(0, 60) || "暂无内容"
}

function wordCount(content: string) {
  return content.replace(/\s/g, "").length
}
</script>

<style scoped>
.notes-page {
  display: flex;
  height: 100%;
  overflow: hidden;
  background: var(--bg);
  padding: 20px 24px 24px;
  gap: 16px;
}

.notes-page.reading {
  display: block;
  padding: 0;
}

.reading-shell {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  height: 100%;
  min-height: 0;
  background: var(--bg);
}

.reading-toc {
  min-height: 0;
  border-right: 1px solid var(--border);
  background: color-mix(in srgb, var(--card-bg) 92%, var(--bg) 8%);
  display: flex;
  flex-direction: column;
}

.reading-toc-header {
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px 0 18px;
  border-bottom: 1px solid var(--border);
  color: var(--text);
  font-size: 13px;
  font-weight: 700;
}

.reading-icon-btn,
.read-mode-btn {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--input-bg);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.reading-icon-btn:hover,
.read-mode-btn:hover {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 34%, var(--border) 66%);
  background: var(--accent-light);
}

.reading-toc-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 10px;
}

.reading-toc-list::-webkit-scrollbar,
.reading-content::-webkit-scrollbar { width: 3px; }
.reading-toc-list::-webkit-scrollbar-thumb,
.reading-content::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

.reading-toc-item {
  width: 100%;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  line-height: 1.45;
  padding: 6px 8px;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reading-toc-item:hover {
  background: var(--hover);
  color: var(--accent);
}

.reading-content {
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  background: var(--card-bg);
}

.reading-topbar {
  position: sticky;
  top: 0;
  z-index: 2;
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px clamp(24px, 5vw, 72px);
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--card-bg) 94%, transparent);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.reading-topbar h1 {
  margin: 0 0 4px;
  color: var(--text);
  font-size: 24px;
  font-weight: 760;
  letter-spacing: 0;
  line-height: 1.25;
}

.reading-topbar span {
  color: var(--text-muted);
  font-size: 12px;
}

.reading-exit-btn {
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--input-bg);
  color: var(--text-secondary);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 650;
  padding: 7px 10px;
  white-space: nowrap;
}

.reading-exit-btn:hover {
  color: var(--accent);
  border-color: color-mix(in srgb, var(--accent) 34%, var(--border) 66%);
  background: var(--accent-light);
}

.markdown-body {
  max-width: 860px;
  margin: 0 auto;
  padding: 34px clamp(24px, 5vw, 72px) 80px;
  color: var(--text);
  font-size: 15px;
  line-height: 1.82;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4),
.markdown-body :deep(h5),
.markdown-body :deep(h6) {
  color: var(--text);
  line-height: 1.35;
  letter-spacing: 0;
  margin: 1.6em 0 0.65em;
  scroll-margin-top: 92px;
}

.markdown-body :deep(h1) { font-size: 28px; }
.markdown-body :deep(h2) { font-size: 22px; }
.markdown-body :deep(h3) { font-size: 18px; }
.markdown-body :deep(p) { margin: 0 0 1em; }
.markdown-body :deep(a) { color: var(--accent); }
.markdown-body :deep(ul),
.markdown-body :deep(ol) { padding-left: 1.5em; margin: 0 0 1em; }
.markdown-body :deep(blockquote) {
  margin: 1.2em 0;
  padding: 0.2em 0 0.2em 1em;
  border-left: 3px solid color-mix(in srgb, var(--accent) 38%, var(--border) 62%);
  color: var(--text-secondary);
}
.markdown-body :deep(.code-block-wrap) {
  position: relative;
  margin: 1.2em 0;
}
.markdown-body :deep(.code-copy-btn) {
  position: absolute;
  right: 8px;
  top: 8px;
  z-index: 1;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: color-mix(in srgb, var(--card-bg) 88%, transparent);
  color: var(--text-muted);
  cursor: pointer;
  font: inherit;
  font-size: 11px;
  font-weight: 650;
  opacity: 0;
  padding: 4px 7px;
  transition: opacity 0.15s, color 0.15s, background 0.15s;
}
.markdown-body :deep(.code-block-wrap:hover .code-copy-btn) {
  opacity: 1;
}
.markdown-body :deep(.code-copy-btn:hover) {
  color: var(--accent);
  background: var(--accent-light);
}
.markdown-body :deep(pre) {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--input-bg) 78%, var(--card-bg) 22%);
  margin: 0;
  padding: 34px 12px 12px;
}
.markdown-body :deep(code) {
  border-radius: 5px;
  background: color-mix(in srgb, var(--input-bg) 82%, var(--card-bg) 18%);
  font-size: 0.92em;
  padding: 0.1em 0.35em;
}
.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
}
.markdown-body :deep(.hljs) {
  color: var(--text-secondary);
}
.markdown-body :deep(.hljs-keyword),
.markdown-body :deep(.hljs-selector-tag),
.markdown-body :deep(.hljs-built_in),
.markdown-body :deep(.hljs-name) {
  color: #cf5f88;
}
.markdown-body :deep(.hljs-string),
.markdown-body :deep(.hljs-title),
.markdown-body :deep(.hljs-section),
.markdown-body :deep(.hljs-attribute) {
  color: #3d8f68;
}
.markdown-body :deep(.hljs-number),
.markdown-body :deep(.hljs-literal),
.markdown-body :deep(.hljs-symbol),
.markdown-body :deep(.hljs-bullet) {
  color: #b7791f;
}
.markdown-body :deep(.hljs-comment),
.markdown-body :deep(.hljs-quote) {
  color: var(--text-muted);
}
.markdown-body :deep(.hljs-variable),
.markdown-body :deep(.hljs-template-variable),
.markdown-body :deep(.hljs-tag),
.markdown-body :deep(.hljs-regexp) {
  color: #2f7fd6;
}
.markdown-body :deep(.language-mermaid) {
  display: block;
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--input-bg) 62%, var(--card-bg) 38%);
  padding: 16px;
  text-align: center;
}
.markdown-body :deep(.language-echarts) {
  display: block;
  min-height: 420px;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--input-bg) 62%, var(--card-bg) 38%);
  padding: 0;
}
.markdown-body :deep(.language-mermaid svg) {
  max-width: 100%;
  height: auto;
}
.markdown-body :deep(.language-mermaid.mermaid-error),
.markdown-body :deep(.language-echarts.chart-error) {
  color: var(--destructive);
  text-align: left;
  white-space: pre-wrap;
  min-height: 0;
  padding: 16px;
}
.markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.2em 0;
}
.markdown-body :deep(th),
.markdown-body :deep(td) {
  border: 1px solid var(--border);
  padding: 8px 10px;
  text-align: left;
}
.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: 8px;
}

.notes-sidebar {
  width: 252px;
  flex-shrink: 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.sidebar-title {
  font-size: 20px;
  font-weight: 760;
  color: var(--text);
  letter-spacing: 0;
}

.sidebar-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.new-btn,
.folder-btn {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  border: 1px solid var(--border);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.folder-btn {
  background: var(--input-bg);
  color: var(--text-secondary);
}
.folder-btn:hover { color: var(--accent); border-color: var(--accent); }

.new-btn {
  border-color: var(--accent);
  background: var(--accent);
  color: #fff;
}
.new-btn:hover { background: var(--accent-hover); }

.folder-create {
  display: flex;
  gap: 6px;
  padding: 10px;
  border-bottom: 1px solid var(--border);
}

.folder-create input {
  min-width: 0;
  flex: 1;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--input-bg);
  color: var(--text);
  font: inherit;
  font-size: 12px;
  outline: none;
  padding: 7px 9px;
}

.folder-create input:focus {
  border-color: var(--accent);
}

.folder-create button {
  border: 1px solid var(--accent);
  border-radius: 7px;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 650;
  padding: 0 9px;
}

.sidebar-view-tabs {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2px;
  padding: 8px;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--card-bg) 88%, var(--bg) 12%);
}

.sidebar-view-tabs button {
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 650;
  padding: 6px 4px;
  transition: background 0.15s, color 0.15s;
}

.sidebar-view-tabs button:hover {
  color: var(--text-secondary);
  background: var(--hover);
}

.sidebar-view-tabs button.active {
  color: var(--accent);
  background: var(--accent-light);
}

.notes-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border: 1px solid transparent;
  border-radius: 8px;
}
.notes-list.root-drop {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent-light) 28%, transparent);
}
.notes-list::-webkit-scrollbar { width: 3px; }
.notes-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

.folder-row-wrap {
  position: relative;
}

.folder-row {
  width: 100%;
  min-height: 30px;
  display: flex;
  align-items: center;
  gap: 7px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  touch-action: none;
  user-select: none;
  font: inherit;
  padding: 6px 30px 6px 10px;
  text-align: left;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
}

.folder-row:hover,
.folder-row.active,
.folder-row.drop {
  background: color-mix(in srgb, var(--input-bg) 72%, transparent);
  border-color: transparent;
  color: var(--text);
}

.folder-row.active {
  color: var(--accent);
  background: color-mix(in srgb, var(--accent-light) 48%, transparent);
  border-color: transparent;
  box-shadow: none;
}

.folder-row.drop {
  background: color-mix(in srgb, var(--accent-light) 52%, transparent);
  border-color: transparent;
  box-shadow: none;
}

.folder-chevron,
.chevron-placeholder {
  flex: 0 0 auto;
}

.folder-chevron {
  color: var(--text-muted);
  transition: transform 0.15s, color 0.15s;
}

.folder-chevron.open {
  transform: rotate(90deg);
  color: var(--accent);
}

.folder-row span {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  font-weight: 650;
}

.folder-rename-input {
  min-width: 0;
  flex: 1;
  border: 1px solid var(--accent);
  border-radius: 6px;
  background: var(--card-bg);
  color: var(--text);
  font: inherit;
  font-size: 12px;
  font-weight: 650;
  outline: none;
  padding: 3px 6px;
}

.folder-row small {
  color: var(--text-muted);
  font-size: 11px;
}

.folder-note-btn {
  position: absolute;
  right: 5px;
  top: 50%;
  width: 22px;
  height: 22px;
  transform: translateY(-50%);
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s, background 0.15s, color 0.15s;
}

.folder-row-wrap:hover .folder-note-btn {
  opacity: 1;
}

.folder-note-btn:hover {
  background: var(--accent-light);
  color: var(--accent);
}

.list-section-label {
  margin: 10px 2px 4px;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.4px;
}

.note-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 8px 9px 10px;
  cursor: pointer;
  touch-action: none;
  user-select: none;
  transition: background 0.12s;
  border-radius: 8px;
  border: 1px solid transparent;
}
.note-item:hover { background: var(--hover); }
.note-item.active {
  background: color-mix(in srgb, var(--accent-light) 58%, transparent);
  border-color: transparent;
  box-shadow: none;
}
.note-item { cursor: grab; }
.note-item:active { cursor: grabbing; }
.note-item.compact {
  min-height: 30px;
  padding-top: 6px;
  padding-bottom: 6px;
}

.list-note {
  padding-left: 10px;
}

.child-note::before {
  content: "";
  position: absolute;
  left: var(--note-guide-left, 17px);
  top: 7px;
  bottom: 7px;
  width: 1px;
  background: color-mix(in srgb, var(--text-muted) 28%, transparent);
  opacity: 0.55;
}

.note-content {
  min-width: 0;
  flex: 1;
}

.note-item-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 3px;
}
.note-item.active .note-item-title { color: var(--accent); }

.note-item-preview {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 3px;
}

.note-item-date {
  font-size: 11px;
  color: var(--text-muted);
}

.note-delete-btn {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s, background 0.15s;
}

.note-item:hover .note-delete-btn,
.note-item.active .note-delete-btn {
  opacity: 1;
}

.note-delete-btn:hover {
  color: var(--destructive);
  background: rgba(255, 59, 48, 0.1);
}

.notes-empty-hint {
  padding: 24px 8px;
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
  line-height: 1.6;
}

.context-menu {
  position: fixed;
  z-index: 10000;
  display: inline-flex;
  flex-direction: column;
  align-items: stretch;
  width: fit-content;
  min-width: 96px;
  max-width: calc(100vw - 16px);
  padding: 5px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card-bg);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.16);
}

.context-menu button {
  display: block;
  width: auto;
  min-width: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  padding: 7px 10px;
  text-align: left;
  white-space: nowrap;
}

.context-menu button:hover {
  background: var(--hover);
  color: var(--accent);
}

.drag-float {
  position: fixed;
  z-index: 40;
  max-width: 180px;
  pointer-events: none;
  border: 1px solid color-mix(in srgb, var(--accent) 34%, var(--border) 66%);
  border-radius: 7px;
  background: var(--card-bg);
  color: var(--text);
  box-shadow: 0 14px 32px rgba(0, 0, 0, 0.18);
  font-size: 12px;
  font-weight: 650;
  overflow: hidden;
  padding: 7px 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.notes-pointer-dragging) {
  cursor: grabbing;
  user-select: none;
}

.editor-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: var(--card-shadow);
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px 12px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
}

.title-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text);
  font-size: 24px;
  font-weight: 760;
  font-family: inherit;
  outline: none;
  letter-spacing: -0.4px;
}
.title-input::placeholder { color: var(--text-muted); }

.editor-wrap {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--card-bg);
}

.editor-body {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
}

/* ── TOC ── */
.toc-panel {
  width: 200px;
  flex-shrink: 0;
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  background: var(--sidebar-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  transition: width 0.2s ease;
  overflow: hidden;
}
.toc-panel.collapsed {
  width: 36px;
}

.toc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 10px 10px;
  flex-shrink: 0;
}
.toc-panel.collapsed .toc-header {
  justify-content: center;
}

.toc-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  white-space: nowrap;
}

.toc-toggle {
  width: 22px;
  height: 22px;
  border: none;
  background: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  flex-shrink: 0;
  transition: color 0.15s, background 0.15s;
}
.toc-toggle:hover { color: var(--text); background: var(--hover); }

.toc-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 16px;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.toc-list::-webkit-scrollbar { width: 2px; }
.toc-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 1px; }

.toc-item {
  display: block;
  font-size: 12px;
  color: var(--text-secondary);
  padding: 4px 8px;
  border-radius: 5px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: background 0.12s, color 0.12s;
  line-height: 1.4;
}
.toc-item:hover { background: var(--hover); color: var(--accent); }
.toc-h1 { font-weight: 600; }
.toc-h2 { padding-left: 16px; }
.toc-h3 { padding-left: 24px; font-size: 11.5px; color: var(--text-muted); }
.toc-h4, .toc-h5, .toc-h6 { padding-left: 32px; font-size: 11px; color: var(--text-muted); }

.toc-empty {
  font-size: 12px;
  color: var(--text-muted);
  padding: 8px;
  opacity: 0.6;
}

.editor-footer {
  padding: 8px 18px;
  font-size: 11px;
  color: var(--text-muted);
  flex-shrink: 0;
  opacity: 0.7;
  border-top: 1px solid var(--border);
  background: color-mix(in srgb, var(--card-bg) 82%, var(--bg) 18%);
}

.editor-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
}
.editor-empty .empty-icon { font-size: 40px; opacity: 0.3; }
.editor-empty p { font-size: 14px; }

@media (max-width: 900px) {
  .notes-page {
    padding: 18px;
    flex-direction: column;
  }

  .notes-sidebar {
    width: 100%;
    max-height: 240px;
  }

  .toc-panel {
    display: none;
  }
}
</style>
