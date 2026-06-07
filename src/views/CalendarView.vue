<template>
  <div class="calendar-page">
    <div class="page-header">
      <div class="header-left">
        <h1>{{ year }}年{{ month + 1 }}月</h1>
        <span class="today-badge" @click="goToday">今天</span>
      </div>
      <div class="nav-btns">
        <button @click="prevMonth">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button @click="nextMonth">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </div>

    <div class="cal-body">
      <div class="cal-left">
        <div class="weekdays">
          <div v-for="d in weekdays" :key="d" class="weekday" :class="{ weekend: d === '日' || d === '六' }">{{ d }}</div>
        </div>
        <div class="cal-grid">
          <div
            v-for="cell in cells"
            :key="cell.key"
            class="cal-cell"
            :class="{
              'other-month': !cell.current,
              today: cell.isToday,
              selected: cell.dateStr === selectedDate,
              holiday: !!cell.holiday,
              workday: cell.isWorkday,
              weekend: cell.isWeekend && !cell.holiday && !cell.isWorkday,
            }"
            @click="selectDate(cell.dateStr)"
          >
            <div class="cell-inner">
              <span class="day-num">{{ cell.day }}</span>
              <span v-if="cell.holiday" class="tag holiday-tag">{{ cell.holiday }}</span>
              <span v-else-if="cell.isWorkday" class="tag workday-tag">班</span>
              <div v-if="taskDates.has(cell.dateStr)" class="task-bars">
                <div
                  v-for="t in todos.filter(t => t.date === cell.dateStr).slice(0, 3)"
                  :key="t.id"
                  class="task-bar"
                  :class="{ done: t.done }"
                >{{ t.text }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <aside class="day-panel">
        <div class="day-panel-header">
          <span class="day-panel-title">{{ panelTitle }}</span>
        </div>

        <form class="day-add-form" @submit.prevent="handleAdd">
          <input v-model="newTask" placeholder="添加任务…" maxlength="200" />
          <button type="submit" :disabled="!newTask.trim()">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </button>
        </form>

        <div class="day-task-list">
          <div v-if="selectedTasks.length === 0" class="day-empty">暂无任务</div>
          <div v-for="task in selectedTasks" :key="task.id" class="day-task-item" :class="{ done: task.done }">
            <button class="check-btn" @click="todoStore.toggle(task.id)">
              <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                <circle v-if="!task.done" cx="8.5" cy="8.5" r="7.5" stroke="var(--border-strong, #ccc)" stroke-width="1.4"/>
                <circle v-else cx="8.5" cy="8.5" r="8.5" fill="var(--accent)"/>
                <path v-if="task.done" d="M5 8.5l2.5 2.5 4.5-5" stroke="#fff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <span class="task-text">{{ task.text }}</span>
            <button class="del-btn" @click="todoStore.remove(task.id)">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2.5 2.5l8 8M10.5 2.5l-8 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import { storeToRefs } from "pinia"
import { getHoliday, isWorkday } from "../data/holidays"
import { useTodoStore } from "../stores/todo"

const todoStore = useTodoStore()
const { todos } = storeToRefs(todoStore)

const weekdays = ["日", "一", "二", "三", "四", "五", "六"]
const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth())
const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
const selectedDate = ref(todayStr)
const newTask = ref("")

function pad(n: number) { return String(n).padStart(2, "0") }

const taskDates = computed(() => {
  const s = new Set<string>()
  todos.value.forEach((t) => { if (t.date) s.add(t.date) })
  return s
})

const selectedTasks = computed(() => todos.value.filter((t) => t.date === selectedDate.value))

const panelTitle = computed(() => {
  if (!selectedDate.value) return "请选择日期"
  const [y, m, d] = selectedDate.value.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = ["日", "一", "二", "三", "四", "五", "六"][date.getDay()]
  if (selectedDate.value === todayStr) return `今天 · 周${weekday}`
  return `${m}月${d}日 · 周${weekday}`
})

function selectDate(dateStr: string) {
  selectedDate.value = dateStr
}

function handleAdd() {
  const text = newTask.value.trim()
  if (!text) return
  todoStore.add(text, selectedDate.value)
  newTask.value = ""
}

const cells = computed(() => {
  const first = new Date(year.value, month.value, 1)
  const last = new Date(year.value, month.value + 1, 0)
  const result = []

  for (let i = 0; i < first.getDay(); i++) {
    const d = new Date(year.value, month.value, -first.getDay() + i + 1)
    const ds = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    result.push({ key: `p${i}`, dateStr: ds, day: d.getDate(), current: false, isToday: false, holiday: getHoliday(ds), isWorkday: isWorkday(ds), isWeekend: d.getDay() === 0 || d.getDay() === 6 })
  }

  for (let d = 1; d <= last.getDate(); d++) {
    const ds = `${year.value}-${pad(month.value + 1)}-${pad(d)}`
    const dow = new Date(year.value, month.value, d).getDay()
    result.push({ key: ds, dateStr: ds, day: d, current: true, isToday: ds === todayStr, holiday: getHoliday(ds), isWorkday: isWorkday(ds), isWeekend: dow === 0 || dow === 6 })
  }

  const trailing = 42 - result.length
  for (let i = 1; i <= trailing; i++) {
    const d = new Date(year.value, month.value + 1, i)
    const ds = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    result.push({ key: `n${i}`, dateStr: ds, day: i, current: false, isToday: false, holiday: getHoliday(ds), isWorkday: isWorkday(ds), isWeekend: d.getDay() === 0 || d.getDay() === 6 })
  }

  return result
})

function prevMonth() { if (month.value === 0) { year.value--; month.value = 11 } else month.value-- }
function nextMonth() { if (month.value === 11) { year.value++; month.value = 0 } else month.value++ }
function goToday() { year.value = now.getFullYear(); month.value = now.getMonth(); selectedDate.value = todayStr }
</script>

