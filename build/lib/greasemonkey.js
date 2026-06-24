const yaml = require("./yaml.js");

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
  const y = yaml.readYamlFile(filepath);

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
  compileHeader,
};
