// ─────────────────────────────────────────────
//  Compile pipeline — all 5 stages
//
//  Stage 1 · Lexer     — source  → tokens
//  Stage 2 · Parser    — tokens  → AST
//  Stage 3 · Analyzer  — AST     → typed/validated AST
//  Stage 4 · Optimizer — AST     → optimized AST
//  Stage 5 · Generator — opt AST → Embedded C
// ─────────────────────────────────────────────

import { tokenize }  from "./tokenize.js";
import { Parser }    from "./parser.js";
import { Analyzer }  from "./analyzer.js";
import { Optimizer } from "./optimizer.js";
import { CodeGen }   from "./codegen.js";

/**
 * Compile a Python subset string into Embedded C.
 * @param {string} source     - Python source code
 * @param {string} targetKey  - "arduino" | "esp32" | "stm32"
 * @returns {{ output, error, warnings, stats, tokens, ast, optReport }}
 */
export function compile(source, targetKey = "arduino") {
  const result = {
    tokens:    [],
    ast:       null,
    optAst:    null,
    output:    "",
    error:     null,
    warnings:  [],
    optReport: [],
    stats:     {},
  };

  try {
    const t0 = performance.now();

    // ── Stage 1: Lexer ────────────────────────
    result.tokens = tokenize(source);

    // ── Stage 2: Parser ───────────────────────
    result.ast = new Parser(result.tokens).parse();

    // ── Stage 3: Semantic Analyzer ────────────
    const analyzer      = new Analyzer();
    const analysis      = analyzer.analyze(result.ast);
    result.warnings     = [...(analysis.warnings || [])];

    // Hard errors from analyzer abort compilation
    if (analysis.errors && analysis.errors.length > 0) {
      throw new Error(analysis.errors[0]);
    }

    // ── Stage 4: IoT Optimizer ────────────────
    const optimizer     = new Optimizer();
    result.optAst       = optimizer.optimize(result.ast);
    result.optReport    = optimizer.report;
    result.optStats     = optimizer.stats;

    // ── Stage 5: Code Generator ───────────────
    const gen           = new CodeGen(targetKey);
    result.output       = gen.generate(result.optAst);
    result.warnings     = [...result.warnings, ...(gen.warnings || [])];

    const t1 = performance.now();

    // ── Stats ─────────────────────────────────
    const srcLines = source.split("\n")
      .filter(l => l.trim() && !l.trim().startsWith("#")).length;
    const outLines = result.output.split("\n")
      .filter(l => l.trim()).length;
    const funcs    = result.ast.body.filter(n => n.type === "FuncDef").length;

    result.stats = {
      time:        (t1 - t0).toFixed(1),
      srcLines,
      outLines,
      funcs,
      tokens:      result.tokens.length,
      folded:      optimizer.stats.folded,
      eliminated:  optimizer.stats.eliminated,
      unrolled:    optimizer.stats.unrolled,
      strengthRed: optimizer.stats.strengthRed,
    };
  } catch (e) {
    result.error = e.message;
  }

  return result;
}
