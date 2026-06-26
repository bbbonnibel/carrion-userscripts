const fs = require("fs-extra");
const userscript = require("./userscript.js");
const docs = require("./docs.js");
const dir = require("./dir.js");

async function main() {
  process.stdout.write("Building userscript package.\n");

  fs.removeSync(dir.DIST);
  process.stdout.write("Dist cleaned.\n");

  process.stdout.write("\n");
  await userscript.build();

  process.stdout.write("\n");
  await docs.build();
}

main();
