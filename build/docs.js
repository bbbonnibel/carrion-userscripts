const path = require("path");
const fs = require("fs-extra");
const showdown = require("showdown");
const dir = require("./dir.js");
const css = require("./lib/css.js");
const { JSDOM } = require("jsdom");

/**
 * Load README.md parsed as a HTML document.
 */
function loadReadme() {
  const README = fs.readFileSync(path.join(dir.CWD, "README.md"), {
    encoding: "utf-8",
  });
  if (!README) {
    throw Error("README is empty");
  }
  const converter = new showdown.Converter();
  converter.setOption("headerIds", false);
  converter.setFlavor("github");
  const readme = converter.makeHtml(README);
  return readme;
}

/**
 * Build the docs HTML file.
 */
function buildHtml() {
  const readme = loadReadme();

  const indexRaw = fs.readFileSync(path.join(dir.DOCS, "index.html"), {
    encoding: "utf-8",
  });
  const dom = new JSDOM(indexRaw);
  const body = dom.window.document.body;
  const main = body.querySelector("main");
  main.innerHTML = readme;
  body.querySelectorAll("h1, h2, h3").forEach((heading) => {
    const text =
      heading.textContent?.trim().toLowerCase() ??
      // heading.querySelector("a")?.innerText?.trim().toLowerCase() ??
      "";
    const id = text
      .replaceAll("'", "")
      .replaceAll(/[^a-z]/g, "-")
      .replaceAll(/-{2,}/g, "-");
    heading.setAttribute("id", id);
    const hashlink = dom.window.document.createElement("a");
    hashlink.classList.add("hashlink");
    hashlink.href = `#${id}`;
    hashlink.textContent = "＃";
    heading.prepend(hashlink);
  });

  fs.writeFileSync(path.join(dir.DIST, "index.html"), dom.serialize(), {
    encoding: "utf-8",
  });
}

async function buildStyles() {
  const style = await css.compileSassFile(
    path.join(dir.DOCS, "styles/main.scss"),
    { allowNodeModules: true },
  );
  fs.writeFileSync(path.join(dir.DIST, "styles/main.css"), style, {
    encoding: "utf-8",
  });
  fs.removeSync(path.join(dir.DIST, "styles/main.scss"));
}

async function build() {
  process.stdout.write(`Building docs...\n`);

  fs.ensureDirSync(dir.DIST);
  fs.copySync(path.join(dir.CWD, "docs"), dir.DIST);
  fs.ensureDirSync(path.join(dir.DIST, "styles"));
  fs.emptyDirSync(path.join(dir.DIST, "styles"));

  buildHtml();
  await buildStyles();

  process.stdout.write(` ✓ Built docs\n`);
}

module.exports = {
  build,
};
