<template>
  <div class="todo-page">
    <div class="page-header">
      <h1>待办事项</h1>
      <span class="stats-badge">{{ pendingCount }} 项待完成</span>
    </div>

    <form class="add-form" @submit.prevent="handleAdd">
      <div class="input-wrap">
        <svg class="input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.3"/>
          <path d="M5.5 8h5M8 5.5v5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        </svg>
        <input v-model="input" placeholder="添加新任务…" maxlength="200" @keydown.enter.prevent="handleAdd" />
      </div>
      <button type="submit" :disabled="!input.trim()">添加</button>
    </form>

    <div class="todo-sections">
      <div class="section" v-if="pending.length">
        <div class="section-label">待完成 · {{ pending.length }}</div>
        <ul class="todo-list">
          <li v-for="item in pending" :key="item.id" class="todo-item">
            <button class="check-btn" @click="store.toggle(item.id)">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="8" stroke="var(--border-strong)" stroke-width="1.5"/>
              </svg>
            </button>
            <span class="todo-text">{{ item.text }}</span>
            <button class="del-btn" @click="store.remove(item.id)">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </li>
        </ul>
      </div>

      <div class="section" v-if="done.length">
        <div class="section-label done-label">已完成 · {{ done.length }}</div>
        <ul class="todo-list">
          <li v-for="item in done" :key="item.id" class="todo-item done">
            <button class="check-btn checked" @click="store.toggle(item.id)">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="8" fill="var(--accent)" stroke="var(--accent)" stroke-width="1.5"/>
                <path d="M5.5 9l2.5 2.5 4.5-5" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <span class="todo-text">{{ item.text }}</span>
            <button class="del-btn" @click="store.remove(item.id)">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </button>
          </li>
        </ul>
      </div>

      <div class="empty-state" v-if="store.todos.length === 0">
        <div class="empty-icon">✦</div>
        <p>暂无待办事项</p>
        <span>在上方输入框添加你的第一个任务</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { useTodoStore } from "../stores/todo"

const store = useTodoStore()
const input = ref("")

const pending = computed(() => store.todos.filter((t) => !t.done))
const done = computed(() => store.todos.filter((t) => t.done))
const pendingCount = computed(() => pending.value.length)

function handleAdd() {
  const text = input.value.trim()
  if (!text) return
  store.add(text)
  input.value = ""
}
</script>

<style scoped>
.todo-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 28px 32px;
  gap: 20px;
  overflow: hidden;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

h1 {
  font-size: 26px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.5px;
}

.stats-badge {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--input-bg);
  padding: 3px 10px;
  border-radius: 20px;
}

.add-form {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.input-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0 14px;
  box-shadow: var(--card-shadow);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.input-wrap:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light), var(--card-shadow);
}

.input-icon { color: var(--text-muted); flex-shrink: 0; }

.input-wrap input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text);
  font-size: 14px;
  font-family: inherit;
  padding: 12px 0;
  outline: none;
}

.input-wrap input::placeholder { color: var(--text-muted); }

.add-form button {
  padding: 0 20px;
  height: 44px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
  white-space: nowrap;
}
.add-form button:hover { background: var(--accent-hover); }
.add-form button:disabled { opacity: 0.4; cursor: not-allowed; }

.todo-sections {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-right: 2px;
}

.todo-sections::-webkit-scrollbar { width: 4px; }
.todo-sections::-webkit-scrollbar-track { background: transparent; }
.todo-sections::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

.section { display: flex; flex-direction: column; gap: 6px; }

.section-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  padding: 0 4px;
}
.done-label { opacity: 0.6; }

.todo-list { list-style: none; display: flex; flex-direction: column; gap: 4px; }

.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--card-bg);
  border-radius: 12px;
  border: 1px solid var(--border);
  box-shadow: var(--card-shadow);
  transition: background 0.12s;
}
.todo-item:hover { background: var(--hover); }
.todo-item:hover .del-btn { opacity: 1; }

.check-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  transition: transform 0.15s;
}
.check-btn:hover { transform: scale(1.1); }

.todo-text {
  flex: 1;
  font-size: 14px;
  color: var(--text);
  line-height: 1.4;
}

.done .todo-text {
  text-decoration: line-through;
  color: var(--text-muted);
}

.del-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s, background 0.15s;
}
.del-btn:hover { color: var(--destructive); background: rgba(255, 59, 48, 0.1); }

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-muted);
  padding: 40px;
}
.empty-icon { font-size: 32px; opacity: 0.3; margin-bottom: 4px; }
.empty-state p { font-size: 15px; font-weight: 500; color: var(--text-secondary); }
.empty-state span { font-size: 13px; }
</style>
