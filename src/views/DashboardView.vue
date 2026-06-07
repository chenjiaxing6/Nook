<template>
  <div class="dashboard">

    <section class="layout-toolbar">
      <div>
        <h1>工作台</h1>
        <span>添加小组件，拖动手柄调整位置，拖动边缘调整大小</span>
      </div>
      <div class="toolbar-actions">
        <button type="button" class="primary-toolbar-btn" @click="showWidgetPicker = true">添加小组件</button>
        <button type="button" @click="resetLayout">重置布局</button>
      </div>
    </section>

    <div v-if="showWidgetPicker" class="modal-backdrop" @click.self="showWidgetPicker = false">
      <section class="widget-picker" role="dialog" aria-modal="true" aria-labelledby="widget-picker-title">
        <div class="picker-header">
          <div>
            <h2 id="widget-picker-title">小组件库</h2>
            <span>{{ availableWidgetDefinitions.length }} 个可添加</span>
          </div>
          <button type="button" @click="showWidgetPicker = false">关闭</button>
        </div>
        <div class="picker-grid">
          <article v-for="definition in widgetDefinitions" :key="definition.id" class="picker-card">
            <span class="picker-icon">{{ definition.icon }}</span>
            <div>
              <strong>{{ definition.name }}</strong>
              <p>{{ definition.description }}</p>
            </div>
            <button
              type="button"
              :disabled="isWidgetAdded(definition.id)"
              @click="addWidget(definition.id)"
            >
              {{ isWidgetAdded(definition.id) ? "已添加" : "添加" }}
            </button>
          </article>
        </div>
      </section>
    </div>

    <div v-if="orderedWidgets.length" class="widget-grid">
      <div
        v-for="widget in orderedWidgets"
        :key="widget.id"
        class="widget-shell"
        :class="{ dragging: draggingWidget === widget.id }"
        :style="widgetStyle(widget)"
        :data-widget-id="widget.id"
      >
        <div class="widget-controls">
          <button type="button" class="remove-widget-btn" title="移除小组件" @click.stop="removeWidget(widget.id)">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M3 3l7 7M10 3l-7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          </button>
          <div
            class="drag-handle"
            title="拖动模块"
            @pointerdown.prevent.stop="startWidgetDrag(widget.id, $event)"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M5 3.5h.01M10 3.5h.01M5 7.5h.01M10 7.5h.01M5 11.5h.01M10 11.5h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
        </div>
        <div class="resize-handle resize-right" @pointerdown.prevent.stop="startResize(widget.id, 'right', $event)"></div>
        <div class="resize-handle resize-bottom" @pointerdown.prevent.stop="startResize(widget.id, 'bottom', $event)"></div>
        <div class="resize-handle resize-corner" @pointerdown.prevent.stop="startResize(widget.id, 'corner', $event)"></div>

        <div v-if="widget.id === 'overview'" class="overview-bar">
          <div class="ov-time">
            <span class="ov-clock">{{ clock }}</span>
            <span class="ov-date">{{ dateLabel }}</span>
          </div>

          <div class="ov-divider"></div>

          <div class="ov-stat">
            <div class="ov-stat-top">
              <span class="ov-stat-value">{{ pendingCount }}</span>
              <span class="ov-stat-unit">项待完成</span>
            </div>
            <div class="ov-progress-track">
              <div class="ov-progress-fill" :style="{ width: todoProgress + '%' }"></div>
            </div>
            <span class="ov-stat-sub">今日已完成 {{ todayDoneCount }} 项</span>
          </div>

          <div class="ov-divider"></div>

          <div class="ov-holiday" v-if="nextHoliday">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="2.5" width="12" height="10" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
              <path d="M4 1v3M10 1v3M1 6h12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            <span class="ov-holiday-name">{{ nextHoliday.name }}</span>
            <span class="ov-holiday-days">
              <template v-if="nextHoliday.daysLeft === 0">就是今天</template>
              <template v-else>还有 <b>{{ nextHoliday.daysLeft }}</b> 天</template>
            </span>
          </div>

          <div class="ov-divider"></div>

          <div class="ov-quote">
            <span>{{ quote }}</span>
          </div>
        </div>

        <div v-else-if="widget.id === 'calendar'" class="card calendar-card">
        <div class="card-header">
          <div class="header-left">
            <h2>{{ year }}年{{ month + 1 }}月</h2>
            <span class="today-badge" @click="goToday">今天</span>
          </div>
          <div class="nav-btns">
            <button @click="prevMonth">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 11L5 7l4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <button @click="nextMonth">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </div>

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
              selected: cell.key === selectedDate,
              holiday: !!cell.holiday,
              workday: cell.isWorkday,
              weekend: cell.isWeekend && !cell.holiday && !cell.isWorkday,
            }"
            @click="selectedDate = cell.key"
          >
            <span class="day-num">{{ cell.day }}</span>
            <span v-if="cell.holiday" class="tag holiday-tag">{{ cell.holiday }}</span>
            <span v-else-if="cell.isWorkday" class="tag workday-tag">班</span>
            <div v-if="taskDates.has(cell.key)" class="task-bars">
              <div
                v-for="t in todos.filter(t => t.date === cell.key).slice(0, 2)"
                :key="t.id"
                class="task-bar"
                :class="{ done: t.done }"
              >{{ t.text }}</div>
            </div>
          </div>
        </div>
      </div>

        <div v-else-if="widget.id === 'todo'" class="card todo-card">
        <div class="card-header">
          <h2>{{ selectedDateLabel }}</h2>
          <span class="stats-badge">{{ pendingCount }} 项待完成</span>
        </div>

        <form class="add-form" @submit.prevent="handleAdd">
          <div class="input-wrap">
            <input v-model="todoInput" placeholder="添加新任务…" maxlength="200" />
          </div>
          <button type="submit" :disabled="!todoInput.trim()">添加</button>
        </form>

        <div class="todo-list-wrap">
          <ul class="todo-list" v-if="selectedTasks.length">
            <li v-for="item in selectedTasks" :key="item.id" class="todo-item" :class="{ done: item.done }">
              <button class="check-btn" @click="store.toggle(item.id)">
                <svg v-if="!item.done" width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="8" stroke="var(--border-strong, #ccc)" stroke-width="1.5"/>
                </svg>
                <svg v-else width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="9" r="8" fill="var(--accent)" stroke="var(--accent)" stroke-width="1.5"/>
                  <path d="M5.5 9l2.5 2.5 4.5-5" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <span class="todo-text">{{ item.text }}</span>
              <button class="del-btn" @click="store.remove(item.id)">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              </button>
            </li>
          </ul>
          <div class="empty-hint" v-else>暂无任务，添加一个吧</div>
        </div>
      </div>

        <div v-else-if="widget.id === 'notes'" class="card notes-card">
        <div class="card-header">
          <h2>笔记</h2>
          <button class="new-btn" @click="notesStore.create()">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </button>
        </div>

        <div class="notes-body">
          <div class="notes-list">
            <div
              v-for="note in notesStore.notes"
              :key="note.id"
              class="note-item"
              :class="{ active: note.id === notesStore.activeId }"
              @click="notesStore.activeId = note.id"
            >
              <div class="note-title">{{ note.title || "无标题" }}</div>
              <div class="note-preview">{{ notePreview(note.content) }}</div>
              <button class="note-del-btn" @click.stop="notesStore.remove(note.id)" title="删除">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M1.5 1.5l8 8M9.5 1.5l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <div v-if="notesStore.notes.length === 0" class="empty-hint">点击 + 新建笔记</div>
          </div>

          <div class="note-editor" v-if="currentNote">
            <input
              class="note-title-input"
              :value="currentNote.title"
              placeholder="标题"
              @input="notesStore.update(currentNote!.id, { title: ($event.target as HTMLInputElement).value })"
            />
            <div class="note-markdown-editor">
              <VditorEditor :key="currentNote.id" :content="currentNote.content" @change="onNoteContentChange" />
            </div>
          </div>
          <div class="note-editor-empty" v-else-if="notesStore.notes.length > 0">
            选择一篇笔记
          </div>
        </div>
        </div>

        <div v-else-if="widget.id === 'task-stats'" class="card mini-widget">
          <div class="card-header">
            <h2>任务统计</h2>
          </div>
          <div class="stats-widget-body">
            <div class="big-number">
              <strong>{{ todoProgress }}%</strong>
              <span>整体完成率</span>
            </div>
            <div class="mini-stat-grid">
              <article>
                <span>全部</span>
                <strong>{{ todos.length }}</strong>
              </article>
              <article>
                <span>已完成</span>
                <strong>{{ allDoneCount }}</strong>
              </article>
              <article>
                <span>今日完成</span>
                <strong>{{ todayDoneCount }}</strong>
              </article>
              <article>
                <span>待完成</span>
                <strong>{{ allPendingCount }}</strong>
              </article>
            </div>
          </div>
        </div>

        <div v-else-if="widget.id === 'recent-done'" class="card mini-widget">
          <div class="card-header">
            <h2>最近完成</h2>
          </div>
          <div class="compact-list">
            <div v-for="item in recentDoneTasks" :key="item.id" class="compact-item">
              <span class="compact-dot"></span>
              <div>
                <strong>{{ item.text }}</strong>
                <small>{{ formatTime(item.doneAt) }}</small>
              </div>
            </div>
            <div v-if="recentDoneTasks.length === 0" class="empty-hint">还没有完成记录</div>
          </div>
        </div>

        <div v-else-if="widget.id === 'quick-note'" class="card mini-widget">
          <div class="card-header">
            <h2>快速便签</h2>
            <button class="new-btn" @click="saveQuickNote">
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            </button>
          </div>
          <textarea
            v-model="quickNoteText"
            class="quick-note-input"
            placeholder="随手记一点..."
          ></textarea>
        </div>

        <div v-else-if="widget.id === 'holiday-countdown'" class="card mini-widget">
          <div class="card-header">
            <h2>节假日倒计时</h2>
          </div>
          <div class="holiday-widget-body" v-if="nextHoliday">
            <span class="holiday-name">{{ nextHoliday.name }}</span>
            <strong v-if="nextHoliday.daysLeft === 0">今天</strong>
            <strong v-else>{{ nextHoliday.daysLeft }} 天</strong>
            <p>{{ nextHoliday.daysLeft === 0 ? "好好享受今天。" : "距离下一个节假日" }}</p>
          </div>
          <div v-else class="empty-hint">暂无后续节假日</div>
        </div>
      </div>
    </div>

    <section v-else class="empty-dashboard">
      <strong>工作台还没有小组件</strong>
      <p>从小组件库添加日历、待办、笔记或概览模块。</p>
      <button type="button" @click="showWidgetPicker = true">添加小组件</button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue"
