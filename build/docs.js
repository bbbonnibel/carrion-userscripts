const path = require("path");
const fs = require("fs-extra");
const showdown = require("showdown");
const dir = require("./dir.js");
const css = require("./lib/css.js");

async function build() {
  process.stdout.write(`Building docs...\n`);

  fs.ensureDirSync(dir.DIST);
  fs.copySync(path.join(dir.CWD, "docs"), dir.DIST);
  fs.ensureDirSync(path.join(dir.DIST, "styles"));
  fs.emptyDirSync(path.join(dir.DIST, "styles"));

  // Build index.html
  const README = fs.readFileSync(path.join(dir.CWD, "README.md"), {
    encoding: "utf-8",
  });
  if (!README) {
    throw Error("README is empty");
  }
  const converter = new showdown.Converter();
  converter.setOption("headerIds", false);
  converter.setFlavor("github");
  let index = fs.readFileSync(path.join(dir.DOCS, "index.html"), {
    encoding: "utf-8",
  });
  if (!index.includes("{{README}}")) {
    throw Error("Index has no “{{README}}” marker");
  }
  index = index.replace("{{README}}", converter.makeHtml(README));
  fs.writeFileSync(path.join(dir.DIST, "index.html"), index, {
    encoding: "utf-8",
  });

  // Build styles
  const style = await css.compileSassFile(
    path.join(dir.DOCS, "styles/main.scss"),
    { allowNodeModules: true },
  );
  fs.writeFileSync(path.join(dir.DIST, "styles/main.css"), style, {
    encoding: "utf-8",
  });
  fs.removeSync(path.join(dir.DIST, "styles/main.scss"));

  process.stdout.write(` ✓ Built docs\n`);
}

module.exports = {
  build,
};
