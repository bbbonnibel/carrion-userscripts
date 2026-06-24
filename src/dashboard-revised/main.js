const mainCss = $import("./styles/main.scss");

/**
 * @param {string} html The template element. Must be only one root element.
 */
function template(html) {
  const t = document.createElement("div");
  t.innerHTML = html;
  return t.firstElementChild;
}

/**
 * @param {string} css The CSS content of this style element.
 * @param {string} name The name of this style sheet.
 */
function style(css, name) {
  const e = document.createElement("style");
  e.setAttribute("data-origin", "dashboard-revised");
  e.setAttribute("data-name", name);
  e.innerText = css;
  return e;
}

/**
 * Repeat a string N times.
 *
 * @example
 * repeat(3, "hi") // "hihihi";
 *
 * @param {number} num The number of times to repeat the string.
 * @param {string} string The string.
 * @returns The string repeated N times.
 */
function repeatStr(num, string) {
  return new Array(num).fill(string).join("");
}

const PAGE = (() => {
  /** @type {HTMLDivElement} */
  const mainContent = document.querySelector("#main-content");
  /** @type {HTMLDivElement} */
  const mainContainer = document.querySelector("#main-content > .container");
  /** @type {HTMLDivElement} */
  const characterGrid = document.querySelector(".character-grid");
  /** @type {HTMLDivElement} */
  const dashboardHeader = document.querySelector(".dashboard-header");
  /** @type {HTMLDivElement} */
  const sortControls = document.querySelector("div:has(> #sort-select)");
  /** @type {HTMLDivElement} */
  const dashboardControls = sortControls.parentElement;
  /** @type {HTMLDivElement} */
  const notificationCenter = document.querySelector("#notification-center");

  return {
    mainContent,
    mainContainer,
    characterGrid,
    dashboardHeader,
    dashboardControls,
    sortControls,
    notificationCenter,
  };
})();

function setViewAsCompact() {
  PAGE.characterGrid.classList.add("drv-as-compact");
  viewAsCompact.classList.remove("drv-inactive");
  viewAsStandard.classList.add("drv-inactive");
  GM_setValue("view", "compact");
}

function setViewAsStandard() {
  PAGE.characterGrid.classList.remove("drv-as-compact");
  viewAsStandard.classList.remove("drv-inactive");
  viewAsCompact.classList.add("drv-inactive");
  GM_setValue("view", "standard");
}

/** @type {HTMLDivElement} */
const viewControls = template(`
<div class="drv-view-controls">
  <button type="button" class="drv-button drv-view-compact">
    <span class="drv-icon drv-icon-view-compact">
      ${repeatStr(9, "<span></span>")}
    </span>
  </button>
  <button type="button" class="drv-button drv-view-standard">
    <span class="drv-icon drv-icon-view-standard">
      ${repeatStr(4, "<span></span>")}
    </span>
  </button>
</div>
`);

/** @type {HTMLDivElement} */
const viewAsCompact = viewControls.querySelector(".drv-view-compact");
/** @type {HTMLDivElement} */
const viewAsStandard = viewControls.querySelector(".drv-view-standard");

viewAsCompact.addEventListener("click", setViewAsCompact);
viewAsStandard.addEventListener("click", setViewAsStandard);

function createNotifControls() {
  // if (!PAGE.notificationCenter) {
  //   return;
  // }
  const notificationHeader = PAGE.notificationCenter.querySelector(
    ".notification-header",
  );

  /** @type {HTMLButtonElement} */
  const notifControl = template(`
    <button type="button" class="drv-button drv-notifs-only">
      Focus
    </button>
  `);

  notifControl.addEventListener("click", () => {
    if (notifControl.classList.contains("drv-on")) {
      notifControl.classList.remove("drv-on");
      notifControl.classList.remove("drv-inactive");
      PAGE.characterGrid.classList.remove("drv-notifs-only");
    } else {
      notifControl.classList.add("drv-on");
      notifControl.classList.add("drv-inactive");
      PAGE.characterGrid.classList.add("drv-notifs-only");
    }
  });

  notificationHeader.appendChild(notifControl);
}

function createCompactChatButtons() {
  /** @type {HTMLAnchorElement[]} */
  const chatButtons = [
    ...document.querySelectorAll(
      `.character-card .btn-primary[href^="/chat/"]`,
    ),
  ];
  for (const chatButton of chatButtons) {
    const clone = chatButton.cloneNode();
    chatButton.classList.add("drv-when-not-in-compact");
    clone.classList.add("drv-when-in-compact");
    clone.innerText = "Chat";
    chatButton.insertAdjacentElement("afterend", clone);
  }
}

function main() {
  document.head.appendChild(style(mainCss, "main.scss"));
  PAGE.sortControls.insertAdjacentElement("afterend", viewControls);
  createNotifControls();
  createCompactChatButtons();

  switch (GM_getValue("view")) {
    case "standard":
      setViewAsStandard();
      break;
    case "compact":
      setViewAsCompact();
      break;
    default:
      setViewAsStandard();
      break;
  }
}

console.log("Dashboard Revised is running");
if (!PAGE.characterGrid) {
  console.log("...except there isn't a character grid, so we're backing out.");
  return;
}
main();
