<template>
  <section class="focus-plugin">
    <header class="focus-header">
      <div>
        <p class="eyebrow">专注模式</p>
        <h2>{{ activePreset.label }}</h2>
      </div>
      <span class="state-pill" :class="{ running: isRunning }">
        {{ isRunning ? "计时中" : "已暂停" }}
      </span>
    </header>

    <div class="timer-stage">
      <div class="timer-ring" :style="{ '--progress': progressPercent }">
        <div class="timer-face">
          <strong>{{ displayTime }}</strong>
          <span>{{ activePreset.description }}</span>
        </div>
      </div>
    </div>

    <div class="preset-row" role="tablist" aria-label="计时模式">
      <button
        v-for="preset in presets"
        :key="preset.id"
        type="button"
        :class="{ active: activePreset.id === preset.id }"
        @click="selectPreset(preset.id)"
      >
        {{ preset.label }}
      </button>
    </div>

    <div class="actions">
      <button type="button" class="primary-action" @click="toggleTimer">
        {{ isRunning ? "暂停" : "开始" }}
      </button>
      <button type="button" class="secondary-action" @click="resetTimer">重置</button>
    </div>

    <footer class="session-summary">
      <article>
        <span>今日完成</span>
        <strong>{{ finishedSessions }}</strong>
      </article>
      <article>
        <span>累计专注</span>
        <strong>{{ focusedMinutes }} 分钟</strong>
      </article>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue"
import { getJsonValue, setStoredValue } from "../../storage"

interface Preset {
  id: string
  label: string
  minutes: number
  description: string
}

const presets: Preset[] = [
  { id: "focus", label: "25 分钟", minutes: 25, description: "完成一段深度工作" },
  { id: "short-break", label: "5 分钟", minutes: 5, description: "短休息，恢复注意力" },
  { id: "long-break", label: "15 分钟", minutes: 15, description: "长休息，整理节奏" },
]

const STORAGE_KEY = "wb_focus_timer_stats"
interface FocusStats {
  date?: string
  finishedSessions?: number
  focusedMinutes?: number
}

const savedStats = ref<FocusStats>({})
const today = new Date().toISOString().slice(0, 10)
const finishedSessions = ref(0)
const focusedMinutes = ref(0)
const activePresetId = ref(presets[0].id)
const remainingSeconds = ref(presets[0].minutes * 60)
const isRunning = ref(false)
let intervalId: number | undefined

void loadStats()

const activePreset = computed(() => presets.find((preset) => preset.id === activePresetId.value) ?? presets[0])
const totalSeconds = computed(() => activePreset.value.minutes * 60)
const progressPercent = computed(() => {
  const elapsed = totalSeconds.value - remainingSeconds.value
  return Math.round((elapsed / totalSeconds.value) * 100)
})
const displayTime = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60).toString().padStart(2, "0")
  const seconds = (remainingSeconds.value % 60).toString().padStart(2, "0")
  return `${minutes}:${seconds}`
})

function selectPreset(id: string) {
  activePresetId.value = id
  resetTimer()
}

function toggleTimer() {
  isRunning.value ? pauseTimer() : startTimer()
}

function startTimer() {
  if (intervalId) return
  isRunning.value = true
  intervalId = window.setInterval(() => {
    if (remainingSeconds.value <= 1) {
      completeSession()
      return
    }
    remainingSeconds.value -= 1
  }, 1000)
}

function pauseTimer() {
  isRunning.value = false
  if (intervalId) window.clearInterval(intervalId)
  intervalId = undefined
}

function resetTimer() {
  pauseTimer()
  remainingSeconds.value = totalSeconds.value
}

function completeSession() {
  const wasFocusSession = activePresetId.value === "focus"
  pauseTimer()
  remainingSeconds.value = totalSeconds.value
  if (wasFocusSession) {
    finishedSessions.value += 1
    focusedMinutes.value += activePreset.value.minutes
    saveStats()
  }
}

function saveStats() {
  void setStoredValue(
    STORAGE_KEY,
    JSON.stringify({
      date: today,
      finishedSessions: finishedSessions.value,
      focusedMinutes: focusedMinutes.value,
    })
  )
}

async function loadStats() {
  savedStats.value = await getJsonValue<FocusStats>(STORAGE_KEY, {})
  if (savedStats.value.date !== today) return
  finishedSessions.value = savedStats.value.finishedSessions ?? 0
  focusedMinutes.value = savedStats.value.focusedMinutes ?? 0
}

onBeforeUnmount(() => pauseTimer())
</script>

<style scoped>
.focus-plugin {
  height: 100%;
  padding: 24px;
  overflow: auto;
  color: var(--text);
}

.focus-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
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

.state-pill {
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--input-bg);
  color: var(--text-muted);
  padding: 5px 11px;
  font-size: 12px;
  font-weight: 600;
}

.state-pill.running {
  color: var(--success);
  border-color: color-mix(in srgb, var(--success) 45%, transparent);
  background: color-mix(in srgb, var(--success) 12%, transparent);
}

.timer-stage {
  display: grid;
  place-items: center;
  padding: 18px 0 22px;
}

.timer-ring {
  --progress: 0;
  width: min(320px, 70vw);
  aspect-ratio: 1;
  border-radius: 50%;
  background: conic-gradient(var(--accent) calc(var(--progress) * 1%), var(--input-bg) 0);
  display: grid;
  place-items: center;
  box-shadow: inset 0 0 0 1px var(--border);
}

.timer-face {
  width: calc(100% - 28px);
  height: calc(100% - 28px);
  border-radius: 50%;
  background: var(--card-bg);
  border: 1px solid var(--border);
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  text-align: center;
}

.timer-face strong {
  font-size: clamp(42px, 9vw, 68px);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.timer-face span {
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
}

.preset-row,
.actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.preset-row {
  margin-bottom: 14px;
}

.preset-row button,
.actions button {
  border: 1px solid var(--border);
  border-radius: 8px;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.preset-row button {
  background: var(--input-bg);
  color: var(--text-secondary);
  padding: 8px 12px;
}

.preset-row button.active {
  background: var(--accent-light);
  color: var(--accent);
  border-color: var(--accent);
}

.actions button {
  min-width: 96px;
  padding: 10px 18px;
}

.primary-action {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.secondary-action {
  background: var(--card-bg);
  color: var(--text-secondary);
}

.session-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  max-width: 420px;
  margin: 22px auto 0;
}

.session-summary article {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--input-bg);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.session-summary span {
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
}

.session-summary strong {
  font-size: 20px;
}

@media (max-width: 560px) {
  .focus-header {
    align-items: flex-start;
  }

  .session-summary {
    grid-template-columns: 1fr;
  }
}
</style>
