const path = require("path");

const CWD = process.cwd();
const SRC = path.join(CWD, "src");
const DIST = path.join(CWD, "dist");

module.exports = {
  CWD,
  SRC,
  DIST,
};
