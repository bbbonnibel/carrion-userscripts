const mainCss = $import("./main.scss");

const LOG_PREFIX = "[Compact Character Controls]";

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

installStyle(mainCss, "compact-character-controls", "main.css");

//#region Page
class CharacterPage {
  /** @type {HTMLLinkElement | null} The Edit button */
  static get editBtn() {
    return document.querySelector("a.btn[href^='/edit']");
  }
  /** @type {HTMLButtonElement | null} The “Overwrite from F-List” button */
  static get overwriteFromFlistBtn() {
    return document.querySelector("a.btn[href^='/import/flist/overwrite']");
  }
  /** @type {HTMLButtonElement | null} The “Import Gallery” button */
  static get importGalleryBtn() {
    return document.querySelector("a.btn[href^='/import/flist/gallery']");
  }
  /** @type {HTMLButtonElement | null} The Report button */
  static get reportBtn() {
    return document.querySelector("#report-btn");
  }
  /** @type {HTMLButtonElement | null} The Mute button */
  static get muteBtn() {
    return document.querySelector("#mute-btn");
  }
  /** @type {HTMLButtonElement | null} The Block button */
  static get blockBtn() {
    return document.querySelector("#block-btn");
  }
  /** @type {HTMLDivElement | null} The character card body */
  static get cardBody() {
    return document.querySelector("#filtered-profile-content .card-body");
  }
}

class DashboardPage {
  /** @type {HTMLAnchorElement} The “Create New Character” button */
  static get newCharacterBtn() {
    return document.querySelector(`a.btn[href="/create/"]`);
  }
  /** @type {HTMLAnchorElement} The “Import from F-List” button */
  static get importFromFlistBtn() {
    return document.querySelector(`a.btn[href="/import/flist/"]`);
  }
}
//#endregion

//#region Compact menu
const menuBtn = template(`
  <button type="button" class="btn btn-secondary bbb-compact-character-controls-btn">
  </button>
`);

const menuVellip = template(`
  <i class="fa-solid fa-ellipsis-vertical"></i>
`);

const contextMenu = template(`
  <div class="bbb-compact-character-controls-menu"></div>
`);

const compactControlsHost = template(`
  <div class="bbb-compact-character-controls-host"></div>
`);
compactControlsHost.appendChild(menuBtn);
compactControlsHost.appendChild(contextMenu);

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
//#endregion

//#region Character page (yours)
function embedYourCharacterMenu() {
  const characterControls = CharacterPage.editBtn?.parentElement;
  if (!characterControls) {
    throw Error("Couldn't embed compact character controls.");
  }
  characterControls.appendChild(compactControlsHost);
  menuBtn.appendChild(menuVellip);
}

function fillYourCharacterMenu() {
  // Create new controls in the context menu.
  const characterId = CharacterPage.cardBody.getAttribute("data-character-id");
  /** @type {HTMLAnchorElement} A new “chat as character” button */
  const chatAsCharacter = template(`
    <a target="_blank" class="btn btn-primary">
      <span>Chat as this character</span>
    </button>
  `);
  chatAsCharacter.setAttribute("href", `/chat/?character=${characterId}`);

  /** the list of buttons to be moved. */
  const menuContents = [
    chatAsCharacter,
    template(`<hr>`),
    CharacterPage.overwriteFromFlistBtn,
    CharacterPage.importGalleryBtn,
  ];

  // Move existing buttons into the context menu.
  for (const button of menuContents) {
    contextMenu.appendChild(button);
  }
}

function startYourCharacterPage() {
  embedYourCharacterMenu();
  fillYourCharacterMenu();
  attachMenuEvents();
}
//#endregion

//#region Character page (other)
function embedOtherCharacterMenu() {
  const characterControls = CharacterPage.reportBtn?.parentElement;
  if (!characterControls) {
    throw Error("Couldn't embed compact character controls.");
  }

  characterControls.appendChild(compactControlsHost);
  menuBtn.appendChild(menuVellip);
}

function fillOtherCharacterMenu() {
  const menuContents = [
    CharacterPage.reportBtn,
    CharacterPage.muteBtn,
    CharacterPage.blockBtn,
  ];
  for (const button of menuContents.filter(Boolean)) {
    contextMenu.appendChild(button);
  }
}

function startOtherCharacterPage() {
  embedOtherCharacterMenu();
  fillOtherCharacterMenu();
  attachMenuEvents();
}
//#endregion

//#region Character page (root)
function startCharacterPage() {
  if (CharacterPage.editBtn) {
    console.debug(LOG_PREFIX, "Starting on your character page");
    startYourCharacterPage();
  } else {
    console.debug(LOG_PREFIX, "Starting on other character page");
    startOtherCharacterPage();
  }
}
//#endregion

//#region Dashboard
function embedDashboardMenu() {
  const newCharacterBtn = DashboardPage.newCharacterBtn;
  if (!newCharacterBtn) {
    throw Error("Couldn't embed compact character controls.");
  }
  newCharacterBtn.insertAdjacentElement("afterend", compactControlsHost);
  menuBtn.innerHTML = "Create&hellip;";
}

function fillDashboardMenu() {
  const menuContents = [
    DashboardPage.newCharacterBtn,
    DashboardPage.importFromFlistBtn,
  ];

  for (const button of menuContents) {
    contextMenu.appendChild(button);
  }
}

function startDashboardPage() {
  console.debug(LOG_PREFIX, "Starting on dashboard page");
  embedDashboardMenu();
  fillDashboardMenu();
  attachMenuEvents();
}
//#endregion

function main() {
  const pathname = window.location.pathname;
  try {
    if (pathname.startsWith("/character")) {
      startCharacterPage();
    } else if (pathname.startsWith("/dashboard")) {
      startDashboardPage();
    }
  } catch (ex) {
    console.error(LOG_PREFIX, "Failed to embed.", ex);
  }
}

main();
