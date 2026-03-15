// ─────────────────────────────────────────────
//  Semantic Analyzer — Phase 3
//
//  Responsibilities:
//    1. Multi-scope symbol table (global + per-function)
//    2. Type inference and type-compatibility checking
//    3. Undefined variable detection
//    4. Function signature validation (arg counts, return types)
//    5. IoT constraint enforcement (no malloc, large-loop warnings, etc.)
//    6. Unused variable detection
// ─────────────────────────────────────────────

// GPIO constants that are always available in the hardware environment
const GPIO_CONSTS = new Set([
  "HIGH", "LOW", "INPUT", "OUTPUT", "INPUT_PULLUP",
  "INPUT_PULLDOWN", "LED_BUILTIN", "A0", "A1", "A2",
  "A3", "A4", "A5", "true", "false",
]);

const BUILTIN_RETURN_TYPES = {
  analogRead:  "int",  digitalRead:  "int",
  millis:      "int",  micros:       "int",
  pulseIn:     "int",  abs:          "int",
  min:         "int",  max:          "int",
  len:         "int",  int:          "int",
  float:       "float", bool:        "bool",
  str:         "str",  print:        "void",
  pinMode:     "void", digitalWrite: "void",
  analogWrite: "void", delay:        "void",
  delayMicroseconds: "void", tone:   "void",
  noTone:      "void",
};

export class Analyzer {
  constructor() {
    this.scopes    = [{}];      // stack of scope maps: name → type
    this.errors    = [];        // hard errors
    this.warnings  = [];        // non-fatal warnings
    this.functions = {};        // name → { params: [{name, type}], returnType }
    this.usedVars  = new Set(); // all variable names ever read
    this.currentFn = null;      // name of current function being analyzed
    this.fnReturnType = null;   // expected return type of current function
  }

  // ── Error / warning helpers ─────────────────
  error(msg)  { this.errors.push(`[Analyzer] ${msg}`); }
  warn(msg)   { this.warnings.push(`[Analyzer] ${msg}`); }

