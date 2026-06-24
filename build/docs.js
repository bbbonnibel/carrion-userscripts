const path = require("path");
const fs = require("fs-extra");
const dir = require("./dir.js");
const css = require("./lib/css.js");

async function build() {
  process.stdout.write(`Building docs...\n`);

  fs.ensureDirSync(dir.DIST);
  fs.ensureDirSync(path.join(dir.DIST, "styles"));

  const static = [
    "index.html",
  ]
  for (const filepath of static) {
    fs.copyFileSync(path.join(dir.DOCS, filepath), path.join(dir.DIST, filepath));
  }

  const style = await css.compileSassFile(path.join(dir.DOCS, "styles/main.scss"), { allowNodeModules: true });
  fs.writeFileSync(path.join(dir.DIST, "styles/main.css"), style, { encoding: "utf-8" });

  process.stdout.write(` ✓ Built docs\n`);
}

module.exports = {
  build,
}
