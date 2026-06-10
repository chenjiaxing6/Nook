<template>
  <div class="database-page">
    <header class="page-header">
      <div>
        <h1>SQLite 数据库</h1>
        <p>支持任意 SQL、任意表查看和行级编辑。</p>
      </div>
      <button type="button" @click="loadTables">刷新</button>
    </header>

    <div class="database-layout">
      <aside class="table-list">
        <button
          v-for="table in tables"
          :key="table.name"
          type="button"
          :class="{ active: activeTable === table.name }"
          @click="selectTable(table.name)"
        >
          <strong>{{ table.name }}</strong>
          <span>{{ table.kind }}</span>
        </button>
      </aside>

      <main class="table-panel">
        <section class="panel-header">
          <div>
            <h2>{{ activeTable || "选择数据表" }}</h2>
            <span v-if="columns.length">{{ columns.length }} 列</span>
          </div>
          <button type="button" :disabled="!activeTable" @click="openInsert">新增行</button>
        </section>

        <div class="data-table-wrap">
          <table v-if="tableRows.length">
            <thead>
              <tr>
                <th v-for="column in tableColumns" :key="column">{{ column }}</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rowIndex) in tableRows" :key="rowIndex">
                <td v-for="(value, colIndex) in row" :key="tableColumns[colIndex]">
                  <textarea
                    v-if="tableColumns[colIndex] !== '__rowid__'"
                    :value="value"
                    @change="updateCell(row, tableColumns[colIndex], ($event.target as HTMLTextAreaElement).value)"
                  ></textarea>
                  <span v-else>{{ value }}</span>
                </td>
                <td>
                  <button type="button" class="danger-btn" @click="deleteRow(row)">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">暂无数据</div>
        </div>

        <section class="sql-console">
          <div class="console-header">
            <h2>SQL 控制台</h2>
            <div>
              <button type="button" @click="runQuery">查询</button>
              <button type="button" @click="runExecute">执行</button>
            </div>
          </div>
          <textarea v-model="sql" spellcheck="false"></textarea>
          <p v-if="message" class="message">{{ message }}</p>
          <div v-if="queryResult" class="query-result">
            <table>
              <thead>
                <tr>
                  <th v-for="column in queryResult.columns" :key="column">{{ column }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in queryResult.rows" :key="index">
                  <td v-for="(value, colIndex) in row" :key="colIndex">{{ value }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>

    <div v-if="insertOpen" class="modal-backdrop" @click.self="insertOpen = false">
      <section class="insert-modal">
        <header>
          <h2>新增 {{ activeTable }}</h2>
          <button type="button" @click="insertOpen = false">关闭</button>
        </header>
        <label v-for="column in editableColumns" :key="column.name">
          <span>{{ column.name }}</span>
          <textarea v-model="insertDraft[column.name]"></textarea>
        </label>
        <button type="button" class="primary-btn" @click="insertRow">保存</button>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue"
import { invoke } from "@tauri-apps/api/core"

interface DbTable {
  name: string
  kind: string
}

interface DbColumn {
  name: string
  kind: string
  not_null: boolean
  primary_key: boolean
}

interface SqlQueryResult {
  columns: string[]
  rows: string[][]
}

const tables = ref<DbTable[]>([])
const activeTable = ref("")
const columns = ref<DbColumn[]>([])
const tableResult = ref<SqlQueryResult>({ columns: [], rows: [] })
const queryResult = ref<SqlQueryResult | null>(null)
const sql = ref("SELECT key, value, updated_at FROM settings LIMIT 100")
const message = ref("")
const insertOpen = ref(false)
const insertDraft = ref<Record<string, string>>({})

const tableColumns = computed(() => tableResult.value.columns)
const tableRows = computed(() => tableResult.value.rows)
const editableColumns = computed(() => columns.value.filter((column) => column.name !== "rowid"))

onMounted(() => void loadTables())

async function loadTables() {
  tables.value = await invoke<DbTable[]>("db_tables")
  if (!activeTable.value && tables.value[0]) {
    await selectTable(tables.value[0].name)
  }
}

async function selectTable(table: string) {
  activeTable.value = table
  columns.value = await invoke<DbColumn[]>("db_table_columns", { table })
  await loadRows()
}

async function loadRows() {
  if (!activeTable.value) return
  tableResult.value = await invoke<SqlQueryResult>("db_table_rows", {
    table: activeTable.value,
    limit: 300,
  })
}

async function updateCell(row: string[], column: string, value: string) {
  if (!activeTable.value) return
  const rowid = Number(row[0])
  await invoke("db_update_row", {
    table: activeTable.value,
    rowid,
    values: { [column]: value },
  })
  await loadRows()
}

async function deleteRow(row: string[]) {
  if (!activeTable.value) return
  await invoke("db_delete_row", {
    table: activeTable.value,
    rowid: Number(row[0]),
  })
  await loadRows()
}

function openInsert() {
  insertDraft.value = Object.fromEntries(editableColumns.value.map((column) => [column.name, ""]))
  insertOpen.value = true
}

async function insertRow() {
  if (!activeTable.value) return
  await invoke("db_insert_row", {
    table: activeTable.value,
    values: insertDraft.value,
  })
  insertOpen.value = false
  await loadRows()
}

async function runQuery() {
  message.value = ""
  queryResult.value = await invoke<SqlQueryResult>("db_query", { sql: sql.value })
}

async function runExecute() {
  queryResult.value = null
  const changed = await invoke<number>("db_execute", { sql: sql.value })
  message.value = `执行完成，影响 ${changed} 行`
  await loadTables()
  if (activeTable.value) await loadRows()
}
</script>

<style scoped>
.database-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 24px 24px;
  overflow: hidden;
  color: var(--text);
}

.page-header,
.panel-header,
.console-header,
.insert-modal header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

h1 {
  font-size: 30px;
  font-weight: 760;
  letter-spacing: 0;
}

.page-header p,
.panel-header span,
.message {
  color: var(--text-muted);
  font-size: 13px;
}

button {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card-bg);
  color: var(--text-secondary);
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  padding: 8px 12px;
  box-shadow: var(--card-shadow);
}

