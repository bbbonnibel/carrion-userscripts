const mainCss = $import("./main.scss");
const PREFIX = "[Autocomplete]";
const DEBUG = false;

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

//#region Levenshtein distance
/**
 * Calculate the levenshtein distance between two words.
 * @param {string} a
 * @param {string} b
 * @returns {number} The levenshtein distance between `a` and `b`.
 */
const levenshtein = (function () {
  function _min(d0, d1, d2, bx, ay) {
    return d0 < d1 || d2 < d1
      ? d0 > d2
        ? d2 + 1
        : d0 + 1
      : bx === ay
        ? d1
        : d1 + 1;
  }

  return function (a, b) {
    if (a === b) {
      return 0;
    }

    if (a.length > b.length) {
      var tmp = a;
      a = b;
      b = tmp;
    }

    var la = a.length;
    var lb = b.length;

    while (la > 0 && a.charCodeAt(la - 1) === b.charCodeAt(lb - 1)) {
      la--;
      lb--;
    }

    var offset = 0;

    while (offset < la && a.charCodeAt(offset) === b.charCodeAt(offset)) {
      offset++;
    }

    la -= offset;
    lb -= offset;

    if (la === 0 || lb < 3) {
      return lb;
    }

    var x = 0;
    var y;
    var d0;
    var d1;
    var d2;
    var d3;
    var dd;
    var dy;
    var ay;
    var bx0;
    var bx1;
    var bx2;
    var bx3;

    var vector = [];

    for (y = 0; y < la; y++) {
      vector.push(y + 1);
      vector.push(a.charCodeAt(offset + y));
    }

    var len = vector.length - 1;

    for (; x < lb - 3; ) {
      bx0 = b.charCodeAt(offset + (d0 = x));
      bx1 = b.charCodeAt(offset + (d1 = x + 1));
      bx2 = b.charCodeAt(offset + (d2 = x + 2));
      bx3 = b.charCodeAt(offset + (d3 = x + 3));
      dd = x += 4;
      for (y = 0; y < len; y += 2) {
        dy = vector[y];
        ay = vector[y + 1];
        d0 = _min(dy, d0, d1, bx0, ay);
        d1 = _min(d0, d1, d2, bx1, ay);
        d2 = _min(d1, d2, d3, bx2, ay);
        dd = _min(d2, d3, dd, bx3, ay);
        vector[y] = dd;
        d3 = d2;
        d2 = d1;
        d1 = d0;
        d0 = dy;
      }
    }

    for (; x < lb; ) {
      bx0 = b.charCodeAt(offset + (d0 = x));
      dd = ++x;
      for (y = 0; y < len; y += 2) {
        dy = vector[y];
        vector[y] = dd = _min(dy, d0, dd, bx0, vector[y + 1]);
        d0 = dy;
      }
    }

    return dd;
  };
})();
//#endregion

//#region Utilities
/**
 * Convert a class `string` to a class selector `.string`
 */
const cls = (str) => `.${str}`;

/**
 * Feed this to an `Array.filter` call to filter the array down to only unique elements.
 *
 * @example
 * ["a", "b", "c", "b"].filter(filterUnique) // ["a", "b", "c"]
 */
function filterUnique(value, index, array) {
  return array.indexOf(value) === index;
}

/**
 * Sort strings alphabetically.
 *
 * @example
 * [].sort(sortAlphabetic)
 *
 * @param {string} a The first string
 * @param {string} b The second string
 */
function sortAlphabetic(a, b) {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}
//#endregion

