# Product Requirements Document (PRD)
## Project: Prompt Optimizer (Universal AI Token Saver & Clarifier)

**Document Version:** 1.0.0  
**Status:** Under Review (Gate 1 Pending Approval)  
**Target Release:** v1.0.0-MVP  

---

## 1. Executive Summary & Vision
**Prompt Optimizer** is a lightweight, cross-platform, privacy-first desktop utility (Windows & macOS) that sits quietly in the system tray. When a user highlights any prompt or text inside **any** application—whether a browser chat (ChatGPT, Claude, Gemini, Grok), an AI coding IDE (Cursor, VS Code), or native desktop AI apps—a subtle floating action toolbar appears (or the user presses a global shortcut).

With one click, users can execute either:
1. **Mode 1 (Compress Tokens):** 100% offline, zero-token, heuristic/rule-based minification of code, logs, and conversational filler (cutting 30%–70% of input tokens).
2. **Mode 2 (Sharpen Prompt):** AI-powered semantic prompt structuring using prompt-engineering frameworks via local Ollama or user-provided API keys (BYOK), eliminating multi-turn conversational waste.

The application is strictly serverless: no central backend, zero telemetry, and zero data logging.

---

## 2. Target Users & Problem Statements

### Target Personas
1. **Developers & AI Engineers:** Heavy users of Cursor, VS Code, and terminal AI agents who routinely paste bulky stack traces, logs, and code snippets, rapidly hitting token rate limits and degrading context window accuracy.
2. **Everyday AI Users & Knowledge Workers:** Users of ChatGPT, Claude, and Gemini web/desktop apps who write vague, conversational prompts, forcing them into 4–5 correction cycles and wasting time.

### Core Problems Solved
* **Token Bleed & Context Saturation:** Raw terminal traces, boilerplate comments, and conversational fluff inflate prompt tokens unnecessarily.
* **The "Multi-Turn Tax":** Vague queries result in generic or incomplete outputs, burning thousands of follow-up tokens to steer the AI.
* **Ecosystem Fragmentation:** Users must juggle disparate Chrome extensions (which break on web UI updates) and IDE plugins; no single tool works across browsers, desktop clients, and IDEs.
* **Privacy Vulnerability:** Users refuse to send proprietary source code or confidential company data through third-party optimization web servers.

---

## 3. Scope & Feature Specifications

### 3.1. Floating Contextual Toolbar & Trigger Mechanisms
* **Text Selection Trigger:** When text is highlighted in any focused window, a subtle floating pill appears near the cursor offering:
  * `[⚡ Compress]` (Mode 1)
  * `[✨ Sharpen]` (Mode 2)
* **Global Shortcut Trigger:** Configurable hotkey (default: `Ctrl+Shift+O` on Windows, `Cmd+Shift+O` on macOS) to instantly invoke the last-used mode or open the action palette.
* **Dismissal Behavior:** Moving the cursor away or resuming typing immediately fades the floating pill out without stealing window focus.

### 3.2. Mode 1: Deterministic Token & Context Compression
* **Filler Stripping:** Heuristic detection and removal of polite conversational prefixes/suffixes ("Hi ChatGPT, could you please...", "Thanks in advance").
* **Log & Stack Trace Dehydration:** Pattern-based extraction of root causes, error types, line numbers, and active source files while collapsing hundreds of lines of framework internals (`node_modules`, system runtime traces).
* **Code & Syntax Minification:** Stripping non-semantic blank lines, redundant comments, and re-formatting multi-line tables/JSON into compact, token-dense representations.
* **100% Offline & Instant:** Executes in `<10ms` using local WebAssembly/native Rust parsing. Zero external API calls, zero token cost.

### 3.3. Mode 2: Semantic Prompt Sharpening
* **Prompt Framework Engine:** Formats rough, fragmented thoughts into structured directives containing:
  * Role / Persona definition
  * Explicit technical constraints and boundaries
  * Output format guidelines
  * Core task and edge-case reminders
* **Engine Routing:**
  * **Local Ollama / LM Studio:** Auto-detects local models running on `localhost:11434` for 100% private, zero-cost AI refinement.
  * **BYOK (Bring Your Own Key):** Direct client-to-API calls to OpenAI (e.g. GPT-4o-mini), Anthropic (Claude 3.5 Haiku), Google (Gemini 2.5 Flash), or Grok (xAI).

