use regex::Regex;
use lazy_static::lazy_static;

lazy_static! {
    // Detects internal framework paths like node:internal, /usr/lib, node_modules
    static ref FRAMEWORK_INTERNAL_TRACE: Regex = Regex::new(
        r"(?m)^\s+at\s+.*?(node:internal|node_modules|webpack|vendor[\\/]).*$\n?"
    ).unwrap();
}

pub fn clean_traces(text: &str) -> String {
    // If text doesn't look like an error or trace, return unchanged
    if !text.contains("at ") && !text.contains("Traceback") && !text.contains("Error:") {
        return text.to_string();
    }

    // Strip internal library stack frames, keeping application frames and exception messages
    let simplified = FRAMEWORK_INTERNAL_TRACE.replace_all(text, "");
    
    // Clean up empty lines created by trace pruning
    let lines: Vec<&str> = simplified
        .lines()
        .filter(|line| !line.trim().is_empty())
        .collect();

    lines.join("\n")
}
