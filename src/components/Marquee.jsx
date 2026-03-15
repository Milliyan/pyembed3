// Scrolling marquee ticker banner

const ITEMS = [
  "Lexical Analysis", "Abstract Syntax Tree", "Type Inference",
  "Dead Code Elimination", "Loop Unrolling", "Code Generation",
  "IoT Optimization", "Static Analysis", "Constant Folding",
  "GPIO Mapping", "Register Allocation", "Semantic Analysis",
];

export default function Marquee() {
  // Duplicate for seamless loop
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <div className="marquee">
      <div className="mtrack">
        {doubled.map((item, i) => (
          <span className="mitem" key={i}>
            {item}
            <span className="msep">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
