// Section 03 — Live Compiler Tool
// Fullscreen uses ReactDOM.createPortal — renders directly into document.body,
// completely outside the IntersectionObserver / fade-up system that was
// causing the compiler to disappear after one second.

import { useState, useCallback, useEffect, forwardRef } from "react";
import { createPortal }                                  from "react-dom";
import { compile }                                       from "../compiler/compile.js";
import { TARGETS }                                       from "../compiler/targets.js";
import { EXAMPLES, EXAMPLE_GROUPS }                      from "../compiler/examples.js";
import { highlightC }                                    from "../compiler/highlight.js";

// ── Shared compiler UI ───────────────────────────────────────────────────────
function CompilerUI({
  src, setSrc, target, setTarget, result, setResult,
  copied, setCopied, activeEx, setActiveEx,
  activeTab, setActiveTab, fullscreen, setFullscreen,
}) {
  const run = useCallback((tgt) => {
    setResult(compile(src, tgt || target));
    setActiveTab("output");
  }, [src, target]);

  const switchTarget = (tgt) => {
    setTarget(tgt);
    setResult(compile(src, tgt));
  };

  const loadExample = (name) => {
    setSrc(EXAMPLES[name]);
    setActiveEx(name);
    setResult(compile(EXAMPLES[name], target));
    setActiveTab("input");
  };

  const copyOutput = () => {
    if (result.output) {
      navigator.clipboard?.writeText(result.output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const s  = e.target.selectionStart;
      const en = e.target.selectionEnd;
      setSrc(src.substring(0, s) + "    " + src.substring(en));
      setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = s + 4; }, 0);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      run();
    }
  };

  const { stats, error, warnings } = result;
  const T = TARGETS[target];

  return (
    <div className={`compiler-wrap${fullscreen ? " compiler-fullscreen" : ""}`}>

      {/* ── Top action bar ── */}
      <div className="c-topbar">
        <div className="c-logo">
          PyEmbed <span className="c-logo-badge">Compiler</span>
        </div>
        <div className="c-actions">
          <select
            className="c-select"
            value={activeEx}
            onChange={e => loadExample(e.target.value)}
          >
            {Object.entries(EXAMPLE_GROUPS).map(([grp, names]) => (
              <optgroup key={grp} label={`── ${grp}`}>
                {names.map(k => <option key={k} value={k}>{k}</option>)}
              </optgroup>
            ))}
          </select>

          {/* Fullscreen toggle */}
          <button
            className="fs-btn"
            onClick={() => setFullscreen(f => !f)}
            title={fullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
          >
            {fullscreen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
              </svg>
            )}
            <span>{fullscreen ? "Exit" : "Fullscreen"}</span>
          </button>

          <button
            className="c-compile"
            onClick={() => run()}
            style={{ background: T.color }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11">
              <polygon points="5,3 19,12 5,21" />
            </svg>
            <span>Compile</span>
            <span className="c-shortcut">⌘↵</span>
          </button>
        </div>
      </div>

      {/* ── Target selector bar ── */}
      <div className="c-tbar">
        <span className="c-tlabel">Target MCU:</span>
        {Object.entries(TARGETS).map(([key, t]) => (
          <button
            key={key}
            className="c-tbtn"
            onClick={() => switchTarget(key)}
            style={{
              border:     `1.5px solid ${target === key ? t.color : "var(--border)"}`,
              background: target === key ? t.badge : "var(--white)",
              color:      target === key ? t.color : "var(--muted)",
            }}
          >
            <span className="tb-name" style={{ fontWeight: target === key ? 600 : 400 }}>
              {t.label}
            </span>
            <span className="tb-sub">{t.sub}</span>
          </button>
        ))}
        <div className="c-tinfo">
          <span className="c-tinfo-v" style={{ color: T.color }}>{T.voltage}</span>
          <span className="c-tinfo-d">ADC {T.adcBits}-bit · {T.serialBaud} baud</span>
        </div>
      </div>

      {/* ── Panel tabs (mobile only) ── */}
      <div className="c-ptabs">
        <button
          className={`c-ptab ${activeTab === "input" ? "active" : ""}`}
          onClick={() => setActiveTab("input")}
          style={activeTab === "input" ? { borderBottomColor: "#22C55E", color: "var(--dark)" } : {}}
        >
          <span className="c-tdot" style={{ background: activeTab === "input" ? "#22C55E" : "var(--border)" }} />
          Python Input
        </button>
        <button
          className={`c-ptab ${activeTab === "output" ? "active" : ""}`}
          onClick={() => setActiveTab("output")}
          style={activeTab === "output" ? { borderBottomColor: T.color, color: "var(--dark)" } : {}}
        >
          <span className="c-tdot" style={{ background: activeTab === "output" ? T.color : "var(--border)" }} />
          {T.label} Output
          {error && <span style={{ color: "var(--red)", marginLeft: 4, fontWeight: 700 }}>!</span>}
        </button>
      </div>

      {/* ── Editor panels ── */}
      <div className="c-main">
        {/* Python input */}
        <div className={`c-panel ${activeTab !== "input" ? "hidden" : ""}`}>
          <div className="c-ph">
            <div className="c-ptitle">
              <span className="c-dot c-dot-g" />
              <span className="lbl">Python Input</span>
            </div>
            <button className="c-paction" onClick={() => setSrc("")}>Clear</button>
          </div>
          <textarea
            className="c-editor"
            value={src}
            onChange={e => setSrc(e.target.value)}
            onKeyDown={handleKey}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="none"
            autoComplete="off"
            placeholder="# Write your Python subset here..."
          />
        </div>

        {/* C output */}
        <div className={`c-panel ${activeTab !== "output" ? "hidden" : ""}`}>
          <div className="c-ph">
            <div className="c-ptitle">
              <span className="c-dot" style={{ background: error ? "var(--red)" : T.color }} />
              <span className="lbl">
                {error ? "Compiler Error" : `${T.label} — Embedded C`}
              </span>
            </div>
            <button
              className={`c-paction ${copied ? "flash" : ""}`}
              onClick={copyOutput}
            >
              {copied ? "✔ Copied" : "Copy"}
            </button>
          </div>
          {error
            ? (
              <div className="c-output err">
                <div className="c-err-title">✖ Compilation Failed</div>
                {error}
                <div className="c-err-hint">
                  Check indentation, syntax, and type annotations.
                </div>
              </div>
            ) : (
              <div
                className="c-output"
                dangerouslySetInnerHTML={{ __html: highlightC(result.output) }}
              />
            )
          }
        </div>
      </div>

      {/* ── Status bar ── */}
      <div className="c-status">
        <div className="c-sitem">
          {error
            ? <span className="c-serr">✖ Error</span>
            : <span className="c-sok">✔ OK</span>
          }
        </div>
        {!error && (
          <>
            <div className="c-sitem"><span>⏱</span><span className="c-sv">{stats.time}ms</span></div>
            <div className="c-sitem"><span>Tokens</span><span className="c-sv">{stats.tokens}</span></div>
            <div className="c-sitem"><span>Py</span><span className="c-sv">{stats.srcLines}L</span></div>
            <div className="c-sitem"><span>C</span><span className="c-sv">{stats.outLines}L</span></div>
            <div className="c-sitem"><span>fn()</span><span className="c-sv">{stats.funcs}</span></div>
            {stats.folded     > 0 && <div className="c-sitem"><span>fold</span><span className="c-sv">{stats.folded}</span></div>}
            {stats.unrolled   > 0 && <div className="c-sitem"><span>unroll</span><span className="c-sv">{stats.unrolled}</span></div>}
            {stats.eliminated > 0 && <div className="c-sitem"><span>dce</span><span className="c-sv">{stats.eliminated}</span></div>}
            <div className="c-sitem"><span>ADC</span><span className="c-sv">{T.adcBits}-bit</span></div>
            <div className="c-sitem">
              <span>V</span>
              <span className="c-sv" style={{ color: T.color }}>{T.voltage}</span>
            </div>
          </>
        )}
        {warnings?.length > 0 && (
          <div className="c-sitem">
            <span className="c-swarn">⚠ {warnings.length}w</span>
          </div>
        )}
        <div className="c-sitem" style={{ marginLeft: "auto", borderRight: "none", borderLeft: "1px solid var(--border)" }}>
          <span style={{ fontSize: ".58rem", opacity: .7 }}>⌘↵ compile · Tab indent · Esc exit fullscreen</span>
        </div>
      </div>

      {/* ── Mobile FAB ── */}
      <button
        className="c-fab"
        onClick={() => run()}
        style={{ background: T.color }}
        aria-label="Compile"
      >
        <span className="fab-ring" />
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5,3 19,12 5,21" />
        </svg>
      </button>

    </div>
  );
}

