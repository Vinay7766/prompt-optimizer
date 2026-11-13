import React, { useEffect } from "react";
import { Copy, X, CornerDownLeft, Sparkles, Zap } from "lucide-react";

interface PreviewHUDProps {
  originalText: string;
  optimizedText: string;
  originalTokens: number;
  optimizedTokens: number;
  tokensSaved: number;
  savingsPercentage?: number;
  mode: "compress" | "sharpen";
  engineUsed?: string;
  onAccept: () => void;
  onCopy: () => void;
  onDismiss: () => void;
}

export const PreviewHUD: React.FC<PreviewHUDProps> = ({
  originalText,
  optimizedText,
  originalTokens,
  optimizedTokens,
  tokensSaved,
  savingsPercentage = 0,
  mode,
  engineUsed,
  onAccept,
  onCopy,
  onDismiss,
}) => {
  // Global keyboard shortcuts for HUD
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
        e.preventDefault();
        onAccept();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onAccept, onDismiss]);

  return (
    <div className="w-full max-w-xl bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex flex-col gap-3 text-slate-100 select-text animate-in fade-in zoom-in-95 duration-150">
      {/* Header & Token Savings Badge */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          {mode === "compress" ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                <Zap className="w-3 h-3 fill-current" />
                -{savingsPercentage.toFixed(1)}% Tokens
              </span>
              <span className="text-xs text-slate-400">
                {originalTokens} → {optimizedTokens} tokens ({tokensSaved} saved)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                <Sparkles className="w-3 h-3" />
                Single-Turn Prompt
              </span>
              <span className="text-xs text-slate-400">
                via {engineUsed?.toUpperCase() || "AI"} ({optimizedTokens} tokens)
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-200 transition cursor-pointer p-1"
          title="Dismiss (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Side-by-Side / Diff Preview */}
      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Original</span>
          <pre className="h-36 overflow-y-auto bg-slate-950/80 p-3 rounded-lg text-slate-400 whitespace-pre-wrap leading-relaxed border border-slate-800">
            {originalText}
          </pre>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">Optimized</span>
          <pre className="h-36 overflow-y-auto bg-slate-950/80 p-3 rounded-lg text-cyan-200 whitespace-pre-wrap leading-relaxed border border-cyan-500/30">
            {optimizedText}
          </pre>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
        <span className="text-slate-500 flex items-center gap-1 text-[11px]">
          Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Enter</kbd> to Replace, <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Esc</kbd> to Cancel
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={onCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer font-medium"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy
          </button>

          <button
            onClick={onAccept}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition cursor-pointer font-semibold shadow-lg shadow-cyan-600/20"
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
            Accept & Replace
          </button>
        </div>
      </div>
    </div>
  );
};
