<template>
  <div class="history-page">
    <div class="page-header">
      <div class="header-left">
        <h1>完成记录</h1>
        <span class="total-badge">共完成 {{ allDone.length }} 项</span>
      </div>
      <div class="view-tabs">
        <button v-for="tab in tabs" :key="tab.key" :class="{ active: activeTab === tab.key }" @click="activeTab = tab.key">
          {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- 日视图 -->
    <div class="content-area" v-if="activeTab === 'day'">
      <div class="date-nav">
        <button @click="offsetDay--"><ChevronLeft /></button>
        <span class="date-label">{{ dayLabel }}</span>
        <button @click="offsetDay++" :disabled="offsetDay >= 0"><ChevronRight /></button>
      </div>
      <!-- 日：24小时柱状图 -->
      <div class="chart-card">
        <div class="chart-title">完成时间分布（小时）</div>
        <div class="chart-wrap">
          <Bar :data="dayChartData" :options="barOptions" />
        </div>
      </div>
      <TaskList :items="dayItems" :empty="`${dayLabel}没有完成的任务`" />
    </div>

    <!-- 周视图 -->
    <div class="content-area" v-else-if="activeTab === 'week'">
      <div class="date-nav">
        <button @click="offsetWeek--"><ChevronLeft /></button>
        <span class="date-label">{{ weekLabel }}</span>
        <button @click="offsetWeek++" :disabled="offsetWeek >= 0"><ChevronRight /></button>
      </div>
      <!-- 周：每日完成数折线图 -->
      <div class="chart-card">
        <div class="chart-title">每日完成数量</div>
        <div class="chart-wrap">
          <Line :data="weekChartData" :options="lineOptions" />
        </div>
      </div>
      <div class="week-grid">
        <div v-for="day in weekDays" :key="day.label" class="week-day-col">
          <div class="week-day-header">
            <span class="week-day-name">{{ day.weekday }}</span>
            <span class="week-day-date" :class="{ today: day.isToday }">{{ day.shortLabel }}</span>
            <span class="week-day-count" v-if="day.items.length">{{ day.items.length }}</span>
          </div>
          <div class="week-day-items">
            <div v-for="item in day.items" :key="item.id" class="history-item">
              <span class="done-dot"></span>
              <span class="item-text">{{ item.text }}</span>
            </div>
            <div v-if="day.items.length === 0" class="day-empty">—</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 月视图 -->
    <div class="content-area" v-else-if="activeTab === 'month'">
      <div class="date-nav">
        <button @click="offsetMonth--"><ChevronLeft /></button>
        <span class="date-label">{{ monthLabel }}</span>
        <button @click="offsetMonth++" :disabled="offsetMonth >= 0"><ChevronRight /></button>
      </div>
      <!-- 月：每日完成数柱状图 -->
      <div class="chart-card">
        <div class="chart-title">每日完成数量</div>
        <div class="chart-wrap">
          <Bar :data="monthChartData" :options="barOptions" />
        </div>
      </div>
      <div class="month-groups">
        <div v-for="group in monthGroups" :key="group.dateStr" class="month-group">
          <div class="group-header">
            <span class="group-date">{{ group.dateStr }}</span>
            <span class="group-count">{{ group.items.length }} 项</span>
          </div>
          <div class="group-items">
            <div v-for="item in group.items" :key="item.id" class="history-item">
              <span class="done-dot"></span>
              <span class="item-text">{{ item.text }}</span>
              <span class="item-time">{{ formatTime(item.doneAt!) }}</span>
            </div>
          </div>
        </div>
        <div v-if="monthGroups.length === 0" class="empty-state">
          <p>{{ monthLabel }}没有完成的任务</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineComponent, h } from "vue"
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from "chart.js"
import { Bar, Line } from "vue-chartjs"
import { useTodoStore } from "../stores/todo"
import type { TodoItem } from "../stores/todo"
import TaskList from "../components/TaskList.vue"

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler)

// ── tiny icon components ──────────────────────────────
const ChevronLeft = defineComponent({ render: () => h("svg", { width: 14, height: 14, viewBox: "0 0 14 14", fill: "none" }, [h("path", { d: "M9 11L5 7l4-4", stroke: "currentColor", "stroke-width": "1.5", "stroke-linecap": "round", "stroke-linejoin": "round" })]) })
const ChevronRight = defineComponent({ render: () => h("svg", { width: 14, height: 14, viewBox: "0 0 14 14", fill: "none" }, [h("path", { d: "M5 3l4 4-4 4", stroke: "currentColor", "stroke-width": "1.5", "stroke-linecap": "round", "stroke-linejoin": "round" })]) })

// ── store ─────────────────────────────────────────────
const store = useTodoStore()
const allDone = computed(() => store.completed())

const tabs: { key: "day" | "week" | "month"; label: string }[] = [
  { key: "day", label: "日" },
  { key: "week", label: "周" },
  { key: "month", label: "月" },
]
const activeTab = ref<"day" | "week" | "month">("week")

