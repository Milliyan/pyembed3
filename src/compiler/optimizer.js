// ─────────────────────────────────────────────
//  IoT Optimizer — Phase 5
//
//  Passes (applied in order):
//    1. Constant Folding   — evaluate pure constant expressions at compile time
//    2. Dead Code Elimination — remove unreachable branches and post-return stmts
//    3. Loop Unrolling     — inline small for-range loops (≤ 8 iterations)
//    4. Strength Reduction — replace x*1, x+0, x**2 etc. with cheaper forms
// ─────────────────────────────────────────────

export class Optimizer {
  constructor() {
    this.report = [];          // human-readable log of optimizations applied
    this.stats  = {
      folded:      0,          // constant expressions folded
      eliminated:  0,          // dead code blocks removed
      unrolled:    0,          // loops unrolled
      strengthRed: 0,          // strength reductions applied
    };
  }

  optimize(ast) {
    const body = this.optimizeBlock(ast.body);
    return { type: "Program", body };
  }

  // ── Block-level optimization ─────────────────
  optimizeBlock(stmts) {
    if (!stmts) return [];
    const out = [];
    for (const stmt of stmts) {
      const result = this.optimizeStmt(stmt);
      if (result === null) continue;              // dead code — eliminated
      if (Array.isArray(result)) {
        out.push(...result);                      // loop unroll expanded
      } else {
        out.push(result);
        // Dead code after return: stop processing this block
        if (result.type === "Return") {
          if (out.length < stmts.length) {
            this.stats.eliminated++;
            this.report.push("Dead code eliminated: unreachable statements after return");
          }
          break;
        }
      }
    }
    return out;
  }

  // ── Statement-level dispatch ─────────────────
  optimizeStmt(node) {
    if (!node) return null;
    switch (node.type) {
      case "FuncDef":
        return { ...node, body: this.optimizeBlock(node.body) };

      case "AnnAssign":
        return { ...node, val: node.val ? this.fold(node.val) : null };

      case "Assign":
        return { ...node, val: this.fold(node.val) };

      case "AugAssign":
        return { ...node, val: this.fold(node.val) };

      case "ExprStmt":
        return { ...node, expr: this.fold(node.expr) };

      case "Return":
        return { ...node, val: node.val ? this.fold(node.val) : null };

      case "If":
        return this.optimizeIf(node);

      case "While": {
        const test = this.fold(node.test);
        // while(False) → remove entirely
        if (test.type === "Bool" && test.val === "False") {
          this.stats.eliminated++;
          this.report.push("Dead code eliminated: while(False) loop removed");
          return null;
        }
        return { ...node, test, body: this.optimizeBlock(node.body) };
      }

      case "For":
        return this.optimizeFor(node);

      default:
        return node;
    }
  }

  // ── If / dead-branch elimination ─────────────
  optimizeIf(node) {
    const test = this.fold(node.test);

    // if(True) → keep body, discard elifs and else
    if (test.type === "Bool" && test.val === "True") {
      this.stats.eliminated++;
      this.report.push("Dead code eliminated: if(True) — else/elif branches removed");
      return {
        type: "If", test,
        body:     this.optimizeBlock(node.body),
        elifs:    [],
        elseBody: null,
      };
    }

    // if(False) → skip to else (or remove entirely)
    if (test.type === "Bool" && test.val === "False") {
      this.stats.eliminated++;
      if (node.elseBody && node.elseBody.length > 0) {
        this.report.push("Dead code eliminated: if(False) — if-body removed, else inlined");
        const elseBody = this.optimizeBlock(node.elseBody);
        if (elseBody.length === 1) return elseBody[0];
        return { type: "If", test: { type: "Bool", val: "True" }, body: elseBody, elifs: [], elseBody: null };
      }
      this.report.push("Dead code eliminated: if(False) branch removed entirely");
      return null;
    }

    // Optimize nested elif / else
    const elifs    = node.elifs.map(el => ({
      test: this.fold(el.test),
      body: this.optimizeBlock(el.body),
    })).filter(el => {
      // elif(False) → remove
      if (el.test.type === "Bool" && el.test.val === "False") {
        this.stats.eliminated++;
        this.report.push("Dead code eliminated: elif(False) branch removed");
        return false;
      }
      return true;
    });

    return {
      ...node,
      test,
      body:     this.optimizeBlock(node.body),
      elifs,
      elseBody: node.elseBody ? this.optimizeBlock(node.elseBody) : null,
    };
  }