import { storeToRefs } from "pinia"
import { getHoliday, isWorkday, holidays } from "../data/holidays"
import { useTodoStore } from "../stores/todo"
import { useNotesStore } from "../stores/notes"
import { getJsonValue, setStoredValue } from "../storage"
import VditorEditor from "../components/VditorEditor.vue"

type WidgetId =
  | "overview"
  | "calendar"
  | "todo"
  | "notes"
  | "task-stats"
  | "recent-done"
  | "quick-note"
  | "holiday-countdown"
type WidgetSize = "small" | "medium" | "large" | "wide"
type ResizeEdge = "right" | "bottom" | "corner"

interface DashboardWidget {
  id: WidgetId
  colSpan: number
  rowSpan: number
}

interface WidgetDefinition {
  id: WidgetId
  name: string
  icon: string
  description: string
  defaultSize: Pick<DashboardWidget, "colSpan" | "rowSpan">
}

const STORAGE_KEY = "wb_dashboard_layout"
const GRID_COLUMNS = 12
const GRID_ROW_HEIGHT = 90
const GRID_GAP = 16
const MIN_COL_SPAN = 3
const MIN_ROW_SPAN = 1
const widgetDefinitions: WidgetDefinition[] = [
  {
    id: "overview",
    name: "概览",
    icon: "⌁",
    description: "时间、日期、任务进度、节假日和一句提示。",
    defaultSize: { colSpan: 12, rowSpan: 1 },
  },
  {
    id: "calendar",
    name: "日历",
    icon: "□",
    description: "月历、节假日和日期任务分布。",
    defaultSize: { colSpan: 5, rowSpan: 7 },
  },
  {
    id: "todo",
    name: "待办",
    icon: "✓",
    description: "查看和维护当前选中日期的任务。",
    defaultSize: { colSpan: 7, rowSpan: 4 },
  },
  {
    id: "notes",
    name: "笔记",
    icon: "✎",
    description: "快速查看、创建和编辑工作台笔记。",
    defaultSize: { colSpan: 7, rowSpan: 4 },
  },
  {
    id: "task-stats",
    name: "任务统计",
    icon: "#",
    description: "查看全部任务、完成率、今日完成和剩余任务。",
    defaultSize: { colSpan: 4, rowSpan: 3 },
  },
  {
    id: "recent-done",
    name: "最近完成",
    icon: "✓",
    description: "展示最近完成的任务，快速回顾进展。",
    defaultSize: { colSpan: 4, rowSpan: 3 },
  },
  {
    id: "quick-note",
    name: "快速便签",
    icon: "+",
    description: "随手记录临时想法，并一键保存为正式笔记。",
    defaultSize: { colSpan: 4, rowSpan: 3 },
  },
  {
    id: "holiday-countdown",
    name: "节假日倒计时",
    icon: "!",
    description: "显示距离下一个节假日还有多久。",
    defaultSize: { colSpan: 4, rowSpan: 3 },
  },
]
const defaultWidgets: DashboardWidget[] = widgetDefinitions.map((definition) => ({
  id: definition.id,
  ...definition.defaultSize,
}))
const widgets = ref<DashboardWidget[]>([...defaultWidgets])
const draggingWidget = ref<WidgetId | null>(null)
const showWidgetPicker = ref(false)
const orderedWidgets = computed(() => widgets.value)
const availableWidgetDefinitions = computed(() =>
  widgetDefinitions.filter((definition) => !isWidgetAdded(definition.id))
)
const sizeOrder: WidgetSize[] = ["small", "medium", "large", "wide"]
const presetSizes: Record<WidgetSize, Pick<DashboardWidget, "colSpan" | "rowSpan">> = {
  small: { colSpan: 4, rowSpan: 3 },
  medium: { colSpan: 6, rowSpan: 4 },
  large: { colSpan: 8, rowSpan: 7 },
  wide: { colSpan: 12, rowSpan: 1 },
}

