<template>
  <div class="notes-page">
    <aside class="notes-sidebar">
      <div class="sidebar-header">
        <span class="sidebar-title">笔记</span>
        <button class="new-btn" @click="store.create()" title="新建笔记">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <div class="notes-list">
        <div
          v-for="note in store.notes"
          :key="note.id"
          class="note-item"
          :class="{ active: note.id === store.activeId }"
          @click="store.activeId = note.id"
        >
          <div class="note-item-title">{{ note.title || "无标题" }}</div>
          <div class="note-item-preview">{{ preview(note.content) }}</div>
          <div class="note-item-date">{{ formatDate(note.updatedAt) }}</div>
        </div>
        <div v-if="store.notes.length === 0" class="notes-empty-hint">
          点击右上角 + 新建笔记
        </div>
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
        <button class="del-note-btn" @click="store.remove(current!.id)" title="删除笔记">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <path d="M2 4h11M5 4V2.5a.5.5 0 01.5-.5h4a.5.5 0 01.5.5V4M6 7v4M9 7v4M3 4l.8 8.5a.5.5 0 00.5-.5h6.4a.5.5 0 00.5-.5L12 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { useNotesStore } from "../stores/notes"
import VditorEditor from "../components/VditorEditor.vue"

const store = useNotesStore()
const current = computed(() => store.active())
const tocCollapsed = ref(false)

interface Heading { level: number; text: string; index: number }

const headings = computed<Heading[]>(() => {
  if (!current.value) return []
  const lines = current.value.content.split("\n")
  const result: Heading[] = []
  lines.forEach((line, i) => {
    const m = line.match(/^(#{1,6})\s+(.+)/)
    if (m) result.push({ level: m[1].length, text: m[2].trim(), index: i })
  })
  return result
})

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

function onContentChange(markdown: string) {
  if (current.value) store.update(current.value.id, { content: markdown })
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
.notes-page { display: flex; height: 100%; overflow: hidden; background: var(--bg); }

.notes-sidebar {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  background: var(--sidebar-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px 12px;
  flex-shrink: 0;
}

.sidebar-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  letter-spacing: -0.2px;
}

.new-btn {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  border: none;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.new-btn:hover { background: var(--accent-hover); }

.notes-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.notes-list::-webkit-scrollbar { width: 3px; }
.notes-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

.note-item {
  padding: 9px 10px;
  cursor: pointer;
  transition: background 0.12s;
  border-radius: 8px;
}
.note-item:hover { background: var(--hover); }
.note-item.active { background: var(--accent-light); }

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

.notes-empty-hint {
  padding: 24px 8px;
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
  line-height: 1.6;
}

.editor-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  background: var(--bg);
}

.editor-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 22px 32px 10px;
  flex-shrink: 0;
}

.title-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text);
  font-size: 22px;
  font-weight: 700;
  font-family: inherit;
  outline: none;
  letter-spacing: -0.4px;
}
.title-input::placeholder { color: var(--text-muted); }

.del-note-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  opacity: 0;
  transition: color 0.15s, background 0.15s, opacity 0.15s;
  flex-shrink: 0;
}
.editor-header:hover .del-note-btn { opacity: 1; }
.del-note-btn:hover { color: var(--destructive); background: rgba(255, 59, 48, 0.1); }

.editor-wrap {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
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
  padding: 8px 32px;
  font-size: 11px;
  color: var(--text-muted);
  flex-shrink: 0;
  opacity: 0.7;
}

.editor-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-muted);
}
.editor-empty .empty-icon { font-size: 40px; opacity: 0.3; }
.editor-empty p { font-size: 14px; }
</style>
