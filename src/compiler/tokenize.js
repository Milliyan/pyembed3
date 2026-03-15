// ─────────────────────────────────────────────
//  Lexer — converts Python source into tokens
// ─────────────────────────────────────────────

const KEYWORDS = new Set([
  "def","if","elif","else","while","for","in","return",
  "and","or","not","True","False","pass","break","continue","None"
]);
const TYPES    = new Set(["int","float","bool","str","void","list"]);
const BUILTINS = new Set(["print","range","abs","min","max","len","int","float","bool","str"]);

export function tokenize(source) {
  const tokens = [];
  const lines = source.split("\n");
  const indentStack = [0];

  for (let ln = 0; ln < lines.length; ln++) {
    const line = lines[ln];
    if (line.trim() === "" || line.trim().startsWith("#")) continue;

    // Measure indentation
    let col = 0;
    while (col < line.length && (line[col] === " " || line[col] === "\t"))
      col += line[col] === "\t" ? 4 : 1;

    const curIndent = indentStack[indentStack.length - 1];
    if (col > curIndent) {
      indentStack.push(col);
      tokens.push({ type: "INDENT", value: col, ln });
    } else {
      while (col < indentStack[indentStack.length - 1]) {
        indentStack.pop();
        tokens.push({ type: "DEDENT", value: col, ln });
      }
    }

    let pos = col;
    while (pos < line.length) {
      if (line[pos] === " " || line[pos] === "\t") { pos++; continue; }
      if (line[pos] === "#") break;

      // String literals
      if (line[pos] === '"' || line[pos] === "'") {
        const q = line[pos]; let s = ""; pos++;
        while (pos < line.length && line[pos] !== q) s += line[pos++];
        pos++;
        tokens.push({ type: "STRING", value: s, ln }); continue;
      }

      // Numbers
      if (/[0-9]/.test(line[pos])) {
        let n = "";
        while (pos < line.length && /[0-9.]/.test(line[pos])) n += line[pos++];
        tokens.push({ type: "NUMBER", value: n, ln }); continue;
      }

      // Identifiers / keywords / types / builtins
      if (/[a-zA-Z_]/.test(line[pos])) {
        let id = "";
        while (pos < line.length && /[a-zA-Z0-9_]/.test(line[pos])) id += line[pos++];
        if (id === "True" || id === "False" || id === "None")
          tokens.push({ type: "BOOL", value: id, ln });
        else if (KEYWORDS.has(id))  tokens.push({ type: "KW",      value: id, ln });
        else if (TYPES.has(id))     tokens.push({ type: "TYPE",    value: id, ln });
        else if (BUILTINS.has(id))  tokens.push({ type: "BUILTIN", value: id, ln });
        else                        tokens.push({ type: "IDENT",   value: id, ln });
        continue;
      }

      // Two-character operators
      const two = line.slice(pos, pos + 2);
      if (["==","!=","<=",">=","->","+=","-=","*=","/=","//","**"].includes(two)) {
        tokens.push({ type: "OP", value: two, ln }); pos += 2; continue;
      }

      // Single-character tokens
      const ch = line[pos];
      if ("+-*/%<>=!".includes(ch)) { tokens.push({ type: "OP",    value: ch, ln }); pos++; continue; }
      if (ch === ":")               { tokens.push({ type: "COLON", value: ":", ln }); pos++; continue; }
      if (ch === ",")               { tokens.push({ type: "COMMA", value: ",", ln }); pos++; continue; }
      if (ch === "(")               { tokens.push({ type: "LP",    value: "(", ln }); pos++; continue; }
      if (ch === ")")               { tokens.push({ type: "RP",    value: ")", ln }); pos++; continue; }
      if (ch === "[")               { tokens.push({ type: "LB",    value: "[", ln }); pos++; continue; }
      if (ch === "]")               { tokens.push({ type: "RB",    value: "]", ln }); pos++; continue; }
      if (ch === ".")               { tokens.push({ type: "DOT",   value: ".", ln }); pos++; continue; }
      pos++;
    }
    tokens.push({ type: "NL", value: "\n", ln });
  }

  while (indentStack.length > 1) {
    indentStack.pop();
    tokens.push({ type: "DEDENT", value: 0 });
  }
  tokens.push({ type: "EOF", value: "" });
  return tokens;
}
