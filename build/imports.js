const path = require("node:path");
const fs = require("fs-extra");
const common = require("./common.js");

/**
 * Escape a string so that it can be injected into the script JS.
 * @param {string} content The file content string to escape.
 */
function escapeFileContent(content) {
  return "`" + content.replaceAll("`", "\\`") + "`";
}

/**
 * Resolve the contents of a specific import reference.
 * @param {string} filepath
 */
async function resolveImport(filepath) {
  console.log("Resolving import:", path.relative(process.cwd(), filepath));
  try {
    let content = "";
    if (filepath.endsWith(".scss")) {
      console.log("Resolving as a SCSS file");
      content = await common.compileCss(filepath);
    } else {
      console.log("Resolving as plaintext");
      content = fs.readFileSync(filepath, {
        encoding: "utf-8",
      });
    }
    return escapeFileContent(content);
  } catch (ex) {
    console.error("Failed to resolve file", filepath, "for reason:", ex);
    throw ex;
  }
}

/**
 * Resolve all `$import()` calls within the script.
 * @param {string} script The script file's contents.
 * @param {string} scriptFilePath The script's path.
 * @returns A version of the script with imports resolved.
 */
async function resolveImports(script, scriptFilePath) {
  const importRx = /\$import\(("(.+)"|'(.+)')\)/;
  let iter = 0;

  if (typeof script === "undefined") {
    throw Error("Can't resolve imports: script was undefined");
  }
  if (!scriptFilePath) {
    throw Error("Can't resolve imports: scriptFilePath was empty or undefined");
  }
  if (!script) {
    process.stderr.write(
      `Skipping imports, script was empty: ${path.relative(process.cwd(), scriptFilePath)}\n`,
    );
    return;
  }

  do {
    const match = importRx.exec(script);
    if (!match) {
      break;
    }
    const importStatement = match.at(0);
    const relativePath = match.at(2);
    const filepath = path.join(scriptFilePath, "..", relativePath);
    if (!fs.existsSync(filepath)) {
      throw Error(
        `Can't resolve import, file doesn't exist: "${scriptFilePath}" tried to import "${filepath}"`,
      );
    }

    const contents = await resolveImport(filepath);

    script = script.replaceAll(importStatement, contents);
  } while (iter++ < 1_000_000);

  return script;
}

module.exports = {
  resolveImports,
};