  // ── Scope helpers ────────────────────────────
  pushScope()      { this.scopes.push({}); }
  popScope()       {
    const scope = this.scopes.pop();
    // Warn about declared but never-read variables
    for (const [name] of Object.entries(scope)) {
      if (!this.usedVars.has(name) && !name.startsWith("_")) {
        this.warn(`Variable '${name}' declared but never used`);
      }
    }
  }
  declare(name, type) {
    this.scopes[this.scopes.length - 1][name] = type;
  }
  lookup(name) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i][name] !== undefined) return this.scopes[i][name];
    }
    return null;
  }

  // ── Entry point ──────────────────────────────
  analyze(ast) {
    // Pass 1: register all top-level function signatures so they
    // can call each other regardless of declaration order
    for (const node of ast.body) {
      if (node.type === "FuncDef") {
        this.functions[node.name] = {
          params:     node.params.map(p => ({ name: p.name, type: p.ptype || "int" })),
          returnType: node.returnType || "void",
        };
        this.declare(node.name, "function");
      }
    }

    // Pass 2: full analysis
    for (const node of ast.body) this.analyzeNode(node);

    return {
      errors:   this.errors,
      warnings: this.warnings,
    };
  }

  // ── Node dispatch ────────────────────────────
  analyzeNode(node) {
    if (!node) return "void";
    switch (node.type) {
      case "FuncDef":   return this.analyzeFuncDef(node);
      case "AnnAssign": return this.analyzeAnnAssign(node);
      case "Assign":    return this.analyzeAssign(node);
      case "AugAssign": return this.analyzeAugAssign(node);
      case "If":        return this.analyzeIf(node);
      case "While":     return this.analyzeWhile(node);
      case "For":       return this.analyzeFor(node);
      case "Return":    return this.analyzeReturn(node);
      case "ExprStmt":  return this.analyzeExpr(node.expr);
      case "Pass": case "Break": case "Continue": return "void";
      default: return "void";
    }
  }

  // ── Function definition ──────────────────────
  analyzeFuncDef(node) {
    const prevFn        = this.currentFn;
    const prevRetType   = this.fnReturnType;
    this.currentFn      = node.name;
    this.fnReturnType   = node.returnType || "void";

    this.pushScope();
    // Declare all params; mark as "used" so they don't trigger unused-var warnings
    for (const p of node.params) {
      this.declare(p.name, p.ptype || "int");
      this.usedVars.add(p.name);
    }

    let hasReturn = false;
    for (const stmt of node.body) {
      this.analyzeNode(stmt);
      if (stmt.type === "Return") hasReturn = true;
    }

    if (this.fnReturnType !== "void" && !hasReturn) {
      this.warn(
        `Function '${node.name}' declares return type '${this.fnReturnType}' but has no return statement`
      );
    }

    this.popScope();
    this.currentFn    = prevFn;
    this.fnReturnType = prevRetType;
    return "void";
  }

  // ── Assignments ──────────────────────────────
  analyzeAnnAssign(node) {
    const declared = node.vtype || "int";
    if (node.val) {
      const inferred = this.analyzeExpr(node.val);
      if (inferred && inferred !== "void" && !this.typesCompatible(declared, inferred)) {
        this.warn(
          `Type mismatch: '${node.target}' declared as '${declared}' but initialised with '${inferred}'`
        );
      }
    }
    this.declare(node.target, declared);
    return declared;
  }

  analyzeAssign(node) {
    const valType  = this.analyzeExpr(node.val);
    const existing = this.lookup(node.target);
    if (existing && existing !== "function" && valType && valType !== "void") {
      if (!this.typesCompatible(existing, valType)) {
        this.warn(
          `Assignment to '${node.target}': variable is '${existing}' but value is '${valType}'`
        );
      }
    }
    if (!existing) this.declare(node.target, valType || "int");
    this.usedVars.add(node.target);
    return valType;
  }

  analyzeAugAssign(node) {
    const varType = this.lookup(node.target);
    if (!varType) {
      this.error(`Variable '${node.target}' used in augmented assignment before declaration`);
    }
    this.usedVars.add(node.target);
    this.analyzeExpr(node.val);
    return varType || "int";
  }

  // ── Control flow ─────────────────────────────
  analyzeIf(node) {
    this.analyzeExpr(node.test);
    this.pushScope(); node.body.forEach(s => this.analyzeNode(s)); this.popScope();
    for (const el of node.elifs) {
      this.analyzeExpr(el.test);
      this.pushScope(); el.body.forEach(s => this.analyzeNode(s)); this.popScope();
    }
    if (node.elseBody) {
      this.pushScope(); node.elseBody.forEach(s => this.analyzeNode(s)); this.popScope();
    }
    return "void";
  }

  analyzeWhile(node) {
    const testType = this.analyzeExpr(node.test);
    // Warn about non-boolean while conditions (not bool/int)
    if (testType === "str") {
      this.warn("While loop condition has type 'str' — this may not behave as expected on MCUs");
    }
    this.pushScope(); node.body.forEach(s => this.analyzeNode(s)); this.popScope();
    return "void";
  }

  analyzeFor(node) {
    if (node.iter.type === "Call" && node.iter.name === "range") {
      const args = node.iter.args;
      // IoT constraint: warn on very large range bounds
      const last = args[args.length - 1];
      if (last?.type === "Num" && parseInt(last.val) > 1000) {
        this.warn(
          `Large loop range bound (${last.val}) in 'for ${node.target}' — verify this won't overflow MCU stack or timing budget`
        );
      }
      // Validate arg count
      if (args.length === 0 || args.length > 3) {
        this.error(`range() takes 1–3 arguments, got ${args.length}`);
      }
      args.forEach(a => this.analyzeExpr(a));
    } else {
      this.analyzeExpr(node.iter);
    }
    this.pushScope();
    this.declare(node.target, "int");
    this.usedVars.add(node.target);
    node.body.forEach(s => this.analyzeNode(s));
    this.popScope();
    return "void";
  }

  analyzeReturn(node) {
    const retType = node.val ? this.analyzeExpr(node.val) : "void";
    if (this.fnReturnType && this.fnReturnType !== "void") {
      if (retType === "void") {
        this.warn(`Function '${this.currentFn}' should return '${this.fnReturnType}' but 'return' has no value`);
      } else if (!this.typesCompatible(this.fnReturnType, retType)) {
        this.warn(
          `Return type mismatch in '${this.currentFn}': expected '${this.fnReturnType}', got '${retType}'`
        );
      }
    }
    return retType;
  }

  // ── Expressions ──────────────────────────────
  analyzeExpr(node) {
    if (!node) return "void";
    switch (node.type) {
      case "Num":   return node.val.includes(".") ? "float" : "int";
      case "Bool":  return "bool";
      case "Str":   return "str";
      case "Name": {
        const type = this.lookup(node.name);
        if (!type && !GPIO_CONSTS.has(node.name)) {
          // Only warn for lowercase identifiers that look like variables
          if (/^[a-z_][a-zA-Z0-9_]*$/.test(node.name)) {
            this.warn(`Variable '${node.name}' may not be declared in this scope`);
          }
        }
        this.usedVars.add(node.name);
        return type || "int";
      }
      case "BinOp": {
        const lt = this.analyzeExpr(node.l);
        const rt = this.analyzeExpr(node.r);
        // Division by zero check
        if ((node.op === "/" || node.op === "%") && node.r.type === "Num" && parseFloat(node.r.val) === 0) {
          this.error("Division by zero detected at compile time");
        }
        if (lt === "float" || rt === "float") return "float";
        if ((lt === "bool" || rt === "bool") && ["&&", "||"].includes(node.op)) return "bool";
        return "int";
      }
      case "UnaryOp": {
        const vt = this.analyzeExpr(node.v);
        return node.op === "!" ? "bool" : vt;
      }
      case "Call":  return this.analyzeCall(node);
      case "Index": {
        this.usedVars.add(node.obj);
        this.analyzeExpr(node.idx);
        const arrType = this.lookup(node.obj);
        if (arrType === "int*")   return "int";
        if (arrType === "float*") return "float";
        return "int";
      }
      default: return "int";
    }
  }

  analyzeCall(node) {
    // IoT constraint: block dynamic memory allocation
    if (node.name === "malloc" || node.name === "calloc" || node.name === "realloc") {
      this.error(
        `IoT constraint violation: dynamic memory ('${node.name}') is forbidden on bare-metal targets — use static arrays instead`
      );
    }

    // Analyze all arguments regardless
    node.args.forEach(a => this.analyzeExpr(a));

    // Built-in return types
    if (BUILTIN_RETURN_TYPES[node.name] !== undefined) {
      return BUILTIN_RETURN_TYPES[node.name];
    }

    // User-defined function
    const fn = this.functions[node.name];
    if (fn) {
      // Argument count check
      if (node.args.length !== fn.params.length) {
        this.warn(
          `Function '${node.name}' expects ${fn.params.length} argument(s) but was called with ${node.args.length}`
        );
      }
      // Argument type checks
      node.args.forEach((arg, i) => {
        const argType    = this.analyzeExpr(arg);
        const paramType  = fn.params[i]?.type;
        if (paramType && argType && !this.typesCompatible(paramType, argType)) {
          this.warn(
            `Argument ${i + 1} of '${node.name}': expected '${paramType}', got '${argType}'`
          );
        }
      });
      return fn.returnType || "void";
    }

    return "int";
  }

  // ── Type compatibility ────────────────────────
  typesCompatible(a, b) {
    if (!a || !b)             return true;
    if (a === b)              return true;
    const numeric = new Set(["int", "float", "bool"]);
    if (numeric.has(a) && numeric.has(b)) return true;
    return false;
  }
}
