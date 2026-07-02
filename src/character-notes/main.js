const mainCss = $import("./main.scss");
const LOG_PREFIX = "[Character Notes]";

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
  e.setAttribute("data-filename", name);
  e.innerText = css;
  document.head.appendChild(e);
}

installStyle(mainCss, "character-notes", "main.css");

//#region Utilities
/**
 * Filter an array down to only unique entries.
 *
 * @example array.filter(filterUnique);
 */
function filterUnique(value, index, array) {
  return array.indexOf(value) === index;
}
//#endregion

/**
 * @typedef {object} Character
 * @prop {string} id Character id
 * @prop {string} name Character name
 * @prop {({ id: string })[]} labels The labels applied to this character
 */

/**
 * @typedef {object} Label
 * @prop {string} id The label ID
 * @prop {string} icon The label icon
 * @prop {string} color The label color
 * @prop {string} text The label text
 */

/**
 * @typedef {object} lookup
 * @prop {string} id
 * @prop {string} name
 */

//#region Storage
class CharacterBank {
  constructor() {
    /**
     * The list of characters.
     * @type {Character[]}
     */
    this.list = [];
    /**
     * A map of characters by their ID.
     * @type {Map<string, Character>}
     */
    this.map = new Map();
    /**
     * A cache of the character store as we last saw it.
     * @type {string}
     */
    this.cache = "";
  }

  /**
   * The character bank storage key.
   * @readonly
   */
  get key() {
    return "characters";
  }

  load() {
    const json = GM_getValue(this.key);
    if (json === this.cache) {
      return;
    }
    /** @type {Characters[]} */
    let characters = [];
    try {
      characters = JSON.parse(json);
    } catch (ex) {
      console.error(LOG_PREFIX, "Character bank corrupt, doing a hard reset.");
      this.hardReset();
      return;
    }
    this.cache = json;
    this.characters = characters;
    this.map = new Map();
    for (const character of characters) {
      this.map.set(character.id, character);
    }
  }

  /**
   * Re-save the character bank based on the current map.
   */
  save() {
    this.list = [...this.map.values()];
    this.cache = JSON.stringify(this.list);
    GM_setValue(this.key, this.cache);
  }

  /**
   * Hard reset the character bank. Wipe storage, reset to zero.
   */
  hardReset() {
    this.map = new Map();
    this.save();
  }

  /**
   * Delete a character from the bank.
   *
   * @param {string} id The character ID
   */
  deleteCharacter(id) {
    this.map.delete(id);
    this.save();
  }

  /**
   * Does a character with this ID exist in our records?
   *
   * @param {string} id The character ID
   * @returns Whether the character exists
   */
  exists(id) {
    return this.map.has(id);
  }

  /**
   * Validate a character record.
   *
   * This deletes the record if the character's name no longer matches, and does nothing otherwise.
   * This exists to preserve carrion's privacy philosophy of name changes signalling a new unrelated character.
   *
   * @param {string} id The character's ID
   * @param {string} name The character's current name.
   */
  validate(id, name) {
    const character = this.getCharacter(id);
    if (!character) {
      return;
    }
    if (character.name === name) {
      return;
    }
    this.deleteCharacter(id);
  }

  /**
   * Create a character record.
   * If a character already exists with this ID, this does nothing.
   *
   * @param {string} id The character ID.
   * @param {string} name The character's current name.
   */
  createCharacter(id, name) {
    if (this.map.has(id)) {
      return;
    }
    this.map.set(id, { id, name, labels: [] });
    this.save();
  }

  /**
   * Ensure a character exists with this ID and name.
   *
   * This validates current records and creates the character if it doesn't exist.
   *
   * @param {string} id The character ID
   * @param {string} name The character's name
   */
  ensureCharacter(id, name) {
    this.validate(id, name);
    if (!this.exists(id)) {
      this.createCharacter(id, name);
    }
  }

  /**
   * Does this character have this label applied?
   *
   * @param {string} characterId The character ID
   * @param {string} labelId The label ID
   * @returns {boolean} True if the character has that label applied, false otherwise.
   */
  hasLabel(characterId, labelId) {
    const character = this.getCharacter(characterId);
    if (!character) {
      return false;
    }
    return Boolean(character.labels.find((l) => l.id === labelId));
  }

  /**
   * Add a label to a character's record.
   * If the character doesn't exist, this does nothing.
   * If the character already has this label, this does nothing.
   *
   * @param {string} characterId The character ID
   * @param {string} labelId The label ID
   */
  addLabel(characterId, labelId) {
    const character = this.getCharacter(characterId);
    if (!character) {
      return;
    }
    if (!this.hasLabel(characterId, labelId)) {
      character.labels.push({ id: labelId });
    }
    this.save();
  }

  /**
   * Remove a label from a character.
   * If the character doesn't exist, this does nothing.
   * If the character didn't have this label, this does nothing.
   *
   * @param {string} characterId The character ID
   * @param {string} labelId The label ID
   * @returns
   */
  removeLabel(characterId, labelId) {
    const character = this.getCharacter(characterId);
    if (!character) {
      return;
    }
    character.labels = character.labels.filter((l) => l.id !== labelId);
    this.save();
  }

