const path = require("path");

const CWD = process.cwd();
const SRC = path.join(CWD, "src");
const SCRIPT = path.join(SRC, "script");
const DOCS = path.join(CWD, "docs");
const DIST = path.join(CWD, "dist");

module.exports = {
  CWD,
  SRC,
  SCRIPT,
  DOCS,
  DIST,
};
