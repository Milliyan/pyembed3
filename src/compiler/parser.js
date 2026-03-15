// ─────────────────────────────────────────────
//  Parser — recursive descent, builds AST
// ─────────────────────────────────────────────

export class Parser {
  constructor(tokens) {
    this.toks = tokens;
    this.pos  = 0;
  }

  peek()         { return this.toks[this.pos] || { type: "EOF", value: "" }; }
  adv()          { return this.toks[this.pos++]; }
  is(type, val)  { const t = this.peek(); return t.type === type && (val === undefined || t.value === val); }
  match(type, val) { if (this.is(type, val)) return this.adv(); return null; }
  skipNL()       { while (this.is("NL")) this.adv(); }

  expect(type, val) {
    if (this.is(type, val)) return this.adv();
    const t = this.peek();
    throw new Error(`Line ${(t.ln || 0) + 1}: Expected ${val || type} but got "${t.value}" (${t.type})`);
  }

  // ── Entry ──────────────────────────────────
  parse() {
    this.skipNL();
    const body = [];
    while (!this.is("EOF")) { body.push(this.stmt()); this.skipNL(); }
    return { type: "Program", body };
  }

  stmt() {
    this.skipNL();
    const t = this.peek();
    if (t.type === "KW") {
      if (t.value === "def")      return this.funcDef();
      if (t.value === "if")       return this.ifStmt();
      if (t.value === "while")    return this.whileStmt();
      if (t.value === "for")      return this.forStmt();
      if (t.value === "return")   return this.retStmt();
      if (t.value === "pass")     { this.adv(); this.match("NL"); return { type: "Pass" }; }
      if (t.value === "break")    { this.adv(); this.match("NL"); return { type: "Break" }; }
      if (t.value === "continue") { this.adv(); this.match("NL"); return { type: "Continue" }; }
    }
    return this.exprStmt();
  }

  // ── Function definition ─────────────────────
  funcDef() {
    this.expect("KW", "def");
    const name = this.expect("IDENT").value;
    this.expect("LP");
    const params = this.parseParams();
    this.expect("RP");
    let returnType = "void";
    if (this.match("OP", "->")) returnType = this.parseType();
    this.expect("COLON");
    this.match("NL");
    const body = this.block();
    return { type: "FuncDef", name, params, returnType, body };
  }

  parseParams() {
    const params = [];
    if (this.is("RP")) return params;
    do {
      if (this.is("RP")) break;
      const name = this.expect("IDENT").value;
      let ptype = "int";
      if (this.match("COLON")) ptype = this.parseType();
      let def = null;
      if (this.match("OP", "=")) def = this.expr();
      params.push({ name, ptype, def });
    } while (this.match("COMMA"));
    return params;
  }

  parseType() {
    let base = "";
    const t = this.peek();
    if (t.type === "TYPE" || t.type === "IDENT" || t.type === "BUILTIN")
      base = this.adv().value;
    else
      base = "int";
    if (this.match("LB")) {
      let inner = "";
      if (this.peek().type === "TYPE" || this.peek().type === "IDENT")
        inner = this.adv().value;
      this.match("RB");
      return `list[${inner}]`;
    }
    return base;
  }

  block() {
    this.expect("INDENT");
    this.skipNL();
    const body = [];
    while (!this.is("DEDENT") && !this.is("EOF")) { body.push(this.stmt()); this.skipNL(); }
    this.match("DEDENT");
    return body;
  }

  // ── Control flow ────────────────────────────
  ifStmt() {
    this.expect("KW", "if");
    const test = this.expr();
    this.expect("COLON"); this.match("NL");
    const body = this.block();
    const elifs = [];
    let elseBody = null;
    this.skipNL();
    while (this.is("KW", "elif")) {
      this.adv();
      const et = this.expr();
      this.expect("COLON"); this.match("NL");
      elifs.push({ test: et, body: this.block() });
      this.skipNL();
    }
    if (this.is("KW", "else")) {
      this.adv(); this.expect("COLON"); this.match("NL");
      elseBody = this.block();
    }
    return { type: "If", test, body, elifs, elseBody };
  }

  whileStmt() {
    this.expect("KW", "while");
    const test = this.expr();
    this.expect("COLON"); this.match("NL");
    const body = this.block();
    return { type: "While", test, body };
  }

  forStmt() {
    this.expect("KW", "for");
    const target = this.expect("IDENT").value;
    this.expect("KW", "in");
    const iter = this.expr();
    this.expect("COLON"); this.match("NL");
    const body = this.block();
    return { type: "For", target, iter, body };
  }

