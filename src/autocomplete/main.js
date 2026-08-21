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
/**
 * @typedef {object} CommandDefinition
 * @prop {string} command The command text, including slash.
 * @prop {string[]} [aliases] A possible list of aliases for the comamnd.
 * @prop {string} [fulltext] The full text of the command including parameters.
 * @prop {string} annotation A human-friendly explanation of the command.
 */

/** @type {CommandDefinition[]} */
const COMMANDS = [
  {
    command: "/invite",
    aliases: ["/link"],
    annotation: `Get the invite link for this channel`,
  },
  {
    command: "/claim",
    annotation: `Claim ownership of an orphaned channel (must be alone in room)`,
  },
  {
    command: "/reclaim",
    annotation: `Reclaim ownership using existing server affiliation (for migrating to new system)`,
  },
  {
    command: "/listmods",
    annotation: `Show moderators for this channel (requires owner or mod access)`,
  },
  {
    command: "/help",
    fulltext: `/help [optional: command]`,
    annotation: `Show available commands (/help) or help for a specific command`,
  },
  {
    command: "/purge",
    annotation: `Permanently delete this DM conversation and all its messages from your device`,
  },
  {
    command: "/broadcast",
    fulltext: `/broadcast [message]`,
    annotation: `Send a site-wide announcement to all connected users (staff only)`,
  },
  {
    command: "/mod",
    fulltext: `/mod "username"`,
    annotation: `Grant moderator status to a user (owner only)`,
  },
  {
    command: "/unmod",
    fulltext: `/unmod "username"`,
    annotation: `Remove moderator status from a user (owner only)`,
  },
  {
    command: "/transfer",
    fulltext: `/transfer "username"`,
    annotation: `Transfer channel ownership to another user (owner only)`,
  },
  {
    command: "/theme",
    fulltext: `/theme [CSS|clear]`,
    annotation: `Set channel theme CSS (owner only). Use /theme clear to remove.`,
  },
  {
    command: "/newtab",
    fulltext: `/newtab "Tab Name"`,
    aliases: ["/tab"],
    annotation: `Create a new tab. In DMs: partner must accept. In channels: owner/mod/admin only.`,
  },
  {
    command: "/nick",
    fulltext: `/nick [new name]`,
    annotation: `Change your display name in this blind chat room.`,
  },
  {
    command: "/renametab",
    fulltext: `/renametab "Old Name" "New Name"`,
    annotation: `Rename an existing tab. In channels: owner/mod/admin only.`,
  },
  {
    command: "/deletetab",
    fulltext: `/deletetab "Tab Name"`,
    annotation: `Delete a tab (cannot delete General tab). In channels: owner/mod/admin only.`,
  },
  {
    command: "/unread",
    aliases: ["/markunread"],
    annotation: `Mark the current room as unread. Useful for coming back to a conversation later.`,
  },
  {
    command: "/unanswered",
    aliases: ["/markunanswered"],
    annotation: `Toggle the "unanswered" shade on DMs where the other person sent the last message.`,
  },
  {
    command: "/refer",
    annotation: `Show your referral link. Share it to earn Recruiter badges when people sign up.`,
  },
  {
    command: "/modmute",
    fulltext: `/modmute "name" [duration: 5m|2h|1d|3d|30d|perm] [reason] [optional: --account]`,
    mod: true,
    annotation: `Site-wide mute that blocks public chat. Append Mod-tier only.`,
  },
  {
    command: "/modban",
    fulltext: `/modban "name" [duration: 5m|2h|1d|3d|30d|perm] [reason] [optional: --account]`,
    mod: true,
    annotation: `Site-wide read-only timeout. Mod-tier only.`,
  },
  {
    command: "/modwarn",
    fulltext: `/modwarn "name" [reason]`,
    mod: true,
    annotation: `Issue a warning to a user. Visible to them; no enforcement. Mod-tier only.`,
  },
  {
    command: "/moddel",
    fulltext: `/moddel [message_id] [reason]`,
    mod: true,
    annotation: `Delete a single message from the current channel by ID. Mod-tier only.`,
  },
];

/** @type {EmojiBank} */
const EMOJIS = $import("../data/emojis.json");
//#endregion

//#region Words and text
/**
 * @typedef {object} Word
 * @prop {number} index The word's index. 0 is the first word, 1 the second, etc.
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
  const words = [...text.matchAll(wordRegex)].map((match, index) => {
    /** @type {string} */
    const segment = match[0];
    /** @type {number} */
    const start = match.index;
    const end = start + segment.length;
    return { index, segment, start, end };
  });
  return words;
}

/**
 * @typedef {object} Span A range between two numbers.
 * @prop {number} start
 * @prop {number} end
 */

