// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{command, AppHandle};
use serde::{Serialize, Deserialize};
use std::fs;
use std::path::PathBuf;
use chrono::{Datelike, Local, Timelike};
use uuid::Uuid;

// ----------------------------------------
// Folder base aplikasi
// ----------------------------------------
fn get_base_dir() -> PathBuf {
    let mut base = dirs::data_dir().unwrap_or(std::env::current_dir().unwrap());
    base.push("TemanKasir by MieAyamPangsit");
    base
}

// ----------------------------------------
// Folder logs
// ----------------------------------------
fn get_logs_dir() -> PathBuf {
    let logs_dir = get_base_dir().join("logs");
    let _ = fs::create_dir_all(&logs_dir);
    logs_dir
}

// ----------------------------------------
// Folder history
// ----------------------------------------
fn get_history_dir() -> PathBuf {
    let history_dir = get_base_dir().join("history");
    let _ = fs::create_dir_all(&history_dir);
    history_dir
}

// ----------------------------------------
// Logging error otomatis
// ----------------------------------------
fn log_error(message: &str) {
    let logs_dir = get_logs_dir();
    let now = Local::now();
    let filename = format!(
        "{:02}{:02}-{:02}-{:02}{:02}.json",
        now.day(),
        now.month(),
        now.year() % 100,
        now.hour(),
        now.minute()
    );
    let file_path = logs_dir.join(filename);

    let log = serde_json::json!({
        "timestamp": now.to_rfc3339(),
        "error": message
    });

    let _ = fs::write(
        file_path,
        serde_json::to_string_pretty(&log).unwrap_or_default(),
    );
}

// ----------------------------------------
// Order structs
// ----------------------------------------
#[derive(Serialize, Deserialize, Debug)]
struct OrderItem {
    id: String,
    nama: String,
    harga: f64,
    qty: u32,
}

#[derive(Serialize, Deserialize, Debug)]
struct OrderHistory {
    date: String,
    barang: Vec<OrderItem>,
    total_harga: f64,
}

// ----------------------------------------
// Util functions
// ----------------------------------------
fn calculate_total(items: &[OrderItem]) -> f64 {
    items.iter().map(|i| i.harga * i.qty as f64).sum()
}