  retStmt() {
    this.expect("KW", "return");
    let val = null;
    if (!this.is("NL") && !this.is("EOF") && !this.is("DEDENT")) val = this.expr();
    this.match("NL");
    return { type: "Return", val };
  }

  // ── Statements ──────────────────────────────
  exprStmt() {
    if (this.is("IDENT") || this.is("BUILTIN")) {
      const saved = this.pos;
      const name  = this.adv().value;

      // Annotated assignment:  name: type = expr
      if (this.is("COLON")) {
        this.adv();
        const vtype = this.parseType();
        let val = null;
        if (this.match("OP", "=")) val = this.expr();
        this.match("NL");
        return { type: "AnnAssign", target: name, vtype, val };
      }

      // Regular assignment:  name = expr
      if (this.is("OP", "=")) {
        this.adv(); const val = this.expr(); this.match("NL");
        return { type: "Assign", target: name, val };
      }

      // Augmented assignment:  name += expr
      const augOps = ["+=", "-=", "*=", "/="];
      if (this.peek().type === "OP" && augOps.includes(this.peek().value)) {
        const op = this.adv().value; const val = this.expr(); this.match("NL");
        return { type: "AugAssign", target: name, op, val };
      }

      this.pos = saved;
    }

    const ex = this.expr();
    if (this.is("OP", "=")) {
      this.adv(); const val = this.expr(); this.match("NL");
      const target = ex.type === "Name" ? ex.name : "__expr__";
      return { type: "Assign", target, val };
    }
    this.match("NL");
    return { type: "ExprStmt", expr: ex };
  }

  // ── Expressions (precedence climbing) ───────
  expr()    { return this.or(); }
  or()      { let l = this.and();     while (this.is("KW","or"))  { this.adv(); l = { type:"BinOp", op:"||", l, r:this.and() }; }     return l; }
  and()     { let l = this.notExpr(); while (this.is("KW","and")) { this.adv(); l = { type:"BinOp", op:"&&", l, r:this.notExpr() }; } return l; }
  notExpr() { if (this.is("KW","not")) { this.adv(); return { type:"UnaryOp", op:"!", v:this.notExpr() }; } return this.cmp(); }

  cmp() {
    let l = this.add();
    const ops = ["==","!=","<",">","<=",">="];
    while (this.peek().type === "OP" && ops.includes(this.peek().value)) {
      const op = this.adv().value; l = { type:"BinOp", op, l, r:this.add() };
    }
    return l;
  }

  add() {
    let l = this.mul();
    while (this.peek().type === "OP" && (this.peek().value === "+" || this.peek().value === "-")) {
      const op = this.adv().value; l = { type:"BinOp", op, l, r:this.mul() };
    }
    return l;
  }

  mul() {
    let l = this.unary();
    while (this.peek().type === "OP" && ["*","/","//","%","**"].includes(this.peek().value)) {
      const raw = this.adv().value;
      const op  = raw === "//" ? "/" : raw === "**" ? "pow" : raw;
      l = { type:"BinOp", op, l, r:this.unary() };
    }
    return l;
  }

  unary() {
    if (this.is("OP","-")) { this.adv(); return { type:"UnaryOp", op:"-", v:this.unary() }; }
    if (this.is("OP","+")) { this.adv(); return this.unary(); }
    return this.primary();
  }

  primary() {
    const t = this.peek();
    if (t.type === "NUMBER") { this.adv(); return { type:"Num",  val:t.value }; }
    if (t.type === "BOOL")   { this.adv(); return { type:"Bool", val:t.value }; }
    if (t.type === "STRING") { this.adv(); return { type:"Str",  val:t.value }; }

    if (t.type === "LP") {
      this.adv(); const e = this.expr(); this.expect("RP"); return e;
    }

    if (t.type === "IDENT" || t.type === "BUILTIN" || t.type === "TYPE") {
      const name = this.adv().value;
      if (this.is("LP")) {
        this.adv();
        const args = [];
        if (!this.is("RP")) { do { if (this.is("RP")) break; args.push(this.expr()); } while (this.match("COMMA")); }
        this.expect("RP");
        return { type:"Call", name, args };
      }
      if (this.is("LB")) {
        this.adv(); const idx = this.expr(); this.expect("RB");
        return { type:"Index", obj:name, idx };
      }
      return { type:"Name", name };
    }

    if (t.type === "KW" && (t.value === "True" || t.value === "False" || t.value === "None")) {
      this.adv(); return { type:"Bool", val:t.value };
    }

    throw new Error(`Line ${(t.ln || 0) + 1}: Unexpected token "${t.value}" (${t.type})`);
  }
}
