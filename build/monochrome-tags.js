const common = require("./common");
const fs = require("fs-extra");
const path = require("path");

const src = "./src/monochrome-tags";
const dist = "./dist/monochrome-tags";
const name = "monochrome-tags.user.js";

async function build() {
  const header = common.compileHeader(src);
  const css = await common.compileCss(path.join(src, "tags.scss"));

  let script = fs.readFileSync(path.join(src, "user.js"), {
    encoding: "utf-8",
  });

  script = [header, script].join("");
  script = script.replace("{{CSS}}", css);

  fs.writeFileSync(path.join(dist, name), script);
}

module.exports = {
  build,
};
