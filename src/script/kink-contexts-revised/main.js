const mainCss = $import("./main.scss");
const LOG_PREFIX = "[Kink Contexts Revised]";

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
//#endregion Boilerplate

//#region Element: Button

class KinkContextToggleElement extends HTMLElement {
  constructor() {
    super();

    /** @type {HTMLDivElement | undefined} */
    this.kink = undefined;
  }

  connectedCallback() {
    let parent = this.parentElement;
    while (!parent?.classList.contains("kink-item")) {
      if (parent === null || parent.nodeName === "BODY") {
        console.error(
          LOG_PREFIX,
          "Failed to isolate parent for a kink context toggle.",
        );
        this.setAttribute("data-error", "no-kink");
        return;
      }

      parent = parent.parentElement;
    }

    this.kink = parent;
    this.addEventListener("click", () => this.click());
  }

  click() {
    if (!this.kink) {
      console.error("This button has no connected kink.");
    }

    this.kink?.classList.toggle("bbb-show-contexts");
  }
}

window.customElements.define(
  "bbb-kink-context-toggle",
  KinkContextToggleElement,
);

//#endregion

installStyle(mainCss, "kink-contexts", "main.css");

function createButton() {
  return template(`
  <bbb-kink-context-toggle>
    <i class="fa-solid fa-gear"></i>
    <div class="indicator"></div>
  </bbb-kink-context-toggle>
`);
}

function main() {
  /** @type {HTMLDivElement[]} */
  const kinks = [...document.querySelectorAll(".kink-item")];

  console.debug(LOG_PREFIX, `Applying contexts to`, kinks.length, `kinks.`);

  for (const kink of kinks) {
    const button = createButton();
    const target = kink.querySelector(".kink-info-icon");
    const label = kink
      .querySelector(".kink-item-name strong")
      ?.textContent?.trim();

    try {
      target.insertAdjacentElement("afterend", button);
    } catch (ex) {
      console.error(
        LOG_PREFIX,
        `Failed to set up the context button for a kink, "${label}".`,
        {
          target,
          ex,
        },
      );
    }
  }
}

main();
