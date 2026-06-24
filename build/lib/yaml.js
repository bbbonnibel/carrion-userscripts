const fs = require("fs-extra");
const yaml = require("yaml");

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