void loadLayoutFromStorage()

function saveLayout() {
  void setStoredValue(STORAGE_KEY, JSON.stringify(widgets.value))
}

async function loadLayoutFromStorage() {
  const saved = await getJsonValue<Array<WidgetId | (Partial<DashboardWidget> & { id: WidgetId; size?: WidgetSize })>>(
    STORAGE_KEY,
    []
  )
  widgets.value = normalizeLayout(saved)
}

function normalizeLayout(saved: Array<WidgetId | (Partial<DashboardWidget> & { id: WidgetId; size?: WidgetSize })>) {
  const validIds = defaultWidgets.map((widget) => widget.id)
  const savedWidgets = saved
    .map((item) => {
      if (typeof item === "string") {
        return defaultWidgets.find((widget) => widget.id === item)
      }
      if (item.size && sizeOrder.includes(item.size)) {
        const preset = presetSizes[item.size]
        return { id: item.id, ...preset }
      }
      if (typeof item.colSpan === "number" && typeof item.rowSpan === "number") {
        return {
          id: item.id,
          colSpan: clamp(Math.round(item.colSpan), MIN_COL_SPAN, GRID_COLUMNS),
          rowSpan: clamp(Math.round(item.rowSpan), MIN_ROW_SPAN, 10),
        }
      }
      return item
    })
    .filter((widget): widget is DashboardWidget =>
      !!widget &&
      validIds.includes(widget.id) &&
      typeof widget.colSpan === "number" &&
      typeof widget.rowSpan === "number"
    )
  const savedIds = savedWidgets.map((widget) => widget.id)
  const mergedIds = [...savedIds, ...validIds.filter((id) => !savedIds.includes(id))]
  return mergedIds.map((id) => {
    return savedWidgets.find((widget) => widget.id === id) ?? defaultWidgets.find((widget) => widget.id === id)!
  })
}

