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

installStyle(mainCss, "chat-unread-indicator", "main.css");
//#endregion

//#region Page info, types
const PAGE = Object.freeze({
  /** @returns {HTMLDivElement} */
  sidebar: () => document.querySelector("#sidebar"),
  /** @returns {HTMLDivElement} */
  roomList: () => document.querySelector("#room-list"),
  /** @returns {SectionElement[]} */
  roomSections: () => [
    ...document
      .querySelector("#room-list")
      .querySelectorAll(
        ".dm-section, .public-channel-section, .channel-section",
      ),
  ],
});

/**
 * @typedef {HTMLDivElement} RoomElement
 */

/**
 * @typedef {HTMLDivElement} SectionElement
 */

/**
 * @typedef {"core"|"user"|"dm"} SectionType
 * Is this section the default channels ("core"), public channels ("user"), or DMs ("dm")?
 */

//#endregion

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

//#region Room position analysis
const clsRoomOutOfView = "bbb-room-out-of-view";
const clsRoomOutOfViewAbove = "bbb-room-out-of-view-above";
const clsRoomOutOfViewBelow = "bbb-room-out-of-view-below";
const clsRoomClosestAbove = "bbb-room-closest-above";
const clsRoomClosestBelow = "bbb-room-closest-below";

const cls = (str) => `.${str}`;

/**
 * @typedef {object} PositionMeta
 * @prop {RoomElement} element The room or section element
 * @prop {DOMRect} bb The bounding box
 * @prop {number} midline The vertical middle (halfway between its top and bottom)
 * @prop {Boolean} visible Whether the room or section is even visible
 */

/**
 * Get position meta for a room or section.
 *
 * @param {RoomElement | SectionElement} element The room or section to examine
 * @returns {PositionMeta}
 */
function getPositionMeta(element) {
  const bb = element.getBoundingClientRect();
  const halfHeight = 0.5 * bb.height;
  const midline = bb.top + halfHeight;

  return {
    visible: bb.height > 0,
    element,
    bb,
    midline,
  };
}

/**
 * Check each room to see if it's out of view, and label them appropriately.
 */
function recalculateRooms() {
  const roomList = PAGE.roomList();
  const sections = PAGE.roomSections();
  /** The room list's bounding box. */
  const BB_roomList = roomList.getBoundingClientRect();
  /** @type {RoomElement[]} */
  const roomItems = [...roomList.querySelectorAll(".room-item")];

  /** @type {PositionMeta | undefined} */
  let closestAbove;
  /** @type {PositionMeta | undefined} */
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

  const roomMeta = roomItems.map(getPositionMeta);
  const collapsedSections = sections.filter((section) => {
    const info = getSectionInfo(section);
    return info.collapsed;
  });
  const sectionMeta = collapsedSections.map(getPositionMeta);

  // Apply above/below to rooms (and collapsed sections) above/eblow
  for (const room of [...roomMeta, ...sectionMeta]) {
    if (!room.visible) {
      continue;
    }

    if (room.midline < BB_roomList.top) {
      room.element.classList.add(clsRoomOutOfView, clsRoomOutOfViewAbove);
      if (!closestAbove || room.midline > closestAbove.midline) {
        closestAbove = room;
      }
    } else if (room.midline > BB_roomList.bottom) {
      room.element.classList.add(clsRoomOutOfView, clsRoomOutOfViewBelow);
      if (!closestBelow || room.midline < closestBelow.midline) {
        closestBelow = room;
      }
    }
  }

  // Apply closest above/below
  closestAbove?.element.classList.add(clsRoomClosestAbove);
  closestBelow?.element.classList.add(clsRoomClosestBelow);
}
//#endregion

/**
 * Get the section that contains a room item.
 * @param {RoomElement} element
 * @returns {SectionElement | undefined} The room's containing section, if it has one.
 */
function getRoomSection(element) {
  if (element.classList.contains("love-letter-room")) {
    return undefined;
  }
  const list = element.parentNode;
  const section = list.parentNode;
  return section;
}

/**
 * Get the section type of a section.
 *
 * @param {SectionElement} element The section element to examine
 * @returns {SectionType | undefined}
 */
function getSectionType(element) {
  switch (element.getAttribute("data-section-id")) {
    case "public-channels":
      return "core";
    case "user-channels":
      return "user";
    case "dms":
      return "dm";
    default:
      return undefined;
  }
}

/**
 * Get information about a section element.
 *
 * @param {SectionElement} element The section element to examine
 */
function getSectionInfo(element) {
  const type = getSectionType(element);
  const collapsed = Boolean(element.querySelector(".collapsible.collapsed"));
  const unreadBadge = element.querySelector(".section-unread-badge");
  let unreadCount = 0;
  if (unreadBadge) {
    unreadCount = parseInt(unreadBadge.textContent.trim(), 10);
  }
  const hasUnread = unreadCount > 0;

  return {
    type,
    collapsed,
    unreadCount,
    hasUnread,
  };
}

/**
 * Get information about a room element.
 *
 * @param {RoomElement} element The room element to examine
 * @returns Information about the room's mentions and unread count.
 */
function getRoomInfo(element) {
  const unreadBadge = element.querySelector(".unread-badge");
  const section = getRoomSection(element);

  // const hasUnread = element.classList.contains("has-unread");
  const hasMention = element.classList.contains("has-mention");
  const isLoveLetter = element.classList.contains("love-letter-room");
  let isDm = false;
  if (!isLoveLetter) {
    const sectionType = getSectionType(section);
    isDm = sectionType === "dm";
  }

  let unreadCount = 0;
  if (unreadBadge) {
    unreadCount = parseInt(unreadBadge.textContent.trim(), 10);
  }
  const hasUnread = unreadCount > 0;

  return {
    /** Is this the love letter room? */
    isLoveLetter,
    /** Is this room a DM? */
    isDm,
    /** Does this have unread messages? */
    hasUnread,
    /** Does this room have a mention? */
    hasMention,
    /** What's the unread count on this room? */
    unreadCount,
    /** What's this room's section? (A love letter room won't have one.) */
    section,
  };
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
      if (info.hasMention || (info.isDm && info.hasUnread)) {
        unreadMentionAbove = true;
      }
    }

    for (const room of roomsBelow) {
      const info = getRoomInfo(room);
      unreadCountBelow += info.unreadCount;
      if (info.hasMention || (info.isDm && info.hasUnread)) {
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

/**
 * Start managing the unread indicators, by redrawing when specific events occur.
 */
function manageIndicators() {
  PAGE.roomList().addEventListener(
    "scroll",
    () => {
      redrawIndicators();
    },
    { passive: true },
  );

  PAGE.roomSections().forEach((section) => {
    const collapsible = section.querySelector(".collapsible");
    if (collapsible) {
      const observer = new MutationObserver(() => redrawIndicators());
      observer.observe(collapsible, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }
  });

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
  console.debug(LOG_PREFIX, "Started");
  insertUnreadIndicators();
  recalculateRooms();
  manageIndicators();

  if (DEBUG_VISREP) {
    PAGE.roomList().classList.add("bbb-debug-visrep");
  }
}

window.addEventListener("chat-ready", () => {
  main();
});
