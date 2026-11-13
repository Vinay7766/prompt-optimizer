import { useState, useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { Zap, Sparkles, Settings, ShieldCheck, Check, Keyboard, Terminal } from "lucide-react";
import {
  compressPrompt,
  sharpenPrompt,
  captureSelection,
  replaceSelection,
  loadApiKey,
  OptimizationResult,
  SharpenResult,
} from "./services/tauriBridge";
import { loadStoredSettings, saveStoredSettings } from "./services/configStorage";
import { PreviewHUD } from "./components/PreviewHUD";
import { SettingsModal } from "./components/SettingsModal";

export default function App() {
  const [inputText, setInputText] = useState("");
  const [activeTab, setActiveTab] = useState<"workspace" | "settings">("workspace");
  const [loading, setLoading] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Results State
  const [compressResult, setCompressResult] = useState<OptimizationResult | null>(null);
  const [sharpenResult, setSharpenResult] = useState<SharpenResult | null>(null);
  const [activeMode, setActiveMode] = useState<"compress" | "sharpen">("compress");

  // HUD Active State
  const [hudActive, setHudActive] = useState(false);

  // Settings State - Loaded from Disk (localStorage) on startup
  const initialSettings = loadStoredSettings();
  const [engine, setEngine] = useState<"ollama" | "openai" | "gemini" | "claude" | "grok">(initialSettings.engine);
  const [ollamaUrl, setOllamaUrl] = useState(initialSettings.ollamaUrl);
  const [modelName, setModelName] = useState(initialSettings.modelName);
  const [instantReplace, setInstantReplaceState] = useState(initialSettings.instantReplace);

  // Helper to update instant replace and immediately persist
  const setInstantReplace = (val: boolean) => {
    setInstantReplaceState(val);
    saveStoredSettings({
      engine,
      ollamaUrl,
      modelName,
      instantReplace: val,
    });
  };

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
      alert(`Compression error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const runSharpenOnText = async (text: string) => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const storedKey = engine !== "ollama" ? await loadApiKey(engine) : "";
      
      if (engine !== "ollama" && (!storedKey || !storedKey.trim())) {
        alert(
          `No ${engine.toUpperCase()} API key found in your local vault.\n\nPlease open Settings to enter your key, or select "Local Ollama" for 100% free offline AI.`
        );
        setActiveTab("settings");
        setLoading(false);
        return;
      }

      const res = await sharpenPrompt({
        prompt: text,
        engine,
        model_name: modelName || undefined,
        api_key: storedKey || undefined,
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

  // Global Background Shortcut Listener (Ctrl+Shift+O)
  useEffect(() => {
    const unlistenPromise = listen<string>("global-selection-captured", async (event) => {
      const captured = event.payload;
      if (captured && captured.trim()) {
        setInputText(captured);
        if (activeMode === "compress") {
          await runCompressOnText(captured);
        } else {
          await runSharpenOnText(captured);
        }
      }
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [activeMode, instantReplace, engine, modelName, ollamaUrl]);

  // UI Selection Capture Button Handlers
  const handleCaptureActiveSelection = async () => {
    try {
      const sel = await captureSelection();
      setInputText(sel);
    } catch {
      alert(
        "No active text selection found in current window.\n\nTip: Highlight text in another application and press Ctrl+Shift+O, or paste text directly into this workspace."
      );
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
            className={`px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeTab === "workspace"
                ? "bg-cyan-600 text-white font-medium shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Workspace
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-2.5 py-1.5 rounded-md flex items-center gap-1 transition cursor-pointer ${
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
            {/* System-Wide OS Hotkey Bar */}
            <div className="flex flex-wrap items-center justify-between p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 shadow-sm gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/25 text-indigo-400">
                  <Keyboard className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-200">System-Wide Hotkey:</span>
                    <kbd className="px-2 py-0.5 rounded bg-slate-800 text-cyan-400 text-[11px] font-mono border border-slate-700 shadow-inner">
                      Ctrl + Shift + O
                    </kbd>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Highlight text in any external application (Chrome, IDE, Notepad) and press hotkey.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Terminal className="w-3 h-3 text-slate-500" />
                  Mode:
                </span>
                <button
                  onClick={() => setActiveMode("compress")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeMode === "compress"
                      ? "bg-cyan-600 text-white shadow-sm"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Compress (Offline)
                </button>
                <button
                  onClick={() => setActiveMode("sharpen")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                    activeMode === "sharpen"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Sharpen ({engine.toUpperCase()})
                </button>
              </div>
            </div>

            {/* Input Box */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                <span>Enter text directly or capture from active window:</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCaptureActiveSelection}
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
                placeholder="Paste code snippets, error traces, or casual prompts here, or highlight text anywhere in Windows..."
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
          <SettingsModal
            engine={engine}
            setEngine={setEngine}
            ollamaUrl={ollamaUrl}
            setOllamaUrl={setOllamaUrl}
            modelName={modelName}
            setModelName={setModelName}
            instantReplace={instantReplace}
            setInstantReplace={setInstantReplace}
          />
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