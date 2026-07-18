const LOG_PREFIX = "[Character Border]";

/** @type {Map<Carrion.Color, string>} */
const colors = new Map([
  ["red", "#ff4444"],
  ["orange", "#ff8800"],
  ["yellow", "#ffcc00"],
  ["green", "#44ff44"],
  ["blue", "#4488ff"],
  ["purple", "#bd6eff"],
  ["pink", "#ff44aa"],
  ["brown", "#c48364"],
  ["teal", "#29daf9"],
  ["white", "#ffffff"],
  ["black", "#000000"],
  ["gray", "#858585"],
  ["dull_red", "#cc6161"],
  ["dull_orange", "#c27338"],
  ["dull_yellow", "#b3872d"],
  ["dull_green", "#608f3d"],
  ["dull_blue", "#6286c0"],
  ["dull_purple", "#9576ad"],
  ["dull_pink", "#bb689a"],
  ["dull_brown", "#967f6e"],
  ["dull_teal", "#589193"],
]);

/**
 * Get the character name out of the URL.
 * We could get it from the page and re-encode it, but this already proves to work with carrion's servers.
 */
function getCharacterUrlName() {
  const pathname = window.location.pathname;
  const parts = pathname.split("/");
  return parts.filter(Boolean).at(1);
}

/**
 * Check if this character even exists.
 *
 * Measurement: The character 404 has no card-header.
 */
function doesCharacterExist() {
  return Boolean(document.querySelector(".card-header"));
}

/**
 * Get the character's API entry.
 */
async function getCharacterApi() {
  const name = getCharacterUrlName();
  const response = await fetch(`/api/v1/characters/${name}/`);
  /** @type {Carrion.Api.V1.Character} */
  const json = await response.json();
  return json;
}

/**
 * Amend an element's style attribute with styles.
 *
 * @param {HTMLElement} element The element to modify.
 * @param {string[]} styles A list of style rules to apply.
 */
function amendStyles(element, styles) {
  const existingStyle = element.getAttribute("style");
  const style = [existingStyle, ...styles].filter(Boolean).join("; ");
  element.setAttribute("style", style);
}

async function main() {
  const card = document.querySelector("#main-content .card");

  if (!card || !doesCharacterExist()) {
    return;
  }

  try {
    amendStyles(card, ["border-top-width: 4px"]);
    const character = await getCharacterApi();
    const color = character.name_color;
    const hex = colors.get(color);
    if (hex) {
      amendStyles(card, [
        `border-top-color: ${hex}`,
        `transition: border-top 0.5s`,
      ]);
    }
    console.log(LOG_PREFIX, "Color resolved:", color);
  } catch (ex) {
    console.log(LOG_PREFIX, "Color failed:", ex);
  }
}

main();
