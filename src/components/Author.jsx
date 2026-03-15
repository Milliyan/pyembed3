// Section 05 — Author / About the builder

export default function Author() {
  return (
    <section className="section">
      <div className="sec-n fade-up">05</div>

      <div className="author-grid fade-up d1">
        <div className="av">👨‍💻</div>

        <div>
          <div className="av-name">Milliyan Mohammed Awol</div>
          <div className="av-role">Electrical &amp; Computer Engineering — Compiler Design; Embedded Systems</div>
          <p className="av-bio">
            Electrical and Computer Engineering student specializing in computer engineering. PyEmbed is original research into
            bridging the gap between high-level Python and bare-metal IoT
            hardware — through principled language translation, static analysis,
            and hardware-aware optimization across all five compiler stages.
          </p>
          <div className="av-links">
            <a href="https://github.com/Milliyan" target="_blank" rel="noopener noreferrer" className="av-link">
              GitHub ↗
            </a>
            <a href="mailto:milliyanmuhe@gmail.com" className="av-link">
              Email →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
