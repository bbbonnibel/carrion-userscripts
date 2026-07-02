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

  /** Hard reset the character bank. Wipe storage, reset to zero. */
  hardReset() {
    this.list = [];
    this.map = new Map();
    this.cache = "[]";
    GM_setValue(this.key, "[]");
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
    this.list = [];
    this.map = new Map();
    this.cache = "[]";
    GM_setValue(this.key, "[]");
  }

  /**
   * Re-save the character list based on the current map.
   */
  save() {
    this.list = [...this.map.values()];
    this.cache = JSON.stringify(this.list);
    GM_setValue(this.key, this.cache);
  }

  /**
   *
   * @param {string} id
   */
  deleteCharacter(id) {
    this.map.delete(id);
    this.save();
  }

  /**
   * Get a label by ID.
   * @param {string} id
   */
  getLabel(id) {
    return this.map.get(id);
  }

  /**
   * Get a list of labels by ID>
   * @param {string[]} ids
   */
  getLabels(ids) {
    return ids.map((id) => this.getLabel(id)).filter(Boolean);
  }
}

class NoteBank {
  // TODO
}

const characters = new CharacterBank();
const labels = new LabelBank();
const notes = new NoteBank();
//#endregion

//#region Core
/**
 * Fetch the labels for a character.
 * @param {{ id: string, name: string }} lookup The character to look up.
 * @returns {Label[]} The labels stored on the characters.
 */
function fetchCharacterLabels(lookup) {
  const { id, name } = lookup;
  const character = characters.getCharacter(lookup.id);

  // if (character.name !== lookup.name) {
  //   characters.deleteCharacter(lookup.id);
  //   return [];
  // }

  if (!character) {
    return [];
  }

  return labels.getLabels(character.labels.map((l) => l.id));
}

/**
 * Put a new label on a character.
 * @param {string} characterId
 * @param {string} labelId
 */
function putCharacterLabel(characterId, labelId) {}
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

  const labels = fetchCharacterLabels({ id: characterId, name: characterName });
}
//#endregion

function main() {
  console.log(LOG_PREFIX, "Starting");
  characters.load();
  labels.load();

  console.debug(LOG_PREFIX, "Starting with these characters and labels.", {
    characters: characters.list,
    labels: labels.list,
  });

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
}

main();
