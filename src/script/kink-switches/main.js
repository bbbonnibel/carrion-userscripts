const mainCss = $import("./main.scss");
const LOG_PREFIX = "[Kink Switches]";

//#region Boilerplate

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

//#endregion

//#region Types
/** @typedef {"favorite" | "yes" | "maybe" | "no"} Pref */
//#endregion

//#region Element: Kink Button
class KinkButtonElement extends HTMLElement {
  static observedAttributes = ["pref"];

  constructor() {
    super();

    /** @type {Pref} */
    this.pref = "maybe";
  }

  connectedCallback() {
    this.pref = this.getAttribute("pref");
    this.addEventListener("click", () => this.click());

    const kinkSwitch = this.parentElement;
    const dropdown = kinkSwitch.previousElementSibling;
    dropdown.setAttribute("data-value", dropdown.value);
  }

  click() {
    const kinkSwitch = this.parentElement;
    const dropdown = kinkSwitch.previousElementSibling;

    kinkSwitch.classList.add("modified");
    const existingValue = getSelectValue(dropdown);
    if (existingValue === this.pref) {
      makeSelection(dropdown, undefined); // toggle off
    } else {
      makeSelection(dropdown, this.pref);
    }
  }
}

window.customElements.define("bbb-kink-button", KinkButtonElement);
//#endregion

//#region Element: Kink switch
class KinkSwitchElement extends HTMLElement {}

window.customElements.define("bbb-kink-switch", KinkSwitchElement);
//#endregion

/**
 * Select a value from a dropdown.
 * @param {HTMLSelectElement} dropdown
 * @param {Pref | "" | undefined} pref
 */
function makeSelection(dropdown, pref) {
  if (pref) {
    const options = [...dropdown.querySelectorAll("option")];
    const index = options.findIndex((o) => o.value === pref);
    dropdown.setAttribute("data-value", pref);
    dropdown.selectedIndex = index;
  } else {
    dropdown.selectedIndex = 0;
    dropdown.removeAttribute("data-value");
  }
  const event = new Event("change", {
    target: dropdown,
    bubbles: true,
  });
  dropdown.dispatchEvent(event);
}

/**
 * Get the value of a dropdown.
 * @param {HTMLSelectElement} dropdown
 * @returns {Pref | undefined} The dropdown value.
 */
function getSelectValue(dropdown) {
  return dropdown.getAttribute("data-value") || undefined;
}

/**
 * Put a switch down next to a kink-select dropdown.
 * @param {HTMLSelectElement} control A `<select>` element with a kink-select class.
 */
function putSwitch(dropdown) {
  /** @type {HTMLSelectElement} */
  const kinkSwitch = template(`
    <bbb-kink-switch>
      <bbb-kink-button pref="favorite"><span>Fave</span></bbb-kink-button>
      <bbb-kink-button pref="yes"><span>Yes</span></bbb-kink-button>
      <bbb-kink-button pref="maybe"><span>Maybe</span></bbb-kink-button>
      <bbb-kink-button pref="no"><span>No</span></bbb-kink-button>
    </bbb-kink-switch>
  `);
  dropdown.insertAdjacentElement("afterend", kinkSwitch);
}

installStyle(mainCss, "kink-switches", "main.css");

function applyKinks() {
  /** @type {HTMLDivElement[]} */
  const kinks = [...document.querySelectorAll(".kink-item:has(.kink-select)")];

  for (const kink of kinks) {
    const label = kink
      .querySelector(".kink-item-name strong")
      ?.textContent?.trim();
    const dropdown = kink.querySelector(".kink-select");

    try {
      putSwitch(dropdown);
    } catch (ex) {
      console.error(
        LOG_PREFIX,
        `Failed to set up the switches for a kink, "${label}".`,
        {
          target: kink,
          ex,
        },
      );
    }
  }
}

function applyPartnerPrefs() {
  /** @type {HTMLDivElement[]} */
  const prefs = [
    ...document.querySelectorAll(".partner-pref-item:has(.kink-select)"),
  ];

  for (const pref of prefs) {
    const label = pref.querySelector("strong")?.textContent?.trim();
    const dropdown = pref.querySelector(".kink-select");

    try {
      putSwitch(dropdown);
    } catch (ex) {
      console.error(
        LOG_PREFIX,
        `Failed to set up the switches for a partner pref, "${label}".`,
        {
          target: pref,
          ex,
        },
      );
    }
  }
}

function main() {
  console.debug(LOG_PREFIX, `Started.`);

  try {
    applyKinks();
  } catch (ex) {
    console.error(LOG_PREFIX, "Failed to apply to kinks.", ex);
  }

  try {
    applyPartnerPrefs();
  } catch (ex) {
    console.error(LOG_PREFIX, "Failed to apply to partner prefs.", ex);
  }
}

main();
