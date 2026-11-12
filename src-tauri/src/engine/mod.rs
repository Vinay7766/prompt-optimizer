pub mod tokenizer;
pub mod denoise;
pub mod trace_cleaner;
pub mod code_trim;

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize, PartialEq)]
pub struct OptimizationResult {
    pub original_text: String,
    pub optimized_text: String,
    pub original_tokens: usize,
    pub optimized_tokens: usize,
    pub tokens_saved: usize,
    pub savings_percentage: f32,
}

pub fn compress_text(input: &str) -> OptimizationResult {
    let original_tokens = tokenizer::count_tokens(input);

    // Pipeline: Denoise -> Trace Cleaner -> Code Trim
    let denoised = denoise::strip_filler(input);
    let trace_cleaned = trace_cleaner::clean_traces(&denoised);
    let optimized_text = code_trim::minify_code(&trace_cleaned);

    let optimized_tokens = tokenizer::count_tokens(&optimized_text);
    let tokens_saved = if original_tokens > optimized_tokens {
        original_tokens - optimized_tokens
    } else {
        0
    };

    let savings_percentage = if original_tokens > 0 {
        (tokens_saved as f32 / original_tokens as f32) * 100.0
    } else {
        0.0
    };

    OptimizationResult {
        original_text: input.to_string(),
        optimized_text,
        original_tokens,
        optimized_tokens,
        tokens_saved,
        savings_percentage,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty_string_compression() {
        let result = compress_text("");
        assert_eq!(result.original_tokens, 0);
        assert_eq!(result.optimized_tokens, 0);
        assert_eq!(result.tokens_saved, 0);
        assert_eq!(result.savings_percentage, 0.0);
    }

    #[test]
    fn test_conversational_filler_removal() {
        let input = "Hello ChatGPT, hope you are having a wonderful day! Can you please help me write a function to reverse a string? Thanks in advance!";
        let result = compress_text(input);
        
        assert!(result.tokens_saved > 0);
        assert!(result.savings_percentage > 30.0);
        assert!(result.optimized_text.contains("write a function to reverse a string"));
        assert!(!result.optimized_text.contains("having a wonderful day"));
        assert!(!result.optimized_text.contains("Thanks in advance"));
    }

    #[test]
    fn test_stack_trace_dehydration() {
        let input = r#"
Error: Cannot find module 'express'
    at Function.Module._resolveFilename (node:internal/modules/cjs/loader:1144:15)
    at Function.Module._load (node:internal/modules/cjs/loader:985:27)
    at Module.require (node:internal/modules/cjs/loader:1235:19)
    at require (node:internal/modules/helpers:176:18)
    at Object.<anonymous> (c:\app\server.js:5:17)
    at Module._compile (node:internal/modules/cjs/loader:1376:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1435:10)
    at Module.load (node:internal/modules/cjs/loader:1207:32)
    at Module._load (node:internal/modules/cjs/loader:1023:12)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:135:12)
How do I fix this?
"#;
        let result = compress_text(input);
        assert!(result.tokens_saved > 20);
        assert!(result.optimized_text.contains("Error: Cannot find module 'express'"));
        assert!(result.optimized_text.contains("server.js:5:17"));
        assert!(!result.optimized_text.contains("executeUserEntryPoint"));
    }

    #[test]
    fn test_code_whitespace_and_comment_minification() {
        let input = r#"
// This function calculates total
function calculateTotal(items) {

    // Initialize sum variable
    let total = 0;


    // Loop over each item
    for (let i = 0; i < items.length; i++) {
        total += items[i].price;
    }

    return total;
}
"#;
        let result = compress_text(input);
        assert!(result.tokens_saved > 5);
        assert!(!result.optimized_text.contains("// This function calculates total"));
        assert!(!result.optimized_text.contains("// Initialize sum variable"));
        assert!(result.optimized_text.contains("function calculateTotal(items)"));
    }
}
