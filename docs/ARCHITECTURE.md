# Technical Architecture Document (ARCHITECTURE.md)
## Project: Prompt Optimizer (Universal AI Token Saver & Clarifier)

**Status:** Approved (Post-Gate 1)  
**Target Platform:** Windows 10/11 (Primary), macOS, Linux  
**Framework:** Tauri v2 (Rust backend + React 19 / TypeScript / Tailwind CSS frontend)  

---

## 1. System Overview & Component Hierarchy

Prompt Optimizer runs as a lightweight, background native desktop process managed via the OS System Tray. It provides system-level accessibility/shortcut interception, a floating on-screen overlay HUD, an offline text/token compression engine, and a secure client for local/cloud AI prompt sharpening.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            OPERATING SYSTEM (OS)                            │
│           (Windows User32 / UI Automation / Virtual Keyboard Hooks)         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Global Hotkeys & Selection Events
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    TAURI v2 CORE (RUST NATIVE RUNTIME)                      │
│                                                                             │
│  ┌──────────────────────────┐  ┌──────────────────────────────────────────┐ │
│  │     System Tray & Menu   │  │        OS Integration & Capture          │ │
│  │   - Tray icon & state    │  │   - Global shortcut (Ctrl+Shift+O)       │ │
│  │   - Quick toggles        │  │   - Text capture (Synthetic Copy/Paste)  │ │
│  │   - Exit / Settings open │  │   - Active window & caret position       │ │
│  └──────────────────────────┘  └──────────────────────────────────────────┘ │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                    OPTIMIZATION PIPELINE CORE                          │ │
│  │                                                                        │ │
│  │  ┌────────────────────────────────┐  ┌───────────────────────────────┐ │ │
│  │  │ Mode 1: Local Heuristic Engine │  │ Mode 2: AI Adapter Pipeline   │ │ │
│  │  │ - Filler Stripper (NLP Rules)  │  │ - Ollama Local Connector      │ │ │
│  │  │ - Stack Trace / Log Minifier   │  │ - BYOK Client (OpenAI, Gemini,│ │ │
│  │  │ - Code Comment / Space Trim    │  │   Anthropic, Grok)            │ │ │
│  │  │ - Tiktoken Local Tokenizer     │  │ - Meta-Prompt Framework       │ │ │
│  │  └────────────────────────────────┘  └───────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌──────────────────────────────────┐  ┌──────────────────────────────────┐ │
│  │      Local Security & Vault      │  │        IPC Bridge Interface      │ │
│  │   - keyring-rs (OS Credential    │  │   - invoke handlers              │ │
│  │     Manager / macOS Keychain)    │  │   - window position events       │ │
│  │   - JSON Config (App LocalData)  │  │   - state change broadcasts      │ │
│  └──────────────────────────────────┘  └──────────────────────────────────┘ │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Tauri IPC (Commands & Events)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                         WEBVIEW UI LAYER (REACT 19)                         │
│                                                                             │
│  ┌─────────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │    Floating Action Pill     │  │          Quick-Preview HUD           │  │
│  │  - Positioned near caret    │  │  - Side-by-side / inline diff        │  │
│  │  - [⚡ Compress] [✨ Sharpen]│  │  - Token reduction counter (%)       │  │
│  │  - Non-stealing focus       │  │  - [Enter] Replace, [Esc] Cancel     │  │
│  └─────────────────────────────┘  └──────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         Settings & Config Modal                       │  │
│  │  - Mode toggle (Instant vs. Preview HUD)                              │  │
│  │  - Engine configuration (Ollama URL, model name, BYOK API Keys)       │  │
│  │  - App blacklist / exclusion list                                     │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Subsystem Specifications

### 2.1. OS Interception & Text Replacement Engine
* **Capture Technique:** To ensure compatibility across any arbitrary window (browsers, terminal, VS Code, Slack, Electron apps), the native layer utilizes synthetic keystrokes via `enigo` or native Windows API:
  1. Save current clipboard contents to temporary memory.
  2. Send synthetic `Ctrl+C` (or `Cmd+C`) to copy highlighted text.
  3. Read clipboard to obtain source text.
  4. Restore initial clipboard content once capture completes.