  // ── Loop unrolling ────────────────────────────
  optimizeFor(node) {
    if (node.iter.type === "Call" && node.iter.name === "range") {
      const args  = node.iter.args.map(a => this.fold(a));
      let start = 0, end = null, step = 1;

      if (args.length === 1 && args[0].type === "Num") {
        end = parseInt(args[0].val);
      } else if (args.length === 2 && args[0].type === "Num" && args[1].type === "Num") {
        start = parseInt(args[0].val);
        end   = parseInt(args[1].val);
      } else if (args.length === 3 && args.every(a => a.type === "Num")) {
        start = parseInt(args[0].val);
        end   = parseInt(args[1].val);
        step  = parseInt(args[2].val);
      }

      if (end !== null) {
        const count = step > 0
          ? Math.max(0, Math.ceil((end - start) / step))
          : 0;

        // Unroll loops with ≤ 8 iterations — safe to inline on MCUs
        if (count > 0 && count <= 8) {
          this.stats.unrolled++;
          this.report.push(
            `Loop unrolled: for ${node.target} in range(${args.map(a => a.val).join(", ")}) → ${count} iterations inlined`
          );
          const unrolled = [];
          for (let i = start; i < end; i += step) {
            const substituted = node.body.map(s => this.substituteVar(s, node.target, i));
            unrolled.push(...this.optimizeBlock(substituted));
          }
          return unrolled;
        }
      }
    }

    return { ...node, body: this.optimizeBlock(node.body) };
  }

  // ── Substitute loop variable with its unrolled value ──
  substituteVar(node, varName, value) {
    if (!node) return node;
    const sub = n => this.substituteVar(n, varName, value);
    const subList = arr => arr ? arr.map(sub) : arr;

    switch (node.type) {
      case "Name":
        return node.name === varName ? { type: "Num", val: String(value) } : node;
      case "BinOp":
        return { ...node, l: sub(node.l), r: sub(node.r) };
      case "UnaryOp":
        return { ...node, v: sub(node.v) };
      case "Call":
        return { ...node, args: node.args.map(sub) };
      case "Index":
        return { ...node, idx: sub(node.idx) };
      case "AnnAssign":
        return { ...node, val: node.val ? sub(node.val) : null };
      case "Assign":
        return { ...node, val: sub(node.val) };
      case "AugAssign":
        return { ...node, val: sub(node.val) };
      case "ExprStmt":
        return { ...node, expr: sub(node.expr) };
      case "Return":
        return { ...node, val: node.val ? sub(node.val) : null };
      case "If":
        return {
          ...node,
          test:     sub(node.test),
          body:     subList(node.body),
          elifs:    node.elifs.map(e => ({ test: sub(e.test), body: subList(e.body) })),
          elseBody: node.elseBody ? subList(node.elseBody) : null,
        };
      case "While":
        return { ...node, test: sub(node.test), body: subList(node.body) };
      case "For":
        // Don't substitute into a nested for that shadows the same variable
        if (node.target === varName) return node;
        return { ...node, body: subList(node.body) };
      default:
        return node;
    }
  }