function resetLayout() {
  widgets.value = [...defaultWidgets]
  saveLayout()
}

function addWidget(id: WidgetId) {
  if (isWidgetAdded(id)) return
  const definition = widgetDefinitions.find((item) => item.id === id)
  if (!definition) return
  widgets.value = [...widgets.value, { id, ...definition.defaultSize }]
  saveLayout()
}

function removeWidget(id: WidgetId) {
  widgets.value = widgets.value.filter((widget) => widget.id !== id)
  saveLayout()
}

function isWidgetAdded(id: WidgetId) {
  return widgets.value.some((widget) => widget.id === id)
}

function widgetStyle(widget: DashboardWidget) {
  return {
    gridColumn: `span ${widget.colSpan}`,
    gridRow: `span ${widget.rowSpan}`,
  }
}

function startWidgetDrag(id: WidgetId, event: PointerEvent) {
  draggingWidget.value = id
  const handle = event.currentTarget as HTMLElement
  handle.setPointerCapture?.(event.pointerId)

  function handlePointerMove(moveEvent: PointerEvent) {
    const targetWidget = widgetAtPoint(moveEvent.clientX, moveEvent.clientY)
    if (!targetWidget || targetWidget === id) return
    moveWidgetBefore(id, targetWidget)
  }

  function handlePointerUp() {
    handle.releasePointerCapture?.(event.pointerId)
    window.removeEventListener("pointermove", handlePointerMove)
    window.removeEventListener("pointerup", handlePointerUp)
    draggingWidget.value = null
    saveLayout()
  }

  window.addEventListener("pointermove", handlePointerMove)
  window.addEventListener("pointerup", handlePointerUp, { once: true })
}

function widgetAtPoint(x: number, y: number): WidgetId | null {
  const elements = document.elementsFromPoint(x, y)
  const shell = elements.find((element) => element instanceof HTMLElement && element.classList.contains("widget-shell"))
  if (!(shell instanceof HTMLElement)) return null

  const id = shell.dataset.widgetId
  return isWidgetId(id) ? id : null
}

function moveWidgetBefore(sourceId: WidgetId, targetId: WidgetId) {
  const next = [...widgets.value]
  const fromIndex = next.findIndex((widget) => widget.id === sourceId)
  const toIndex = next.findIndex((widget) => widget.id === targetId)
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  widgets.value = next
}

function isWidgetId(value: unknown): value is WidgetId {
  return typeof value === "string" && widgetDefinitions.some((definition) => definition.id === value)
}

