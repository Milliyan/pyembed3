import { defineConfig } from "vite";
import react            from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir:        "dist",
    sourcemap:     false,
    rollupOptions: {
      output: {
        manualChunks: {
          react:    ["react", "react-dom"],
          compiler: [
            "./src/compiler/tokenize.js",
            "./src/compiler/parser.js",
            "./src/compiler/analyzer.js",
            "./src/compiler/optimizer.js",
            "./src/compiler/codegen.js",
            "./src/compiler/compile.js",
          ],
        },
      },
    },
  },
});