// ── Wrapper component ─────────────────────────────────────────────────────────
const CompilerTool = forwardRef(function CompilerTool(_props, ref) {
  const [src,        setSrc]        = useState(EXAMPLES["Blink LED"]);
  const [target,     setTarget]     = useState("arduino");
  const [result,     setResult]     = useState(() => compile(EXAMPLES["Blink LED"], "arduino"));
  const [copied,     setCopied]     = useState(false);
  const [activeEx,   setActiveEx]   = useState("Blink LED");
  const [activeTab,  setActiveTab]  = useState("input");
  const [fullscreen, setFullscreen] = useState(false);

  // Lock body scroll & handle Escape while fullscreen is open
  useEffect(() => {
    document.body.style.overflow = fullscreen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [fullscreen]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setFullscreen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const sharedProps = {
    src, setSrc, target, setTarget, result, setResult,
    copied, setCopied, activeEx, setActiveEx,
    activeTab, setActiveTab, fullscreen, setFullscreen,
  };

  return (
    <section className="compiler-section" ref={ref}>
      <div className="sec-n fade-up">03</div>
      <div className="fade-up d1">
        <h2 className="sec-title">Live Compiler</h2>
        <p className="sec-sub">
          Write Python below, pick your MCU target, hit Compile — and see the
          generated Embedded C instantly.
        </p>
      </div>

      {/* ── Inline compiler (shown when NOT fullscreen) ── */}
      <div className="fade-up d2">
        {!fullscreen && <CompilerUI {...sharedProps} />}

        {/* Placeholder keeps section height while fullscreen overlay is open */}
        {fullscreen && (
          <div className="compiler-fs-placeholder">
            <span>Compiler is open in fullscreen</span>
            <button className="btn-outline" onClick={() => setFullscreen(false)}>
              Exit Fullscreen
            </button>
          </div>
        )}
      </div>

      {/* ── Fullscreen portal (rendered into document.body — zero interference) ── */}
      {fullscreen && createPortal(
        <CompilerUI {...sharedProps} />,
        document.body
      )}
    </section>
  );
});

export default CompilerTool;
