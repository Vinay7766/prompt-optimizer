pub mod meta_prompt;
pub mod ollama;
pub mod byok;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SharpenRequest {
    pub prompt: String,
    pub engine: String, // "ollama", "openai", "gemini", "claude", "grok"
    pub model_name: Option<String>,
    pub api_key: Option<String>,
    pub ollama_url: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SharpenResult {
    pub original_prompt: String,
    pub sharpened_prompt: String,
    pub original_tokens: usize,
    pub sharpened_tokens: usize,
    pub engine_used: String,
}

pub async fn sharpen_prompt(req: SharpenRequest) -> Result<SharpenResult, String> {
    let original_tokens = crate::engine::tokenizer::count_tokens(&req.prompt);
    
    let sharpened_prompt = match req.engine.to_lowercase().as_str() {
        "ollama" => {
            let url = req.ollama_url.unwrap_or_else(|| "http://localhost:11434".to_string());
            let model = req.model_name.unwrap_or_else(|| "llama3.2".to_string());
            ollama::generate(&url, &model, &req.prompt).await?
        }
        "openai" | "gemini" | "claude" | "grok" => {
            let api_key = req.api_key.ok_or_else(|| "API key required for cloud provider".to_string())?;
            let model = req.model_name.unwrap_or_else(|| match req.engine.to_lowercase().as_str() {
                "gemini" => "gemini-2.5-flash".to_string(),
                "claude" => "claude-3-5-haiku-20241022".to_string(),
                "grok" => "grok-2-mini".to_string(),
                _ => "gpt-4o-mini".to_string(),
            });
            byok::call_provider(&req.engine, &api_key, &model, &req.prompt).await?
        }
        _ => return Err(format!("Unsupported engine: {}", req.engine)),
    };

    let sharpened_tokens = crate::engine::tokenizer::count_tokens(&sharpened_prompt);

    Ok(SharpenResult {
        original_prompt: req.prompt,
        sharpened_prompt,
        original_tokens,
        sharpened_tokens,
        engine_used: req.engine,
    })
}
