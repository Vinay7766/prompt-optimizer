use regex::Regex;
use lazy_static::lazy_static;

lazy_static! {
    // Single line comments (// ...) but not URLs (http:// or https://)
    static ref SINGLE_LINE_COMMENT: Regex = Regex::new(r"(?m)^\s*//(?!/).*$").unwrap();
    // Consecutive blank lines (3 or more reduced to single empty line)
    static ref MULTI_BLANK_LINES: Regex = Regex::new(r"\n{3,}").unwrap();
}

pub fn minify_code(text: &str) -> String {
    // 1. Remove single-line comments that are on their own lines
    let without_comments = SINGLE_LINE_COMMENT.replace_all(text, "");

    // 2. Collapse excessive vertical blank lines
    let collapsed_lines = MULTI_BLANK_LINES.replace_all(&without_comments, "\n\n");

    // 3. Trim outer whitespace
    collapsed_lines.trim().to_string()
}
