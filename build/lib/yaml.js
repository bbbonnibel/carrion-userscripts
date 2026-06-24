const fs = require("fs-extra");
const yaml = require("yaml");

/**
 * Parse and return a yaml file.
 * @param {string} filepath The path to the Yaml file to read.
 * @returns {object} The yaml file contents.
 */
function readYamlFile(filepath) {
  if (!fs.existsSync(filepath)) {
    throw Error(`Asked to read nonexistent yaml file: ${filepath}`);
  }
  const file = fs.readFileSync(filepath, { encoding: "utf-8" });
  const y = yaml.parse(file);
  return y;
}

module.exports = {
  readYamlFile,
};
