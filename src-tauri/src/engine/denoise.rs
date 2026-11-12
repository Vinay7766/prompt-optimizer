use regex::Regex;
use lazy_static::lazy_static;

lazy_static! {
    static ref FILLER_PATTERNS: Vec<Regex> = vec![
        Regex::new(r"(?i)\b(hello|hi|hey)\s+(chatgpt|claude|gemini|grok|assistant|ai)\b[,!]?").unwrap(),
        Regex::new(r"(?i)\b(hope you are having a (great|wonderful|good) day)[,!]?").unwrap(),
        Regex::new(r"(?i)\b(hope this email finds you well)[,!]?").unwrap(),
        Regex::new(r"(?i)\bcan you (please\s+)?help me\s+(to\s+)?").unwrap(),
        Regex::new(r"(?i)\bi was wondering if you could\s+").unwrap(),
        Regex::new(r"(?i)\bcould you please\s+").unwrap(),
        Regex::new(r"(?i)\b(thanks in advance|thank you so much|thank you)[,!.]?").unwrap(),
        Regex::new(r"(?i)\bi would really appreciate it if you could\s+").unwrap(),
    ];
}

pub fn strip_filler(text: &str) -> String {
    let mut cleaned = text.to_string();
    for pattern in FILLER_PATTERNS.iter() {
        cleaned = pattern.replace_all(&cleaned, "").to_string();
    }
    
    // Collapse multiple consecutive spaces and trim lines
    let lines: Vec<String> = cleaned
        .lines()
        .map(|line| line.trim().to_string())
        .filter(|line| !line.is_empty())
        .collect();
    
    lines.join("\n")
}
