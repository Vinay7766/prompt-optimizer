use serde_json::json;

pub async fn generate(base_url: &str, model: &str, raw_prompt: &str) -> Result<String, String> {
    let endpoint = format!("{}/api/generate", base_url.trim_end_matches('/'));
    let prompt_payload = crate::ai::meta_prompt::build_sharpen_payload(raw_prompt);

    let body = json!({
        "model": model,
        "system": crate::ai::meta_prompt::SYSTEM_INSTRUCTION,
        "prompt": prompt_payload,
        "stream": false
    });

    let client = reqwest::Client::new();
    let resp = client
        .post(&endpoint)
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Failed to connect to Ollama at {}: {}", endpoint, e))?;

    if !resp.status().is_success() {
        return Err(format!("Ollama returned HTTP error status: {}", resp.status()));
    }

    let json_resp: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;

    let response_text = json_resp["response"]
        .as_str()
        .ok_or_else(|| "Invalid response format from Ollama".to_string())?;

    Ok(response_text.trim().to_string())
}
