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
  sidebar: () => document.querySelector("#sidebar"),
  roomList: () => document.querySelector("#room-list"),
  roomSections: () =>
    this.roomList().querySelectorAll(
      ".dm-section, .public-channel-section, .channel-section",
    ),
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
        <div class="text">new messages</div>
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

/**
 * @typedef {object} RoomOffset
 * The position of each room within the entire `#room-list` element.
 *
 * @prop {HTMLDivElement} room The room element.
 * @prop {HTMLDivElement} section The section the room belongs to.
 * @prop {number} offsetTop The room's offsetTop, relative to the room list.
 * @prop {number} offsetBottom The room's offsetBottom, relative to the room list.
 */

/** @type {RoomOffset[]} */
let roomOffsets = [];

function insertUnreadIndicators() {
  const roomList = PAGE.roomList();
  roomList.insertAdjacentElement("beforebegin", indicatorTop.host);
  roomList.insertAdjacentElement("afterend", indicatorBottom.host);
}

/**
 * Recalculate room offsets for a section.
 *
 * @private
 * @param {HTMLDivElement} section The section to recalculate for
 * @returns Room offsets for the section.
 */
function calculateSection(section) {
  const roomItems = [...section.querySelectorAll(".room-item")];
  return roomItems.map((room) => {
    const offsetTop = room.offsetTop + section.offsetTop;
    const offsetBottom = offsetTop + room.clientHeight;
    return {
      room,
      section,
      offsetTop,
      offsetBottom,
    };
  });
}

function calculateRoomOffsets() {
  const sections = PAGE.roomSections();
  const offsets = sections.map((section) => calculateSection(section)).flat();
}

function rescanIndicators() {
  const roomList = PAGE.roomList();
  const listTop = roomList.scrollTop;
  const listBottom = listTop + roomList.clientHeight;
}

function main() {
  console.debug(LOG_PREFIX, "Started");
  insertUnreadIndicators();
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
