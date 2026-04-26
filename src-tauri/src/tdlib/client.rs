use std::ffi::{CStr, CString};
use std::os::raw::c_char;
use serde_json::Value;
use tauri::AppHandle;

// raw-dylib: Rust generates the import table from these declarations directly,
// no tdjson.lib import library required — only tdjson.dll at runtime.
#[cfg_attr(windows, link(name = "tdjson", kind = "raw-dylib"))]
#[cfg_attr(not(windows), link(name = "tdjson", kind = "dylib"))]
extern "C" {
    fn td_create_client_id() -> i32;
    fn td_send(client_id: i32, request: *const c_char);
    fn td_receive(timeout: f64) -> *const c_char;
    fn td_execute(request: *const c_char) -> *const c_char;
}

pub fn create_client() -> i32 {
    unsafe { td_create_client_id() }
}

pub fn send(client_id: i32, request: Value) {
    let s = request.to_string();
    if let Ok(c_str) = CString::new(s) {
        unsafe { td_send(client_id, c_str.as_ptr()) };
    }
}

pub fn execute(request: Value) -> Option<Value> {
    let s = request.to_string();
    let c_str = CString::new(s).ok()?;
    let result = unsafe { td_execute(c_str.as_ptr()) };
    if result.is_null() {
        return None;
    }
    let result_str = unsafe { CStr::from_ptr(result) }.to_str().ok()?;
    serde_json::from_str(result_str).ok()
}

pub fn receive_loop(app_handle: AppHandle) {
    eprintln!("[TDLib] receive_loop started");
    loop {
        let result = unsafe { td_receive(1.0) };
        if result.is_null() {
            continue;
        }
        let result_str = match unsafe { CStr::from_ptr(result) }.to_str() {
            Ok(s) => s,
            Err(_) => continue,
        };
        eprintln!("[TDLib] update: {result_str}");
        match serde_json::from_str::<Value>(result_str) {
            Ok(json) => crate::tdlib::events::dispatch(json, &app_handle),
            Err(e) => eprintln!("[TDLib] parse error: {e}"),
        }
    }
}
