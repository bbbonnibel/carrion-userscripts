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

/** @type {HTMLDivElement} */
const viewControls = template(`
<div class="drv-view-controls">
  <button type="button" class="drv-button drv-view-compact">
    <span class="drv-icon-view-compact">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </span>
  </button>
  <button type="button" class="drv-button drv-view-standard">
    <span class="drv-icon-view-standard">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </span>
  </button>
</div>
`);

/** @type {HTMLDivElement} */
const viewAsCompact = viewControls.querySelector(".drv-view-compact");
/** @type {HTMLDivElement} */
const viewAsGrid = viewControls.querySelector(".drv-view-standard");

const PAGE = (() => {
  /** @type {HTMLDivElement} */
  const characterGrid = document.querySelector(".character-grid");
  /** @type {HTMLDivElement} */
  const dashboardHeader = document.querySelector(".dashboard-header");
  /** @type {HTMLDivElement} */
  const sortControls = document.querySelector("div:has(> #sort-select)");
  /** @type {HTMLDivElement} */
  const dashboardControls = sortControls.parentElement;

  return {
    characterGrid,
    dashboardHeader,
    dashboardControls,
    sortControls,
  };
})();

viewAsCompact.addEventListener("click", () => {
  PAGE.characterGrid.classList.add("drv-as-compact");
  viewAsCompact.classList.remove("inactive");
  viewAsGrid.classList.add("inactive");
});

viewAsGrid.addEventListener("click", () => {
  PAGE.characterGrid.classList.remove("drv-as-compact");
  viewAsGrid.classList.remove("inactive");
  viewAsCompact.classList.add("inactive");
});

viewAsCompact.classList.add("inactive");

function main() {
  PAGE.sortControls.insertAdjacentElement("afterend", viewControls);
  document.head.appendChild(style(mainCss, "main.scss"));

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

console.log("Dashboard Revised is running");
if (!PAGE.characterGrid) {
  console.log("...except there isn't a character grid, so we're backing out.");
  return;
}
main();