* **In-Place Replacement:**
  1. Place optimized text into clipboard.
  2. Send synthetic `Ctrl+V` (or `Cmd+V`) into the active window.
  3. Clean up clipboard buffer.

### 2.2. Mode 1: Deterministic Token Compression Pipeline (Rust)
The compression module runs purely in-memory in `<10ms` with zero allocations outside of string buffers.
* **Module 1: Conversational De-Noiser (`denoise.rs`):** Strips conversational openings, pleasantries, apologies, and filler tokens using compiled regular expressions.
* **Module 2: Log & Trace Dehydrator (`trace_cleaner.rs`):** Parses stack traces, extracts error headers, message strings, and user-space file references while stripping deep framework dependencies (e.g. `node_modules`, standard library internals).
* **Module 3: Code Minifier (`code_trim.rs`):** Trims empty blank lines, trailing whitespace, and inline non-documentation comments without breaking syntax or indentation.
* **Module 4: Tokenizer (`tokenizer.rs`):** Uses `tiktoken-rs` (cl100k_base / o200k_base) to compute exact pre- and post-optimization token counts.

### 2.3. Mode 2: AI Sharpening & Prompt Framework Engine
* **Meta-Prompt Framework:** Transforms rough prompts into structured single-turn instructions enforcing:
  * Role assignment
  * Objective & scope
  * Output constraints & format
  * Edge case handling
* **Connectors:**
  * `OllamaClient`: HTTP client pointing to `http://localhost:11434/api/generate`.
  * `CloudClient`: Direct REST connectors to OpenAI (`api.openai.com/v1/chat/completions`), Anthropic (`api.anthropic.com/v1/messages`), and Gemini (`generativelanguage.googleapis.com/v1beta/models`).
* **Vault:** API keys are never stored in plain text files. They are stored using the `keyring` crate in Windows Credential Manager or macOS Keychain.

### 2.4. Tauri Window Architecture
* **Main Window (`settings`):** Standard decor, hidden on launch, shown via tray menu.
* **Overlay Window (`hud`):** Frameless, transparent, always-on-top, hidden by default. Appears dynamically near the cursor when text is selected or shortcut is pressed.

---

## 3. Directory Structure

```
Prompt Optimiser/
├── PRD.md
├── ARCHITECTURE.md
├── TASKS.md
├── src-tauri/                 # Rust Native Core
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── src/
│   │   ├── main.rs            # Entry point & Tauri setup
│   │   ├── app_state.rs       # Shared thread-safe state
│   │   ├── tray.rs            # System tray initialization
│   │   ├── clipboard.rs       # Text capture & replacement
│   │   ├── keyring_vault.rs   # Secure API key storage
│   │   ├── engine/
│   │   │   ├── mod.rs
│   │   │   ├── tokenizer.rs   # Token counting (tiktoken-rs)
│   │   │   ├── denoise.rs     # Filler stripping
│   │   │   ├── trace_cleaner.rs # Log & stack trace compression
│   │   │   └── code_trim.rs   # Code & comment minification
│   │   └── ai/
│   │       ├── mod.rs
│   │       ├── ollama.rs      # Ollama connector
│   │       └── byok.rs        # OpenAI/Gemini/Anthropic client
│   └── tests/
│       ├── test_compression.rs
│       └── test_ai_adapters.rs
├── src/                       # Frontend UI (React + Tailwind)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── src/
│       ├── App.tsx
│       ├── main.tsx
│       ├── components/
│       │   ├── FloatingPill.tsx
│       │   ├── PreviewHUD.tsx
│       │   ├── DiffViewer.tsx
│       │   └── SettingsModal.tsx
│       └── services/
│           └── tauriBridge.ts
```

---

## 4. Verification & Testing Strategy
* **Unit Tests (Rust):** Red-Green-Refactor test suites for every compression heuristic (asserting token reduction percentage and semantic preservation).
* **AI Adapter Mock Tests:** Integration tests verifying request/response payloads for Ollama and BYOK endpoints.
* **E2E UI & IPC Tests:** Testing Tauri IPC invocations and state serialization between Rust and React.
