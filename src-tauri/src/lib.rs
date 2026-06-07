use rusqlite::{params, types::ValueRef, Connection};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn db_get(app: tauri::AppHandle, key: String) -> Result<Option<String>, String> {
    let conn = open_db(&app)?;
    conn.query_row(
        "SELECT value FROM settings WHERE key = ?1",
        params![key],
        |row| row.get(0),
    )
    .map(Some)
    .or_else(|err| match err {
        rusqlite::Error::QueryReturnedNoRows => Ok(None),
        other => Err(other.to_string()),
    })
}

#[tauri::command]
fn db_set(app: tauri::AppHandle, key: String, value: String) -> Result<(), String> {
    let conn = open_db(&app)?;
    conn.execute(
        "INSERT INTO settings (key, value, updated_at)
         VALUES (?1, ?2, unixepoch('now') * 1000)
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           updated_at = excluded.updated_at",
        params![key, value],
    )
    .map_err(|err| err.to_string())?;
    Ok(())
}

#[tauri::command]
fn db_remove(app: tauri::AppHandle, key: String) -> Result<(), String> {
    let conn = open_db(&app)?;
    conn.execute("DELETE FROM settings WHERE key = ?1", params![key])
        .map_err(|err| err.to_string())?;
    Ok(())
}

#[derive(serde::Serialize)]
struct SqlQueryResult {
    columns: Vec<String>,
    rows: Vec<Vec<String>>,
}

#[derive(serde::Serialize)]
struct DbTable {
    name: String,
    kind: String,
}

#[derive(serde::Serialize)]
struct DbColumn {
    name: String,
    kind: String,
    not_null: bool,
    primary_key: bool,
}

#[tauri::command]
fn db_query(app: tauri::AppHandle, sql: String) -> Result<SqlQueryResult, String> {
    let conn = open_db(&app)?;
    query_sql(&conn, &sql)
}

#[tauri::command]
fn db_execute(app: tauri::AppHandle, sql: String) -> Result<usize, String> {
    let conn = open_db(&app)?;
    conn.execute_batch(&sql).map_err(|err| err.to_string())?;
    Ok(conn.changes() as usize)
}

#[tauri::command]
fn db_tables(app: tauri::AppHandle) -> Result<Vec<DbTable>, String> {
    let conn = open_db(&app)?;
    let result = query_sql(
        &conn,
        "SELECT name, type FROM sqlite_master
         WHERE type IN ('table', 'view') AND name NOT LIKE 'sqlite_%'
         ORDER BY type, name",
    )?;
    Ok(result
        .rows
        .into_iter()
        .filter_map(|row| {
            Some(DbTable {
                name: row.get(0)?.to_string(),
                kind: row.get(1)?.to_string(),
            })
        })
        .collect())
}

#[tauri::command]
fn db_table_columns(app: tauri::AppHandle, table: String) -> Result<Vec<DbColumn>, String> {
    let conn = open_db(&app)?;
    let sql = format!("PRAGMA table_info({})", quote_identifier(&table));
    let result = query_sql(&conn, &sql)?;
    Ok(result
        .rows
        .into_iter()
        .filter_map(|row| {
            Some(DbColumn {
                name: row.get(1)?.to_string(),
                kind: row.get(2)?.to_string(),
                not_null: row.get(3).map(|v| v == "1").unwrap_or(false),
                primary_key: row.get(5).map(|v| v != "0").unwrap_or(false),
            })
        })
        .collect())
}

#[tauri::command]
fn db_table_rows(app: tauri::AppHandle, table: String, limit: u32) -> Result<SqlQueryResult, String> {
    let conn = open_db(&app)?;
    let limit = limit.clamp(1, 1000);
    let sql = format!(
        "SELECT rowid AS __rowid__, * FROM {} LIMIT {}",
        quote_identifier(&table),
        limit
    );
    query_sql(&conn, &sql)
}

