use std::path::PathBuf;

fn main() {
    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));

    // On Windows we use `kind = "raw-dylib"` in client.rs, so no .lib is needed.
    // On other platforms the #[link(kind = "dylib")] attribute handles it.
    #[cfg(not(windows))]
    {
        let tdlib_path = std::env::var("TDLIB_PATH")
            .map(PathBuf::from)
            .unwrap_or_else(|_| manifest_dir.join("tdlib"));
        println!("cargo:rustc-link-search=native={}", tdlib_path.display());
        println!("cargo:rerun-if-env-changed=TDLIB_PATH");
    }

    println!("cargo:rerun-if-changed=tdlib/tdjson.dll");

    let dll_src = find_tdjson_dll(&manifest_dir);

    match dll_src {
        Some(src) => {
            let profile = std::env::var("PROFILE").unwrap_or_else(|_| "debug".to_string());
            let out_dir = manifest_dir.join("target").join(&profile);
            let dest = out_dir.join("tdjson.dll");
            if dest != src {
                if let Err(e) = std::fs::copy(&src, &dest) {
                    println!(
                        "cargo:warning=Could not copy tdjson.dll to {}: {e}",
                        out_dir.display()
                    );
                }
            }
        }
        None => {
            println!(
                "cargo:warning=tdjson.dll not found. Run `pnpm add prebuilt-tdlib` \
                then copy tdjson.dll from node_modules into src-tauri/tdlib/. \
                See README for full setup instructions."
            );
        }
    }

    tauri_build::build();
}

fn find_tdjson_dll(manifest_dir: &PathBuf) -> Option<PathBuf> {
    let project_root = manifest_dir.parent().unwrap_or(manifest_dir);
    let nm = project_root.join("node_modules");

    // 1. Explicit override
    if let Ok(p) = std::env::var("TDLIB_PATH") {
        let dll = PathBuf::from(p).join("tdjson.dll");
        if dll.exists() {
            return Some(dll);
        }
    }

    // 2. Manual placement (documented in README)
    let manual = manifest_dir.join("tdlib").join("tdjson.dll");
    if manual.exists() {
        return Some(manual);
    }

    // 3. pnpm virtual store: node_modules/.pnpm/@prebuilt-tdlib+win32-x64@*/node_modules/...
    let pnpm_store = nm.join(".pnpm");
    if let Ok(entries) = std::fs::read_dir(&pnpm_store) {
        for entry in entries.flatten() {
            let name = entry.file_name();
            let s = name.to_string_lossy();
            if s.starts_with("@prebuilt-tdlib+win32-x64@") {
                let dll = entry
                    .path()
                    .join("node_modules")
                    .join("@prebuilt-tdlib")
                    .join("win32-x64")
                    .join("tdjson.dll");
                if dll.exists() {
                    return Some(dll);
                }
            }
        }
    }

    // 4. Regular npm/yarn layout
    for subpath in &[
        ["@prebuilt-tdlib", "win32-x64", "tdjson.dll"].as_slice(),
        &["@prebuilt-tdlib", "windows-x64", "tdjson.dll"],
        &["prebuilt-tdlib", "tdjson.dll"],
    ] {
        let dll = subpath.iter().fold(nm.clone(), |p, s| p.join(s));
        if dll.exists() {
            return Some(dll);
        }
    }

    None
}