  getCharacter(id) {
    return this.map.get(id);
  }
}

class LabelBank {
  constructor() {
    /**
     * The list of labels.
     * @type {Label[]}
     */
    this.list = [];
    /**
     * A map of labels by their ID.
     * @type {Map<string, Label>}
     */
    this.map = new Map();
    /**
     * A cache of the label store as we last saw it.
     * @type {string}
     */
    this.cache = "[]";
  }

  /**
   * The label bank storage key.
   * @readonly
   */
  get key() {
    return "labels";
  }

  load() {
    const json = GM_getValue(this.key);
    if (json === this.cache) {
      return;
    }
    /** @type {Label[]} */
    let labels = [];
    try {
      labels = JSON.parse(json);
    } catch (ex) {
      console.error(LOG_PREFIX, "Label bank corrupt, doing a hard reset.");
      this.hardReset();
      return;
    }
    this.cache = json;
    this.list = labels;
    this.map = new Map();
    for (const label of labels) {
      this.map.set(label.id, label);
    }
  }

  /** Hard reset the label bank. Wipe storage, reset to zero. */
  hardReset() {
    this.map = new Map();
    this.save();
  }

  /**
   * Re-save the label list based on the current map.
   */
  save() {
    this.list = [...this.map.values()];
    this.cache = JSON.stringify(this.list);
    GM_setValue(this.key, this.cache);
  }

  /**
   * Delete a label from the bank.
   *
   * @param {string} id
   */
  deleteLabel(id) {
    this.map.delete(id);
    this.save();
  }

  /**
   * Create a new label.
   *
   * @param {{ icon: string, color: string, text: string }} config Config for the new label.
   * @returns The created label, including its newly assigned ID.
   */
  createLabel(config) {
    const id = crypto.randomUUID();
    /** @type {Label} */
    const label = {
      id,
      icon: config.icon,
      color: config.color,
      text: config.text,
    };
    this.map.set(id, label);
    this.save();
    return label;
  }

  /**
   * Get a label by ID.
   *
   * @param {string} id
   */
  getLabel(id) {
    return this.map.get(id);
  }

  /**
   * Get a list of labels by their IDs.
   *
   * @param {string[]} ids
   */
  getLabels(ids) {
    return ids.map((id) => this.getLabel(id)).filter(Boolean);
  }
}

class NoteBank {
  // TODO
}

const characterBank = new CharacterBank();
const labelBank = new LabelBank();
const noteBank = new NoteBank();
//#endregion

//#region Core
/**
 * Fetch the labels for a character.
 * @param {{ id: string, name: string }} character The character to look up.
 * @returns {Label[]} The labels stored on the characters.
 */
function fetchCharacterLabels(lookup) {
  characterBank.validate(lookup.id, lookup.name);
  const character = characterBank.getCharacter(lookup.id);
  if (!character) {
    return [];
  }

  return labelBank.getLabels(character.labels.map((l) => l.id));
}

/**
 * Put a new label on a character.
 * @param {{ id: string, name: string }} character The character to put a label on. If they don't already exist, the name is used to create or update them.
 * @param {string} labelId
 */
function putCharacterLabel(character, labelId) {
  characterBank.ensureCharacter(character.id, character.name);

  characterBank.addLabel(character.id, labelId);
}
//#endregion

//#region Chat
function startChatPage() {}
//#endregion

//#region Dashboard
function startDashboardPage() {}
//#endregion

//#region Search
function startSearchPage() {}
//#endregion

//#region Character
function startCharacterPage() {
  const cardHeader = document.querySelector(".card-header");
  const cardBody = document.querySelector(".card-body");
  const characterId = cardBody.getAttribute("data-character-id");
  const characterName = cardHeader.querySelector("h1").textContent.trim();
  if (!characterId || !characterName) {
    throw Error("Can't start character page. Character ID or name is missing.", {
      characterId,
      characterName,
    });
  }

  // debug setup
  characterBank.hardReset();
  labelBank.hardReset();
  characterBank.ensureCharacter(characterId, characterName);
  const label = labelBank.createLabel({ icon: "❤️", color: "red", text: "cool" });
  putCharacterLabel({ id: characterId, name: characterName }, label.id);
  // end debug setup

  const labels = fetchCharacterLabels({ id: characterId, name: characterName });
  console.log(LOG_PREFIX, `Character ${characterId}/${characterName} has these labels:`, labels);
}
//#endregion

function main() {
  console.log(LOG_PREFIX, "Starting");
  characterBank.load();
  labelBank.load();

  const pathname = window.location.pathname;
  if (pathname.startsWith("/character")) {
    startCharacterPage();
  } else if (pathname.startsWith("/chat")) {
    startChatPage();
  } else if (pathname.startsWith("/dashboard")) {
    startDashboardPage();
  } else if (pathname.startsWith("/search")) {
    startSearchPage();
  } else {
    console.warn(LOG_PREFIX, "Couldn't recognise which page to start.");
  }

  console.debug(LOG_PREFIX, "Starting with these characters and labels.", {
    characters: characterBank.list,
    labels: labelBank.list,
  });
}

main();
