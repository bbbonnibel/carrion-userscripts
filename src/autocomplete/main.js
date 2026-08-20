const mainCss = $import("./main.scss");
const PREFIX = "[Autocomplete]";

//#region Bootstrap
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
//#endregion

//#region Data
const COMMANDS = [
  {
    command: "/me",
    fulltext: "/me [text]",
    annotation: "Send emote text",
  },
];

/** @type {EmojiBank} */
const EMOJIS = $import("../data/emojis.json");
//#endregion

//#region Words
/**
 * @typedef {object} Word
 * @prop {string} segment The word itself
 * @prop {number} start The start index within the text
 * @prop {number} end The end index within the text
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
//#endregion

//#region Message input management
class MessageInputManager {
  constructor() {
    /**
     * The message input field.
     * @public
     * @type {HTMLTextAreaElement}
     */
    this.input = document.querySelector(".input-area");

    /**
     * The containing message input area.
     * @public
     * @type {HTMLDivElement}
     */
    this.inputArea = document.querySelector("#message-input");

    /**
     * The words in the input.
     * @public
     * @type {Word[]}
     */
    this.words = [];

    /**
     * The current word that contains the curser in the input.
     *
     * It's possible for there to be multiple words, but none are the current word.
     * This can happen if the user has a span of text selected, or the text cursor is in whitespace.
     *
     * @public
     * @type {Word | undefined}
     */
    this.word = undefined;
  }

  /**
   * Update this with the current state of the input.
   * @public
   */
  update() {
    this.words = getWords(this.input.value);
    this.currentWord = undefined;

    // If the selectionStart and selectionEnd match, we're in a neutral text cursor state.
    if (this.input.selectionStart === this.input.selectionEnd) {
      const cursorPosition = this.input.selectionEnd;
      for (const word of this.words) {
        if (cursorPosition <= word.start) {
          // This word is too early.
          continue;
        }
        if (cursorPosition >= word.end) {
          // This word is too late. Word not found if we're here.
          break;
        }
        if (cursorPosition >= word.start && cursorPosition <= word.end) {
          this.currentWord = word;
        }
      }
    }
  }
}

const messageInput = new MessageInputManager();
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
  const inputArea = messageInput.inputArea;
  inputArea.appendChild(autocomplete.element);
  autocomplete.list.appendChild(
    template(`<li><span>autocomplete here</span></li>`),
  );
}

function updateAutocompletePosition() {
  const input = messageInput.input;
  const inputArea = messageInput.inputArea;

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
  const input = messageInput.input;
  const observer = new ResizeObserver(() => {
    updateAutocompletePosition();
  });
  observer.observe(input);
}
//#endregion

//#region Parse command
/**
 * Parse the current command.
 */
function parseCommand() {
  // if ()
}
//#endregion

//#region Parse emoji
/**
 *
 * @param {string} original The original piece of text to modify
 * @param {string} insert The word to insert into that text
 * @param {string} span.start The start of the span of text to replace in the original.
 * @param {string} span.end The end of the span of text to replace in the original.
 */
function replaceWord(original, insert, span) {
  const before = original.slice(0, span.start);
  const after = original.slice(span.end);
  return [before, insert, after].join("");
}

/**
 * Pick an emoji from autocomplete.
 *
 * This will modify the message input by replacing the given word with the autocompleted emoji.
 *
 * @param {Word} word The word to replace
 * @param {EmojiDefinition} emojiDef The emoji picked to autocomplete that word.
 */
function pickEmoji(word, emojiDef) {
  const value = messageInput.input.value;
  const emoji = emojiDef.emoji;
  const replacement = replaceWord(value, emoji, {
    start: word.start,
    end: word.end,
  });
  messageInput.input.value = replacement;
  messageInput.setSelectionRange(word.start + emoji.length);
}

/**
 *
 * @param {EmojiDefinition} emoji The emoji to make an option for.
 */
function makeEmojiAutocompleteOption(emoji) {
  return template(`
    <li class="li-emoji">
      <span class="emoji">${emoji.emoji}</span>
      <span class="label">${emoji.default}</span>
    </li>
  `);
}

/**
 * Get emoji options that match a piece of text.
 *
 * @param {string} text The word we're looking at
 * @returns Emojis that match the text, sorted by best to worst.
 */
function getEmojiOptions(text) {
  if (text.length < 2) {
    return [];
  }
  const raw = text.replaceAll(":", "");
  const options = EMOJIS.shortcodes
    .filter((s) => s.includes(raw))
    .map((shortcode) => {
      // Lower score is better.
      let score = shortcode.length;
      if (!shortcode.startsWith(raw)) {
        score + 100;
      }
      return { shortcode, score };
    });
  return options
    .slice(0, 10)
    .toSorted((a, b) => {
      a.score - b.score;
    })
    .map((o) => {
      const rawEmoji = EMOJIS.byShortcode[o.shortcode];
      const emojiDef = EMOJIS.definitions[rawEmoji];
      return emojiDef;
    });
}

/**
 * Parse the current emoji, if any.
 */
function parseEmoji() {
  const currentWord = messageInput.currentWord;
  const isEmoji =
    currentWord &&
    currentWord.segment.startsWith(":") && // begins with emoji marker
    !currentWord.segment.startsWith("::") && // not a details marker
    !currentWord.segment.endsWith(":"); // if it's already a complete emoji, we're not intersted
  if (!isEmoji) {
    return;
  }

  const options = getEmojiOptions(currentWord.segment);
  if (options.length > 0) {
    autocomplete.show();
  }
  options.forEach((option) => {
    const li = makeEmojiAutocompleteOption(option);
    autocomplete.list.appendChild(li);
    li.addEventListener("click", () => {
      pickEmoji(currentWord, option);
    });
  });
}
//#endregion

//#region Parse message
function parseMessageInput() {
  autocomplete.clear();
  messageInput.update();

  if (messageInput.input.value.startsWith("/")) {
    parseCommand();
  }
  if (messageInput.currentWord.startsWith(":")) {
    parseEmoji();
  }
}

function watchMessageInput() {
  const input = messageInput.input;
  const options = { passive: true };
  // TODO at some point we need ESC to clear the autocomplete, just for the current word.
  input.addEventListener("blur", () => autocomplete.clear(), options);
  input.addEventListener("focus", () => parseMessageInput(), options);
  input.addEventListener("selectionchange", () => parseMessageInput(), options);
}
//#endregion

//#region Main
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
//#endregion
