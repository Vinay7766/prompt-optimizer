import React from "react";
import { Zap, Sparkles, X } from "lucide-react";

interface FloatingPillProps {
  onCompress: () => void;
  onSharpen: () => void;
  onDismiss: () => void;
  loading?: boolean;
}

export const FloatingPill: React.FC<FloatingPillProps> = ({
  onCompress,
  onSharpen,
  onDismiss,
  loading = false,
}) => {
  return (
    <div className="inline-flex items-center gap-1.5 p-1 bg-slate-900/95 border border-slate-700/80 rounded-full shadow-2xl backdrop-blur-md text-xs select-none animate-in fade-in zoom-in-95 duration-150">
      <button
        onClick={onCompress}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-600/90 hover:bg-cyan-500 text-white font-medium shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
        title="Compress tokens using 100% offline rule heuristics"
      >
        <Zap className="w-3.5 h-3.5 fill-current" />
        <span>Compress</span>
      </button>

      <button
        onClick={onSharpen}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white font-medium shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
        title="Sharpen into a single-turn structured prompt via AI"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>Sharpen</span>
      </button>

      <button
        onClick={onDismiss}
        className="w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
        title="Dismiss pill"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};