<style scoped>
.calendar-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 28px 32px 20px;
  gap: 20px;
  overflow: hidden;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.header-left { display: flex; align-items: center; gap: 12px; }

h1 { font-size: 26px; font-weight: 700; color: var(--text); letter-spacing: -0.5px; }

.today-badge {
  font-size: 12px; font-weight: 500; color: var(--accent);
  background: var(--accent-light); padding: 3px 10px; border-radius: 20px;
  cursor: pointer; transition: opacity 0.15s;
}
.today-badge:hover { opacity: 0.75; }

.nav-btns { display: flex; gap: 6px; }
.nav-btns button {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border);
  background: var(--card-bg); color: var(--text-secondary); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.15s, border-color 0.15s; box-shadow: var(--card-shadow);
}
.nav-btns button:hover { background: var(--hover); border-color: var(--accent); color: var(--accent); }

/* ── body ── */
.cal-body {
  flex: 1;
  display: flex;
  gap: 16px;
  overflow: hidden;
  min-height: 0;
}

.cal-left {
  flex: 1;
  background: var(--card-bg);
  border-radius: 16px;
  box-shadow: var(--card-shadow);
  border: 1px solid var(--border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid var(--border);
  background: var(--hover);
  flex-shrink: 0;
}

.weekday {
  text-align: center; font-size: 12px; font-weight: 600;
  color: var(--text-muted); padding: 10px 0; letter-spacing: 0.3px;
}
.weekday.weekend { color: var(--destructive); opacity: 0.7; }

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  flex: 1;
}

.cal-cell {
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: 7px 8px;
  cursor: pointer;
  transition: background 0.12s;
  min-height: 0;
  overflow: hidden;
  min-width: 0;
}
.cal-cell:nth-child(7n) { border-right: none; }
.cal-cell:hover { background: var(--hover); }
.cal-cell.selected { background: var(--accent-light); }
.cal-cell.selected:not(.today) .day-num { color: var(--accent); font-weight: 700; }

.cell-inner {
  display: flex;
  flex-direction: column;
  gap: 2px;
  height: 100%;
}

.day-num {
  font-size: 13px; font-weight: 500; color: var(--text); line-height: 1;
}
.other-month .day-num { color: var(--text-muted); font-weight: 400; }
.weekend .day-num { color: var(--destructive); }
.today .day-num {
  width: 24px; height: 24px; background: var(--accent); color: #fff;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 12px;
}

.tag {
  font-size: 10px; font-weight: 600; padding: 1px 4px;
  border-radius: 3px; width: fit-content; letter-spacing: 0.2px;
}
.holiday-tag { background: rgba(255,59,48,0.1); color: var(--destructive); }
.workday-tag { background: rgba(255,149,0,0.12); color: var(--warning); }

.task-bars { display: flex; flex-direction: column; gap: 1px; margin-top: 2px; width: 100%; overflow: hidden; }
.task-bar {
  font-size: 10px;
  line-height: 1.4;
  padding: 1px 4px;
  border-radius: 3px;
  background: var(--accent-light);
  color: var(--accent);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
  min-width: 0;
  max-width: 100%;
}
.task-bar.done {
  background: rgba(52, 199, 89, 0.12);
  color: var(--success);
  text-decoration: line-through;
  opacity: 0.7;
}

/* ── day panel ── */
.day-panel {
  width: 220px;
  flex-shrink: 0;
  background: var(--card-bg);
  border-radius: 16px;
  box-shadow: var(--card-shadow);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.day-panel-header {
  padding: 16px 16px 10px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.day-panel-title {
  font-size: 13px; font-weight: 600; color: var(--text);
}

.day-add-form {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 12px; border-bottom: 1px solid var(--border); flex-shrink: 0;
}

.day-add-form input {
  flex: 1; border: none; background: var(--input-bg); border-radius: 7px;
  padding: 6px 10px; font-size: 13px; font-family: inherit; color: var(--text); outline: none;
}
.day-add-form input::placeholder { color: var(--text-muted); }

.day-add-form button {
  width: 26px; height: 26px; border-radius: 7px; border: none;
  background: var(--accent); color: #fff; cursor: pointer; display: flex;
  align-items: center; justify-content: center; flex-shrink: 0;
  transition: background 0.15s; opacity: 1;
}
.day-add-form button:disabled { opacity: 0.35; cursor: not-allowed; }
.day-add-form button:not(:disabled):hover { background: var(--accent-hover); }

.day-task-list {
  flex: 1; overflow-y: auto; padding: 6px 0;
}
.day-task-list::-webkit-scrollbar { width: 3px; }
.day-task-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

.day-empty {
  padding: 24px 16px; font-size: 12px; color: var(--text-muted);
  text-align: center; opacity: 0.6;
}

.day-task-item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 12px; transition: background 0.12s;
}
.day-task-item:hover { background: var(--hover); }
.day-task-item:hover .del-btn { opacity: 1; }

.check-btn {
  background: none; border: none; cursor: pointer; padding: 0;
  display: flex; align-items: center; flex-shrink: 0; transition: transform 0.15s;
}
.check-btn:hover { transform: scale(1.1); }

.task-text {
  flex: 1; font-size: 13px; color: var(--text); line-height: 1.4;
}
.done .task-text { text-decoration: line-through; color: var(--text-muted); }

.del-btn {
  background: none; border: none; cursor: pointer; color: var(--text-muted);
  padding: 3px; border-radius: 5px; display: flex; align-items: center;
  opacity: 0; transition: opacity 0.15s, color 0.15s, background 0.15s;
}
.del-btn:hover { color: var(--destructive); background: rgba(255,59,48,0.1); }
</style>
