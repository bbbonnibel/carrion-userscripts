const mainCss = $import("./main.scss");
const LOG_PREFIX = "[Chat Unread Indicator]";
const DEBUG_VISREP_BARS = false;

/**
 * Debounce a script to not occur repeatedly within a time period.
 * @see {@link https://github.com/sindresorhus/debounce#readme} Author's readme
 * @param {function} function_ The inner function to debounce.
 * @param {number} wait Number of milliseconds to wait between running the function again.
 * @param {object} options
 * @param {boolean} options.immediate Whether the function runs immediately, instead of on the tail end after the wait.
 * @returns
 */
function debounce(function_, wait = 100, options = {}) {
  if (typeof function_ !== "function") {
    throw new TypeError(
      `Expected the first parameter to be a function, got \`${typeof function_}\`.`,
    );
  }

  if (wait < 0) {
    throw new RangeError("`wait` must not be negative.");
  }

  if (typeof options === "boolean") {
    throw new TypeError(
      "The `options` parameter must be an object, not a boolean. Use `{immediate: true}` instead.",
    );
  }

  const { immediate } = options;

  let storedContext;
  let storedArguments;
  let timeoutId;
  let timestamp;
  let result;

  function run() {
    const callContext = storedContext;
    const callArguments = storedArguments;
    storedContext = undefined;
    storedArguments = undefined;
    result = function_.apply(callContext, callArguments);
    return result;
  }

  function later() {
    const last = Date.now() - timestamp;

    if (last < wait && last >= 0) {
      timeoutId = setTimeout(later, wait - last);
    } else {
      timeoutId = undefined;

      if (!immediate) {
        result = run();
      }
    }
  }

  const debounced = function (...arguments_) {
    if (
      storedContext &&
      this !== storedContext &&
      Object.getPrototypeOf(this) === Object.getPrototypeOf(storedContext)
    ) {
      throw new Error(
        "Debounced method called with different contexts of the same prototype.",
      );
    }

    storedContext = this;
    storedArguments = arguments_;
    timestamp = Date.now();

    const callNow = immediate && !timeoutId;

    if (!timeoutId) {
      timeoutId = setTimeout(later, wait);
    }

    if (callNow) {
      result = run();
      return result;
    }

    return undefined;
  };

  Object.defineProperty(debounced, "isPending", {
    get() {
      return timeoutId !== undefined;
    },
  });

  debounced.clear = () => {
    if (!timeoutId) {
      return;
    }

    clearTimeout(timeoutId);
    timeoutId = undefined;
    storedContext = undefined;
    storedArguments = undefined;
  };

  debounced.flush = () => {
    if (!timeoutId) {
      return;
    }

    debounced.trigger();
  };

  debounced.trigger = () => {
    result = run();

    debounced.clear();
  };

  return debounced;
}

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
  roomSections: () => [
    ...document
      .querySelector("#room-list")
      .querySelectorAll(
        ".dm-section, .public-channel-section, .channel-section",
      ),
  ],
});

//#region Indicators
class UnreadIndicator {
  /**
   * Create a new unread indicator.
   *
   * @param {string} name The name of the indicator ("top" or "bottom")
   */
  constructor(name) {
    /**
     * The outer indicator host.
     * @private
     * @type {HTMLDivElement}
     */
    this.host = template(`<div class="bbb-floating-indicator-host"></div>`);
    /**
     * The inner indicator container.
     * @private
     * @type {HTMLDivElement}
     */
    this.container = template(
      `<div class="bbb-floating-indicator-container"></div>`,
    );
    /**
     * The indicator itself.
     * @public
     * @type {HTMLDivElement}
     */
    this.indicator = template(`
      <div class="bbb-floating-indicator">
        <div class="arrow"></div>
        <div class="text">new messages</div>
        <div class="count"></div>
        <div class="arrow"></div>
      </div>
    `);
    /**
     * The element that's storing the message count.
     * @private
     * @type {HTMLDivElement}
     */
    this.count = this.indicator.querySelector(".count");

    this.host.classList.add(name);
    this.container.classList.add(name);
    this.indicator.classList.add(name);
    this.host.appendChild(this.container);
    this.container.appendChild(this.indicator);
  }

  /**
   * Show this indicator.
   * @private
   */
  show() {
    this.indicator.classList.add("show");
  }

  /**
   * Hide this indicator.
   * @private
   */
  hide() {
    this.indicator.classList.remove("show");
  }

  /**
   * Update this unread indicator.
   *
   * @param {object} state The current state this indicator should reflect.
   * @param {number} state.unreadCount The total unread count.
   * @param {boolean} state.mention Whether there's been a mention.
   */
  update(state) {
    if (state.unreadCount > 0) {
      this.count.innerText = state.unreadCount;
      this.show();
    } else {
      this.count.innerText = "";
      this.hide();
    }
    if (state.mention) {
      this.indicator.classList.add("has-mention");
    } else {
      this.indicator.classList.remove("has-mention");
    }
  }
}

