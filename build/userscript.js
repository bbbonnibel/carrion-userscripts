const path = require("node:path");
const fs = require("fs-extra");
const imports = require("./imports.js");
const dir = require("./dir.js");
const yaml = require("./lib/yaml.js");
const greasemonkey = require("./lib/greasemonkey.js");

/**
 * @typedef {Object} ProjectFile
 * @prop {string} releases The URL for userscript releases.
 * @prop {string} homepage The homepage URL.
 */
/**
 * @type {ProjectFile}
 */
const PROJECT = yaml.readYamlFile(path.join(dir.CWD, "project.yaml"));

const DIST_SCRIPT = path.join(dir.DIST, "script");

async function buildUserscript(folder) {
  process.stdout.write(`Building ${folder}\n`);

  const config = yaml.readYamlFile(path.join(dir.SRC, folder, "build.yaml"));
  const version = config.version ?? "0.0.0";
  const headerFile = config.header ?? "header.yaml";
  const mainFile = config.main ?? "main.js";
  const outname = config.outfile ?? `${folder}.user.js`;
  const outfolder = config.outfolder ?? folder;
  const outFolderPath = path.join(DIST_SCRIPT, outfolder);
  const outFilePath = path.join(outFolderPath, outname);
  const downloadUrl = new URL(`${folder}/${outname}`, PROJECT.releases).href;

  process.stdout.write(` • Version ${version}\n`);

  const headerYaml = yaml.readYamlFile(path.join(dir.SRC, folder, headerFile));
  const header = greasemonkey.compileHeader({
    ...headerYaml,
    version,
    downloadURL: downloadUrl,
    updateURL: downloadUrl,
    homepage: PROJECT.homepage,
    icon: PROJECT.icon,
    icon64: PROJECT.icon64,
  });

  const mainFilePath = path.join(dir.SRC, folder, mainFile);
  let script = fs.readFileSync(mainFilePath, {
    encoding: "utf-8",
  });
  script = await imports.resolveImports(script, mainFilePath);
  script = [header, script].join("\n\n\n");

  fs.ensureDirSync(outFolderPath);
  fs.writeFileSync(outFilePath, script);

  process.stdout.write(` ✓ Built ${folder}\n`);
}

/**
 *
 * @param {string[]} folders Folders to build.
 */
async function series(folders) {
  process.stdout.write("Building all scripts.\n");
  process.stdout.write("\n");

  for (const folder of folders) {
    await buildUserscript(folder);
    process.stdout.write("\n");
  }

  process.stdout.write(`✓✓ Built all scripts\n`);
}

/**
 * Get the list of userscript folder names inside SRC.
 *
 * This is every folder inside `src` that has a `build.yaml`.
 *
 * e.g. if `src/a` and `src/b` are userscript folders, this returns `["a", "b"]`.
 *
 * @returns {string[]} The list of folder names.
 */
function getUserscriptFolders() {
  return fs
    .readdirSync(dir.SRC)
    .map((folderName) => {
      const hasBuildYaml = fs.existsSync(
        path.join(dir.SRC, folderName, "build.yaml"),
      );
      if (!hasBuildYaml) {
        return undefined;
      }
      return folderName;
    })
    .filter(Boolean);
}

async function build() {
  const folders = getUserscriptFolders();
  await series(folders);
}

module.exports = {
  build,
};
