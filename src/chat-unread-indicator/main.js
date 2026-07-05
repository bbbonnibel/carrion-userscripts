const mainCss = $import("./main.scss");
const LOG_PREFIX = "[Chat Unread Indicator]";

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

installStyle(mainCss, "chat-unread-indicator", "main.css");

const PAGE = Object.freeze({
  roomList: () => document.querySelector("#room-list"),
  sidebar: () => document.querySelector("#sidebar"),
});

class UnreadIndicator {
  /**
   * Create a new unread indicator.
   *
   * @param {string} name The name of the indicator ("top" or "bottom")
   */
  constructor(name) {
    /** @type {HTMLDivElement} The outer indicator host. */
    this.host = template(`
      <div class="bbb-floating-indicator-host">
      </div>
    `);
    /** @type {HTMLDivElement} The indicator itself. */
    this.indicator = template(`
      <div class="bbb-floating-indicator">
        <div class="arrow"></div>
        <div class="text">Unread messages</div>
        <div class="count"></div>
        <div class="arrow"></div>
      </div>
    `);
    this.host.appendChild(this.indicator);
    this.host.classList.add(name);
    this.indicator.classList.add(name);
  }

  show() {
    this.indicator.classList.add("show");
  }

  hide() {
    this.indicator.classList.remove("show");
  }
}

const indicatorTop = new UnreadIndicator("top");
const indicatorBottom = new UnreadIndicator("bottom");

function insertUnreadIndicators() {
  const list = PAGE.roomList();
  list.insertAdjacentElement("beforebegin", indicatorTop.host);
  list.insertAdjacentElement("afterend", indicatorBottom.host);

  list.addEventListener("mouseenter", (event) => {
    if (event.target !== list) {
      return;
    }
    indicatorTop.show();
    indicatorBottom.show();
  });

  list.addEventListener("mouseleave", (event) => {
    if (event.target !== list) {
      return;
    }
    indicatorTop.hide();
    indicatorBottom.hide();
  });
}

function main() {
  console.debug(LOG_PREFIX, "Started");
  insertUnreadIndicators();
  console.debug(LOG_PREFIX, "Unread indicators inserted:", {
    top: indicatorTop,
    bottom: indicatorBottom,
  });
}

window.addEventListener("chat-ready", () => {
  main();
});

// [
//   "drakensberg:ready",
//   "siteInit:ready",
//   "chat-ready",
//   "connection-status",
//   "drakensberg:character-changed",
//   "app:channel-tab-changed",
//   "tabs-updated",
// ].forEach((name) => {
//   window.addEventListener(name, (event) => {
//     console.debug("[EVENT DISCOVERY]", name, {
//       "room list exists?": document.querySelector("#room-list"),
//       event,
//     });
//   });
// });