### 3.4. Interactive Quick-Preview HUD vs. Instant Replace
* **Preview HUD (Default):** A floating non-modal card displaying:
  * Side-by-side or inline diff (Original vs. Optimized)
  * Exact token reduction counter (`-42% tokens saved | ~180 tokens`)
  * Actions: `[Enter]` to Accept & Replace in-place, `[Ctrl+C]` to Copy, `[Esc]` to Cancel.
* **Instant Replace Mode:** User toggle in Settings to bypass the HUD and directly overwrite highlighted text in-place.

### 3.5. Settings & Local Security
* **Vault Storage:** API keys (OpenAI, Anthropic, Gemini, Grok) are stored securely in the native OS credential store (Windows Credential Manager / macOS Keychain).
* **Provider & Model Selector:** Choose default engine for Mode 2 (Ollama model name, or provider + API model).
* **Custom Exclusion Rules:** Blacklist specific sensitive applications or window titles where the floating toolbar should never appear.

---

## 4. System Architecture & Tech Stack

```
┌─────────────────────────────────────────────────────────────┐
│                       System Tray App                       │
│                     (Tauri v2 + Rust)                       │
├───────────────────────────────┬─────────────────────────────┤
│      Native OS Services       │         UI Layer            │
│  - Global Shortcuts           │  - Floating Action Pill     │
│  - Text Selection Capture     │  - Quick-Preview HUD        │
│  - OS Keyring Vault (BYOK)    │  - Settings & Config Modal  │
│  - Accessibility / In-Place   │    (React + Tailwind CSS)   │
├───────────────────────────────┴─────────────────────────────┤
│                    Optimization Core                        │
│  ┌─────────────────────────────┬──────────────────────────┐ │
│  │   Mode 1: Rule Compressor   │   Mode 2: AI Sharpen     │ │
│  │   - Regex / NLP Parser      │   - Ollama Local Adapter │ │
│  │   - Stack Trace Minifier    │   - BYOK Direct Client   │ │
│  │   - Tokenizer (tiktoken)    │     (OpenAI/Gemini/etc.) │ │
│  └─────────────────────────────┴──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

* **Core Runtime:** **Tauri v2 (Rust)** — lightweight native footprint (~12MB install, ~15MB RAM idle, no heavy Chromium/Electron overhead).
* **Frontend UI:** **React 19 + TypeScript + Tailwind CSS** (clean, responsive, theme-aware dark/light mode).
* **Token Accounting:** Local native tokenizer module based on `bpe` / `tiktoken-rs` for precise real-time token metrics.
* **Target Platforms:** Windows 10/11 (primary target for v1), macOS (Apple Silicon / Intel).

---

## 5. Explicit Non-Goals (Out of Scope for v1)
* ❌ **No Cloud Backend or User Accounts:** No centralized database, authentication servers, or analytics dashboards.
* ❌ **No Browser Session Hijacking:** Will not automate or scrape logged-in ChatGPT/Claude browser cookies (strictly compliant with provider TOS).
* ❌ **No Autonomous Agent Execution:** The tool does not execute code or act as an autonomous agent; it strictly optimizes prompts and text payloads.
* ❌ **No Mobile Apps:** Desktop-only focus for v1.

---

## 6. Success Metrics & Quality Gates
* **Speed:** Mode 1 local compression latency `<15ms`. Mode 2 AI round-trip `<1.2s` (network dependent).
* **Token Efficiency:** Mode 1 achieves an average of `30%–60%` token reduction on logs/code pastes.
* **Reliability:** In-place text replacement operates cleanly across major browsers (Chrome, Edge, Firefox, Brave) and IDEs (VS Code, Cursor).
* **Zero Crashes / Memory Leaks:** Background tray idle memory remains strictly under `30MB`.

---

## 7. Delivery Milestones
* **Milestone 1:** Architecture Spec & Task Breakdown (`ARCHITECTURE.md`, `TASKS.md`).
* **Milestone 2:** Core Compression Engine (Mode 1 unit tests & parsing benchmarks).
* **Milestone 3:** AI Adapter Engine (Ollama + BYOK OpenAI/Gemini connectors).
* **Milestone 4:** Tauri v2 Native Shell (Global shortcut, clipboard capture, floating UI).
* **Milestone 5:** Preview HUD, In-Place Replacement & Settings Window.
* **Milestone 6:** 5-Axis Code Review, Security Audit & Installer Packaging (Windows MSI/EXE).
* **Milestone 7:** Production Launch & Plain-English Handover.

---
*Created on 2026-11-12. Awaiting Gate 1 User Confirmation.*
