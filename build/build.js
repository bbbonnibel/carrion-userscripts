const path = require("node:path");
const fs = require("fs-extra");
const common = require("./common.js");
const imports = require("./imports.js");

const CWD = process.cwd();
const SRC = path.join(CWD, "src");
const DIST = path.join(CWD, "dist");
const DIST_SCRIPT = path.join(DIST, "script");
/**
 * @typedef {Object} ProjectFile
 * @prop {string} releases The URL for userscript releases.
 */
/**
 * @type {ProjectFile}
 */
const PROJECT = common.readYaml(path.join(CWD, "project.yaml"));

async function build(folder) {
  process.stdout.write(`Building ${folder}...\n`);

  const config = common.readYaml(path.join(SRC, folder, "build.yaml"));
  const version = config.version ?? "0.0.0";
  const headerFile = config.header ?? "header.yaml";
  const mainFile = config.main ?? "main.js";
  const outname = config.out;
  const outFolder = path.join(DIST_SCRIPT, folder);
  const outFile = path.join(outFolder, outname);
  const downloadUrl = path.join(PROJECT.releases, folder, outname);

  process.stdout.write(`Building version ${version}\n`);

  const header = common.compileHeader({
    filepath: path.join(SRC, folder, headerFile),
    version,
    downloadUrl,
  });

  const mainFilePath = path.join(SRC, folder, mainFile);
  let script = fs.readFileSync(mainFilePath, {
    encoding: "utf-8",
  });
  script = await imports.resolveImports(script, mainFilePath);
  script = [header, script].join("\n\n\n");

  fs.ensureDirSync(outFolder);
  fs.writeFileSync(outFile, script);

  process.stdout.write(` ✓ Built ${folder}\n`);
}

/**
 *
 * @param {string[]} folders Folders to build.
 */
async function series(folders) {
  for (const folder of folders) {
    await build(folder);
  }

  process.stdout.write(`✓✓ Built all scripts\n`);
}

module.exports = {
  build,
  series,
};
