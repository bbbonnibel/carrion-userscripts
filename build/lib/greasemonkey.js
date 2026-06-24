/**
 *
 * @param {object} contents
 * @returns The compiled userscript header.
 */
function compileHeader(contents) {
  let header = [];

  for (const [key, value] of Object.entries(contents)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        header.push(`@${key} ${item}`);
      }
    } else {
      header.push(`@${key} ${value}`);
    }
  }


  header = ["==UserScript==", header, "==/UserScript=="]
    .flat()
    .map((i) => `// ${i}`.trim())
    .join("\n");

  return header;
}

module.exports = {
  compileHeader,
};
