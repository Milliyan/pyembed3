import { useState, useEffect } from "react";

export default function Nav({ onGoCompiler, onGoArchitecture }) {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const close = () => setMenuOpen(false);

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    close();
  };

  return (
    <>
      <nav className={`nav ${scrolled ? "scrolled" : ""}`}>
        <span className="nav-logo" onClick={scrollTop}>
          PyEmbed <span className="nav-logo-badge">v1.0</span>
        </span>

        <ul className="nav-links">
          <li><a onClick={() => { onGoArchitecture(); close(); }}>Architecture</a></li>
          <li><a onClick={() => { onGoCompiler();    close(); }}>Compiler</a></li>
          <li><a href="#">Research</a></li>
        </ul>

        <button className="nav-cta" onClick={() => { onGoCompiler(); close(); }}>
          Try Compiler →
        </button>

        <button
          className={`hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </nav>

      {/* Mobile drawer */}
      <div className={`mob-menu ${menuOpen ? "open" : ""}`}>
        <a onClick={() => { onGoArchitecture(); close(); }}>Architecture</a>
        <a onClick={() => { onGoCompiler();    close(); }}>Compiler</a>
        <a href="#">Research</a>
        <a className="mob-cta" onClick={() => { onGoCompiler(); close(); }}>
          Try Compiler →
        </a>
      </div>
    </>
  );
}
