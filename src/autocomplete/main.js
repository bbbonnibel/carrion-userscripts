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

//#region Commands
const COMMANDS = [
  {
    command: "/me",
    fulltext: "/me [text]",
    annotation: "Send emote text",
  },
];
//#endregion

//#region Page
const PAGE = Object.freeze({
  /** @type {() => HTMLDivElement} */
  inputArea: () => document.querySelector(".input-area"),
  /** @type {() => HTMLInputElement} */
  messageInput: () => document.querySelector("#message-input"),
});
//#endregion

//#region Autocomplete
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

  clear() {
    this.list.innerHTML = "";
    this.hide();
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

//#region Textarea
/**
 * @typedef {object} Word
 * @prop {string} segment The word itself
 * @prop {number} start The start index within the text
 * @prop {number} end The end index within the text
 */
/**
 * @typedef {Array<Word>} Words
 */

/**
 * Get each word in a string.
 *
 * A word is any text surrounded by word boundaries.
 *
 * @param {string} text The text to read
 * @returns Each individual word in the text
 */
function getWords(text) {
  const wordRegex = /(?<=(^|\s))(.+?)(?=($|\s))/g;
  const words = [...text.matchAll(wordRegex)].map((match) => {
    /** @type {string} */
    const segment = match[0];
    /** @type {number} */
    const start = match.index;
    const end = start + segment.length;
    return { segment, start, end };
  });
  return words;
}

/**
 * Parse the current command.
 * @param {HTMLTextAreaElement} messageInput
 * @param {Words} words
 */
function parseCommand(messageInput, words) {
  // if ()
}

/**
 *
 * @param {EmojiDefinition} emoji The emoji to make an option for.
 */
function makeEmojiAutocompleteOption(emoji) {
  return template(`
    <li class="li-emoji">
      <span class="emoji">${emoji.emoji}</span>
      <span class="label">${emoji.shortcodes[0]}</span>
    </li>
  `);
}

/**
 * Get emoji options that match a piece of text.
 *
 * @param {string} text The word we're looking at
 * @returns {Emoji[]} Emojis that match the text
 */
function getEmojiOptions(text) {
  if (text.length < 2) {
    return [];
  }
  /** @type {EmojiShortDefinition[]} */
  let options = [];
  if (text.length === 2) {
    options = EMOJIS.prefix2[text] ?? [];
  } else if (text.length >= 3) {
    options = EMOJIS.prefix3[text.slice(0, 3)] ?? [];
  }
  options = options.filter(
    (option) =>
      option.shortcode.startsWith(text) ||
      option.shortcode.replaceAll("-", "").startsWith(text),
  );
  return options.map((o) => EMOJIS.all[o.emoji]);
}

/**
 * Parse the current emoji, if any.
 * @param {HTMLTextAreaElement} messageInput
 * @param {Words} words
 */
function parseEmoji(messageInput, words) {
  if (messageInput.selectionStart !== messageInput.selectionEnd) {
    return;
  }
  const cursorPosition = messageInput.selectionEnd;
  const emojis = words
    .filter((w) => w.segment.startsWith(":")) // begins with emoji marker
    .filter((w) => !w.segment.startsWith("::")) // details marker
    .filter((w) => !w.segment.endsWith(":")); // not a complete emoji
  const currentEmoji = emojis.find(
    (w) => cursorPosition >= w.start && cursorPosition <= w.end,
  );
  if (!currentEmoji) {
    return;
  }

  const options = getEmojiOptions(currentEmoji.segment);
  if (options.length > 0) {
    autocomplete.show();
  }
  options.forEach((option) => {
    const li = makeEmojiAutocompleteOption(option);
    autocomplete.list.appendChild(li);
  });
}

function parseMessageInput() {
  autocomplete.clear();
  const messageInput = PAGE.messageInput();
  const words = getWords(messageInput.value);

  if (messageInput.value.startsWith("/")) {
    parseCommand(messageInput, words);
  }
  if (words.find((w) => w.segment.startsWith(":"))) {
    parseEmoji(messageInput, words);
  }
}

function watchMessageInput() {
  const messageInput = PAGE.messageInput();
  messageInput.addEventListener(
    "selectionchange",
    () => {
      parseMessageInput();
    },
    {
      passive: true,
    },
  );
}
//#endregion

function mainUi() {
  insertAutocomplete();
  updateAutocompletePosition();
  watchAutocompletePosition();
  watchMessageInput();
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
