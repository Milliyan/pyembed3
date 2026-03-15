// Site footer

export default function Footer() {
  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="footer">
      <span className="footer-brand">PyEmbed</span>
      <span className="footer-copy">© 2025 — Compiler Research Project</span>
      <span className="footer-top" onClick={scrollTop}>Back to top ↑</span>
    </footer>
  );
}
