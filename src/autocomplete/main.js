const mainCss = $import("./main.scss");
const PREFIX = "[Autocomplete]";
/** @type {EmojiBank} */
const EMOJIS = $import("../data/emojis.json");

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

installStyle(mainCss, "autocomplete", "main.css");

//#region Page
const PAGE = Object.freeze({
  /** @type {() => HTMLDivElement} */
  inputArea: () => document.querySelector(".input-area"),
  /** @type {() => HTMLInputElement} */
  messageInput: () => document.querySelector("#message-input"),
});
//#endregion

//#region Autocomplete element
class Autocomplete {
  constructor() {
    /** @type {HTMLDivElement} */
    this.element = template(`<div class="bbb-chat-autocomplete"></div>`);
    /** @type {HTMLOListElement} */
    this.list = template(`<ol></ol>`);
    this.element.appendChild(this.list);
  }

  show() {
    this.element.classList.add("open");
  }

  hide() {
    this.element.classList.remove("open");
  }
}
const autocomplete = new Autocomplete();

function insertAutocomplete() {
  const inputArea = PAGE.inputArea();
  inputArea.appendChild(autocomplete.element);
  autocomplete.list.appendChild(
    template(`<li><span>autocomplete here</span></li>`),
  );
}

function updateAutocompletePosition() {
  const input = PAGE.messageInput();
  const inputArea = PAGE.inputArea();

  const inputBB = input.getBoundingClientRect();
  const inputAreaBB = inputArea.getBoundingClientRect();

  const left = inputBB.left - inputAreaBB.left;
  const width = inputBB.width;
  const bottom = Math.abs(inputBB.top - inputAreaBB.bottom) - 1;

  autocomplete.element.setAttribute(
    "style",
    [`left: ${left}px`, `width: ${width}px`, `bottom: ${bottom}px`].join("; "),
  );
}

function watchAutocompletePosition() {
  const input = PAGE.messageInput();
  const observer = new ResizeObserver(() => {
    updateAutocompletePosition();
  });
  observer.observe(input);
}
//#endregion

function mainUi() {
  insertAutocomplete();
  updateAutocompletePosition();
  watchAutocompletePosition();
}

async function main() {
  console.debug(PREFIX, "Started");
  window.addEventListener("chat-ready", () => {
    console.debug(PREFIX, "Chat ready. Starting UI.");
    try {
      mainUi();
    } catch (ex) {
      console.error(PREFIX, "Main UI failed to load:", ex);
    }
  });
}

main();