//#region Data
/**
 * @typedef {object} CommandDefinition
 * @prop {string} command The command text, including slash.
 * @prop {string[]} [aliases] A possible list of aliases for the comamnd.
 * @prop {string} [fulltext] The full text of the command including parameters.
 * @prop {string} annotation A human-friendly explanation of the command.
 * @prop {boolean} staff Is this a staff-only command?
 * @prop {boolean} ignore Should this command be ignored universally?
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
    ignore: true,
  },
  {
    command: "/listmods",
    annotation: `Show moderators for this channel (owner/mod only)`,
  },
  {
    command: "/help",
    fulltext: `/help [optional: command]`,
    annotation: `Show available commands (/help) or help for a specific command`,
  },
  {
    command: "/purge",
    annotation: `Permanently delete this DM and all its messages`,
    ignore: true,
  },
  {
    command: "/broadcast",
    fulltext: `/broadcast [message]`,
    annotation: `Send a site-wide announcement to all connected users (staff only)`,
    staff: true,
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
    command: "/kick",
    fulltext: "/kick [username]",
    annotation: "Remove user from channel (owner/mod only)",
  },
  {
    command: "/ban",
    fulltext: "/ban [username]",
    annotation: "Permanently ban user (owner/mod only)",
  },
  {
    command: "/unban",
    fulltext: "/unban [username]",
    annotation: "Remove a ban (owner/mod only)",
  },
  {
    command: "/mute",
    fulltext: "/mute [username]",
    annotation: "Prevent user from chatting (owner/mod only)",
  },
  {
    command: "/unmute",
    fulltext: "/unmute [username]",
    annotation: "Allow user to chat again (owner/mod only)",
  },
  {
    command: "/topic",
    fulltext: "/topic [new topic]",
    annotation: "Set channel topic (owner only)",
  },
  {
    command: "/theme",
    fulltext: `/theme [CSS|clear]`,
    annotation: `Set channel theme CSS. Use /theme clear to remove. (owner only)`,
  },
  {
    command: "/newtab",
    fulltext: `/newtab "Tab Name"`,
    aliases: ["/tab"],
    annotation: `Create a new tab. (DM only, or owner/mod only)`,
  },
  {
    command: "/nick",
    fulltext: `/nick [new name]`,
    annotation: `Change your display name in this blind chat room.`,
    ignore: true,
  },
  {
    command: "/renametab",
    fulltext: `/renametab "Old Name" "New Name"`,
    annotation: `Rename an existing tab. (DM only, or owner/mod only)`,
  },
  {
    command: "/deletetab",
    fulltext: `/deletetab "Tab Name"`,
    annotation: `Delete a tab. (DM only, or owner/mod only)`,
  },
  {
    command: "/unread",
    // aliases: ["/markunread"],
    annotation: `Mark the current room as unread.`,
  },
  {
    command: "/unanswered",
    aliases: ["/markunanswered"],
    annotation: `Toggle the "unanswered" shade on DMs where the other person sent the last message.`,
    ignore: true,
  },
  {
    command: "/refer",
    annotation: `Show your referral link. Share it to earn Recruiter badges when people sign up.`,
  },
  {
    command: "/modmute",
    fulltext: `/modmute "name" [duration: 5m|2h|1d|3d|30d|perm] [reason] [optional: --account]`,
    annotation: `Site-wide mute that blocks public chat. (mod only)`,
    staff: true,
  },
  {
    command: "/modban",
    fulltext: `/modban "name" [duration: 5m|2h|1d|3d|30d|perm] [reason] [optional: --account]`,
    annotation: `Site-wide read-only timeout. (mod only)`,
    staff: true,
  },
  {
    command: "/modwarn",
    fulltext: `/modwarn "name" [reason]`,
    annotation: `Issue a warning to a user. Visible to them; no enforcement. (mod only)`,
    staff: true,
  },
  {
    command: "/moddel",
    fulltext: `/moddel [message_id] [reason]`,
    annotation: `Delete a single message from the current channel by ID. (mod only)`,
    staff: true,
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
   * The message input field.
   * @public
   * @type {HTMLTextAreaElement}
   */
  get input() {
    return document.querySelector("#message-input");
  }

  /**
   * The containing message input area.
   * @public
   * @type {HTMLDivElement}
   */
  get inputArea() {
    return document.querySelector(".input-area");
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
        if (cursorPosition >= word.start && cursorPosition <= word.end) {
          this.currentWord = word;
          break;
        }
        if (word.start >= cursorPosition) {
          // We've enumerated all the words and passed the cursor. It must be in whitespace.
          break;
        }
      }
    }

    if (DEBUG) {
      console.debug(PREFIX, "messageInput update:", {
        words: this.words,
        currentWord: this.currentWord,
      });
    }
  }
}

const messageInput = new MessageInputManager();

/**
 * Replace a word in the entered message, then put the cursor at the end of that word.
 *
 * @param {Word} word The word to replace
 * @param {string} replacement The replacement word to impose.
 * @param {string} length The length of the replacement word. For emojis, overwrite this with `1`.
 */
function replaceWordInMessage(word, replacement) {
  const original = messageInput.input.value;
  const newValue = replaceWord(original, replacement, word);
  messageInput.input.value = newValue;
  messageInput.input.focus();
  const selectionPosition = word.start + replacement.length;
  messageInput.input.setSelectionRange(selectionPosition, selectionPosition);
}
//#endregion

