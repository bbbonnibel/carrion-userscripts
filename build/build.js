const libraries = [["monochromeTags", require("./parcels/monochrome-tags")]];

async function build() {
  console.log("Building all");

  for (const [name, builder] of libraries) {
    process.stdout.write(`Building ${name}`);
    await builder.build();
    process.stdout.write(" ✓\n");
  }
}

build();
