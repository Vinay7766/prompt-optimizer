use tiktoken_rs::cl100k_base;

pub fn count_tokens(text: &str) -> usize {
    if text.is_empty() {
        return 0;
    }
    match cl100k_base() {
        Ok(bpe) => bpe.encode_with_special_tokens(text).len(),
        Err(_) => {
            // Fallback estimation: ~4 chars per token if tokenizer fails to init
            (text.chars().count() + 3) / 4
        }
    }
}
