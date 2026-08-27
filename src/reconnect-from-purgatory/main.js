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

const reconnect = template(`
  <div class="bbb-reconnect-from-purgatory">
    <a href="/chat/?character=">Reconnect as <span class="name"></span></a>
  </div>
`);

function getActiveCharacter() {
  /**
   * @type {HTMLOptionElement}
   * @example <option value="1265" data-name="Bonnibel" data-avatar="(url)">
   */
  const option = document.querySelector("#site-character-selector :checked");
  const characterId = option?.value || undefined;
  const characterName = option?.getAttribute("data-name") ?? undefined;
  return { characterId, characterName };
}

function updateReconnect() {
  const { characterId, characterName } = getActiveCharacter();

  if (characterId && characterName) {
    reconnect.classList.remove("hide");
    reconnect
      .querySelector("a")
      .setAttribute("href", `/chat/?character=${characterId}`);
    reconnect.querySelector(".name").innerText = characterName;
  } else {
    reconnect.classList.add("hide");
  }
}

function main() {
  console.debug(LOG_PREFIX, "Started");

  const purgatory = document.getElementById("chat-purgatory");
  const content = purgatory.querySelector(".purgatory-content");
  content.appendChild(reconnect);

  const selector = document.getElementById("site-character-selector");
  const observer = new MutationObserver(() => updateReconnect());
  observer.watch(selector, {
    childList: true,
    subtree: true,
    attributes: true,
  });
  updateReconnect();
}

main();

// TODO activeCharacter doesn't seem to be getting set (except to Anonymous) at this stage.
