<template>
  <div class="task-list-wrap">
    <div v-if="items.length" class="task-list">
      <div v-for="item in items" :key="item.id" class="history-item">
        <span class="done-dot"></span>
        <span class="item-text">{{ item.text }}</span>
        <span class="item-time">{{ formatTime(item.doneAt!) }}</span>
      </div>
    </div>
    <div v-else class="empty-state">
      <p>{{ empty }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TodoItem } from "../stores/todo"

defineProps<{ items: TodoItem[]; empty: string }>()

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
}
</script>

<style scoped>
.task-list-wrap {
  flex: 1;
  overflow-y: auto;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--card-shadow);
  min-height: 0;
}
.task-list-wrap::-webkit-scrollbar { width: 4px; }
.task-list-wrap::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

.task-list { padding: 4px 0; }

.history-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  transition: background 0.12s;
}
.history-item:hover { background: var(--hover); }

.done-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--success);
  flex-shrink: 0;
}

.item-text { flex: 1; font-size: 13.5px; color: var(--text); }

.item-time { font-size: 11px; color: var(--text-muted); flex-shrink: 0; }

.empty-state {
  height: 100%;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 13px;
}
</style>
