const mainCss = $import("./main.scss");

const LOG_PREFIX = "[Compact Character Controls]";

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

const compactControlsHost = template(`
  <div class="bbb-compact-character-controls-host"></div>
`); // boy these class names get long. good thing i only have to write them once!
compactControlsHost.appendChild(menuBtn);
compactControlsHost.appendChild(contextMenu);

const CharacterPage = Object.freeze({
  editBtn: () => document.querySelector("a.btn[href^='/edit']"),
  reportBtn: () => document.querySelector("#report-btn"),
  muteBtn: () => document.querySelector("#mute-btn"),
  blockBtn: () => document.querySelector("#block-btn"),
});

const DashboardPage = Object.freeze({
  newCharacterBtn: () => document.querySelector("a.btn[href^='/create']"),
});

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

function startYourCharacterPage() {
  const editBtn = CharacterPage.editBtn();
  if (!editBtn) {
    return;
  }

  const characterControls = editBtn.parentElement;

  /** the list of buttons to be moved. */
  const importButtons = editBtn.parentElement.querySelectorAll(
    ".btn[href^='/import']",
  );

  characterControls.appendChild(compactControlsHost);
  attachMenuEvents();
  for (const button of importButtons) {
    contextMenu.appendChild(button);
  }
}

function startOtherCharacterPage() {
  const reportBtn = CharacterPage.reportBtn();
  const muteBtn = CharacterPage.muteBtn();
  const blockBtn = CharacterPage.blockBtn();
  if (!reportBtn) {
    return;
  }
  const characterControls = reportBtn.parentElement;

  characterControls.appendChild(compactControlsHost);
  attachMenuEvents();
  console.debug(LOG_PREFIX, "Moving buttons:", {
    reportBtn,
    muteBtn,
    blockBtn,
  });
  for (const button of [muteBtn, blockBtn, reportBtn].filter(Boolean)) {
    contextMenu.appendChild(button);
  }
}

function startCharacterPage() {
  if (CharacterPage.editBtn()) {
    console.debug(LOG_PREFIX, "Starting on your character page");
    startYourCharacterPage();
  } else {
    console.debug(LOG_PREFIX, "Starting on other character page");
    startOtherCharacterPage();
  }
}

function startDashboardPage() {
  console.debug(LOG_PREFIX, "Starting on dashboard page");
  const newCharacterBtn = DashboardPage.newCharacterBtn();
  if (!newCharacterBtn) {
    // Mysteriously missing.
    return;
  }

  /** the list of buttons to be moved. */
  const importButtons = newCharacterBtn.parentElement.querySelectorAll(
    ".btn[href^='/import']",
  );

  newCharacterBtn.insertAdjacentElement("afterend", compactControlsHost);
  attachMenuEvents();
  for (const button of importButtons) {
    contextMenu.appendChild(button);
  }
}

function main() {
  const pathname = window.location.pathname;
  if (pathname.startsWith("/character")) {
    startCharacterPage();
  } else if (pathname.startsWith("/dashboard")) {
    startDashboardPage();
  }
}

main();
