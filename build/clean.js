const fs = require("fs-extra");
const dir = require("./lib/dir.js");

fs.removeSync(dir.DIST);
process.stdout.write("Dist cleaned.\n");