button:hover {
  border-color: var(--accent);
  color: var(--accent);
}

button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.database-layout {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 14px;
}

.table-list,
.table-panel,
.sql-console,
.insert-modal {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
}

.table-list {
  overflow: auto;
  padding: 10px;
}

.table-list button {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  margin-bottom: 6px;
  text-align: left;
  box-shadow: none;
}

.table-list button.active {
  border-color: var(--accent);
  background: var(--accent-light);
  color: var(--accent);
}

.table-list span {
  color: var(--text-muted);
  font-size: 11px;
}

.table-panel {
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) 260px;
  overflow: hidden;
}

.panel-header,
.console-header {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--card-bg) 88%, var(--bg) 12%);
}

.data-table-wrap,
.query-result {
  overflow: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

th,
td {
  border-bottom: 1px solid var(--border);
  border-right: 1px solid var(--border);
  padding: 8px;
  vertical-align: top;
}

th {
  background: var(--input-bg);
  color: var(--text-secondary);
  position: sticky;
  top: 0;
  z-index: 1;
}

td textarea,
.sql-console textarea,
.insert-modal textarea {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--input-bg);
  color: var(--text);
  font: inherit;
  font-family: "SF Mono", "Fira Code", monospace;
  resize: vertical;
  padding: 7px;
  outline: none;
}

td textarea {
  min-width: 180px;
  min-height: 54px;
}

.danger-btn:hover {
  border-color: var(--destructive);
  color: var(--destructive);
}

.empty-state {
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--text-muted);
}

.sql-console {
  border-radius: 0;
  border-inline: 0;
  border-bottom: 0;
  overflow: hidden;
  box-shadow: none;
}

.sql-console textarea {
  min-height: 92px;
  border: 0;
  border-bottom: 1px solid var(--border);
  border-radius: 0;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  background: rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 24px;
}

.insert-modal {
  width: min(620px, 100%);
  max-height: calc(100vh - 48px);
  overflow: auto;
  padding: 16px;
}

.insert-modal label {
  display: block;
  margin-top: 12px;
}

.insert-modal label span {
  display: block;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 5px;
}

.primary-btn {
  width: 100%;
  margin-top: 14px;
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
</style>
