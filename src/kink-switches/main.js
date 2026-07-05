const mainCss = $import("./main.scss");
const LOG_PREFIX = "[Kink Switches]";

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

/** @typedef {"favorite" | "yes" | "maybe" | "no"} Pref */

/**
 * Create a kink switch button.
 * @param {Pref} pref
 * @returns {HTMLButtonElement}
 */
function createButton(pref) {
  const text = pref === "favorite" ? "fave" : pref;
  return template(`
    <button type="button" class="bbb-kink-button" data-pref="${pref}">
      <span>${text}</span>
    </button>
  `);
}

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
 * Put a switch down for a control.
 * @param {HTMLDivElement} control
 */
function putSwitch(control) {
  const prefs = ["favorite", "yes", "maybe", "no"];

  const dropdown = control.querySelector(".kink-select");
  dropdown.setAttribute("data-value", dropdown.value);

  const kinkSwitch = template(`
    <div class="bbb-kink-switch">
    </div>
  `);

  dropdown.insertAdjacentElement("afterend", kinkSwitch);

  for (const pref of prefs) {
    const btn = createButton(pref);
    kinkSwitch.appendChild(btn);
    btn.addEventListener("click", (event) => {
      kinkSwitch.classList.add("modified");
      const existingValue = getSelectValue(dropdown);
      if (existingValue === pref) {
        makeSelection(dropdown, undefined); // toggle off
      } else {
        makeSelection(dropdown, pref);
      }
    });
  }
}

/** @type {HTMLDivElement[]} */
const kinks = [...document.querySelectorAll(".kink-item:has(.kink-select)")];

installStyle(mainCss, "kink-switches", "main.css");

for (const kink of kinks) {
  const label = kink
    .querySelector(".kink-item-name strong")
    ?.textContent?.trim();
  const control = kink.querySelector(".kink-item-controls");

  try {
    putSwitch(control);
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
