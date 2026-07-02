const path = require("path");
const fs = require("fs-extra");
const dir = require("./dir.js");

const TEMPLATE = path.join(dir.CWD, "build/template");

function getDatestamp(date) {
  const year = today.getFullYear();
  const month = today.getMonth().toString().padStart(2, "0");
  const day = today.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createUserscript(name) {
  const outFolder = path.join(dir.SRC, name);

  console.log(`Creating "${name}" ...`);

  if (fs.pathExistsSync(outFolder)) {
    console.error(
      "✖ A script already exists at this location. Aborting create.\n",
    );
    return;
  }

  const datestamp = getDatestamp(new Date());

  fs.ensureDirSync(outFolder);
  const files = fs.readdirSync(TEMPLATE);
  for (const filename of files) {
    let content = fs.readFileSync(path.join(TEMPLATE, filename), {
      encoding: "utf-8",
    });

    content = content.replaceAll("$SCRIPTNAME", name);
    content = content.replaceAll("$DATESTAMP", name);

    fs.writeFileSync(path.join(outFolder, filename), content, {
      encoding: "utf-8",
    });
    console.log(`✓ Deposited ${filename}`);
  }

  console.log(`Created src/${name}`);
}

function main() {
  const name = process.argv[2];
  createUserscript(name);
}

main();
