const mainCss = $import("./main.scss");
const starEmpty = $import("./star-empty.svg");
const starFilled = $import("./star-filled.svg");
const LOG_PREFIX = "[Character Pins]";

const pinClass = "bbb-pinned";
const pinBtnClass = "bbb-pin-character-button";

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

installStyle(mainCss, "pinned-characters", "main.css");

/** @typedef {HTMLDivElement} Card */

/**
 * Convert a string list to a map.
 * @param {string[]} list A list of items, e.g. `["A", "B", "C"]`
 * @returns {Map<string, true>} A map of those items, true for each one in the list: `Map[{ A: true, B: true, C: true }]`
 */
function listToMap(list) {
  const map = new Map();
  for (const item of list) {
    map.set(item, true);
  }
  return map;
}

/**
 * Get pins from the store.
 * @returns {string[]} The list of pins
 */
function getPins() {
  return GM_getValue("pins", []);
}

/**
 * Update the list of pins in the store.
 * @param {string[]} value The list of pins
 */
function setPins(value) {
  GM_setValue("pins", value);
}

/**
 * Get the character name on this card.
 * @param {Card} card The character's card
 * @returns {string} The character's name
 */
function getCharacterName(card) {
  return card.querySelector(".character-name").textContent.trim();
}

/**
 * Validate the pins so that only existing characters stay pinned.
 * If a character is pinned but no longer exists, their pin gets removed.
 * @param {Card[]} cards The current set of character cards
 */
function validatePins(cards) {
  console.debug(LOG_PREFIX, "Validating pins");
  const names = cards.map((card) => getCharacterName(card));
  const map = listToMap(names);
  const pins = getPins();
  let count = 0;
  for (const pin of pins) {
    if (!map.has(pin)) {
      // This pin references a character who no longer exists.
      removePin(pin);
      count++;
    }
  }
  console.debug(LOG_PREFIX, "Validation has removed", count, "pins");
}

/**
 * Add a character to the pin list.
 * @param {string} name The character's name
 */
function removePin(name) {
  console.debug(LOG_PREFIX, "Removing pin:", name);
  let pins = getPins();
  pins = pins.filter((na) => na !== name);
  setPins(pins);
}

/**
 * Remove a character from the pin list.
 * @param {string} name The character's name
 */
function addPin(name) {
  console.debug(LOG_PREFIX, "Adding pin:", name);
  let pins = getPins();
  if (pins.includes(name)) {
    return;
  }
  pins = [...pins, name];
  setPins(pins);
}

/**
 * Make a pin button.
 * @returns {HTMLDivElement}
 */
function makePinBtn() {
  const title_unpinned = "Click to pin to start, or right click to pin to end";
  const title_pinned = "Click to unpin";
  return template(`
    <button
      type="button"
      class="${pinBtnClass}"
      title="${title_unpinned}"
      data-title-unpinned="${title_unpinned}";
      data-title-pinned="${title_pinned}"
    >
      <div class="halo"></div>
      <div class="star when-inactive">${starEmpty}</div>
      <div class="star when-active">${starFilled}</div>
    </button>
  `);
}

/**
 * Pin a card.
 *
 * This alters HTML only, not state. You also need to call {@link addPin} or {@link removePin}.
 *
 * @param {Card} card The character card
 * @param {boolean} pin Whether to pin the card or not
 */
function setCardPin(card, pin) {
  const btn = card.querySelector(`.${pinBtnClass}`);
  if (pin) {
    card.classList.add(pinClass);
    btn.setAttribute("title", btn.getAttribute("data-title-pinned"));
  } else {
    card.classList.remove(pinClass);
    btn.setAttribute("title", btn.getAttribute("data-title-unpinned"));
  }
}

/**
 * Install a pin button in each characer card.
 * @param {Card[]} cards The dashboard's character cards
 */
function installPinButtons(cards) {
  for (const card of cards) {
    const pinBtn = makePinBtn();
    card.insertBefore(pinBtn, card.firstChild);
    const name = getCharacterName(card);

    pinBtn.addEventListener("click", () => {
      if (card.classList.contains(pinClass)) {
        setCardPin(card, false);
        removePin(name);
      } else {
        setCardPin(card, true);
        addPin(name);
      }
    });
  }
}

function main() {
  console.debug(LOG_PREFIX, "Started.");
  /** @type {Card[]} */
  const cards = [...document.querySelectorAll(".character-card")];
  validatePins(cards);
  installPinButtons(cards);

  // Init pins from store
  const pins = getPins();
  console.debug(LOG_PREFIX, "Initial pins:", pins);
  const pinMap = listToMap(pins);
  for (const card of cards) {
    const name = getCharacterName(card);
    if (pinMap.has(name)) {
      setCardPin(card, true);
    }
  }
}

main();
