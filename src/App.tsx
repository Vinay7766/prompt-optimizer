import React, { useState } from "react";
import { Zap, Sparkles, Copy, Check, Settings, X, ShieldCheck } from "lucide-react";
import {
  compressPrompt,
  sharpenPrompt,
  getClipboard,
  setClipboard,
  saveApiKey,
  loadApiKey,
  OptimizationResult,
  SharpenResult,
} from "./services/tauriBridge";

export default function App() {
  const [inputText, setInputText] = useState("");
  const [activeTab, setActiveTab] = useState<"compress" | "sharpen" | "settings">("compress");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Results
  const [compressResult, setCompressResult] = useState<OptimizationResult | null>(null);
  const [sharpenResult, setSharpenResult] = useState<SharpenResult | null>(null);
  
  // Settings State
  const [engine, setEngine] = useState<"ollama" | "openai" | "gemini" | "claude" | "grok">("gemini");
  const [apiKey, setApiKey] = useState("");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [modelName, setModelName] = useState("");
  const [settingsSaved, setSettingsSaved] = useState(false);

  const handleCompress = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const res = await compressPrompt(inputText);
      setCompressResult(res);
      setSharpenResult(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSharpen = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const res = await sharpenPrompt({
        prompt: inputText,
        engine,
        model_name: modelName ? modelName : undefined,
        api_key: apiKey ? apiKey : undefined,
        ollama_url: ollamaUrl ? ollamaUrl : undefined,
      });
      setSharpenResult(res);
      setCompressResult(null);
    } catch (err: any) {
      alert(`Error sharpening prompt: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await getClipboard();
      if (text) setInputText(text);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyResult = async (text: string) => {
    try {
      await setClipboard(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async () => {
    try {
      if (apiKey) {
        await saveApiKey(engine, apiKey);
      }
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch (e) {
      alert(`Failed to save key: ${e}`);
    }
  };

  const handleLoadKey = async (selectedEngine: string) => {
    try {
      const key = await loadApiKey(selectedEngine);
      setApiKey(key || "");
    } catch {
      setApiKey("");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-text">
      {/* Top Header */}
      <header className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide">Prompt Optimizer</h1>
            <p className="text-[11px] text-slate-400">Universal Token Saver & Clarifier</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs">
          <button
            onClick={() => setActiveTab("compress")}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition ${
              activeTab === "compress"
                ? "bg-cyan-600 text-white font-medium shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Compress
          </button>
          <button
            onClick={() => setActiveTab("sharpen")}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition ${
              activeTab === "sharpen"
                ? "bg-indigo-600 text-white font-medium shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Sharpen
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-2.5 py-1.5 rounded-md flex items-center transition ${
              activeTab === "settings"
                ? "bg-slate-700 text-white font-medium"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 p-5 max-w-5xl w-full mx-auto flex flex-col gap-4">
        {activeTab !== "settings" ? (
          <>
            {/* Input Box */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Enter or paste your raw prompt / logs / code:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePasteClipboard}
                    className="hover:text-cyan-400 underline transition cursor-pointer"
                  >
                    Paste from Clipboard
                  </button>
                  {inputText && (
                    <button
                      onClick={() => {
                        setInputText("");
                        setCompressResult(null);
                        setSharpenResult(null);
                      }}
                      className="hover:text-rose-400 transition cursor-pointer flex items-center gap-0.5"
                    >
                      <X className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste code snippets, error traces, or casual prompts here..."
                className="w-full h-36 bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 resize-none transition shadow-inner"
              />
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>100% Serverless & Zero Data Retention</span>
              </div>

              {activeTab === "compress" ? (
                <button
                  onClick={handleCompress}
                  disabled={loading || !inputText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-cyan-600/20 transition cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  {loading ? "Compressing..." : "Compress Tokens (100% Offline)"}
                </button>
              ) : (
                <button
                  onClick={handleSharpen}
                  disabled={loading || !inputText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  {loading ? "Sharpening..." : `Sharpen with ${engine.toUpperCase()}`}
                </button>
              )}
            </div>

            {/* Mode 1 Compress Results */}
            {compressResult && (
              <div className="mt-2 bg-slate-900/90 border border-cyan-500/30 rounded-xl p-4 flex flex-col gap-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      -{compressResult.savings_percentage.toFixed(1)}% Tokens
                    </span>
                    <span className="text-xs text-slate-400">
                      {compressResult.original_tokens} → {compressResult.optimized_tokens} tokens ({compressResult.tokens_saved} saved)
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopyResult(compressResult.optimized_text)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : "Copy Result"}
                  </button>
                </div>

                <div className="relative">
                  <pre className="w-full max-h-56 overflow-y-auto bg-slate-950/60 p-3.5 rounded-lg text-xs font-mono text-cyan-200 whitespace-pre-wrap leading-relaxed border border-slate-800/80">
                    {compressResult.optimized_text}
                  </pre>
                </div>
              </div>
            )}

            {/* Mode 2 Sharpen Results */}
            {sharpenResult && (
              <div className="mt-2 bg-slate-900/90 border border-indigo-500/30 rounded-xl p-4 flex flex-col gap-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      Single-Turn Structured Prompt
                    </span>
                    <span className="text-xs text-slate-400">
                      via {sharpenResult.engine_used.toUpperCase()} ({sharpenResult.sharpened_tokens} tokens)
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopyResult(sharpenResult.sharpened_prompt)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : "Copy Result"}
                  </button>
                </div>

                <div className="relative">
                  <pre className="w-full max-h-56 overflow-y-auto bg-slate-950/60 p-3.5 rounded-lg text-xs font-mono text-indigo-200 whitespace-pre-wrap leading-relaxed border border-slate-800/80">
                    {sharpenResult.sharpened_prompt}
                  </pre>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Settings Panel */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-5 shadow-xl max-w-2xl mx-auto w-full">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-400" />
                Engine & API Key Settings
              </h2>
              <span className="text-xs text-slate-400">Keys are stored in your OS Keychain</span>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Default AI Engine (Mode 2 Sharpen)
                </label>
                <select
                  value={engine}
                  onChange={(e) => {
                    const selected = e.target.value as any;
                    setEngine(selected);
                    handleLoadKey(selected);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="gemini">Google Gemini (Gemini 2.5 Flash)</option>
                  <option value="openai">OpenAI (GPT-4o-mini)</option>
                  <option value="claude">Anthropic Claude (Claude 3.5 Haiku)</option>
                  <option value="grok">xAI Grok (Grok-2-mini)</option>
                  <option value="ollama">Local Ollama (localhost:11434)</option>
                </select>
              </div>

              {engine === "ollama" ? (
                <>
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1.5">Ollama Server URL</label>
                    <input
                      type="text"
                      value={ollamaUrl}
                      onChange={(e) => setOllamaUrl(e.target.value)}
                      placeholder="http://localhost:11434"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1.5">Ollama Model Name</label>
                    <input
                      type="text"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      placeholder="llama3.2 (or mistral, qwen2.5-coder)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5">
                    {engine.toUpperCase()} API Key (BYOK)
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={`Enter your ${engine} API key...`}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Your key is saved directly to your local Windows Credential Manager / macOS Keychain and never leaves your device.
                  </p>
                </div>
              )}

              <button
                onClick={handleSaveSettings}
                className="mt-2 w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-cyan-600/20"
              >
                {settingsSaved ? <Check className="w-4 h-4 text-white" /> : <SaveIcon className="w-4 h-4" />}
                {settingsSaved ? "Settings Saved Securely!" : "Save Engine Preferences"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function SaveIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
      <path d="M7 3v4a1 1 0 0 0 1 1h7" />
    </svg>
  );
}