function startResize(id: WidgetId, edge: ResizeEdge, event: PointerEvent) {
  const startWidget = widgets.value.find((widget) => widget.id === id)
  const gridElement = (event.currentTarget as HTMLElement).closest(".widget-grid")
  if (!startWidget || !gridElement) return

  const gridRect = gridElement.getBoundingClientRect()
  const columnWidth = (gridRect.width - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS
  const startX = event.clientX
  const startY = event.clientY
  const startColSpan = startWidget.colSpan
  const startRowSpan = startWidget.rowSpan

  function handlePointerMove(moveEvent: PointerEvent) {
    const deltaCols = Math.round((moveEvent.clientX - startX) / (columnWidth + GRID_GAP))
    const deltaRows = Math.round((moveEvent.clientY - startY) / (GRID_ROW_HEIGHT + GRID_GAP))
    widgets.value = widgets.value.map((widget) => {
      if (widget.id !== id) return widget
      return {
        ...widget,
        colSpan: edge === "bottom" ? widget.colSpan : clamp(startColSpan + deltaCols, MIN_COL_SPAN, GRID_COLUMNS),
        rowSpan: edge === "right" ? widget.rowSpan : clamp(startRowSpan + deltaRows, MIN_ROW_SPAN, 10),
      }
    })
  }

  function handlePointerUp() {
    window.removeEventListener("pointermove", handlePointerMove)
    window.removeEventListener("pointerup", handlePointerUp)
    saveLayout()
  }

  window.addEventListener("pointermove", handlePointerMove)
  window.addEventListener("pointerup", handlePointerUp, { once: true })
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

// ── Overview ──────────────────────────────────────────
const clock = ref("")
const dateLabel = ref("")
const weekNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"]

function tick() {
  const d = new Date()
  clock.value = d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  dateLabel.value = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekNames[d.getDay()]}`
}
tick()
let timer: ReturnType<typeof setInterval>
onMounted(() => { timer = setInterval(tick, 1000) })
onUnmounted(() => clearInterval(timer))

const quotes = [
  "专注当下，成就未来。",
  "每一个今天，都是昨天期待的明天。",
  "行动是治愈恐惧的良药。",
  "不积跬步，无以至千里。",
  "把每件平凡的事做好，就是不平凡。",
  "你现在的努力，是在为未来的自己铺路。",
  "简单地活，认真地做。",
  "慢慢来，比较快。",
]
const quote = quotes[new Date().getDate() % quotes.length]

// next holiday countdown
const nextHoliday = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const entries = Object.entries(holidays)
    .map(([ds, name]) => ({ ds, name, date: new Date(ds) }))
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
  if (!entries.length) return null
  const first = entries[0]
  const daysLeft = Math.round((first.date.getTime() - today.getTime()) / 86400000)
  return { name: first.name, daysLeft }
})

// ── Calendar ──────────────────────────────────────────
const weekdays = ["日", "一", "二", "三", "四", "五", "六"]
const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth())
const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`

function pad(n: number) { return String(n).padStart(2, "0") }

const cells = computed(() => {
  const first = new Date(year.value, month.value, 1)
  const last = new Date(year.value, month.value + 1, 0)
  const result = []
  for (let i = 0; i < first.getDay(); i++) {
    const d = new Date(year.value, month.value, -first.getDay() + i + 1)
    const ds = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    result.push({ key: `p${i}`, day: d.getDate(), current: false, isToday: false, holiday: getHoliday(ds), isWorkday: isWorkday(ds), isWeekend: d.getDay() === 0 || d.getDay() === 6 })
  }
  for (let d = 1; d <= last.getDate(); d++) {
    const ds = `${year.value}-${pad(month.value + 1)}-${pad(d)}`
    const dow = new Date(year.value, month.value, d).getDay()
    result.push({ key: ds, day: d, current: true, isToday: ds === todayStr, holiday: getHoliday(ds), isWorkday: isWorkday(ds), isWeekend: dow === 0 || dow === 6 })
  }
  const trailing = 42 - result.length
  for (let i = 1; i <= trailing; i++) {
    const d = new Date(year.value, month.value + 1, i)
    const ds = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    result.push({ key: `n${i}`, day: i, current: false, isToday: false, holiday: getHoliday(ds), isWorkday: isWorkday(ds), isWeekend: d.getDay() === 0 || d.getDay() === 6 })
  }
  return result
})

function prevMonth() { if (month.value === 0) { year.value--; month.value = 11 } else month.value-- }
function nextMonth() { if (month.value === 11) { year.value++; month.value = 0 } else month.value++ }
function goToday() { year.value = now.getFullYear(); month.value = now.getMonth() }

// ── Todo ──────────────────────────────────────────────
const store = useTodoStore()
const { todos } = storeToRefs(store)
const todoInput = ref("")
const selectedDate = ref(todayStr)

const taskDates = computed(() => {
  const s = new Set<string>()
  todos.value.forEach((t) => { if (t.date) s.add(t.date) })
  return s
})

const selectedTasks = computed(() => todos.value.filter((t) => t.date === selectedDate.value))

const selectedDateLabel = computed(() => {
  if (selectedDate.value === todayStr) return "今天的任务"
  const [, m, d] = selectedDate.value.split("-").map(Number)
  return `${m}月${d}日的任务`
})

const pendingCount = computed(() => selectedTasks.value.filter((t) => !t.done).length)
const allDoneCount = computed(() => todos.value.filter((t) => t.done).length)
const allPendingCount = computed(() => todos.value.filter((t) => !t.done).length)
const todoProgress = computed(() => {
  const total = todos.value.length
  if (!total) return 0
  return Math.round((allDoneCount.value / total) * 100)
})
const todayDoneCount = computed(() => {
  return todos.value.filter((t) => t.done && t.doneAt && new Date(t.doneAt).toISOString().slice(0, 10) === todayStr).length
})
const recentDoneTasks = computed(() => store.completed().slice(0, 5))

function handleAdd() {
  const text = todoInput.value.trim()
  if (!text) return
  store.add(text, selectedDate.value)
  todoInput.value = ""
}

// ── Notes ─────────────────────────────────────────────
const notesStore = useNotesStore()
const currentNote = computed(() => notesStore.active())
const quickNoteText = ref("")

function notePreview(content: string) {
  return content.replace(/\n/g, " ").slice(0, 40) || "暂无内容"
}

function onNoteContentChange(markdown: string) {
  if (currentNote.value) notesStore.update(currentNote.value.id, { content: markdown })
}

function saveQuickNote() {
  const content = quickNoteText.value.trim()
  if (!content) return
  notesStore.create()
  const note = notesStore.active()
  if (!note) return
  notesStore.update(note.id, {
    title: content.slice(0, 18),
    content,
  })
  quickNoteText.value = ""
}

function formatTime(timestamp?: number) {
  if (!timestamp) return "未知时间"
  return new Date(timestamp).toLocaleString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
</script>

<style scoped>
.dashboard {
  padding: 20px 24px 24px;
  height: 100%;
  overflow: auto;
  box-sizing: border-box;
}

.layout-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.layout-toolbar h1 {
  color: var(--text);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.4px;
}

.layout-toolbar span {
  display: block;
  color: var(--text-muted);
  font-size: 12px;
  margin-top: 4px;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.layout-toolbar button {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card-bg);
  color: var(--text-secondary);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 12px;
  box-shadow: var(--card-shadow);
}

.layout-toolbar button:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.layout-toolbar .primary-toolbar-btn {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.layout-toolbar .primary-toolbar-btn:hover {
  color: #fff;
  background: var(--accent-hover);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.widget-picker {
  width: min(760px, 100%);
  max-height: min(720px, calc(100vh - 48px));
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--card-bg);
  box-shadow: 0 18px 60px rgba(0, 0, 0, 0.22), var(--card-shadow);
  padding: 16px;
  overflow: auto;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.picker-header h2 {
  color: var(--text);
  font-size: 16px;
  font-weight: 700;
}

.picker-header span {
  color: var(--text-muted);
  font-size: 12px;
}

.picker-header button,
.picker-card button,
.empty-dashboard button {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card-bg);
  color: var(--text-secondary);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 12px;
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.picker-card {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--input-bg);
  padding: 12px;
}

.picker-icon {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: var(--accent-light);
  color: var(--accent);
  font-size: 18px;
  font-weight: 700;
}

.picker-card strong {
  display: block;
  color: var(--text);
  font-size: 14px;
  margin-bottom: 4px;
}

.picker-card p {
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.5;
}

.picker-card button:not(:disabled) {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.picker-card button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.widget-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-rows: 90px;
  gap: 16px;
  min-height: calc(100% - 54px);
}

.widget-shell {
  position: relative;
  min-height: 0;
  display: flex;
  transition: opacity 0.12s;
}

.widget-shell.dragging {
  opacity: 0.55;
  pointer-events: none;
}

.widget-controls {
  position: absolute;
  z-index: 5;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 6px;
}

.drag-handle,
.remove-widget-btn {
  width: 26px;
  height: 26px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--card-bg);
  color: var(--text-muted);
  display: grid;
  place-items: center;
  box-shadow: var(--card-shadow);
}

.drag-handle {
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.remove-widget-btn {
  cursor: pointer;
  font: inherit;
}

.drag-handle:active {
  cursor: grabbing;
}

.drag-handle:hover,
.remove-widget-btn:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.remove-widget-btn:hover {
  color: var(--destructive);
  border-color: var(--destructive);
}

.resize-handle {
  position: absolute;
  z-index: 6;
}

.resize-right {
  top: 42px;
  right: -4px;
  bottom: 18px;
  width: 8px;
  cursor: ew-resize;
}

.resize-bottom {
  right: 18px;
  bottom: -4px;
  left: 18px;
  height: 8px;
  cursor: ns-resize;
}

.resize-corner {
  right: -5px;
  bottom: -5px;
  width: 18px;
  height: 18px;
  cursor: nwse-resize;
}

.resize-corner::after {
  content: "";
  position: absolute;
  right: 5px;
  bottom: 5px;
  width: 8px;
  height: 8px;
  border-right: 2px solid var(--text-muted);
  border-bottom: 2px solid var(--text-muted);
  opacity: 0.55;
}

.resize-handle:hover::after {
  border-color: var(--accent);
  opacity: 1;
}

.overview-bar {
  display: flex;
  align-items: center;
  gap: 0;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: var(--card-shadow);
  padding: 0 84px 0 24px;
  min-height: 72px;
  width: 100%;
  flex-shrink: 0;
  overflow: hidden;
}

.empty-dashboard {
  min-height: 360px;
  border: 1px dashed var(--border);
  border-radius: 12px;
  background: var(--card-bg);
  display: grid;
  place-items: center;
  align-content: center;
  gap: 10px;
  color: var(--text-muted);
  text-align: center;
}

.empty-dashboard strong {
  color: var(--text);
  font-size: 17px;
}

.empty-dashboard p {
  font-size: 13px;
}

.empty-dashboard button {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  margin-top: 4px;
}

.ov-divider {
  width: 1px;
  height: 28px;
  background: var(--border);
  flex-shrink: 0;
  margin: 0 20px;
}

/* time */
.ov-time {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-shrink: 0;
}
.ov-clock {
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.5px;
  font-variant-numeric: tabular-nums;
}
.ov-date {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
  white-space: nowrap;
}

/* todo progress */
.ov-stat { display: flex; flex-direction: column; gap: 4px; flex-shrink: 0; min-width: 140px; }
.ov-stat-top { display: flex; align-items: baseline; gap: 4px; }
.ov-stat-value { font-size: 18px; font-weight: 700; color: var(--text); letter-spacing: -0.3px; }
.ov-stat-unit { font-size: 12px; color: var(--text-muted); }
.ov-progress-track {
  height: 4px;
  background: var(--input-bg);
  border-radius: 2px;
  overflow: hidden;
}
.ov-progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: 2px;
  transition: width 0.4s ease;
}
.ov-stat-sub { font-size: 11px; color: var(--text-muted); }

/* holiday */
.ov-holiday {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
  color: var(--text-secondary);
}
.ov-holiday svg { color: var(--accent); flex-shrink: 0; }
.ov-holiday-name { font-size: 13px; font-weight: 600; color: var(--text); }
.ov-holiday-days { font-size: 12px; color: var(--text-muted); }
.ov-holiday-days b { color: var(--accent); font-weight: 700; }

/* quote */
.ov-quote {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  overflow: hidden;
}
.ov-quote span {
  font-size: 13px;
  color: var(--text-muted);
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Card base ── */
.card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--card-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
  width: 100%;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 84px 12px 18px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
}

.card-header h2 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  letter-spacing: -0.2px;
}

.today-badge {
  font-size: 11px;
  font-weight: 500;
  color: var(--accent);
  background: var(--accent-light);
  padding: 2px 8px;
  border-radius: 20px;
  cursor: pointer;
  transition: opacity 0.15s;
}
.today-badge:hover { opacity: 0.7; }

.nav-btns { display: flex; gap: 4px; }
.nav-btns button {
  width: 26px;
  height: 26px;
  border-radius: 7px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s, border-color 0.12s;
}
.nav-btns button:hover { background: var(--hover); border-color: var(--accent); color: var(--accent); }

.stats-badge {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--input-bg);
  padding: 2px 8px;
  border-radius: 20px;
}

/* ── Calendar ── */
.calendar-card { flex: 1; }

.weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  padding: 2px 8px 0;
  flex-shrink: 0;
}
.weekday {
  text-align: center;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-muted);
  padding: 5px 0 4px;
  letter-spacing: 0.4px;
  text-transform: uppercase;
}
.weekday.weekend { color: var(--destructive); opacity: 0.6; }

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  padding: 0 4px 6px;
  gap: 1px;
}

