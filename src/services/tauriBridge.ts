import { invoke } from "@tauri-apps/api/core";

export interface OptimizationResult {
  original_text: string;
  optimized_text: string;
  original_tokens: number;
  optimized_tokens: number;
  tokens_saved: number;
  savings_percentage: number;
}

export interface SharpenRequest {
  prompt: string;
  engine: "ollama" | "openai" | "gemini" | "claude" | "grok";
  model_name?: string;
  api_key?: string;
  ollama_url?: string;
}

export interface SharpenResult {
  original_prompt: string;
  sharpened_prompt: string;
  original_tokens: number;
  sharpened_tokens: number;
  engine_used: string;
}

export async function compressPrompt(text: string): Promise<OptimizationResult> {
  return await invoke<OptimizationResult>("compress_prompt", { text });
}

export async function sharpenPrompt(req: SharpenRequest): Promise<SharpenResult> {
  return await invoke<SharpenResult>("sharpen_prompt_cmd", { req });
}

export async function getClipboard(): Promise<string> {
  return await invoke<string>("get_clipboard");
}

export async function setClipboard(text: string): Promise<void> {
  await invoke("set_clipboard", { text });
}

export async function captureSelection(): Promise<string> {
  return await invoke<string>("capture_selection");
}

export async function replaceSelection(text: string): Promise<void> {
  await invoke("replace_selection", { text });
}

export async function saveApiKey(provider: string, key: string): Promise<void> {
  await invoke("save_key", { provider, key });
}

export async function loadApiKey(provider: string): Promise<string> {
  return await invoke<string>("load_key", { provider });
}
