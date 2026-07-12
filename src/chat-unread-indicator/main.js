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
  /** @returns {HTMLDivElement} */
  sidebar: () => document.querySelector("#sidebar"),
  /** @returns {HTMLDivElement} */
  roomList: () => document.querySelector("#room-list"),
  /** @returns {NodeListOf<HTMLDivElement>} */
  roomSections: () =>
    document
      .querySelector("#room-list")
      .querySelectorAll(
        ".dm-section, .public-channel-section, .channel-section",
      ),
});

//#region Indicators
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
//#endregion

//#region Room Manager
/**
 * @typedef {object} RoomOffset
 * The position of each room within the entire `#room-list` element.
 *
 * @prop {HTMLDivElement} room The room element.
 * @prop {HTMLDivElement} section The section the room belongs to.
 * @prop {number} offsetTop The room's offsetTop, relative to the room list.
 * @prop {number} offsetBottom The room's offsetBottom, relative to the room list.
 * @prop {number} offsetMiddle The value between the top and bottom, like a horizontal line through the middle of the element.
 */

class RoomManager {
  constructor() {
    /**
     * The list of room offsets.
     * @type {RoomOffset[]}
     * @public
     */
    this.roomOffsets = [];
  }
  /**
   * Recalculate room offsets for a section.
   *
   * @private
   * @param {HTMLDivElement} section The section to recalculate for
   * @returns Room offsets for the section.
   */
  calculateSection(section) {
    const roomItems = [...section.querySelectorAll(".room-item")];
    return roomItems.map((room) => {
      const offsetTop = room.offsetTop + section.offsetTop;
      const offsetBottom = offsetTop + room.clientHeight;
      const offsetMiddle = offsetTop + room.clientHeight / 2;
      return {
        room,
        section,
        offsetTop,
        offsetBottom,
      };
    });
  }

  /**
   * Calculate all the room offsets in the room list.
   *
   * @private
   * @returns All the room offsets in the list.
   */
  calculateRoomOffsets() {
    const sections = PAGE.roomSections();
    const offsets = sections
      .map((section) => this.calculateSection(section))
      .flat();
    return offsets;
  }

  /**
   * Refresh the room offsets.
   * This modifies {@link roomOffsets} with new values.
   *
   * @private
   */
  refreshRoomOffsets() {
    this.roomOffsets = this.calculateRoomOffsets();
  }

  /**
   * Calculate the room offsets and start watching for changes.
   * Whenever rooms are added/removed/(repositioned?), refresh room offsets.
   *
   * @public
   */
  manageRoomOffsets() {
    refreshRoomOffsets();

    const observer = new MutationObserver((mutation) => {
      console.log(LOG_PREFIX, "Mutation observed in channels:", mutation);
      refreshRoomOffsets();
    });
    const sections = PAGE.roomSections();
    for (const section of sections) {
      const rooms = section.querySelector("div:has(.room-item)");
      observer.observe(rooms, {
        childList: true,
      });
    }

    window.addEventListener(
      "resize",
      () => {
        console.log(LOG_PREFIX, "Window size changed:", mutation);
        refreshRoomOffsets();
      },
      { passive: true },
    );
  }

  /**
   * Get the list of rooms according to whether they're in or out of view.
   *
   * @public
   * @returns The rooms in or out of view.
   */
  getRoomsOutOfView() {
    const roomList = PAGE.roomList();

    const listTop = roomList.scrollTop;
    const listBottom = listTop + roomList.clientHeight;

    /** @type {RoomOffset[]} Rooms invisible above, including partial overlap. */
    const above = [];
    /** @type {RoomOffset[]} Rooms invisible below, including partial overlap. */
    const below = [];
    /** @type {RoomOffset[]} Rooms that are visible in view. */
    const visible = [];

    for (const roff of roomManager.roomOffsets) {
      if (roff.offsetMiddle < listTop) {
        above.push(roff);
      } else if (roff.offsetMiddle > listBottom) {
        below.push(roff);
      } else {
        visible.push(roff);
      }
    }

    return { above, below, visible };
  }
}

const roomManager = new RoomManager();
//#endregion

// TODO (next step):
// Whenever there's a scroll event (debounced), or a new message, recalculate getRoomsOutOfView().
// Check if any of the rooms above/below have messages. If so, show that indicator.

// TODO What if the indicator "host" was a 30px high element overlapping the top
// and bottom of the room list, but with pointer-events: none and overflow: hidden?
// We hide the top/bottom indicators by positioning them outside the box,
// and bring them inward when needed.
// Try it later!

// TODO Indicators should show up red if any of those rooms have mentions.

// TODO Indicators should show totals.

function insertUnreadIndicators() {
  const roomList = PAGE.roomList();
  roomList.insertAdjacentElement("beforebegin", indicatorTop.host);
  roomList.insertAdjacentElement("afterend", indicatorBottom.host);
}

function main() {
  console.debug(LOG_PREFIX, "Started");
  insertUnreadIndicators();
  roomManager.manageRoomOffsets();
  manageIndicators();
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
