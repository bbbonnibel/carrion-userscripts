const path = require("path");

const CWD = process.cwd();
const SRC = path.join(CWD, "src");
const DOCS = path.join(CWD, "docs");
const DIST = path.join(CWD, "dist");

module.exports = {
  CWD,
  SRC,
  DOCS,
  DIST,
};