// ── helpers ───────────────────────────────────────────
function dateStr(ts: number) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })
}
function addDays(base: Date, n: number) {
  const d = new Date(base); d.setDate(d.getDate() + n); return d
}
const todayStr = dateStr(Date.now())

// ── chart shared options ──────────────────────────────
const ACCENT = "#007aff"
const ACCENT_ALPHA = "rgba(0,122,255,0.15)"

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.parsed.y} 项` } } },
  scales: {
    x: { grid: { display: false }, ticks: { color: "#888", font: { size: 11 } } },
    y: { grid: { color: "rgba(128,128,128,0.1)" }, ticks: { color: "#888", font: { size: 11 }, stepSize: 1, precision: 0 }, beginAtZero: true },
  },
}

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.parsed.y} 项` } } },
  scales: {
    x: { grid: { display: false }, ticks: { color: "#888", font: { size: 11 } } },
    y: { grid: { color: "rgba(128,128,128,0.1)" }, ticks: { color: "#888", font: { size: 11 }, stepSize: 1, precision: 0 }, beginAtZero: true },
  },
}

// ── Day ───────────────────────────────────────────────
const offsetDay = ref(0)
const targetDay = computed(() => addDays(new Date(), offsetDay.value))
const dayLabel = computed(() => {
  if (offsetDay.value === 0) return "今天"
  if (offsetDay.value === -1) return "昨天"
  const d = targetDay.value
  return `${d.getMonth() + 1}月${d.getDate()}日`
})
const dayItems = computed(() => {
  const ds = dateStr(targetDay.value.getTime())
  return allDone.value.filter((t) => dateStr(t.doneAt!) === ds)
})
const dayChartData = computed(() => {
  const counts = Array(24).fill(0)
  for (const item of dayItems.value) {
    counts[new Date(item.doneAt!).getHours()]++
  }
  return {
    labels: Array.from({ length: 24 }, (_, i) => `${i}时`),
    datasets: [{
      data: counts,
      backgroundColor: ACCENT,
      borderRadius: 4,
      borderSkipped: false,
    }],
  }
})

// ── Week ──────────────────────────────────────────────
const offsetWeek = ref(0)
const weekLabel = computed(() => {
  if (offsetWeek.value === 0) return "本周"
  if (offsetWeek.value === -1) return "上周"
  const mon = weekMonday(offsetWeek.value)
  const sun = addDays(mon, 6)
  return `${mon.getMonth() + 1}/${mon.getDate()} – ${sun.getMonth() + 1}/${sun.getDate()}`
})
function weekMonday(offset: number) {
  const now = new Date()
  const dow = now.getDay() === 0 ? 6 : now.getDay() - 1
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - dow + offset * 7)
}
const weekdayNames = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
const weekDays = computed(() => {
  const mon = weekMonday(offsetWeek.value)
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(mon, i)
    const ds = dateStr(d.getTime())
    return {
      label: `${d.getMonth() + 1}月${d.getDate()}日`,
      shortLabel: `${d.getDate()}`,
      weekday: weekdayNames[i],
      isToday: ds === todayStr,
      items: allDone.value.filter((t) => dateStr(t.doneAt!) === ds),
    }
  })
})
const weekChartData = computed(() => ({
  labels: weekDays.value.map((d) => d.weekday),
  datasets: [{
    data: weekDays.value.map((d) => d.items.length),
    borderColor: ACCENT,
    backgroundColor: ACCENT_ALPHA,
    borderWidth: 2,
    pointBackgroundColor: ACCENT,
    pointRadius: 4,
    pointHoverRadius: 6,
    fill: true,
    tension: 0.35,
  }],
}))

