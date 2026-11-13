/// Fast, deterministic, and 100% crash-proof token counter.
/// Eliminates external C-runtime dynamic linking dependencies (STATUS_ENTRYPOINT_NOT_FOUND).
/// Follows OpenAI / Anthropic standard BPE estimation:
/// ~4 characters per token for English text and code, accounting for word boundaries and punctuation.
pub fn count_tokens(text: &str) -> usize {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return 0;
    }

    let mut token_count = 0;
    for word in trimmed.split_whitespace() {
        // Base: each word is at least 1 token
        // Longer words, code identifiers, and symbols count additional tokens (~3.8 - 4 chars/token)
        let len = word.chars().count();
        if len <= 4 {
            token_count += 1;
        } else {
            token_count += (len + 3) / 4;
        }

        // Additional token for common code delimiters or punctuation attached to words
        for c in word.chars() {
            if "{}[]();:,.<>/?`~!@#$%^&*|\\".contains(c) {
                token_count += 1;
            }
        }
    }

    token_count.max(1)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty_string() {
        assert_eq!(count_tokens(""), 0);
        assert_eq!(count_tokens("   "), 0);
    }

    #[test]
    fn test_simple_sentence() {
        let count = count_tokens("write a function to reverse a string");
        assert!(count >= 7 && count <= 12);
    }

    #[test]
    fn test_code_snippet() {
        let count = count_tokens("function add(a, b) { return a + b; }");
        assert!(count >= 10);
    }
}