// ----------------------------------------
// Commands
// ----------------------------------------
#[command]
fn save_order(items: Vec<OrderItem>) -> Result<(), String> {
    if items.is_empty() {
        return Err("items kosong".into());
    }

    let history_dir = get_history_dir();
    let total_harga = calculate_total(&items);

    let date = Local::now()
        .format("%Y-%m-%d_%H-%M-%S-%3f")
        .to_string();

    let order = OrderHistory {
        date: date.clone(),
        barang: items,
        total_harga,
    };

    let path = history_dir.join(format!("{}.json", date));

    let content = serde_json::to_string_pretty(&order).map_err(|e| e.to_string())?;
    fs::write(path, content).map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
fn load_all_history(newest_first: Option<bool>) -> Result<Vec<OrderHistory>, String> {
    let dir = get_history_dir();
    let mut result = Vec::new();

    for entry in fs::read_dir(dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.extension().and_then(|s| s.to_str()) == Some("json") {
            let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
            if let Ok(order) = serde_json::from_str::<OrderHistory>(&content) {
                result.push(order);
            }
        }
    }

    if newest_first.unwrap_or(true) {
        result.sort_by(|a, b| b.date.cmp(&a.date));
    } else {
        result.sort_by(|a, b| a.date.cmp(&b.date));
    }

    Ok(result)
}

#[command]
fn get_all_history(order: Option<String>) -> Result<Vec<OrderHistory>, String> {
    let history_dir = get_history_dir();
    if !history_dir.exists() {
        return Ok(vec![]);
    }

    let mut all_history: Vec<OrderHistory> = vec![];

    for entry in fs::read_dir(&history_dir).map_err(|e| {
        log_error(&e.to_string());
        e.to_string()
    })? {
        let entry = entry.map_err(|e| {
            log_error(&e.to_string());
            e.to_string()
        })?;
        let path = entry.path();
        if path.is_file() && path.extension().map_or(false, |ext| ext == "json") {
            let content = fs::read_to_string(&path).map_err(|e| {
                log_error(&e.to_string());
                e.to_string()
            })?;
            if let Ok(order_data) = serde_json::from_str::<OrderHistory>(&content) {
                all_history.push(order_data);
            }
        }
    }

    all_history.reverse();

    if let Some(ord) = order {
        if ord.to_lowercase() == "asc" {
            all_history.sort_by(|a, b| b.date.cmp(&a.date));
        }
    }

    Ok(all_history)
}

#[command]
fn get_total_income() -> Result<f64, String> {
    let history_dir = get_history_dir();
    if !history_dir.exists() {
        return Ok(0.0);
    }

    let mut total: f64 = 0.0;

    for entry in fs::read_dir(&history_dir).map_err(|e| {
        log_error(&e.to_string());
        e.to_string()
    })? {
        let entry = entry.map_err(|e| {
            log_error(&e.to_string());
            e.to_string()
        })?;
        let path = entry.path();
        if path.is_file() && path.extension().map_or(false, |ext| ext == "json") {
            let content = fs::read_to_string(&path).map_err(|e| {
                log_error(&e.to_string());
                e.to_string()
            })?;
            if let Ok(order) = serde_json::from_str::<OrderHistory>(&content) {
                total += order.total_harga;
            }
        }
    }

    Ok(total)
}

// ----------------------------------------
// Product structs & functions
// ----------------------------------------
#[derive(Serialize, Deserialize, Clone)]
pub struct Product {
    pub internal_id: String,
    pub id: String,
    pub nama: String,
    pub harga: f64,
    pub stock: u32,
}

fn get_products_dir() -> PathBuf {
    let dir = get_base_dir().join("products");
    fs::create_dir_all(&dir).ok();
    dir
}

fn find_product_by_internal_id(
    products_dir: &PathBuf,
    internal_id: &str,
) -> Option<(Product, PathBuf)> {
    let entries = fs::read_dir(products_dir).ok()?;

    for entry in entries.flatten() {
        if entry.path().is_file() {
            let content = fs::read_to_string(entry.path()).ok()?;
            if let Ok(p) = serde_json::from_str::<Product>(&content) {
                if p.internal_id == internal_id {
                    return Some((p, entry.path()));
                }
            }
        }
    }
    None
}

#[tauri::command]
fn product(
    internal_id: Option<String>,
    id: String,
    nama: String,
    harga: f64,
    stock: u32,
) -> Result<(), String> {
    let products_dir = get_products_dir();

    // 🔎 cari produk lama
    let (mut product, old_path) = if let Some(ref iid) = internal_id {
        if let Some((p, path)) = find_product_by_internal_id(&products_dir, iid) {
            (p, Some(path))
        } else {
            (
                Product {
                    internal_id: iid.clone(),
                    id: id.clone(),
                    nama: nama.clone(),
                    harga,
                    stock,
                },
                None,
            )
        }
    } else {
        (
            Product {
                internal_id: Uuid::new_v4().to_string(),
                id: id.clone(),
                nama: nama.clone(),
                harga,
                stock,
            },
            None,
        )
    };

    // ✏️ update field
    product.id = id.clone();
    product.nama = nama.clone();
    product.harga = harga;
    product.stock = stock;

    // ❌ hapus file lama (jika ada)
    if let Some(path) = old_path {
        let _ = fs::remove_file(path);
    }

    // 📝 tulis file baru
    let filename = format!("{}-{}.json", product.id, product.nama.replace(" ", "_"));
    let file_path = products_dir.join(filename);

    fs::write(
        file_path,
        serde_json::to_string_pretty(&product).map_err(|e| e.to_string())?,
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn get_product_by_id(_app: AppHandle, id: String) -> Result<Product, String> {
    let dir = get_products_dir();

    if !dir.exists() {
        return Err("Products folder not found".into());
    }

    for entry in fs::read_dir(dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.is_file() && path.extension().map_or(false, |e| e == "json") {
            let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
            let product: Product = serde_json::from_str(&content).map_err(|e| e.to_string())?;

            if product.id == id {
                return Ok(product);
            }
        }
    }

    Err("Product not found".into())
}

#[tauri::command]
fn get_all_products() -> Result<Vec<Product>, String> {
    let products_dir = get_products_dir();
    let mut products = Vec::new();

    if let Ok(entries) = fs::read_dir(products_dir) {
        for entry in entries.flatten() {
            if entry.path().is_file() {
                if let Ok(content) = fs::read_to_string(entry.path()) {
                    if let Ok(p) = serde_json::from_str::<Product>(&content) {
                        products.push(p);
                    }
                }
            }
        }
    }

    products.sort_by(|a, b| a.nama.cmp(&b.nama));
    Ok(products)
}

#[tauri::command]
fn delete_product(internal_id: String) -> Result<(), String> {
    let products_dir = get_products_dir();

    if let Some((_p, path)) = find_product_by_internal_id(&products_dir, &internal_id) {
        fs::remove_file(path).map_err(|e| e.to_string())?;
    }

    Ok(())
}

// ----------------------------------------
// Store Config
// ----------------------------------------
#[derive(Serialize, Deserialize, Clone)]
struct StoreConfig {
    nama: String,
    alamat: Option<String>,
    telpon: Option<String>,
}

fn get_config_dir() -> PathBuf {
    let dir = get_base_dir().join("config");
    fs::create_dir_all(&dir).ok();
    dir
}

fn get_store_config_path() -> PathBuf {
    get_config_dir().join("storeConfig.json")
}

#[tauri::command]
fn set_store_config(
    nama: String,
    alamat: Option<String>,
    telpon: Option<String>,
) -> Result<(), String> {
    let path = get_store_config_path();

    let mut config = if path.exists() {
        let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        serde_json::from_str::<StoreConfig>(&content).unwrap_or(StoreConfig {
            nama: nama.clone(),
            alamat: None,
            telpon: None,
        })
    } else {
        StoreConfig {
            nama: nama.clone(),
            alamat: None,
            telpon: None,
        }
    };

    config.nama = nama;
    if let Some(a) = alamat {
        config.alamat = Some(a);
    }
    if let Some(t) = telpon {
        config.telpon = Some(t);
    }

    fs::write(&path, serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?)
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn get_store_config() -> Result<Option<StoreConfig>, String> {
    let path = get_store_config_path();
    if !path.exists() {
        return Ok(None);
    }

    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let config = serde_json::from_str::<StoreConfig>(&content).map_err(|e| e.to_string())?;
    Ok(Some(config))
}

// helper
fn remove_dir_all_if_exists(dir: &PathBuf) -> Result<(), String> {
    if dir.exists() {
        fs::remove_dir_all(dir).map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Hapus semua file konfigurasi & produk
#[command]
fn reset_config_and_products() -> Result<(), String> {
    // Base app folder
    let base_dir = get_base_dir();

    // Folder config
    let config_dir = base_dir.join("config");
    remove_dir_all_if_exists(&config_dir)?;

    // Folder products
    let products_dir = base_dir.join("products");
    remove_dir_all_if_exists(&products_dir)?;

    Ok(())
}

// ----------------------------------------
// Tauri app
// ----------------------------------------
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            save_order,
            get_all_history,
            get_total_income,
            product,
            get_store_config,
            set_store_config,
            get_product_by_id,
            get_all_products,
            delete_product,
            load_all_history,
            reset_config_and_products
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    tauri_nextjs_template_lib::run()
}
