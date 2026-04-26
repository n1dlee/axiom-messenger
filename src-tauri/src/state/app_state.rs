use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use serde_json::Value;

pub struct AppState {
    pub client_id: i32,
    pub ghost_mode: AtomicBool,
    /// chat_id → message_id → message JSON (live cache for deleted-message recovery)
    pub message_cache: Mutex<HashMap<i64, HashMap<i64, Value>>>,
    /// Messages saved before permanent deletion (Ayugram-style)
    pub deleted_messages: Mutex<Vec<Value>>,
}

impl AppState {
    pub fn new(client_id: i32) -> Self {
        AppState {
            client_id,
            ghost_mode: AtomicBool::new(false),
            message_cache: Mutex::new(HashMap::new()),
            deleted_messages: Mutex::new(Vec::new()),
        }
    }

    pub fn ghost_mode(&self) -> bool {
        self.ghost_mode.load(Ordering::Relaxed)
    }

    pub fn set_ghost_mode(&self, enabled: bool) {
        self.ghost_mode.store(enabled, Ordering::Relaxed);
    }
}
