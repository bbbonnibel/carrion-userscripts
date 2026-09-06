const mainCss = $import("./main.scss");
const LOG_PREFIX = "[Chat Unread Indicator]";
const DEBUG_VISREP = false;

//#region externals
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
//#endregion

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

const PAGE = Object.freeze({
  /** @returns {HTMLDivElement} */
  sidebar: () => document.querySelector("#sidebar"),
  /** @returns {HTMLDivElement} */
  roomList: () => document.querySelector("#room-list"),
  /** @returns {HTMLDivElement[]} */
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
        <div class="text"><span>new messages</span></div>
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
      this.show();
      if (state.unreadCount >= 99) {
        this.count.innerText = "99+";
      } else {
        this.count.innerText = state.unreadCount;
      }
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
//#endregion

//#region Room analysis
const clsRoomOutOfView = "bbb-room-out-of-view";
const clsRoomOutOfViewAbove = "bbb-room-out-of-view-above";
const clsRoomOutOfViewBelow = "bbb-room-out-of-view-below";
const clsRoomClosestAbove = "bbb-room-closest-above";
const clsRoomClosestBelow = "bbb-room-closest-below";

const cls = (str) => `.${str}`;

/**
 * @typedef {object} RoomMeta
 * @prop {HTMLDivElement} el The room element
 * @prop {DOMRect} bb The room bounding box
 * @prop {number} midline The room's vertical middle (halfway between its top and bottom)
 */

/**
 * Check each room to see if it's out of view, and label them appropriately.
 */
function recalculateRooms() {
  const roomList = PAGE.roomList();
  /** The room list's bounding box. */
  const BB_roomList = roomList.getBoundingClientRect();

  /** @type {RoomMeta | undefined} */
  let closestAbove;
  /** @type {RoomMeta | undefined} */
  let closestBelow;

  // Reset classes.
  const removeClasses = [
    clsRoomOutOfView,
    clsRoomOutOfViewAbove,
    clsRoomOutOfViewBelow,
    clsRoomClosestAbove,
    clsRoomClosestBelow,
  ];
  document
    .querySelectorAll(removeClasses.map(cls).join(", "))
    .forEach((element) => {
      element.classList.remove(...removeClasses);
    });

  // Gather data about each room.
  /** @type {HTMLDivElement[]} */
  const roomItems = [...roomList.querySelectorAll(".room-item")];
  /** @type {RoomMeta[]} */
  const rooms = roomItems.map((el) => {
    const bb = el.getBoundingClientRect();
    const halfHeight = 0.5 * bb.height;
    const midline = bb.top + halfHeight;

    return {
      el,
      bb,
      midline,
    };
  });

  // Apply above/below to rooms above/eblow
  for (const room of rooms) {
    if (room.midline < BB_roomList.top) {
      room.el.classList.add(clsRoomOutOfView, clsRoomOutOfViewAbove);
      if (!closestAbove || room.midline > closestAbove.midline) {
        closestAbove = room;
      }
    } else if (room.midline > BB_roomList.bottom) {
      room.el.classList.add(clsRoomOutOfView, clsRoomOutOfViewBelow);
      if (!closestBelow || room.midline < closestBelow.midline) {
        closestBelow = room;
      }
    }
  }

  // Apply closest above/below
  closestAbove?.el.classList.add(clsRoomClosestAbove);
  closestBelow?.el.classList.add(clsRoomClosestBelow);
}
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
    recalculateRooms();
    const roomsAbove = document.querySelectorAll(cls(clsRoomOutOfViewAbove));
    const roomsBelow = document.querySelectorAll(cls(clsRoomOutOfViewBelow));
    let unreadCountAbove = 0;
    let unreadMentionAbove = false;
    let unreadCountBelow = 0;
    let unreadMentionBelow = false;

    for (const room of roomsAbove) {
      const info = getRoomInfo(room);
      unreadCountAbove += info.unreadCount;
      if (info.hasMention) {
        unreadMentionAbove = true;
      }
    }

    for (const room of roomsBelow) {
      const info = getRoomInfo(room);
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

function insertUnreadIndicators() {
  const roomList = PAGE.roomList();
  roomList.insertAdjacentElement("beforebegin", indicatorTop.host);
  roomList.insertAdjacentElement("afterend", indicatorBottom.host);

  indicatorTop.indicator.addEventListener("click", () => {
    const target = document.querySelector(cls(clsRoomClosestAbove));
    if (target) {
      target.scrollIntoView({
        block: "start",
        behavior: "smooth",
      });
    }
  });
  indicatorBottom.indicator.addEventListener("click", () => {
    const target = document.querySelector(cls(clsRoomClosestBelow));
    if (target) {
      target.scrollIntoView({
        block: "end",
        behavior: "smooth",
      });
    }
  });
}
function main() {
  installStyle(mainCss, "chat-unread-indicator", "main.css");
  insertUnreadIndicators();
  recalculateRooms();
  manageIndicators();

  if (DEBUG_VISREP) {
    PAGE.roomList().classList.add("bbb-debug-visrep");
  }
}

window.addEventListener("chat-ready", () => {
  try {
    main();
    console.debug(LOG_PREFIX, "Started.");
  } catch (ex) {
    console.error(LOG_PREFIX, "Failed to start:", ex);
  }
});
