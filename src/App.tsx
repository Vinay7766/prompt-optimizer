import { useState } from "react";
import { Zap, Sparkles, Settings, ShieldCheck, Check, CornerDownLeft } from "lucide-react";
import {
  compressPrompt,
  sharpenPrompt,
  captureSelection,
  replaceSelection,
  saveApiKey,
  loadApiKey,
  OptimizationResult,
  SharpenResult,
} from "./services/tauriBridge";
import { FloatingPill } from "./components/FloatingPill";
import { PreviewHUD } from "./components/PreviewHUD";

export default function App() {
  const [inputText, setInputText] = useState("");
  const [activeTab, setActiveTab] = useState<"workspace" | "hud_preview" | "settings">("workspace");
  const [loading, setLoading] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Results State
  const [compressResult, setCompressResult] = useState<OptimizationResult | null>(null);
  const [sharpenResult, setSharpenResult] = useState<SharpenResult | null>(null);
  const [activeMode, setActiveMode] = useState<"compress" | "sharpen">("compress");

  // Floating Pill & HUD Toggle State
  const [showPill, setShowPill] = useState(true);
  const [hudActive, setHudActive] = useState(false);

  // Settings State
  const [engine, setEngine] = useState<"ollama" | "openai" | "gemini" | "claude" | "grok">("gemini");
  const [apiKey, setApiKey] = useState("");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [modelName, setModelName] = useState("");
  const [instantReplace, setInstantReplace] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Execution Handlers
  const runCompressOnText = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await compressPrompt(text);
      setCompressResult(res);
      setSharpenResult(null);
      setActiveMode("compress");

      if (instantReplace) {
        await replaceSelection(res.optimized_text);
      } else {
        setHudActive(true);
      }
    } catch (err) {
      console.error("Compression error:", err);
    } finally {
      setLoading(false);
    }
  };

  const runSharpenOnText = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await sharpenPrompt({
        prompt: text,
        engine,
        model_name: modelName || undefined,
        api_key: apiKey || undefined,
        ollama_url: ollamaUrl || undefined,
      });
      setSharpenResult(res);
      setCompressResult(null);
      setActiveMode("sharpen");

      if (instantReplace) {
        await replaceSelection(res.sharpened_prompt);
      } else {
        setHudActive(true);
      }
    } catch (err) {
      alert(`Error sharpening prompt: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // OS Active Selection Capture & Run
  const handleCaptureAndCompress = async () => {
    try {
      const text = await captureSelection();
      setInputText(text);
      await runCompressOnText(text);
    } catch (e) {
      console.log("No active text selection, using workspace input:", e);
      if (inputText.trim()) {
        await runCompressOnText(inputText);
      }
    }
  };

  const handleCaptureAndSharpen = async () => {
    try {
      const text = await captureSelection();
      setInputText(text);
      await runSharpenOnText(text);
    } catch (e) {
      console.log("No active text selection, using workspace input:", e);
      if (inputText.trim()) {
        await runSharpenOnText(inputText);
      }
    }
  };

  const handleAcceptHUD = async () => {
    const textToReplace =
      activeMode === "compress"
        ? compressResult?.optimized_text
        : sharpenResult?.sharpened_prompt;

    if (textToReplace) {
      try {
        await replaceSelection(textToReplace);
      } catch (err) {
        console.error("Replace failed:", err);
      }
      setHudActive(false);
    }
  };

  const handleCopyHUD = () => {
    const textToCopy =
      activeMode === "compress"
        ? compressResult?.optimized_text
        : sharpenResult?.sharpened_prompt;

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2000);
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
      <header className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-wide">Prompt Optimizer</h1>
            <p className="text-[11px] text-slate-400">Universal Token Saver & Clarifier</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs">
          <button
            onClick={() => setActiveTab("workspace")}
            className={`px-3 py-1.5 rounded-md transition ${
              activeTab === "workspace"
                ? "bg-cyan-600 text-white font-medium shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Workspace
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-2.5 py-1.5 rounded-md flex items-center gap-1 transition ${
              activeTab === "settings"
                ? "bg-slate-700 text-white font-medium"
                : "text-slate-400 hover:text-slate-200"
            }`}
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 p-5 max-w-5xl w-full mx-auto flex flex-col gap-4">
        {activeTab === "workspace" ? (
          <>
            {/* Interactive Floating Pill Demonstration */}
            {showPill && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/40 border border-slate-800/80">
                <span className="text-xs text-slate-400">
                  Floating Toolbar Preview (Appears near text selection across any app):
                </span>
                <FloatingPill
                  onCompress={handleCaptureAndCompress}
                  onSharpen={handleCaptureAndSharpen}
                  onDismiss={() => setShowPill(false)}
                  loading={loading}
                />
              </div>
            )}

            {/* Input Box */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Enter text directly or highlight text in any app:</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      try {
                        const sel = await captureSelection();
                        setInputText(sel);
                      } catch {
                        alert("No active text selection found in current window.");
                      }
                    }}
                    className="hover:text-cyan-400 underline transition cursor-pointer"
                  >
                    Capture Active Selection
                  </button>
                  {inputText && (
                    <button
                      onClick={() => {
                        setInputText("");
                        setCompressResult(null);
                        setSharpenResult(null);
                        setHudActive(false);
                      }}
                      className="hover:text-rose-400 transition cursor-pointer"
                    >
                      Clear
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

            {/* Main Action Bar */}
            <div className="flex items-center justify-between pt-1">
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>100% Serverless & Hardware-Encrypted Vault</span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => runCompressOnText(inputText)}
                  disabled={loading || !inputText.trim()}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 transition cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  {loading && activeMode === "compress" ? "Compressing..." : "Compress Tokens"}
                </button>

                <button
                  onClick={() => runSharpenOnText(inputText)}
                  disabled={loading || !inputText.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {loading && activeMode === "sharpen" ? "Sharpening..." : `Sharpen with ${engine.toUpperCase()}`}
                </button>
              </div>
            </div>

            {/* Interactive Preview HUD Overlay */}
            {hudActive && (
              <div className="mt-2 flex justify-center">
                <PreviewHUD
                  originalText={
                    activeMode === "compress"
                      ? compressResult?.original_text || inputText
                      : sharpenResult?.original_prompt || inputText
                  }
                  optimizedText={
                    activeMode === "compress"
                      ? compressResult?.optimized_text || ""
                      : sharpenResult?.sharpened_prompt || ""
                  }
                  originalTokens={
                    activeMode === "compress"
                      ? compressResult?.original_tokens || 0
                      : sharpenResult?.original_tokens || 0
                  }
                  optimizedTokens={
                    activeMode === "compress"
                      ? compressResult?.optimized_tokens || 0
                      : sharpenResult?.sharpened_tokens || 0
                  }
                  tokensSaved={
                    activeMode === "compress" ? compressResult?.tokens_saved || 0 : 0
                  }
                  savingsPercentage={
                    activeMode === "compress"
                      ? compressResult?.savings_percentage || 0
                      : 0
                  }
                  mode={activeMode}
                  engineUsed={sharpenResult?.engine_used}
                  onAccept={handleAcceptHUD}
                  onCopy={handleCopyHUD}
                  onDismiss={() => setHudActive(false)}
                />
              </div>
            )}
          </>
        ) : (
          /* Settings View */
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-5 shadow-xl max-w-2xl mx-auto w-full">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Settings className="w-4 h-4 text-cyan-400" />
                Preferences & Engine Configuration
              </h2>
              <span className="text-xs text-slate-400">Keys stored in OS Keychain</span>
            </div>

            <div className="flex flex-col gap-4">
              {/* Replace Behavior Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Instant In-Place Replacement
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Directly overwrite selected text without displaying the Preview HUD.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={instantReplace}
                  onChange={(e) => setInstantReplace(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Engine Selector */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  Default AI Engine for Prompt Sharpening
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
                    <label className="text-xs font-medium text-slate-300 block mb-1.5">
                      Ollama Server URL
                    </label>
                    <input
                      type="text"
                      value={ollamaUrl}
                      onChange={(e) => setOllamaUrl(e.target.value)}
                      placeholder="http://localhost:11434"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1.5">
                      Ollama Model Name
                    </label>
                    <input
                      type="text"
                      value={modelName}
                      onChange={(e) => setModelName(e.target.value)}
                      placeholder="llama3.2"
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
                    Direct-to-provider only. Never sent to any intermediary server.
                  </p>
                </div>
              )}

              <button
                onClick={handleSaveSettings}
                className="mt-2 w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shadow-cyan-600/20"
              >
                {settingsSaved ? <Check className="w-4 h-4 text-white" /> : <CornerDownLeft className="w-4 h-4" />}
                {settingsSaved ? "Preferences Saved!" : "Save Engine Preferences"}
              </button>
            </div>
          </div>
        )}
      </div>

      {copiedNotification && (
        <div className="fixed bottom-5 right-5 bg-emerald-600 text-white text-xs px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-3.5 h-3.5" /> Copied to clipboard!
        </div>
      )}
    </main>
  );
}
