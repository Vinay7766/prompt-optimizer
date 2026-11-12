# Prompt Optimizer (Universal AI Token Saver & Clarifier)

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-lightgrey.svg)
![Security](https://img.shields.io/badge/security-100%25%20Serverless%20%7C%20Local-brightgreen.svg)

**Prompt Optimizer** is a lightweight, cross-platform desktop application designed to run seamlessly in the background. It allows developers, engineers, and AI users to highlight raw prompts, terminal traces, or messy code snippets in **any application** (ChatGPT, Claude, Gemini, Grok, Cursor, VS Code, Slack) and instantly optimize them in-place with a single click.

---

## ⚡ Key Features & Dual Modes

### 1. Mode 1: Context & Token Compression (Shrink)
- **100% Offline & Zero Token Cost:** Runs instantly in under 10ms using local deterministic rule engines.
- **Conversational De-Noising:** Strips pleasantries, polite filler, and generic greetings.
- **Log & Stack Trace Dehydration:** Collapses deep runtime framework calls (e.g. `node:internal`, `node_modules`, system runtime traces) while preserving the exact failing file, line number, and exception message.
- **Code & Whitespace Minification:** Strips non-semantic blank lines and redundant inline comments.
- **Average Token Savings:** 30% to 70% reduction on pasted context.

### 2. Mode 2: Semantic Prompt Sharpening (Clarify)
- **Single-Turn Precision:** Transforms casual, ambiguous ideas into structured prompts following the 4 core prompt-engineering pillars (Persona, Objective, Strict Constraints, and Output Format).
- **Zero Hallucination Loop:** Guarantees that the LLM answers correctly on the first try, saving 3,000 to 8,000 follow-up tokens.
- **Local AI Engine Support:** Connects directly to local models running in **Ollama** (`http://localhost:11434`) for 100% private, zero-cost AI refinement.
- **Bring Your Own Key (BYOK):** Direct-to-provider API calls (Google Gemini, OpenAI, Anthropic Claude, xAI Grok). Keys are stored safely in the **Windows Credential Manager / macOS Keychain**—never sent to any third-party server.

---

## 🛡️ Privacy & Security Architecture
- **100% Serverless:** There is no central backend, no proxy server, and no cloud database.
- **Zero Telemetry:** Prompt Optimizer does not track user queries or store prompt history.
- **OS-Level Keyring:** API keys are hardware-encrypted via OS credential APIs.

---

## 🚀 Building & Running from Source

### Prerequisites
- Node.js v20+ and npm
- Rust & Cargo (GNU toolchain or MSVC)
- Tauri v2 CLI

### Setup
```bash
# Clone the repository
git clone https://github.com/Vinay7766/prompt-optimizer.git
cd prompt-optimizer

# Install frontend dependencies
npm install

# Run in desktop development mode
npm run tauri dev

# Build production installer (MSI / EXE)
npm run tauri build
```

---

## 📦 Automated Releases
Every push to the `main` branch automatically triggers the GitHub Actions CI/CD release workflow (`.github/workflows/release.yml`) to compile, sign, and publish the standalone Windows installer directly on GitHub Releases.
