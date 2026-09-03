import { build, context } from "esbuild";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const watch = process.argv.includes("--watch");

mkdirSync("dist", { recursive: true });

/** Bundle the UI (React) script and inline it into a single ui.html file.
 * Figma loads the plugin UI in a sandboxed iframe with no access to
 * external/local files, so the built JS must be inlined directly into a
 * <script> tag rather than referenced via src=. */
function writeUiHtml() {
  const js = readFileSync("dist/ui.js", "utf8");
  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { margin: 0; padding: 0; }
      body { font: 11px sans-serif; color: #1e1e1e; }
      #root { height: 100vh; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>${js}</script>
  </body>
</html>
`;
  writeFileSync("dist/ui.html", html);
}

const mainOpts = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  outfile: "dist/main.js",
  target: "es2017",
  format: "iife",
  minify: !watch,
  logLevel: "info",
};

const uiOpts = {
  entryPoints: ["src/ui.tsx"],
  bundle: true,
  outfile: "dist/ui.js",
  target: "es2017",
  format: "iife",
  jsx: "automatic",
  minify: !watch,
  define: { "process.env.NODE_ENV": watch ? '"development"' : '"production"' },
  logLevel: "info",
};

if (watch) {
  const mainCtx = await context(mainOpts);
  const uiCtx = await context({
    ...uiOpts,
    plugins: [
      {
        name: "inline-html",
        setup(b) {
          b.onEnd(() => writeUiHtml());
        },
      },
    ],
  });
  await Promise.all([mainCtx.watch(), uiCtx.watch()]);
  console.log("Watching for changes...");
} else {
  await build(mainOpts);
  await build(uiOpts);
  writeUiHtml();
}