#[tauri::command]
fn db_insert_row(
    app: tauri::AppHandle,
    table: String,
    values: serde_json::Map<String, serde_json::Value>,
) -> Result<(), String> {
    let conn = open_db(&app)?;
    let pairs: Vec<(String, String)> = values
        .into_iter()
        .filter_map(|(key, value)| json_to_sql_literal(&value).map(|literal| (key, literal)))
        .collect();
    if pairs.is_empty() {
        return Err("No values provided".into());
    }
    let columns = pairs
        .iter()
        .map(|(key, _)| quote_identifier(key))
        .collect::<Vec<_>>()
        .join(", ");
    let literals = pairs
        .iter()
        .map(|(_, value)| value.clone())
        .collect::<Vec<_>>()
        .join(", ");
    let sql = format!(
        "INSERT INTO {} ({}) VALUES ({})",
        quote_identifier(&table),
        columns,
        literals
    );
    conn.execute_batch(&sql).map_err(|err| err.to_string())
}

#[tauri::command]
fn db_update_row(
    app: tauri::AppHandle,
    table: String,
    rowid: i64,
    values: serde_json::Map<String, serde_json::Value>,
) -> Result<(), String> {
    let conn = open_db(&app)?;
    let assignments = values
        .into_iter()
        .filter_map(|(key, value)| {
            json_to_sql_literal(&value).map(|literal| format!("{} = {}", quote_identifier(&key), literal))
        })
        .collect::<Vec<_>>();
    if assignments.is_empty() {
        return Ok(());
    }
    let sql = format!(
        "UPDATE {} SET {} WHERE rowid = {}",
        quote_identifier(&table),
        assignments.join(", "),
        rowid
    );
    conn.execute_batch(&sql).map_err(|err| err.to_string())
}

#[tauri::command]
fn db_delete_row(app: tauri::AppHandle, table: String, rowid: i64) -> Result<(), String> {
    let conn = open_db(&app)?;
    let sql = format!("DELETE FROM {} WHERE rowid = {}", quote_identifier(&table), rowid);
    conn.execute_batch(&sql).map_err(|err| err.to_string())
}

fn open_db(app: &tauri::AppHandle) -> Result<Connection, String> {
    let db_path = db_path(app)?;
    let conn = Connection::open(db_path).map_err(|err| err.to_string())?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        )",
        [],
    )
    .map_err(|err| err.to_string())?;
    Ok(conn)
}

fn query_sql(conn: &Connection, sql: &str) -> Result<SqlQueryResult, String> {
    let mut stmt = conn.prepare(sql).map_err(|err| err.to_string())?;
    let columns = stmt
        .column_names()
        .into_iter()
        .map(|name| name.to_string())
        .collect::<Vec<_>>();
    let column_count = stmt.column_count();
    let rows = stmt
        .query_map([], |row| {
            let mut values = Vec::with_capacity(column_count);
            for index in 0..column_count {
                values.push(sql_value_to_string(row.get_ref(index)?));
            }
            Ok(values)
        })
        .map_err(|err| err.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|err| err.to_string())?;
    Ok(SqlQueryResult { columns, rows })
}

fn sql_value_to_string(value: ValueRef<'_>) -> String {
    match value {
        ValueRef::Null => String::new(),
        ValueRef::Integer(value) => value.to_string(),
        ValueRef::Real(value) => value.to_string(),
        ValueRef::Text(value) => String::from_utf8_lossy(value).to_string(),
        ValueRef::Blob(value) => format!("<blob {} bytes>", value.len()),
    }
}

fn quote_identifier(value: &str) -> String {
    format!("\"{}\"", value.replace('"', "\"\""))
}

fn json_to_sql_literal(value: &serde_json::Value) -> Option<String> {
    match value {
        serde_json::Value::Null => Some("NULL".into()),
        serde_json::Value::Bool(value) => Some(if *value { "1".into() } else { "0".into() }),
        serde_json::Value::Number(value) => Some(value.to_string()),
        serde_json::Value::String(value) => Some(format!("'{}'", value.replace('\'', "''"))),
        serde_json::Value::Array(_) | serde_json::Value::Object(_) => {
            Some(format!("'{}'", value.to_string().replace('\'', "''")))
        }
    }
}

fn db_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|err| err.to_string())?;
    fs::create_dir_all(&dir).map_err(|err| err.to_string())?;
    Ok(dir.join("workbench.sqlite"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            db_get,
            db_set,
            db_remove,
            db_query,
            db_execute,
            db_tables,
            db_table_columns,
            db_table_rows,
            db_insert_row,
            db_update_row,
            db_delete_row
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
