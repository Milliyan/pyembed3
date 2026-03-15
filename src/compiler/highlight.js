// ─────────────────────────────────────────────
//  Syntax Highlighters
//  Returns HTML string with <span> classes for colouring
// ─────────────────────────────────────────────

/**
 * Highlight Python source code.
 * CSS classes: pe-kw  pe-fn  pe-ty  pe-cm  pe-st  pe-nu
 */
export function highlightPython(code) {
  return code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Comments (must run before keywords so # lines are fully wrapped)
    .replace(/(#.*)/g, '<span class="pe-cm">$1</span>')
    // Keywords
    .replace(
      /\b(def|if|elif|else|while|for|in|return|and|or|not|True|False|pass|break|continue|None)\b/g,
      '<span class="pe-kw">$1</span>'
    )
    // Types
    .replace(/\b(int|float|bool|str|void|list)\b/g, '<span class="pe-ty">$1</span>')
    // Function calls
    .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g, '<span class="pe-fn">$1</span>')
    // Strings
    .replace(/(".*?"|'.*?')/g, '<span class="pe-st">$1</span>')
    // Numbers
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="pe-nu">$1</span>');
}

/**
 * Highlight generated Embedded C code.
 * CSS classes: pe-kw  pe-fn  pe-ty  pe-cm  pe-st  pe-nu
 */
export function highlightC(code) {
  return code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Line comments
    .replace(/(\/\/.*)/g, '<span class="pe-cm">$1</span>')
    // Block comments (/* ... */)
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="pe-cm">$1</span>')
    // Keywords
    .replace(
      /\b(void|int|float|bool|char|const|return|if|else|while|for|break|continue|include|extern)\b/g,
      '<span class="pe-kw">$1</span>'
    )
    // Function calls
    .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g, '<span class="pe-fn">$1</span>')
    // Preprocessor directives
    .replace(/(#[a-zA-Z]+)/g, '<span class="pe-ty">$1</span>')
    // Strings
    .replace(/(".*?")/g, '<span class="pe-st">$1</span>')
    // Numbers
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="pe-nu">$1</span>');
}
