// Section 01 — About PyEmbed

export default function About() {
  return (
    <section className="section">
      <div className="sec-n fade-up">01</div>

      <div className="about-grid fade-up d1">
        <p className="about-quote">
          "IoT is eating the world. C is hard. Python is not.
          PyEmbed bridges the gap."
        </p>

        <div className="about-text">
          <p>
            Embedded systems power billions of IoT devices. Yet programming
            them requires deep knowledge of C, memory management, and hardware
            constraints — a steep barrier for most developers.
          </p>
          <p>
            <strong>PyEmbed</strong> accepts a statically-typed Python subset
            and outputs clean, optimized Embedded C — ready for ESP32, Arduino,
            STM32, and more. No runtime, no interpreter, no overhead.
          </p>
          <p>
            This project is original research in{" "}
            <strong>compiler design and IoT optimization</strong>, exploring
            static analysis, type inference, and hardware-aware code generation.
          </p>
        </div>
      </div>
    </section>
  );
}
