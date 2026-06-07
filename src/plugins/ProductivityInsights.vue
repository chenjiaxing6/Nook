<template>
  <section class="insights-plugin">
    <header class="plugin-header">
      <div>
        <p class="eyebrow">今日概览</p>
        <h2>效率洞察</h2>
      </div>
      <div class="completion-ring" :style="{ '--progress': completionRate }">
        <span>{{ completionRate }}%</span>
      </div>
    </header>

    <div class="metrics-grid">
      <article class="metric-card">
        <span class="metric-label">待办总数</span>
        <strong>{{ totalTodos }}</strong>
      </article>
      <article class="metric-card">
        <span class="metric-label">已完成</span>
        <strong>{{ doneTodos }}</strong>
      </article>
      <article class="metric-card">
        <span class="metric-label">未完成</span>
        <strong>{{ openTodos }}</strong>
      </article>
      <article class="metric-card">
        <span class="metric-label">笔记数量</span>
        <strong>{{ noteCount }}</strong>
      </article>
    </div>

    <div class="content-grid">
      <section class="panel">
        <div class="panel-title">
          <h3>最近完成</h3>
          <span>{{ completedTodos.length }} 条</span>
        </div>
        <ul v-if="recentCompleted.length" class="item-list">
          <li v-for="todo in recentCompleted" :key="todo.id">
            <span class="status-dot done"></span>
            <div>
              <strong>{{ todo.text }}</strong>
              <small>{{ formatTime(todo.doneAt) }}</small>
            </div>
          </li>
        </ul>
        <p v-else class="empty-text">还没有完成记录</p>
      </section>

      <section class="panel">
        <div class="panel-title">
          <h3>最近笔记</h3>
          <span>{{ noteCount }} 篇</span>
        </div>
        <ul v-if="recentNotes.length" class="item-list">
          <li v-for="note in recentNotes" :key="note.id">
            <span class="status-dot note"></span>
            <div>
              <strong>{{ note.title || "未命名笔记" }}</strong>
              <small>{{ formatTime(note.updatedAt) }}</small>
            </div>
          </li>
        </ul>
        <p v-else class="empty-text">还没有笔记</p>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useNotesStore } from "../stores/notes"
import { useTodoStore } from "../stores/todo"

const todoStore = useTodoStore()
const notesStore = useNotesStore()

const totalTodos = computed(() => todoStore.todos.length)
const doneTodos = computed(() => todoStore.todos.filter((todo) => todo.done).length)
const openTodos = computed(() => totalTodos.value - doneTodos.value)
const noteCount = computed(() => notesStore.notes.length)
const completedTodos = computed(() => todoStore.completed())
const recentCompleted = computed(() => completedTodos.value.slice(0, 5))
const recentNotes = computed(() =>
  [...notesStore.notes].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5)
)
const completionRate = computed(() =>
  totalTodos.value === 0 ? 0 : Math.round((doneTodos.value / totalTodos.value) * 100)
)

function formatTime(timestamp?: number) {
  if (!timestamp) return "未知时间"
  return new Intl.DateTimeFormat("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp)
}
</script>

<style scoped>
.insights-plugin {
  height: 100%;
  padding: 24px;
  overflow: auto;
  color: var(--text);
}

.plugin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.eyebrow {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
}

h2 {
  font-size: 24px;
  font-weight: 700;
}

.completion-ring {
  --progress: 0;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: conic-gradient(var(--success) calc(var(--progress) * 1%), var(--input-bg) 0);
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}

.completion-ring span {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--card-bg);
  font-weight: 700;
  font-size: 15px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(120px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.metric-card,
.panel {
  border: 1px solid var(--border);
  background: var(--input-bg);
  border-radius: 8px;
}

.metric-card {
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.metric-label {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
}

.metric-card strong {
  font-size: 26px;
  line-height: 1;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.panel {
  min-height: 260px;
  padding: 16px;
}

.panel-title {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 12px;
}

.panel-title h3 {
  font-size: 15px;
  font-weight: 700;
}

.panel-title span {
  color: var(--text-muted);
  font-size: 12px;
}

.item-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item-list li {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 10px;
  border-radius: 8px;
  background: var(--card-bg);
  border: 1px solid var(--border);
}

.item-list strong {
  display: block;
  max-width: 100%;
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-list small {
  display: block;
  color: var(--text-muted);
  font-size: 12px;
  margin-top: 3px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex: 0 0 auto;
  margin-top: 5px;
}

.status-dot.done { background: var(--success); }
.status-dot.note { background: var(--accent); }

.empty-text {
  color: var(--text-muted);
  font-size: 13px;
  padding: 28px 0;
  text-align: center;
}

@media (max-width: 820px) {
  .metrics-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .plugin-header {
    align-items: flex-start;
  }
}
</style>
