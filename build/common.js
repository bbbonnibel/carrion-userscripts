const sass = require("sass");
const autoprefixer = require("autoprefixer");
const postcss = require("postcss");
const prettier = require("@prettier/sync");
const yaml = require("yaml");
const path = require("path");
const fs = require("fs-extra");

async function compileCss(sourcePath) {
  let { css } = sass.compile(sourcePath, {
    style: "expanded",
    loadPaths: ["node_modules"],
  });
  const prefixed = await postcss([autoprefixer]).process(css, {
    from: "./.browserslistrc",
  });
  prefixed.warnings().forEach((warn) => {
    console.warn("CSS warning:", warn.toString());
  });
  css = prefixed.css;
  css = prettier.format(css, { parser: "css" });
  return css;
}

function compileHeader(folder) {
  const filepath = path.join(folder, "header.yaml");
  const file = fs.readFileSync(filepath, { encoding: "utf-8" });
  const y = yaml.parse(file);

  let header = [];

  for (const [key, value] of Object.entries(y)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        header.push(`@${key} ${item}`);
      }
    } else {
      header.push(`@${key} ${value}`);
    }
  }

  header = ["==UserScript==", header, "==/UserScript=="]
    .flat()
    .map((i) => `// ${i}`.trim())
    .join("\n");

  header += "\n\n\n";

  return header;
}

module.exports = {
  compileCss,
  compileHeader,
};
