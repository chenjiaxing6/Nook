<template>
  <div class="vditor-wrap">
    <div ref="el" class="vditor-container" />
    <button class="toolbar-toggle" :class="{ active: toolbarVisible }" @click="toggleToolbar" title="工具栏">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <rect x="1" y="3" width="12" height="1.5" rx="0.75" fill="currentColor"/>
        <rect x="1" y="6.25" width="8" height="1.5" rx="0.75" fill="currentColor"/>
        <rect x="1" y="9.5" width="10" height="1.5" rx="0.75" fill="currentColor"/>
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue"
import Vditor from "vditor"
import "vditor/dist/index.css"
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

hljs.registerLanguage("javascript", javascript)
hljs.registerLanguage("typescript", typescript)
hljs.registerLanguage("python", python)
hljs.registerLanguage("rust", rust)
hljs.registerLanguage("go", go)
hljs.registerLanguage("java", java)
hljs.registerLanguage("css", css)
hljs.registerLanguage("xml", xml)
hljs.registerLanguage("html", xml)
hljs.registerLanguage("json", json)
hljs.registerLanguage("bash", bash)
hljs.registerLanguage("shell", bash)
hljs.registerLanguage("sql", sql)
hljs.registerLanguage("markdown", markdown)

;(window as any).hljs = hljs

const props = defineProps<{ content: string }>()
const emit = defineEmits<{ change: [markdown: string] }>()

const el = ref<HTMLElement>()
const toolbarVisible = ref(false)
let vd: Vditor | null = null

function toggleToolbar() {
  toolbarVisible.value = !toolbarVisible.value
  const toolbar = el.value?.querySelector<HTMLElement>(".vditor-toolbar")
  if (toolbar) toolbar.style.display = toolbarVisible.value ? "" : "none"
}

onMounted(() => {
  vd = new Vditor(el.value!, {
    mode: "ir",
    height: "100%",
    minHeight: 200,
    placeholder: "开始写作…",
    value: props.content,
    toolbar: [
      "headings", "bold", "italic", "strike", "|",
      "line", "quote", "list", "ordered-list", "check", "|",
      "code", "inline-code", "link", "table", "|",
      "undo", "redo",
    ],
    cache: { enable: false },
    after() {
      const toolbar = el.value?.querySelector<HTMLElement>(".vditor-toolbar")
      if (toolbar) toolbar.style.display = "none"
    },
    input(value) {
      emit("change", value)
    },
  })
})

onBeforeUnmount(() => {
  vd?.destroy()
  vd = null
})

watch(() => props.content, (val) => {
  if (vd && vd.getValue() !== val) {
    vd.setValue(val)
  }
})
</script>

<style>
.vditor-wrap {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.vditor-container {
  flex: 1;
  min-height: 0;
}

.vditor-container .vditor {
  height: 100% !important;
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  background: var(--bg) !important;
  color: var(--text) !important;
}

.vditor-container .vditor-toolbar {
  border-bottom: 1px solid var(--border) !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  background: var(--card-bg) !important;
}

.vditor-container .vditor-toolbar__item button {
  color: var(--text-secondary) !important;
  border-radius: 7px !important;
}

.vditor-container .vditor-toolbar__item button:hover {
  background: var(--hover) !important;
  color: var(--accent) !important;
}

.vditor-container .vditor-toolbar__divider {
  border-left-color: var(--border) !important;
}

.vditor-container .vditor-content,
.vditor-container .vditor-ir,
.vditor-container .vditor-ir pre,
.vditor-container .vditor-wysiwyg,
.vditor-container .vditor-sv {
  background: var(--bg) !important;
  color: var(--text) !important;
}

.vditor-container .vditor-reset {
  color: var(--text-secondary) !important;
}

.vditor-container .vditor-reset h1,
.vditor-container .vditor-reset h2,
.vditor-container .vditor-reset h3,
.vditor-container .vditor-reset h4,
.vditor-container .vditor-reset h5,
.vditor-container .vditor-reset h6,
.vditor-container .vditor-ir__node--expand {
  color: var(--text) !important;
}

.vditor-container .vditor-reset a {
  color: var(--accent) !important;
}

.vditor-container .vditor-reset blockquote {
  border-left-color: var(--accent) !important;
  background: var(--accent-light) !important;
  color: var(--text-secondary) !important;
}

.vditor-container .vditor-reset code:not(.hljs) {
  background: var(--input-bg) !important;
  color: var(--accent) !important;
}

.vditor-container .vditor-reset pre,
.vditor-container .vditor-reset pre code,
.vditor-container .vditor-reset .hljs {
  background: var(--input-bg) !important;
  color: var(--text-secondary) !important;
}

.vditor-container .vditor-reset table tr {
  background: transparent !important;
  border-top-color: var(--border) !important;
}

.vditor-container .vditor-reset table th,
.vditor-container .vditor-reset table td {
  border-color: var(--border) !important;
}

.vditor-container .vditor-reset table tr:nth-child(2n),
.vditor-container .vditor-reset table th {
  background: var(--input-bg) !important;
}

.vditor-container .vditor-ir__marker,
.vditor-container .vditor-ir__node--expand .vditor-ir__marker {
  color: var(--text-muted) !important;
}

.vditor-container .vditor-ir__preview {
  color: var(--text) !important;
}

.vditor-container .vditor-ir__node--focus,
.vditor-container .vditor-wysiwyg__block--current {
  background: var(--hover) !important;
}

.vditor-container .vditor-outline,
.vditor-container .vditor-hint,
.vditor-container .vditor-panel,
.vditor-container .vditor-menu,
.vditor-container .vditor-toolbar__item--current,
.vditor-container .vditor-toolbar__item--current button {
  background: var(--card-bg) !important;
  color: var(--text-secondary) !important;
  border-color: var(--border) !important;
}

.vditor-container textarea,
.vditor-container input {
  color: var(--text) !important;
  background: var(--bg) !important;
}

.vditor-container ::selection {
  background: var(--accent-light);
}

.toolbar-toggle {
  position: absolute;
  top: 8px;
  right: 12px;
  width: 26px;
  height: 26px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--card-bg);
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--card-shadow);
  transition: color 0.15s, background 0.15s, border-color 0.15s;
  z-index: 10;
}

.toolbar-toggle:hover {
  color: var(--text);
  border-color: var(--accent);
}

.toolbar-toggle.active {
  color: var(--accent);
  background: var(--accent-light);
  border-color: var(--accent);
}
</style>
