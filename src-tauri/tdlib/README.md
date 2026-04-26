# TDLib binaries

Place `tdjson.dll` (Windows) or `libtdjson.so` / `libtdjson.dylib` (Linux/macOS) in this directory.

## Obtaining TDLib

### Option A — Prebuilt binaries (fastest)

Download the latest Windows build from the unofficial releases:
https://github.com/tdlib/td/releases

Or use a community build:
https://github.com/nickolaev/tdlib-binaries/releases

Required file: `tdjson.dll` (place it here in `src-tauri/tdlib/`)

### Option B — Build from source

1. Install prerequisites:
   - Visual Studio 2022 with C++ workload
   - CMake ≥ 3.16
   - vcpkg

2. Build:
```
git clone https://github.com/tdlib/td.git
cd td
mkdir build && cd build
cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=../tdlib ..
cmake --build . --target install
```

3. Copy the resulting `tdjson.dll` here.

## API Credentials

Before running the app, set your Telegram API credentials in `src/lib.rs`:

```rust
const TG_API_ID: i32 = YOUR_API_ID;
const TG_API_HASH: &str = "YOUR_API_HASH";
```

Get your credentials at https://my.telegram.org → API development tools.