// ── Month ─────────────────────────────────────────────
const offsetMonth = ref(0)
const targetMonth = computed(() => {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + offsetMonth.value, 1)
})
const monthLabel = computed(() => {
  if (offsetMonth.value === 0) return "本月"
  const d = targetMonth.value
  return `${d.getFullYear()}年${d.getMonth() + 1}月`
})
const monthItems = computed(() => {
  const d = targetMonth.value
  return allDone.value.filter((t) => {
    const td = new Date(t.doneAt!)
    return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth()
  })
})
const monthGroups = computed(() => {
  const map = new Map<string, TodoItem[]>()
  for (const item of monthItems.value) {
    const ds = dateStr(item.doneAt!)
    if (!map.has(ds)) map.set(ds, [])
    map.get(ds)!.push(item)
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([ds, items]) => {
      const [, mm, dd] = ds.split("-")
      return { dateStr: `${parseInt(mm)}月${parseInt(dd)}日`, items }
    })
})
const monthChartData = computed(() => {
  const d = targetMonth.value
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  const counts = Array(daysInMonth).fill(0)
  for (const item of monthItems.value) {
    counts[new Date(item.doneAt!).getDate() - 1]++
  }
  return {
    labels: Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`),
    datasets: [{
      data: counts,
      backgroundColor: counts.map((v) => v > 0 ? ACCENT : "rgba(128,128,128,0.15)"),
      borderRadius: 4,
      borderSkipped: false,
    }],
  }
})
</script>

<style scoped>
.history-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px 24px 24px;
  gap: 16px;
  overflow: hidden;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  padding: 4px 2px 2px;
}
.header-left { display: flex; align-items: center; gap: 12px; }
h1 { font-size: 30px; font-weight: 760; color: var(--text); letter-spacing: 0; }
.total-badge {
  font-size: 12px; font-weight: 650; color: var(--text-muted);
  background: var(--input-bg); padding: 6px 10px; border-radius: 8px;
  border: 1px solid var(--border);
}

.view-tabs {
  display: flex; background: var(--input-bg); border: 1px solid var(--border); border-radius: 8px; padding: 3px; gap: 2px;
}
.view-tabs button {
  padding: 5px 18px; border: none; border-radius: 7px; background: transparent;
  color: var(--text-muted); font-size: 13px; font-weight: 500; font-family: inherit;
  cursor: pointer; transition: background 0.15s, color 0.15s;
}
.view-tabs button.active {
  background: var(--card-bg); color: var(--accent); box-shadow: var(--card-shadow);
}

.content-area {
  flex: 1; display: flex; flex-direction: column; gap: 12px;
  overflow: hidden; min-height: 0;
}

/* date nav */
.date-nav { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.date-nav button {
  width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border);
  background: var(--card-bg); color: var(--text-secondary); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: var(--card-shadow); transition: border-color 0.12s, color 0.12s;
}
.date-nav button:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.date-nav button:disabled { opacity: 0.3; cursor: not-allowed; }
.date-label { font-size: 15px; font-weight: 600; color: var(--text); min-width: 80px; }

/* chart card */
.chart-card {
  background: var(--card-bg); border: 1px solid var(--border);
  border-radius: 8px; box-shadow: var(--card-shadow);
  padding: 14px 18px 12px; flex-shrink: 0;
}
.chart-title { font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 10px; letter-spacing: 0.3px; }
.chart-wrap { height: 120px; }

/* week grid */
.week-grid {
  flex: 1; display: grid; grid-template-columns: repeat(7, 1fr);
  gap: 8px; overflow: hidden; min-height: 0;
}
.week-day-col {
  background: var(--card-bg); border: 1px solid var(--border);
  border-radius: 8px; box-shadow: var(--card-shadow);
  display: flex; flex-direction: column; overflow: hidden;
}
.week-day-header {
  padding: 10px 8px 8px; border-bottom: 1px solid var(--border);
  display: flex; flex-direction: column; align-items: center; gap: 3px; flex-shrink: 0;
}
.week-day-name { font-size: 10px; font-weight: 600; color: var(--text-muted); letter-spacing: 0.3px; }
.week-day-date {
  font-size: 18px; font-weight: 600; color: var(--text);
  width: 34px; height: 34px; display: flex; align-items: center;
  justify-content: center; border-radius: 50%; line-height: 1;
}
.week-day-date.today { background: var(--accent); color: #fff; box-shadow: 0 2px 8px rgba(0,122,255,0.35); }
.week-day-count {
  font-size: 10px; font-weight: 600; color: var(--accent);
  background: var(--accent-light); padding: 1px 6px; border-radius: 10px;
}
.week-day-items {
  flex: 1; overflow-y: auto; padding: 6px 8px;
  display: flex; flex-direction: column; gap: 4px;
}
.week-day-items::-webkit-scrollbar { width: 2px; }
.week-day-items::-webkit-scrollbar-thumb { background: var(--border); border-radius: 1px; }
.day-empty { color: var(--text-muted); font-size: 16px; text-align: center; padding: 12px 0; opacity: 0.3; }

/* month groups */
.month-groups {
  flex: 1; overflow-y: auto; display: flex; flex-direction: column;
  gap: 10px; padding-right: 4px;
}
.month-groups::-webkit-scrollbar { width: 4px; }
.month-groups::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }
.month-group {
  background: var(--card-bg); border: 1px solid var(--border);
  border-radius: 8px; box-shadow: var(--card-shadow); overflow: hidden;
}
.group-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 9px 16px; border-bottom: 1px solid var(--border); background: var(--hover);
}
.group-date { font-size: 13px; font-weight: 600; color: var(--text); }
.group-count {
  font-size: 11px; color: var(--accent); background: var(--accent-light);
  padding: 2px 8px; border-radius: 10px; font-weight: 500;
}
.group-items { padding: 4px 0; }

/* shared item row */
.history-item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 16px; transition: background 0.12s;
}
.history-item:hover { background: var(--hover); }
.done-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--success); flex-shrink: 0; }
.item-text { flex: 1; font-size: 13px; color: var(--text); }
.item-time { font-size: 11px; color: var(--text-muted); flex-shrink: 0; }

.week-day-items .history-item { padding: 5px 4px; border-radius: 6px; }
.week-day-items .item-text {
  font-size: 11px; line-height: 1.3; overflow: hidden;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
}

.empty-state {
  flex: 1; display: flex; align-items: center; justify-content: center;
  color: var(--text-muted); font-size: 14px;
}
</style>
