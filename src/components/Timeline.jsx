// Section 04 — Development Roadmap + Tech Stack

const PHASES = [
  {
    ph: "PHASE 01 · Weeks 1–2",
    name: "Lexer Implementation",
    desc: "Tokenizer for all Python subset constructs — keywords, identifiers, operators, strings, INDENT/DEDENT tracking.",
    badge: "badge-done", label: "Completed",
  },
  {
    ph: "PHASE 02 · Weeks 3–5",
    name: "Parser & AST Builder",
    desc: "Recursive descent parser with context-free grammar producing a fully typed Abstract Syntax Tree.",
    badge: "badge-done", label: "Completed",
  },
  {
    ph: "PHASE 03 · Weeks 6–7",
    name: "Semantic Analyzer",
    desc: "Multi-scope symbol table, type inference, undefined variable detection, IoT constraint validation, and return-type checking.",
    badge: "badge-done", label: "Completed",
  },
  {
    ph: "PHASE 04 · Weeks 8–10",
    name: "C Code Generator",
    desc: "AST traversal emitting clean, target-specific Embedded C with proper headers, forward declarations, and HAL mappings.",
    badge: "badge-done", label: "Completed",
  },
  {
    ph: "PHASE 05 · Weeks 11–12",
    name: "IoT Optimizer",
    desc: "Constant folding, dead code elimination, loop unrolling (≤ 8 iterations), strength reduction, and unreachable-code removal.",
    badge: "badge-done", label: "Completed",
  },
];

const TECH  = ["Python 3.11", "Lark Parser", "pytest", "ESP32-IDF", "Arduino IDE", "Git"];
const ROAD  = ["LLVM Backend", "RTOS Support"];

export default function Timeline() {
  const [left, right] = [PHASES.slice(0, 3), PHASES.slice(3)];

  return (
    <section className="section section-alt">
      <div className="sec-n fade-up">04</div>
      <div className="fade-up d1">
        <h2 className="sec-title">Development Roadmap</h2>
        <p className="sec-sub">Five phases mapping to the five compiler stages.</p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "3rem",
        marginTop: "1rem",
        flexWrap: "wrap",
      }}>
        {/* Left column */}
        <div className="timeline fade-up d2">
          {left.map(t => (
            <div className="tl-item" key={t.name}>
              <div className="tl-phase">{t.ph}</div>
              <div className="tl-name">{t.name}</div>
              <div className="tl-desc">{t.desc}</div>
              <span className={`badge ${t.badge}`}>{t.label}</span>
            </div>
          ))}
        </div>

        {/* Right column — remaining phases + tech pills */}
        <div className="fade-up d3">
          <div className="timeline">
            {right.map(t => (
              <div className="tl-item" key={t.name}>
                <div className="tl-phase">{t.ph}</div>
                <div className="tl-name">{t.name}</div>
                <div className="tl-desc">{t.desc}</div>
                <span className={`badge ${t.badge}`}>{t.label}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "1.5rem" }}>
            <p style={{ fontSize: ".88rem", fontWeight: 600, color: "var(--dark)", marginBottom: "1rem" }}>
              Built With
            </p>
            <div className="pills">
              {TECH.map(t  => <span className="pill"        key={t}>{t}</span>)}
              {ROAD.map(t  => <span className="pill dashed" key={t}>{t} · roadmap</span>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