.cal-cell {
  border-radius: 6px;
  padding: 3px 2px 2px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  transition: background 0.12s;
  cursor: pointer;
  overflow: hidden;
  min-width: 0;
}
.cal-cell:hover { background: var(--hover); }
.cal-cell.selected { background: var(--accent-light); }
.cal-cell.selected:not(.today) .day-num { color: var(--accent); font-weight: 700; }

.task-bars { display: flex; flex-direction: column; gap: 1px; margin-top: 2px; width: 100%; overflow: hidden; }
.task-bar {
  font-size: 9px;
  line-height: 1.4;
  padding: 1px 3px;
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

.day-num {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 500;
  color: var(--text);
  border-radius: 50%;
  line-height: 1;
  transition: background 0.12s, color 0.12s;
}
.other-month .day-num { color: var(--text-muted); font-weight: 400; opacity: 0.4; }
.weekend .day-num { color: var(--destructive); }

.today .day-num {
  background: var(--accent);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(0, 122, 255, 0.4);
}

.tag {
  font-size: 8px;
  font-weight: 600;
  padding: 1px 3px;
  border-radius: 3px;
  width: fit-content;
  letter-spacing: 0.1px;
  line-height: 1.3;
}
.holiday-tag { background: rgba(255, 59, 48, 0.1); color: var(--destructive); }
.workday-tag { background: rgba(255, 149, 0, 0.12); color: var(--warning); }
.holiday .day-num { color: var(--destructive); }

/* ── Todo ── */
.todo-card { flex: 1; }

.add-form {
  display: flex;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.input-wrap {
  flex: 1;
  background: var(--input-bg);
  border-radius: 8px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  transition: box-shadow 0.15s;
}
.input-wrap:focus-within { box-shadow: 0 0 0 2px var(--accent-light); }

.input-wrap input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text);
  font-size: 13px;
  font-family: inherit;
  padding: 8px 0;
  outline: none;
}
.input-wrap input::placeholder { color: var(--text-muted); }

