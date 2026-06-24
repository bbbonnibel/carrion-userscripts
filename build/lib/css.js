const sass = require("sass");
const path = require("path");
const autoprefixer = require("autoprefixer");
const postcss = require("postcss");
const prettier = require("@prettier/sync");

/**
 * @typedef {Object} CompileSassConfig
 * @prop {boolean} [allowNodeModules] Allow node_modules in the load paths.
 */

/**
 * Compile a Sass (or SCSS) file.
 *
 * The resulting file will be prettified and have no source map.
 *
 * @param {string} sourcePath The path to the root SASS/SCSS file to compile.
 * @param {CompileSassConfig} config Compile config
 * @returns Compiled CSS.
 */
async function compileSassFile(sourcePath, config = {}) {
  /** @type {sass.Options<"sync">} */
  const sassOptions = {
    style: "expanded",
  };
  if (config.allowNodeModules) {
    sassOptions.loadPaths = [path.join(process.cwd(), "node_modules")];
  }

  let { css } = sass.compile(sourcePath, sassOptions);
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

module.exports = {
  compileSassFile,
};
