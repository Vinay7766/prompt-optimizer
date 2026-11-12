# Atomic Task Breakdown (TASKS.md)
## Project: Prompt Optimizer (Universal AI Token Saver & Clarifier)

**Execution Framework:** Test-Driven Development (Red-Green-Refactor)  
**Status:** Ready for Execution  

---

## Task Matrix & Dependency Graph

```
[Task 1: Project Scaffolding (Tauri v2 + React 19)]
        │
        ▼
[Task 2: Mode 1 - Tokenizer & Local Compression Engine (Rust TDD)]
        │
        ▼
[Task 3: Mode 2 - AI Connectors: Ollama & BYOK Direct Clients (Rust TDD)]
        │
        ▼
[Task 4: OS Clipboard Capture & In-Place Text Replacement Engine]
        │
        ▼
[Task 5: Frontend UI - Floating Pill, Preview HUD & Diff Viewer]
        │
        ▼
[Task 6: Settings Window & Keyring Vault Integration]
        │
        ▼
[Task 7: 5-Axis Code Review, Security Audit & Build Verification]
        │
        ▼
[Task 8: Production Packaging (Windows MSI/EXE) & Plain English Handover]
```

---

### Phase 1: Project Foundation & Compression Engine
- [ ] **Task 1: Project Scaffolding & Environment Setup**
  - Initialize Tauri v2 project with React 19, TypeScript, Vite, and Tailwind CSS.
  - Configure `Cargo.toml` with required crates: `tauri`, `serde`, `serde_json`, `tokio`, `tiktoken-rs`, `regex`, `keyring`, `reqwest`.
  - Configure `tauri.conf.json` with multi-window support (`hud` overlay and `settings`).
  - *Proof of completion:* `cargo check` and `npm run build` execute with 0 errors.

- [ ] **Task 2: Mode 1 Compression Pipeline (Test-Driven Development)**
  - **Task 2.1 (Red):** Write unit tests in `src-tauri/src/engine/tests/` asserting filler phrase removal, stack trace dehydration, and token count calculations on real-world test prompts.
  - **Task 2.2 (Green):** Implement `tokenizer.rs` using `tiktoken-rs` (cl100k_base / o200k_base).
  - **Task 2.3 (Green):** Implement `denoise.rs` for conversational filler removal.
  - **Task 2.4 (Green):** Implement `trace_cleaner.rs` for stack trace pruning and log minification.
  - **Task 2.5 (Green):** Implement `code_trim.rs` for comments and whitespace stripping.
  - **Task 2.6 (Refactor):** Benchmark latency (target `<10ms`) and confirm 100% test pass rate.
  - *Proof of completion:* `cargo test --package prompt-optimizer --lib engine` passes all test cases.

---

### Phase 2: AI Adapters & OS Integration
- [ ] **Task 3: Mode 2 AI Adapters (Ollama + BYOK)**
  - **Task 3.1 (Red):** Write unit tests mocking responses from Ollama and OpenAI/Gemini/Anthropic endpoints.
  - **Task 3.2 (Green):** Implement `meta_prompt.rs` containing the 5-pillar prompt sharpening instructions.
  - **Task 3.3 (Green):** Implement `ollama.rs` client connecting to `http://localhost:11434`.
  - **Task 3.4 (Green):** Implement `byok.rs` supporting OpenAI, Gemini, Claude, and Grok REST endpoints.
  - **Task 3.5 (Green):** Implement `keyring_vault.rs` for secure local credential storage.
  - *Proof of completion:* `cargo test --package prompt-optimizer --lib ai` passes all unit tests.

- [ ] **Task 4: OS Clipboard Interception & In-Place Replacement**
  - Implement system-wide global shortcut registration (default `Ctrl+Shift+O`).
  - Implement non-destructive synthetic clipboard copy (`Ctrl+C` emulation) to capture highlighted text.
  - Implement in-place synthetic clipboard paste (`Ctrl+V` emulation) to replace selected text.
  - Expose Tauri IPC commands: `capture_selected_text`, `replace_selected_text`, `optimize_text`.
  - *Proof of completion:* Automated integration test verifying text capture and IPC command responses.

---

### Phase 3: Frontend UI & User Experience
- [ ] **Task 5: Floating Pill & Preview HUD Component**
  - Build `FloatingPill.tsx`: compact, beautiful pill with `[⚡ Compress]` and `[✨ Sharpen]` buttons.
  - Build `PreviewHUD.tsx`: side-by-side / inline diff viewer with syntax highlighting and token savings counter.
  - Implement keyboard navigation: `Enter` to Accept, `Esc` to Dismiss, `Ctrl+C` to Copy.
  - Connect React components to Tauri IPC handlers (`tauriBridge.ts`).
  - *Proof of completion:* `npm run build` and visual preview verification.

- [ ] **Task 6: Settings Modal & Tray System**
  - Build `SettingsModal.tsx`:
    - Mode behavior toggle: "Show Preview HUD" vs. "Replace Immediately".
    - Engine selector: Built-in Heuristic vs. Ollama vs. Cloud BYOK.
    - Secure API Key input fields for OpenAI, Gemini, Claude, Grok.
    - Application exclusion blacklist.
  - Build `tray.rs`: Native system tray menu with status indicator, quick mode switch, settings shortcut, and exit option.
  - *Proof of completion:* Settings state correctly reads and persists to local app config.

---

### Phase 4: Review, Packaging & Launch
- [ ] **Task 7: 5-Axis Code Review & Security Audit**
  - Run comprehensive audit across Correctness, Architecture, Security (OWASP Top 10), Performance, and Readability.
  - Eliminate dead code, unused dependencies, and redundant allocations.
  - Verify zero-server leakage: confirm no outgoing network requests occur in Mode 1 or without explicit user configuration.
  - *Proof of completion:* Verification report generated with PASS status across all 5 axes.

- [ ] **Task 8: Production Packaging (Windows MSI/EXE) & Plain English Handover**
  - Build production binary: `cargo tauri build`.
  - Verify standalone installer and portable executable generation.
  - Author comprehensive `README.md` and Plain English user manual covering operational workflows, shortcut customization, and engine configuration.
  - *Proof of completion:* Standalone Windows installer generated and validated.