.add-form button {
  padding: 0 14px;
  height: 34px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
  white-space: nowrap;
}
.add-form button:hover { background: var(--accent-hover); }
.add-form button:disabled { opacity: 0.4; cursor: not-allowed; }

.todo-list-wrap {
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  padding: 6px 8px;
}
.todo-list-wrap::-webkit-scrollbar { width: 3px; }
.todo-list-wrap::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

.todo-list { list-style: none; display: flex; flex-direction: column; gap: 2px; }

.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 9px;
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
}

.todo-text { flex: 1; font-size: 13px; color: var(--text); }
.done .todo-text { text-decoration: line-through; color: var(--text-muted); }

.del-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 3px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  opacity: 0;
  transition: opacity 0.15s, color 0.15s;
}
.del-btn:hover { color: var(--destructive); }

/* ── Mini widgets ── */
.mini-widget {
  flex: 1;
}

.stats-widget-body {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(120px, 0.9fr) 1.1fr;
  gap: 12px;
  padding: 14px;
  overflow: auto;
}

.big-number,
.mini-stat-grid article {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--input-bg);
}

.big-number {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 6px;
  text-align: center;
  min-height: 120px;
}

.big-number strong {
  color: var(--accent);
  font-size: 34px;
  line-height: 1;
}

.big-number span,
.mini-stat-grid span {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
}