const indicatorTop = new UnreadIndicator("top");
const indicatorBottom = new UnreadIndicator("bottom");

function insertUnreadIndicators() {
  const roomList = PAGE.roomList();
  roomList.insertAdjacentElement("beforebegin", indicatorTop.host);
  roomList.insertAdjacentElement("afterend", indicatorBottom.host);

  indicatorTop.indicator.addEventListener("click", () => {
    roomList.scrollBy({
      top: -400,
      behavior: "smooth",
    });
  });
  indicatorBottom.indicator.addEventListener("click", () => {
    roomList.scrollBy({
      top: +400,
      behavior: "smooth",
    });
  });
}
//#endregion

//#region Room Manager
/**
 * @typedef {object} RoomOffset
 * The position of each room within the entire `#room-list` element.
 *
 * @prop {HTMLDivElement} element The room element.
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
   * @returns {RoomOffset} Room offsets for the section.
   */
  calculateSection(section) {
    const roomItems = [...section.querySelectorAll(".room-item")];
    return roomItems.map((room) => {
      const offsetTop = room.offsetTop + section.offsetTop;
      const offsetBottom = offsetTop + room.clientHeight;
      const offsetMiddle = offsetTop + room.clientHeight / 2;
      return {
        element: room,
        section,
        offsetTop,
        offsetBottom,
        offsetMiddle,
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
   * @public // make private again later
   */
  refreshRoomOffsets() {
    console.debug(LOG_PREFIX, "Refreshing room offsets");
    this.roomOffsets = this.calculateRoomOffsets();

    if (DEBUG_VISREP_BARS) {
      function createVisrepBar(cls, y) {
        const bar = template(`<div class="bbb-debug-visrep-bar"></div>`);
        bar.classList.add(cls);
        bar.setAttribute("style", `top: ${y}px`);
        return bar;
      }

      const roomList = PAGE.roomList();
      roomList
        .querySelectorAll(".bbb-debug-visrep-bar")
        .forEach((e) => e.remove());
      for (const room of this.roomOffsets) {
        const barTop = createVisrepBar("top", room.offsetTop);
        const barMiddle = createVisrepBar("middle", room.offsetMiddle);
        const barBottom = createVisrepBar("bottom", room.offsetBottom);
        roomList.append(barTop, barMiddle, barBottom);
      }
    }
  }

  /**
   * Calculate the room offsets and start watching for changes.
   * Whenever rooms are added/removed/(repositioned?), refresh room offsets.
   *
   * @public
   */
  manageRoomOffsets() {
    this.refreshRoomOffsets();

    const observer = new MutationObserver((mutation) => {
      console.log(LOG_PREFIX, "Mutation observed in channels:", mutation);
      this.refreshRoomOffsets();
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
      (mutation) => {
        console.log(LOG_PREFIX, "Window size changed:", mutation);
        this.refreshRoomOffsets();
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
    const sidebar = PAGE.sidebar();

    const listTop = roomList.scrollTop + sidebar.offsetTop;
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

/**
 * Get information about a room element.
 *
 * @param {HTMLDivElement} element
 * @returns Information about the room's mentions and unread count.
 */
function getRoomInfo(element) {
  const hasUnread = element.classList.contains("has-unread");
  const hasMention = element.classList.contains("has-mention");
  let unreadCount = 0;
  if (hasUnread) {
    const unreadBadge = element.querySelector(".unread-badge");
    if (unreadBadge) {
      unreadCount = parseInt(unreadBadge.textContent.trim(), 10);
    }
  }
  return { hasUnread, hasMention, unreadCount };
}

const redrawIndicators = debounce(
  () => {
    const rooms = roomManager.getRoomsOutOfView();
    let unreadCountAbove = 0;
    let unreadMentionAbove = false;
    let unreadCountBelow = 0;
    let unreadMentionBelow = false;
    for (const room of rooms.above) {
      const info = getRoomInfo(room.element);
      unreadCountAbove += info.unreadCount;
      if (info.hasMention) {
        unreadMentionAbove = true;
      }
    }

    for (const room of rooms.below) {
      const info = getRoomInfo(room.element);
      unreadCountBelow += info.unreadCount;
      if (info.hasMention) {
        unreadMentionBelow = true;
      }
    }

    indicatorTop.update({
      unreadCount: unreadCountAbove,
      mention: unreadMentionAbove,
    });
    indicatorBottom.update({
      unreadCount: unreadCountBelow,
      mention: unreadMentionBelow,
    });
  },
  100,
  { immediate: false },
);

function manageIndicators() {
  PAGE.roomList().addEventListener(
    "scroll",
    () => {
      redrawIndicators();
    },
    { passive: true },
  );

  ["display-message", "room-left", "tabs-updated", "dm-tabs-changed"].forEach(
    (chatEventName) => {
      window.addEventListener(
        chatEventName,
        () => {
          redrawIndicators();
        },
        { passive: true },
      );
    },
  );
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
