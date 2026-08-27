const mainCss = $import("./main.scss");
const LOG_PREFIX = "[Reconnect from Purgatory]";

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
 * @param {string} origin The origin of this style sheet. That's this script's name.
 * @param {string} filename The name of this style sheet, e.g. "main.css"
 */
function installStyle(css, origin, filename) {
  const e = document.createElement("style");
  e.setAttribute("data-origin", origin);
  e.setAttribute("data-filename", filename);
  e.innerText = css;
  document.head.appendChild(e);
}

installStyle(mainCss, "reconnect-from-purgatory", "main.css");

function main() {
  console.debug(LOG_PREFIX, "Started");

  const purgatory = document.getElementById("chat-purgatory");
  const selector = document.getElementById("site-character-selector");

  /**
   * @type {HTMLOptionElement}
   * @example <option value="1265" data-name="Bonnibel" data-avatar="(url)">
   */
  const activeCharacter = selector.querySelector(":checked");

  if (!activeCharacter) {
    return;
  }

  const characterId = activeCharacter.value;
  const characterName = activeCharacter.getAttribute("data-name");

  const content = purgatory.querySelector(".purgatory-content");

  const reconnect = template(`
    <div style="text-align: center; margin: 20px 0;">
      <a href="/chat/?character=${characterId}">Reconnect as <span class="name"></span></a>
    </div>
  `);
  reconnect.querySelector(".name").innerText = characterName;
  content.appendChild(reconnect);
}

main();

// TODO activeCharacter doesn't seem to be getting set (except to Anonymous) at this stage.
