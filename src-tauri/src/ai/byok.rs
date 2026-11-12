use serde_json::json;

pub async fn call_provider(
    provider: &str,
    api_key: &str,
    model: &str,
    raw_prompt: &str,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    let payload = crate::ai::meta_prompt::build_sharpen_payload(raw_prompt);
    let system_prompt = crate::ai::meta_prompt::SYSTEM_INSTRUCTION;

    match provider.to_lowercase().as_str() {
        "gemini" => {
            let url = format!(
                "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
                model, api_key
            );
            let body = json!({
                "systemInstruction": {
                    "parts": [{ "text": system_prompt }]
                },
                "contents": [{
                    "parts": [{ "text": payload }]
                }],
                "generationConfig": {
                    "temperature": 0.3
                }
            });

            let resp = client.post(&url).json(&body).send().await
                .map_err(|e| format!("Gemini connection error: {}", e))?;

            if !resp.status().is_success() {
                return Err(format!("Gemini API error: HTTP {}", resp.status()));
            }

            let res: serde_json::Value = resp.json().await
                .map_err(|e| format!("Gemini JSON parse error: {}", e))?;

            let text = res["candidates"][0]["content"]["parts"][0]["text"]
                .as_str()
                .ok_or_else(|| "Failed to extract text from Gemini response".to_string())?;

            Ok(text.trim().to_string())
        }
        "openai" | "grok" => {
            let endpoint = if provider.eq_ignore_ascii_case("grok") {
                "https://api.x.ai/v1/chat/completions"
            } else {
                "https://api.openai.com/v1/chat/completions"
            };

            let body = json!({
                "model": model,
                "messages": [
                    { "role": "system", "content": system_prompt },
                    { "role": "user", "content": payload }
                ],
                "temperature": 0.3
            });

            let resp = client.post(endpoint)
                .bearer_auth(api_key)
                .json(&body)
                .send()
                .await
                .map_err(|e| format!("Provider connection error ({}): {}", provider, e))?;

            if !resp.status().is_success() {
                return Err(format!("{} API error: HTTP {}", provider, resp.status()));
            }

            let res: serde_json::Value = resp.json().await
                .map_err(|e| format!("Parse error: {}", e))?;

            let text = res["choices"][0]["message"]["content"]
                .as_str()
                .ok_or_else(|| "Failed to extract text from response".to_string())?;

            Ok(text.trim().to_string())
        }
        "claude" => {
            let url = "https://api.anthropic.com/v1/messages";
            let body = json!({
                "model": model,
                "max_tokens": 1024,
                "system": system_prompt,
                "messages": [
                    { "role": "user", "content": payload }
                ]
            });

            let resp = client.post(url)
                .header("x-api-key", api_key)
                .header("anthropic-version", "2023-06-01")
                .header("content-type", "application/json")
                .json(&body)
                .send()
                .await
                .map_err(|e| format!("Claude connection error: {}", e))?;

            if !resp.status().is_success() {
                return Err(format!("Claude API error: HTTP {}", resp.status()));
            }

            let res: serde_json::Value = resp.json().await
                .map_err(|e| format!("Claude response parse error: {}", e))?;

            let text = res["content"][0]["text"]
                .as_str()
                .ok_or_else(|| "Failed to extract text from Claude response".to_string())?;

            Ok(text.trim().to_string())
        }
        _ => Err(format!("Unsupported provider: {}", provider)),
    }
}