  // ── Constant folding ──────────────────────────
  fold(node) {
    if (!node) return node;
    switch (node.type) {
      case "Num":
      case "Bool":
      case "Str":
      case "Name":
        return node;

      case "UnaryOp": {
        const v = this.fold(node.v);
        if (v.type === "Num") {
          if (node.op === "-") {
            this.stats.folded++;
            const result = -parseFloat(v.val);
            return { type: "Num", val: String(result) };
          }
          if (node.op === "!") {
            this.stats.folded++;
            return { type: "Bool", val: parseFloat(v.val) === 0 ? "True" : "False" };
          }
        }
        if (v.type === "Bool" && node.op === "!") {
          this.stats.folded++;
          return { type: "Bool", val: v.val === "True" ? "False" : "True" };
        }
        return { ...node, v };
      }

      case "BinOp": {
        const l = this.fold(node.l);
        const r = this.fold(node.r);

        // ── Numeric constant folding ──
        if (l.type === "Num" && r.type === "Num") {
          const lv = parseFloat(l.val);
          const rv = parseFloat(r.val);

          // Division by zero guard
          if ((node.op === "/" || node.op === "%") && rv === 0) {
            return { ...node, l, r };
          }

          let result;
          switch (node.op) {
            case "+":   result = lv + rv; break;
            case "-":   result = lv - rv; break;
            case "*":   result = lv * rv; break;
            case "/":   result = lv / rv; break;
            case "%":   result = lv % rv; break;
            case "pow": result = Math.pow(lv, rv); break;
            case "==":  this.stats.folded++; return { type: "Bool", val: lv === rv ? "True" : "False" };
            case "!=":  this.stats.folded++; return { type: "Bool", val: lv !== rv ? "True" : "False" };
            case "<":   this.stats.folded++; return { type: "Bool", val: lv <  rv ? "True" : "False" };
            case ">":   this.stats.folded++; return { type: "Bool", val: lv >  rv ? "True" : "False" };
            case "<=":  this.stats.folded++; return { type: "Bool", val: lv <= rv ? "True" : "False" };
            case ">=":  this.stats.folded++; return { type: "Bool", val: lv >= rv ? "True" : "False" };
          }
          if (result !== undefined) {
            this.stats.folded++;
            this.report.push(`Constant folded: ${l.val} ${node.op} ${r.val} → ${result}`);
            const isFloat = !Number.isInteger(result) || l.val.includes(".") || r.val.includes(".");
            return { type: "Num", val: isFloat ? String(result) : String(Math.trunc(result)) };
          }
        }

        // ── Boolean constant folding ──
        if (l.type === "Bool" && r.type === "Bool") {
          const lv = l.val === "True", rv = r.val === "True";
          if (node.op === "&&") { this.stats.folded++; return { type: "Bool", val: lv && rv ? "True" : "False" }; }
          if (node.op === "||") { this.stats.folded++; return { type: "Bool", val: lv || rv ? "True" : "False" }; }
        }

        // ── Strength reduction ──
        if (r.type === "Num") {
          const rv = parseFloat(r.val);
          if (node.op === "+" && rv === 0) { this.stats.strengthRed++; return l; }
          if (node.op === "-" && rv === 0) { this.stats.strengthRed++; return l; }
          if (node.op === "*" && rv === 1) { this.stats.strengthRed++; return l; }
          if (node.op === "*" && rv === 0) { this.stats.strengthRed++; return { type: "Num", val: "0" }; }
          if (node.op === "/" && rv === 1) { this.stats.strengthRed++; return l; }
          // x ** 2  →  x * x
          if (node.op === "pow" && rv === 2) {
            this.stats.strengthRed++;
            this.report.push(`Strength reduction: x**2 → x*x`);
            return { type: "BinOp", op: "*", l, r: l };
          }
        }
        if (l.type === "Num") {
          const lv = parseFloat(l.val);
          if (node.op === "+" && lv === 0) { this.stats.strengthRed++; return r; }
          if (node.op === "*" && lv === 1) { this.stats.strengthRed++; return r; }
          if (node.op === "*" && lv === 0) { this.stats.strengthRed++; return { type: "Num", val: "0" }; }
        }

        return { ...node, l, r };
      }

      case "Call":
        return { ...node, args: node.args.map(a => this.fold(a)) };

      case "Index":
        return { ...node, idx: this.fold(node.idx) };

      default:
        return node;
    }
  }
}
