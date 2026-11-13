export interface AppSettings {
  engine: "ollama" | "openai" | "gemini" | "claude" | "grok";
  ollamaUrl: string;
  modelName: string;
  instantReplace: boolean;
}

const SETTINGS_KEY = "prompt_optimizer_settings_v1";

export const DEFAULT_SETTINGS: AppSettings = {
  engine: "gemini",
  ollamaUrl: "http://localhost:11434",
  modelName: "",
  instantReplace: false,
};

export function loadStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      engine: parsed.engine || DEFAULT_SETTINGS.engine,
      ollamaUrl: parsed.ollamaUrl || DEFAULT_SETTINGS.ollamaUrl,
      modelName: parsed.modelName || DEFAULT_SETTINGS.modelName,
      instantReplace: typeof parsed.instantReplace === "boolean" ? parsed.instantReplace : DEFAULT_SETTINGS.instantReplace,
    };
  } catch (err) {
    console.error("Failed to load settings from disk, falling back to defaults:", err);
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error("Failed to persist settings to disk:", err);
  }
}
