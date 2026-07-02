const mainCss = $import("./main.scss");

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

installStyle(mainCss, "compact-character-controls", "main.css");

const menuBtn = template(`
  <button type="button" class="btn btn-secondary bbb-compact-character-controls-btn">
    <i class="fa-solid fa-ellipsis-vertical"></i>
  </button>
`);

const contextMenu = template(`
  <div class="bbb-compact-character-controls-menu"></div>
`);

const contextMenuHost = template(`
  <div class="bbb-compact-character-controls-menu-host"></div>
`); // boy these class names get long. good thing i only have to write them once!
contextMenuHost.appendChild(contextMenu);

function attachMenuEvents() {
  const openClass = "open";

  menuBtn.addEventListener("click", () => {
    contextMenu.classList.toggle(openClass);
  });

  contextMenu.addEventListener("click", () => {
    contextMenu.classList.remove(openClass);
  });

  document.body.addEventListener("click", (event) => {
    const { target } = event;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    if (target === menuBtn) {
      // Clicking the menu button. Ignore.
      return;
    }
    if (target === contextMenu || contextMenu.contains(target)) {
      // Clicking the context menu or inside it. Ignore.
      return;
    }
    contextMenu.classList.remove(openClass);
  });
}

/**
 * Install the menu controls in a container.
 *
 * @param {HTMLElement} container The element that will contain the menu controls.
 */
function installMenu(container) {}

function startCharacterPage() {
  const editBtn = document.querySelector("a.btn[href^='/edit']");
  if (!editBtn) {
    // Not our character.
    return;
  }

  /** the container of the controls like the edit button. */
  const characterControls = editBtn.parentElement;
  characterControls.classList.add("bbb-character-controls");

  /** the list of buttons to be moved. */
  const importButtons = editBtn.parentElement.querySelectorAll(
    ".btn[href^='/import']",
  );

  characterControls.appendChild(menuBtn);
  menuBtn.insertAdjacentElement("afterend", contextMenuHost);
  attachMenuEvents();
  for (const button of importButtons) {
    contextMenu.appendChild(button);
    button.classList.remove("btn", "btn-secondary");
  }
}

function startDashboardPage() {
  const newCharacterBtn = document.querySelector("a.btn[href^='/create']");
  if (!newCharacterBtn) {
    // Mysteriously missing.
    return;
  }

  /** the list of buttons to be moved. */
  const importButtons = newCharacterBtn.parentElement.querySelectorAll(
    ".btn[href^='/import']",
  );

  newCharacterBtn.insertAdjacentElement("afterend", menuBtn);
  menuBtn.insertAdjacentElement("afterend", contextMenuHost);
  attachMenuEvents();
  for (const button of importButtons) {
    contextMenu.appendChild(button);
    button.classList.remove("btn", "btn-secondary");
  }
}

function main() {
  const LOG_PREFIX = "[Compact Character Controls]";
  const pathname = window.location.pathname;
  if (pathname.startsWith("/character")) {
    console.debug(LOG_PREFIX, "Starting on character page");
    startCharacterPage();
  }
  if (pathname.startsWith("/dashboard")) {
    console.debug(LOG_PREFIX, "Starting on dashboard page");
    startDashboardPage();
  }
}

main();
