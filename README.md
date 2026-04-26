<div align="center">

# Axiom Messenger

**A privacy-first Telegram desktop client built with Tauri 2, React 19, and Rust.**

Glassmorphism UI · Ghost Mode · Deleted Message Recovery · Full TDLib integration

[![Tauri](https://img.shields.io/badge/Tauri-2.x-24C8DB?logo=tauri&logoColor=white)](https://tauri.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Rust](https://img.shields.io/badge/Rust-stable-CE422B?logo=rust&logoColor=white)](https://www.rust-lang.org)
[![TDLib](https://img.shields.io/badge/TDLib-latest-2CA5E0?logo=telegram&logoColor=white)](https://github.com/tdlib/td)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## Overview

Axiom is a fully-featured Telegram client for Windows built on top of Telegram's official **TDLib** library. It exposes the complete Telegram feature set through a custom glassmorphism interface while adding privacy enhancements not found in the official client.

**Key differentiators:**
- **Ghost Mode** — read any conversation without sending read receipts, silently, with one toggle
- **Deleted Message Recovery** — messages deleted by the sender remain visible in your session, marked with a ghost badge
- **Pixel-perfect dark UI** — OLED-ready glassmorphism design system with a violet accent palette, no third-party UI library

---

## Features

### Core Messaging
| Feature | Status |
|---|---|
| Phone → SMS/Telegram code → 2FA authentication | ✅ |
| Chat list with real-time sort (TDLib `updateChatPosition`) | ✅ |
| Message history with date separators | ✅ |
| Send / Edit / Delete / Forward messages | ✅ |
| Reply with inline preview | ✅ |
| Typing indicators | ✅ |
| Read receipts (viewMessages) | ✅ |
| All message types: text, photo, video, voice, sticker, GIF, document, poll, call, dice… | ✅ |
| Message context menu (right-click) | ✅ |

### Privacy
| Feature | Status |
|---|---|
| **Ghost Mode** — read without sending seen receipts | ✅ |
| **Deleted Message Recovery** — preserve messages deleted by senders | ✅ |
| Block / Unblock users | ✅ |
| Privacy settings (Last Seen, Phone, Profile Photo, etc.) | ✅ |
| Active Sessions management | ✅ |

### Media
| Feature | Status |
|---|---|
| Send photos, videos, documents, voice notes | ✅ |
| **Video circles** (video notes) — record and preview | ✅ |
| Emoji picker (8 categories, search) | ✅ |
| Sticker picker (installed sets, trending) | ✅ |
| GIF picker (saved animations, search) | ✅ |
| Attachment menu | ✅ |
| Media viewer (full-screen photo/video) | ✅ |

### Chats & Navigation
| Feature | Status |
|---|---|
| Chat folder tabs (TDLib `getChatFolders`) | ✅ |
| Chat context menu: pin, mute, archive, delete | ✅ |
| Global search (chats + messages) | ✅ |
| In-chat message search with navigation | ✅ |
| Forward message modal (chat picker) | ✅ |
| New private chat (contact search) | ✅ |
| Create group / supergroup / channel | ✅ |
| Leave / delete chat | ✅ |

### Profiles
| Feature | Status |
|---|---|
| User profile panel (name, bio, username, phone, online status) | ✅ |
| Group/channel info panel (description, invite link, members) | ✅ |
| Premium badge ⭐, Verified badge ✓, Bot badge | ✅ |

### Settings
| Section | Status |
|---|---|
| Account (name, username, bio) | ✅ |
| Privacy & Security | ✅ |
| Notifications (per scope toggles) | ✅ |
| Appearance (Dark / OLED / Light theme, font size, chat background) | ✅ |
| Active Sessions (view and terminate) | ✅ |
| Logout | ✅ |

---

## Stack

| Layer | Technology |
|---|---|
| Desktop shell | **Tauri 2** (Rust + WebView2) |
| Frontend | **React 19** + **TypeScript 5** + **Vite 7** |
| Styling | CSS Modules + CSS custom properties — zero UI library dependencies |
| State management | React Context + `useReducer` |
| Rust backend | Raw `extern "C"` FFI over the TDLib JSON API |
| Telegram API | **TDLib** (`tdjson.dll` on Windows) |

---

## Architecture

```
React (TypeScript)
    │  invoke("command", args)    ← IPC call to Rust
    │  listen("td:event", cb)     ← real-time events from Rust
    ▼
Tauri Commands & Events (Rust)
    │  client::send(json)         ← async request to TDLib (td_send)
    │  client::execute(json)      ← sync execute (log level, etc.)
    ▼
TDLib JSON API  (tdjson.dll)
    │  td_send(client_id, req)    ← fire-and-forget
    │  td_receive(timeout)        ← background polling thread
    ▼
Telegram servers  (MTProto)
```

**Design decisions:**

- **Async TDLib model** — All requests are sent via `td_send` and matched to responses through the `@extra` field (e.g., `getChatHistory` → `messages`). A background `std::thread` polls `td_receive` continuously and dispatches each update to the correct Tauri event.
- **Chat ordering** — TDLib's `updateChatPosition` carries a 64-bit `order` field. The frontend stores this value and sorts the chat list descending, so pinned and recently-active chats always appear first.
- **Ghost Mode** — An `AtomicBool` in Rust `AppState`. The `view_messages` Tauri command is a no-op while ghost mode is on, preventing read receipts from ever reaching TDLib.
- **Deleted message recovery** — Every received message is cached in `AppState.message_cache`. When TDLib fires `updateDeleteMessages` with `is_permanent = true`, cached content for those IDs is moved to `deleted_messages` and re-emitted to the frontend, which renders them with a ghost badge.

---

## Project Structure

```
axiom_messenger/
├── src/                          # React + TypeScript frontend
│   ├── components/
│   │   ├── auth/                 # PhoneStep · CodeStep · PasswordStep
│   │   ├── chat/                 # ChatView · MessageBubble · MessageInput
│   │   │                         # ContextMenu · ReplyPreview · TypingIndicator
│   │   │                         # ForwardModal · AttachmentMenu · VideoNoteRecorder
│   │   ├── layout/               # AppLayout (sidebar + chat split)
│   │   ├── media/                # MediaViewer
│   │   ├── modals/               # NewChatModal · CreateChatModal
│   │   ├── picker/               # EmojiPicker · StickerPicker · GifPicker
│   │   ├── profile/              # UserProfile · ChatInfo
│   │   ├── search/               # GlobalSearch · InChatSearch
│   │   ├── settings/             # SettingsPanel · AccountSettings · PrivacySettings
│   │   │                         # NotificationSettings · AppearanceSettings · SessionsSettings
│   │   ├── sidebar/              # Sidebar · ChatListItem · FolderTabs · ChatListMenu
│   │   └── ui/                   # Avatar · GhostModeToggle · GlassButton
│   ├── hooks/
│   │   ├── useTdlib.ts           # ~50 typed wrappers over Tauri invoke commands
│   │   └── useTdlibEvents.ts     # Global event listeners + message/chat parsers
│   ├── store/
│   │   ├── AppContext.tsx         # React Context + useReducer (single source of truth)
│   │   └── types.ts              # AppState · Chat · Message · AppAction
│   └── styles/
│       ├── tokens.css            # Design tokens (colors, spacing, radii, typography)
│       └── global.css            # Reset · glassmorphism utilities · animations
│
└── src-tauri/                    # Rust backend
    ├── build.rs                  # Link TDLib + copy DLL to output directory
    ├── tdlib/
    │   └── tdjson.dll            # ← place your TDLib DLL here (not included)
    └── src/
        ├── lib.rs                # App entry: state setup, receive loop, command registration
        ├── state/                # AppState (client_id, ghost_mode, caches)
        ├── tdlib/
        │   ├── client.rs         # FFI bindings: create_client, send, execute, receive_loop
        │   ├── events.rs         # Route TDLib @type updates to named Tauri events
        │   └── types.rs          # JSON request builders for all used TDLib methods
        └── commands/
            ├── auth.rs           # Authentication commands
            ├── chats.rs          # Chat management commands
            ├── media.rs          # File download + all media send commands
            ├── messages.rs       # Message CRUD + reactions + search
            ├── settings.rs       # Ghost mode + account + privacy + sessions
            └── users.rs          # User/profile lookup + contacts + blocking
```

---

## Prerequisites

### 1. Rust toolchain

```powershell
winget install Rustlang.Rustup
rustc --version   # verify
```

### 2. Node.js (LTS) + pnpm

```powershell
winget install OpenJS.NodeJS.LTS
npm install -g pnpm
```

### 3. Visual Studio C++ Build Tools (Windows)

```powershell
winget install Microsoft.VisualStudio.2022.BuildTools
# During install, select: "Desktop development with C++"
```

> WebView2 is already included with Windows 11 and recent Windows 10 builds.

### 4. TDLib (`tdjson.dll`)

TDLib is **not bundled** in this repository due to its binary size (~40 MB).

1. Download a prebuilt Windows release from the [TDLib releases page](https://github.com/tdlib/td/releases), or build from source following the [TDLib build instructions](https://github.com/tdlib/td#building).
2. Place **`tdjson.dll`** (plus any companion DLLs it requires) into:
   ```
   src-tauri/tdlib/tdjson.dll
   ```
3. The `build.rs` script will automatically link against it and copy the DLL next to the compiled binary.

   Override the path with the `TDLIB_PATH` environment variable if needed.

### 5. Telegram API credentials

1. Go to [https://my.telegram.org](https://my.telegram.org) → *API development tools*
2. Create an application to receive your **API ID** and **API Hash**
3. Open `src-tauri/src/lib.rs` and fill in:
   ```rust
   const TG_API_ID: i32 = 12345678;           // ← your API ID
   const TG_API_HASH: &str = "your_hash";     // ← your API hash
   ```

---

## Getting Started

```powershell
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/axiom-messenger.git
cd axiom-messenger

# 2. Install frontend dependencies
pnpm install

# 3. Place tdjson.dll in src-tauri/tdlib/ (see Prerequisites above)

# 4. Fill in TG_API_ID and TG_API_HASH in src-tauri/src/lib.rs

# 5. Start the development build (first compile takes ~2-3 minutes)
pnpm tauri dev
```

### Production build

```powershell
pnpm tauri build
# Installer → src-tauri/target/release/bundle/
```

---

## Tauri Event Reference

| Event | TDLib source | Payload |
|---|---|---|
| `td:auth_state` | `updateAuthorizationState` | Full TDLib update object |
| `td:new_chat` | `updateNewChat` | `{ chat }` |
| `td:chat_updated` | `updateChatLastMessage`, `updateChatPosition`, `updateChatReadInbox`, … | Full TDLib update |
| `td:messages` | `messages` (response to `getChatHistory`) | `{ messages[], @extra: chatId }` |
| `td:new_message` | `updateNewMessage` | `{ message }` |
| `td:message_updated` | `updateMessageContent` | Full TDLib update |
| `td:deleted_messages` | `updateDeleteMessages` (permanent=true) | `{ chat_id, messages[] }` |
| `td:typing` | `updateChatAction` | Full TDLib update |
| `td:connection_state` | `updateConnectionState` | Full TDLib update |
| `td:user_response` | `user`, `userFullInfo`, `chatMembers`, … | Full TDLib response |
| `td:sessions` | `sessions` | Full TDLib response |
| `td:chat_folders` | `chatFolders` | Full TDLib response |
| `td:media_response` | `stickerSets`, `stickers`, `animations`, … | Full TDLib response |
| `td:messages_found` | `foundChatMessages`, `foundMessages` | Full TDLib response |

---

## Troubleshooting

**`error: could not find native library 'tdjson'`**  
→ `tdjson.dll` is missing. Place it in `src-tauri/tdlib/` and re-run `pnpm tauri dev`.

**App stays on loading screen indefinitely**  
→ `TG_API_ID` / `TG_API_HASH` in `src-tauri/src/lib.rs` are still `0` / `""`.

**`tdjson.dll` not found at runtime (crash on launch)**  
→ If you added the DLL after the last successful build, re-run `pnpm tauri dev` to trigger a rebuild and DLL copy.

**WebView2 missing (older Windows 10)**  
→ Install the [WebView2 Runtime](https://developer.microsoft.com/en-us/microsoft-edge/webview2/).

**`error[E0428]: the name __cmd__get_me is defined multiple times`**  
→ `get_me` was duplicated across `users.rs` and `settings.rs`. Remove the one in `users.rs`.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: description"`
4. Push and open a Pull Request

---

## License

MIT © 2025. See [LICENSE](LICENSE) for details.

> **Disclaimer:** This is an unofficial third-party client. It is not affiliated with, endorsed by, or connected to Telegram Messenger Inc. Use responsibly and in accordance with [Telegram's Terms of Service](https://telegram.org/tos).
