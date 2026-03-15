# PyEmbed — Python to Embedded C Compiler

A full-stack web application that compiles a statically-typed Python subset
into optimized Embedded C for IoT microcontrollers (Arduino, ESP32, STM32).

---

## Quick Start

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
```

---

## Project Structure

```
pyembed/
├── index.html                  # HTML entry point
├── vite.config.js              # Vite build config
├── package.json
└── src/
    ├── main.jsx                # React entry — mounts <App />, imports CSS
    ├── App.jsx                 # Root component — wires all sections + scroll refs
    │
    ├── compiler/               # ── Compiler Engine ──────────────────────────
    │   ├── tokenize.js         # Lexer: Python source → token stream
    │   ├── parser.js           # Parser: tokens → Abstract Syntax Tree (AST)
    │   ├── targets.js          # MCU target profiles (Arduino / ESP32 / STM32)
    │   ├── codegen.js          # Code generator: AST → Embedded C
    │   ├── compile.js          # Pipeline: tokenize → parse → generate
    │   ├── examples.js         # 13 example programs (grouped by category)
    │   └── highlight.js        # Syntax highlighters for Python and C
    │
    ├── components/             # ── React Components ─────────────────────────
    │   ├── Nav.jsx             # Fixed top nav bar + mobile hamburger drawer
    │   ├── Hero.jsx            # Landing hero — title, code card, CTA buttons
    │   ├── Marquee.jsx         # Scrolling ticker banner
    │   ├── About.jsx           # §01 — About section
    │   ├── Architecture.jsx    # §02 — Pipeline diagram + features grid
    │   ├── CompilerTool.jsx    # §03 — Live compiler IDE (full editor + output)
    │   ├── Timeline.jsx        # §04 — Roadmap timeline + tech pills
    │   ├── Author.jsx          # §05 — Author / research credit
    │   └── Footer.jsx          # Site footer
    │
    └── styles/                 # ── CSS (imported in main.jsx) ───────────────
        ├── global.css          # CSS variables, reset, shared typography, buttons
        ├── nav.css             # Navigation bar + mobile menu
        ├── hero.css            # Hero section + code card + marquee
        ├── sections.css        # About, pipeline, features, timeline, author, footer
        └── compiler.css        # Compiler tool IDE (editor panels, status bar, FAB)
```

---

## Compiler Architecture

The compiler runs entirely in the browser — no server required.

```
Python source
     │
     ▼
┌─────────────┐
│   Lexer     │  tokenize.js   — source → token stream (KEYWORD, IDENT, OP, …)
└─────────────┘
     │
     ▼
┌─────────────┐
│   Parser    │  parser.js     — tokens → Abstract Syntax Tree (recursive descent)
└─────────────┘
     │
     ▼
┌─────────────┐
│  Analyzer   │  (Phase 3 — in progress)
└─────────────┘
     │
     ▼
┌─────────────┐
│  Optimizer  │  (Phase 5 — planned)
└─────────────┘
     │
     ▼
┌─────────────┐
│  Generator  │  codegen.js    — AST → target-specific Embedded C
└─────────────┘
     │
     ▼
Embedded C output
```

### Supported Python Subset

| Construct          | Example                          |
|--------------------|----------------------------------|
| Annotated vars     | `x: int = 5`                     |
| Functions          | `def blink(pin: int) -> void:`   |
| if / elif / else   | full support                     |
| while / for        | `for i in range(n):`             |
| GPIO builtins      | `digitalWrite`, `analogRead`, …  |
| print              | → `Serial.println()` / HAL UART  |
| Operators          | `+  -  *  /  //  %  **  ==  !=` |
| Augmented assign   | `+=  -=  *=  /=`                 |
| break / continue   | full support                     |

### MCU Targets

| Target  | ADC    | Voltage | Baud    |
|---------|--------|---------|---------|
| Arduino | 10-bit | 5V      | 9600    |
| ESP32   | 12-bit | 3.3V    | 115200  |
| STM32   | 12-bit | 3.3V    | 115200  |

---

## Tech Stack

- **React 18** + **Vite 5**
- **Fraunces** (serif display) · **Outfit** (UI) · **Fira Code** (mono)
- Zero external runtime dependencies — compiler is pure JS

---

## Roadmap

| Phase | Description              | Status      |
|-------|--------------------------|-------------|
| 01    | Lexer                    | ✅ Complete  |
| 02    | Parser + AST             | ✅ Complete  |
| 03    | Semantic Analyzer        | ✅ Complete  |
| 04    | C Code Generator         | ✅ Complete  |
| 05    | IoT Optimizer            | ✅ Complete  |

---

## Author

**Milliyan Mohammed Awol**  
Computer Science — Compiler Design & Embedded Systems