/**
 *
 * @param {string} original The original piece of text to modify
 * @param {string} insert The word to insert into that text
 * @param {(Word | Span)} span The span of text to replace in the original. You can pass in a Word here.
 */
function replaceWord(original, insert, span) {
  const before = original.slice(0, span.start);
  const after = original.slice(span.end);
  return [before, insert, after].join("");
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

/**
 * Replace a word in the entered message, then put the cursor at the end of that word.
 *
 * @param {Word} word The word to replace
 * @param {string} replacement The replacement word to impose.
 */
function replaceWordInMessage(word, replacement) {
  const original = messageInput.input.value;
  const newValue = replaceWord(original, replacement, word);
  messageInput.input.value = newValue;
  messageInput.setSelectionRange(word.start + replacement.length);
}
//#endregion

//#region Autocomplete
class Autocomplete {
  constructor() {
    /**
     * The autocomplete element itself.
     * @type {HTMLDivElement}
     */
    this.element = template(`<div class="bbb-chat-autocomplete"></div>`);
    /**
     * The list of autocomplete options.
     * @type {HTMLOListElement}
     */
    this.list = template(`<ol class="options"></ol>`);
    /**
     * The a container for housing the current established command.
     * @type {HTMLDivElement}
     */
    this.currentCommand = template(
      `<div class="current-command-container"></div>`,
    );
    this.element.appendChild(this.list);
    this.element.appendChild(this.currentCommand);
  }

  show() {
    this.element.classList.add("open");
  }

  hide() {
    this.element.classList.remove("open");
  }

  clear() {
    this.list.innerHTML = "";
    this.currentCommand.innerHTML = "";
    this.hide();
  }
}
const autocomplete = new Autocomplete();

function insertAutocomplete() {
  const inputArea = messageInput.inputArea;
  inputArea.appendChild(autocomplete.element);
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
 * Parse the filled command that has already been locked in at the start of this message.
 */
function parseFilledCommand() {
  const firstWord = messageInput.words[0];
  if (firstWord.start > 0 || !firstWord.segment.startsWith("/")) {
    // Not a command.
    return;
  }
  const command = COMMANDS.find((c) => c.command === firstWord);
  if (!command) {
    return;
  }
  const displayText = command.fulltext ?? command.command;
  const element = template(`<div class="current-command">${displayText}</div>`);
  autocomplete.currentCommand.appendChild(element);
}

/**
 * Pick a command to autocomplete the first word.
 * @param {CommandDefinition} command The command to autocomplete.
 */
function pickCommand(command) {
  const word = messageInput.words[0];
  // Add a space in the replacement so we don't keep offering autocomplete.
  replaceWordInMessage(word, command.command + " ");
}

/**
 * Make an autocomplete option for a command.
 *
 * @param {CommandDefinition} command The command to make an option for.
 */
function makeCommandAutocompleteOption(command) {
  return template(`
    <li class="li-command">
      <span class="figure">${command.command}</span>
      <span class="label">${command.annotation}</span>
    </li>
  `);
}

/**
 * Provide autocomplete options for the current command we're entering.
 */
function autocompleteCommand() {
  const word = messageInput.words[0];
  const options =
    word.segment === "/"
      ? COMMANDS
      : COMMANDS.filter((c) => {
          if (c.command.startsWith(word.segment)) {
            return true;
          }
          if (c.aliases) {
            if (c.aliases.find((a) => a.startsWith(word.segment))) {
              return true;
            }
          }
          return false;
        });

  options.forEach((option) => {
    const li = makeCommandAutocompleteOption(option);
    autocomplete.list.appendChild(li);
    li.addEventListener("click", () => {
      pickCommand(word, option);
    });
  });
}

/**
 * Parse the current command.
 */
function parseCommand() {
  if (messageInput.currentWord?.index > 0) {
    // If the first word matches a command, that command is locked in.
    parseFilledCommand();
  }

  if (messageInput.currentWord?.index === 0) {
    // Autocomplete the command.
    autocompleteCommand();
  }
}
//#endregion

//#region Parse emoji
/**
 * Pick an emoji from autocomplete.
 *
 * This will modify the message input by replacing the given word with the autocompleted emoji.
 *
 * @param {Word} word The word to replace
 * @param {EmojiDefinition} emojiDef The emoji picked to autocomplete that word.
 */
function pickEmoji(word, emojiDef) {
  replaceWordInMessage(word, emojiDef.emoji);
}

/**
 * Make an autocomplete option for an emoji.
 *
 * @param {EmojiDefinition} emoji The emoji to make an option for.
 */
function makeEmojiAutocompleteOption(emoji) {
  return template(`
    <li class="li-emoji">
      <span class="figure">${emoji.emoji}</span>
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
  if (messageInput.currentWord?.startsWith(":")) {
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

// TODO
// Keyboard controls — up/down/tab/(enter?)
// Escape to close for the current command