.mini-stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.mini-stat-grid article {
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
}

.mini-stat-grid strong {
  color: var(--text);
  font-size: 22px;
}

.compact-list {
  flex: 1;
  overflow: auto;
  padding: 8px;
}

.compact-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  border-radius: 8px;
  padding: 10px;
}

.compact-item:hover {
  background: var(--hover);
}

.compact-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--success);
  flex: 0 0 auto;
  margin-top: 5px;
}

.compact-item strong {
  display: block;
  color: var(--text);
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact-item small {
  display: block;
  color: var(--text-muted);
  font-size: 11px;
  margin-top: 3px;
}

.quick-note-input {
  flex: 1;
  min-height: 0;
  border: 0;
  resize: none;
  outline: none;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 13px;
  line-height: 1.7;
  padding: 14px 16px;
}

.quick-note-input::placeholder {
  color: var(--text-muted);
}

.holiday-widget-body {
  flex: 1;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  padding: 18px;
  text-align: center;
}

.holiday-name {
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 700;
}

.holiday-widget-body strong {
  color: var(--accent);
  font-size: clamp(32px, 6vw, 54px);
  line-height: 1;
}

.holiday-widget-body p {
  color: var(--text-muted);
  font-size: 12px;
}

/* ── Notes ── */
.notes-card { flex: 1; min-height: 0; }

.new-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
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

.notes-body {
  display: grid;
  grid-template-columns: 160px 1fr;
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

.notes-list {
  border-right: 1px solid var(--border);
  overflow-y: auto;
  padding: 6px 0;
}
.notes-list::-webkit-scrollbar { width: 3px; }
.notes-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

.note-item {
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--border);
  transition: background 0.12s;
  position: relative;
}
.note-item:hover { background: var(--hover); }
.note-item.active { background: var(--accent-light); }
.note-item:hover .note-del-btn { opacity: 1; }

.note-del-btn {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border-radius: 5px;
  border: none;
  background: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s, background 0.15s, color 0.15s;
}
.note-del-btn:hover { background: rgba(255,59,48,0.1); color: var(--destructive); }

.note-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}
.note-item.active .note-title { color: var(--accent); }

.note-preview {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-editor {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.note-title-input {
  padding: 12px 16px 8px;
  border: none;
  border-bottom: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  outline: none;
  flex-shrink: 0;
}
.note-title-input::placeholder { color: var(--text-muted); }

.note-markdown-editor {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.note-markdown-editor :deep(.vditor-wrap) {
  min-height: 0;
}

.note-markdown-editor :deep(.vditor-toolbar) {
  padding-right: 44px !important;
}

.note-editor-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: 13px;
}

.empty-hint {
  padding: 16px 12px;
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
}

@media (max-width: 1120px) {
  .widget-shell {
    grid-column: span 12 !important;
  }
}

@media (max-width: 760px) {
  .dashboard {
    padding: 16px;
  }

  .modal-backdrop {
    padding: 12px;
    align-items: start;
  }

  .widget-picker {
    max-height: calc(100vh - 24px);
  }

  .layout-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .toolbar-actions,
  .toolbar-actions button {
    width: 100%;
  }

  .picker-grid {
    grid-template-columns: 1fr;
  }

  .picker-card {
    grid-template-columns: 38px minmax(0, 1fr);
  }

  .picker-card button {
    grid-column: 1 / -1;
  }

  .stats-widget-body {
    grid-template-columns: 1fr;
  }

  .overview-bar {
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
    padding: 16px 84px 16px 16px;
  }

  .ov-divider {
    display: none;
  }

  .ov-quote {
    justify-content: flex-start;
    width: 100%;
  }

  .notes-body {
    grid-template-columns: 1fr;
  }

  .notes-list {
    border-right: 0;
    border-bottom: 1px solid var(--border);
    max-height: 160px;
  }
}
</style>
