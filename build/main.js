const build = require("./build.js");

build.series(["monochrome-tags", "dashboard-revised"]);