//#region Autocomplete
const HAS_KEYBOARD_FOCUS = "has-keyboard-focus";
const HAS_KEYBOARD_FOCUS_SELECTOR = cls(HAS_KEYBOARD_FOCUS);

class Autocomplete {
  constructor() {
    /**
     * The autocomplete element itself.
     * @type {HTMLDivElement}
     */
    this.element = template(
      `<div id="bbb-chat-autocomplete" class="bbb-chat-autocomplete" tabindex="0"></div>`,
    );
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

  /**
   * Is autocomplete open?
   */
  get isOpen() {
    return this.element.classList.contains("open");
  }

  /**
   * Does autocomplete have options listed?
   */
  get hasOptions() {
    return this.list.innerHTML !== "";
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

  /**
   * Move keyboard focus up through the options.
   */
  keyboardFocusUp() {
    // Since this is an inverted list, up is the next sibling.
    const hasFocus = this.list.querySelector(HAS_KEYBOARD_FOCUS_SELECTOR);
    /** @type {HTMLLIElement | null} */
    const next = hasFocus.nextElementSibling;
    if (next) {
      hasFocus.classList.remove(HAS_KEYBOARD_FOCUS);
      next.classList.add(HAS_KEYBOARD_FOCUS);
      next.scrollIntoView({
        behavior: "instant",
        block: "nearest",
        container: "nearest",
      });
    }
  }

  /**
   * Move keyboard focus down through the options.
   */
  keyboardFocusDown() {
    // Since this is an inverted list, down is the previous sibling.
    const hasFocus = this.list.querySelector(HAS_KEYBOARD_FOCUS_SELECTOR);
    /** @type {HTMLLIElement | null} */
    const next = hasFocus.previousElementSibling;
    if (next) {
      hasFocus.classList.remove(HAS_KEYBOARD_FOCUS);
      next.classList.add(HAS_KEYBOARD_FOCUS);
      next.scrollIntoView({
        behavior: "instant",
        block: "nearest",
        container: "nearest",
      });
    }
  }

  /**
   * Pick the current option that has keyboard focus.
   */
  pickFocusedOption() {
    const hasFocus = this.list.querySelector(HAS_KEYBOARD_FOCUS_SELECTOR);
    if (hasFocus) {
      const button = hasFocus.querySelector("button");
      button.click();
    }
  }

  /**
   *
   * @param {HTMLLIElement[]} options
   */
  setOptions(options) {
    autocomplete.list.innerHTML = "";
    if (options.length === 0) {
      return;
    }
    autocomplete.show();
    autocomplete.list.append(...options);
    autocomplete.list.scrollTo({
      top: autocomplete.list.scrollHeight,
      behavior: "instant",
    });
    options.at(0).classList.add(HAS_KEYBOARD_FOCUS);
  }
}
const autocomplete = new Autocomplete();

/**
 * Insert the autocomplete element onto the page.
 */
function insertAutocomplete() {
  const inputArea = messageInput.inputArea;
  inputArea.appendChild(autocomplete.element);
}

/**
 * Reposition and resize the autocomplete element.
 */
function updateAutocompletePosition() {
  const input = messageInput.input;
  const inputArea = messageInput.inputArea;

  const inputBB = input.getBoundingClientRect();
  const inputAreaBB = inputArea.getBoundingClientRect();

  const inset = 40;
  const bottom = Math.abs(inputBB.top - inputAreaBB.bottom) + 4;

  autocomplete.element.setAttribute(
    "style",
    [`left: ${inset}px`, `right: ${inset}px`, `bottom: ${bottom}px`].join("; "),
  );
}

/**
 * Return the text for the tab symbol associated with autocomplete via keyboard.
 * @returns {string}
 */
function makeAutocompleteTab() {
  return `
    <div class="autocomplete-tab / if-keyboard-focus">
      <span class="tab-icon">⭾ Tab</span>
    </div>
  `;
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
 * @param {Word} word The word to replace
 * @param {string} command The command word to autocomplete.
 */
function pickCommand(word, command) {
  // Add a space in the replacement so we don't keep offering autocomplete.
  replaceWordInMessage(word, `${command} `);
  autocomplete.clear();
}

/**
 * Make an autocomplete option for a command.
 *
 * @param {CommandDefinition} command The command to make an option for.
 */
function makeCommandAutocompleteOption(command) {
  return template(`
    <li class="li-command">
      <button type="button" class="option option-command">
        <span class="figure">${command.command}</span>
        <span class="label">${command.annotation}</span>
        ${makeAutocompleteTab()}
      </button>
    </li>
  `);
}

/**
 * Get the commands that can autocomplete for a word.
 *
 * @param {Word} word The word to autocomplete commands for
 * @returns {CommandDefinition[]} Available commands for autocomplete
 */
function getCommandOptions(word) {
  const ignore = ["/", "/m", "/me"];
  if (ignore.includes(word.segment)) {
    return [];
  }

  const availableCommands = COMMANDS.filter((c) => !c.ignore && !c.staff).sort(
    (a, b) => sortAlphabetic(a.command, b.command),
  );

  if (word.segment === "/?") {
    return availableCommands;
  }

  return availableCommands.filter((c) => {
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
}

/**
 * Provide autocomplete options for the current command we're entering.
 */
function autocompleteCommand() {
  const word = messageInput.words[0];

  let options = getCommandOptions(word);

  const elements = options.map((option) => {
    const li = makeCommandAutocompleteOption(option);
    li.addEventListener("click", () => {
      pickCommand(word, option.command);
    });
    return li;
  });
  autocomplete.setOptions(elements);
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
  replaceWordInMessage(word, `${emojiDef.emoji} `);
  autocomplete.clear();
}

/**
 * Make an autocomplete option for an emoji.
 *
 * @param {EmojiDefinition & { score: number, primary: string }} emoji The emoji to make an option for.
 */
function makeEmojiAutocompleteOption(emoji) {
  return template(`
    <li class="li-emoji" data-score="${emoji.score}">
      <button type="button" class="option option-emoji">
        <span class="figure">${emoji.emoji}</span>
        <span class="label">${emoji.shortcodes[0]}</span>
        ${makeAutocompleteTab()}
      </button>
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
  const matchingShortcodes = EMOJIS.shortcodes
    .filter((s) => s.includes(raw))
    .sort((a, b) => a.length - b.length);
  const matchingEmojis = matchingShortcodes
    .map((shortcode) => EMOJIS.byShortcode[shortcode])
    .filter(filterUnique)
    .map((rawEmoji) => EMOJIS.definitions[rawEmoji]);

  return matchingEmojis;
}

/**
 * Parse the current emoji, if any.
 */
function parseEmoji() {
  const word = messageInput.currentWord;
  if (!word) {
    return;
  }

  const isEmoji = word.segment.match(/^:[^:]+/); // begins with emoji marker
  if (!isEmoji) {
    return;
  }

  const options = getEmojiOptions(word.segment);
  const elements = options.map((option) => {
    const li = makeEmojiAutocompleteOption(option);
    li.addEventListener("click", () => {
      pickEmoji(word, option);
    });
    return li;
  });
  autocomplete.setOptions(elements);
}
//#endregion

//#region Mentions
/**
 * Pick an emoji from autocomplete.
 *
 * This will modify the message input by replacing the given word with the autocompleted emoji.
 *
 * @param {Word} word The word to replace
 * @param {string} user The user picked to autocomplete that word
 */
function pickUser(word, user) {
  replaceWordInMessage(word, `@[${user}] `);
  autocomplete.clear();
}

/**
 * Generate a unique two-color gradient from a username.
 * Uses a simple hash to derive two hue values for a consistent,
 * personalized placeholder avatar.
 *
 * @see "message-renderer.js" This function was stolen directly from carrion's code.
 *
 * @param {string} username - The username to hash
 * @returns {string} CSS gradient string
 */
function generateUsernameGradient(username) {
  if (!username) {
    return "linear-gradient(135deg, #3a3a4a 0%, #2a2a3a 100%)";
  }

  // Simple hash function (djb2-like)
  let hash1 = 5381;
  let hash2 = 52711;
  for (let i = 0; i < username.length; i++) {
    const char = username.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) ^ char;
    hash2 = ((hash2 << 5) + hash2) ^ char;
  }

  // Convert to positive values and get hue (0-360)
  const hue1 = Math.abs(hash1) % 360;
  const hue2 = Math.abs(hash2) % 360;

  // Use HSL for nice colors - moderate saturation, darker for visibility on dark bg
  const color1 = `hsl(${hue1}, 45%, 35%)`;
  const color2 = `hsl(${hue2}, 45%, 25%)`;

  return `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
}

/**
 * Make an autocomplete option for a username.
 *
 * @param {string} username The username (or character name) to make an option for.
 */
function makeUsernameAutocompleteOption(username) {
  const avatarUrl = unsafeWindow.drakensberg.getAvatar(username) ?? "";
  const gradient = generateUsernameGradient(username);
  return template(`
    <li class="li-username">
      <button type="button" class="option option-username">
        <span class="figure" style="background: ${gradient};">
          <img class="avatar" data-found="${Boolean(avatarUrl)}" src="${avatarUrl}">
        </span>
        <span class="label">${username}</span>
        ${makeAutocompleteTab()}
      </button>
    </li>
  `);
}

function parseMention() {
  const word = messageInput.currentWord;
  if (word.segment.length < 2) {
    return;
  }
  if (word.segment.endsWith("]")) {
    return;
  }

  /** The normalized mention being entered. */
  let mention = word.segment.slice(1).toLowerCase();
  if (mention.startsWith("[")) {
    mention = mention.slice(1);
  }

  /** @type {string[]} The list of names the user has bookmarked. */
  const bookmarks = unsafeWindow.socialManager
    .getBookmarks()
    .map((b) => b.name);
  /** @type {string[]} The list of names of people online. */
  const onlineUsers = unsafeWindow.drakensberg.getOnlineUsers();

  /** The set of users available for autocomplete. */
  const users = [...bookmarks, ...onlineUsers]
    .filter(filterUnique)
    .map((name) => {
      return {
        name,
        normalized: name.toLowerCase().replaceAll(" ", ""),
      };
    });

  const near = [];
  const far = [];
  for (const user of users) {
    if (!user.normalized.includes(mention)) {
      continue;
    }
    if (user.normalized.length - mention.length <= 8) {
      near.push(user.name);
    } else {
      far.push(user.name);
    }
  }

  const options = [
    ...near
      .map((name) => {
        return {
          name,
          distance: levenshtein(mention, name.toLowerCase()),
        };
      })
      .toSorted((a, b) => {
        const difference = a.distance - b.distance;
        if (difference !== 0) {
          return difference;
        }
        return sortAlphabetic(a.name.toLowerCase(), b.name.toLowerCase());
      })
      .map((record) => record.name),
    ...far.toSorted(sortAlphabetic),
  ];

  const elements = options.map((option) => {
    const li = makeUsernameAutocompleteOption(option);
    autocomplete.list.appendChild(li);
    li.addEventListener("click", () => {
      pickUser(word, option);
    });
    return li;
  });
  autocomplete.setOptions(elements);
}
//#endregion

//#region Message input handling
function parseMessageInput() {
  autocomplete.clear();
  messageInput.update();

  if (messageInput.input.value.startsWith("/")) {
    parseCommand();
  }
  if (messageInput.currentWord?.segment.startsWith(":")) {
    parseEmoji();
  }
  if (messageInput.currentWord?.segment.startsWith("@")) {
    parseMention();
  }
}

function bindPassiveEvents() {
  const input = messageInput.input;
  const options = { passive: true };
  // TODO at some point we need ESC to clear the autocomplete, just for the current word.
  input.addEventListener(
    "blur",
    (event) => {
      if (
        event.relatedTarget === autocomplete.element ||
        autocomplete.element.contains(event.relatedTarget)
      ) {
        return;
      }
      autocomplete.clear();
    },
    options,
  );
  autocomplete.element.addEventListener("focus", () => input.focus(), options);
  input.addEventListener("focus", () => parseMessageInput(), options);
  input.addEventListener("selectionchange", () => parseMessageInput(), options);
}

function bindKeyboardManagementEvents() {
  const input = messageInput.input;

  input.addEventListener("keydown", (event) => {
    if (!autocomplete.isOpen) {
      return;
    }

    if (event.altKey || event.ctrlKey || event.shiftKey || event.metaKey) {
      return;
    }

    if (autocomplete.hasOptions) {
      // These events only get handled when we have options to move through.
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          autocomplete.keyboardFocusDown();
          break;
        case "ArrowUp":
          event.preventDefault();
          autocomplete.keyboardFocusUp();
          break;
        case "Tab":
          event.preventDefault();
          autocomplete.pickFocusedOption();
          break;
      }

      switch (event.key) {
        case "Escape":
          event.preventDefault();
          autocomplete.hide();
          break;
      }
    }
  });
}
//#endregion

//#region Main
function mainUi() {
  insertAutocomplete();
  updateAutocompletePosition();
  watchAutocompletePosition();
  bindPassiveEvents();
  bindKeyboardManagementEvents();
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
