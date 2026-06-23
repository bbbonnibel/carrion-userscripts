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

function readYaml(filepath) {
  if (!fs.existsSync(filepath)) {
    throw Error(`Asked to read nonexistent yaml file: ${filepath}`);
  }
  const file = fs.readFileSync(filepath, { encoding: "utf-8" });
  const y = yaml.parse(file);
  return y;
}

/**
 * @typedef {Object} CompileHeaderConfig
 * @property {string} filepath The absolute filepath of the header file.
 * @property {string} version The script's version.
 * @property {string} downloadUrl The script's download URL.
 */
/**
 *
 * @param {CompileHeaderConfig} config
 * @returns The compiled userscript header.
 */
function compileHeader(config) {
  const { filepath, version, downloadUrl } = config;
  const y = readYaml(filepath);

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

  header.push(`@version ${version}`);
  header.push(`@downloadURL ${downloadUrl}`);
  header.push(`@updateURL ${downloadUrl}`);

  header = ["==UserScript==", header, "==/UserScript=="]
    .flat()
    .map((i) => `// ${i}`.trim())
    .join("\n");

  return header;
}

module.exports = {
  compileCss,
  readYaml,
  compileHeader,
};
