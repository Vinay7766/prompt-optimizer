import { useState, useEffect } from "react";
import { Settings, ShieldCheck, Check, CornerDownLeft, Lock, Server } from "lucide-react";
import { saveApiKey, loadApiKey } from "../services/tauriBridge";
import { saveStoredSettings } from "../services/configStorage";

interface SettingsModalProps {
  engine: "ollama" | "openai" | "gemini" | "claude" | "grok";
  setEngine: (engine: "ollama" | "openai" | "gemini" | "claude" | "grok") => void;
  ollamaUrl: string;
  setOllamaUrl: (url: string) => void;
  modelName: string;
  setModelName: (model: string) => void;
  instantReplace: boolean;
  setInstantReplace: (val: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  engine,
  setEngine,
  ollamaUrl,
  setOllamaUrl,
  modelName,
  setModelName,
  instantReplace,
  setInstantReplace,
}) => {
  const [apiKey, setApiKey] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Load existing key from OS Keychain when provider changes
  useEffect(() => {
    let isMounted = true;
    const fetchKey = async () => {
      if (engine === "ollama") {
        setApiKey("");
        return;
      }
      try {
        const key = await loadApiKey(engine);
        if (isMounted) setApiKey(key || "");
      } catch {
        if (isMounted) setApiKey("");
      }
    };
    fetchKey();
    return () => {
      isMounted = false;
    };
  }, [engine]);

  const handleSave = async () => {
    try {
      // 1. Persist preferences to disk via configStorage
      saveStoredSettings({
        engine,
        ollamaUrl,
        modelName,
        instantReplace,
      });

      // 2. Persist credentials to OS Keychain
      if (engine !== "ollama" && apiKey.trim()) {
        await saveApiKey(engine, apiKey.trim());
      }
      setStatusMessage("Preferences & Credentials saved to disk!");
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (err) {
      setStatusMessage(`Error saving: ${err}`);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-5 shadow-2xl max-w-2xl mx-auto w-full select-text animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <Settings className="w-4 h-4 text-cyan-400" />
          Settings & Local Vault
        </h2>
        <span className="text-[11px] text-emerald-400 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          Hardware-Encrypted Storage
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {/* Instant In-Place Replace Option */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
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

        {/* Engine Selection */}
        <div>
          <label className="text-xs font-medium text-slate-300 block mb-1.5 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            Default AI Engine for Prompt Sharpening
          </label>
          <select
            value={engine}
            onChange={(e) => setEngine(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition"
          >
            <option value="gemini">Google Gemini (Gemini 2.5 Flash)</option>
            <option value="openai">OpenAI (GPT-4o-mini)</option>
            <option value="claude">Anthropic Claude (Claude 3.5 Haiku)</option>
            <option value="grok">xAI Grok (Grok-2-mini)</option>
            <option value="ollama">Local Ollama (localhost:11434)</option>
          </select>
        </div>

        {/* Engine-Specific Parameters */}
        {engine === "ollama" ? (
          <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Ollama Server Endpoint
              </label>
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Model Name
              </label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="llama3.2 (or qwen2.5-coder, mistral)"
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-950/50 border border-slate-800">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              {engine.toUpperCase()} API Key (BYOK)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Enter your ${engine} API key...`}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-400">
              Direct client-to-API only. Stored directly in Windows Credential Manager / macOS Keychain.
            </p>
          </div>
        )}

        {/* Action Button & Status */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={handleSave}
            className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-cyan-600/20 active:scale-[0.99]"
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
            <span>Save Preferences to Vault</span>
          </button>

          {statusMessage && (
            <div className="p-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-center gap-1.5 animate-in fade-in duration-100">
              <Check className="w-3.5 h-3.5" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
