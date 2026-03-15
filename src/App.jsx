import { useEffect, useRef } from "react";

import Nav          from "./components/Nav.jsx";
import Hero         from "./components/Hero.jsx";
import Marquee      from "./components/Marquee.jsx";
import About        from "./components/About.jsx";
import Architecture from "./components/Architecture.jsx";
import CompilerTool from "./components/CompilerTool.jsx";
import Timeline     from "./components/Timeline.jsx";
import Author       from "./components/Author.jsx";
import Footer       from "./components/Footer.jsx";

export default function App() {
  const archRef     = useRef(null);
  const compilerRef = useRef(null);

  // Scroll helpers passed down to Nav and Hero buttons
  const scrollTo = (ref) =>
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  // Activate fade-up animations via IntersectionObserver
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("in"); }),
      { threshold: 0.08 }
    );
    document.querySelectorAll(".fade-up").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <Nav
        onGoCompiler={()    => scrollTo(compilerRef)}
        onGoArchitecture={() => scrollTo(archRef)}
      />

      <Hero
        onGoCompiler={()    => scrollTo(compilerRef)}
        onGoArchitecture={() => scrollTo(archRef)}
      />

      <Marquee />

      <About />

      <hr className="divider" />

      <Architecture ref={archRef} />

      <hr className="divider" />

      <CompilerTool ref={compilerRef} />

      <Timeline />

      <Author />

      <Footer />
    </>
  );
}
