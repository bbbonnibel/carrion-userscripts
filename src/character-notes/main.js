const mainCss = $import("./main.scss");

/**
 * @param {string} html The template element. Must be only one root element.
 */
function template(html) {
  const t = document.createElement("div");
  t.innerHTML = html;
  return t.firstElementChild;
}

/**
 * Install a style sheet into the document.
 * @param {string} css The CSS content of this style element.
 * @param {string} name The name of this style sheet, e.g. "main.css"
 * @param {string} origin The origin of this style sheet. That's this script's name.
 */
function installStyle(css, name, origin) {
  const e = document.createElement("style");
  e.setAttribute("data-origin", origin);
  e.setAttribute("data-name", name);
  e.innerText = css;
  document.head.appendChild(e);
}


function startCharacterPage() {
  const cardHeader = document.querySelector(".card-header");
  const cardBody = document.querySelector(".card-body");
  const characterId = cardBody.getAttribute("data-character-id");
  const characterName = cardHeader.querySelector("h1").textContent.trim();
  if (!characterId || !characterName) {
    throw Error("Can't start character page. Character ID or name is missing.", { characterId, characterName })
  }
}
