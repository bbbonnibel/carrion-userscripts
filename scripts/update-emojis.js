const fs = require("fs-extra");
const path = require("path");

/**
 * @typedef {object} EmojiFamily.Emoji
 * @prop {string} emoji The emoji itself, e.g. "😀"
 * @prop {string} hexcode The unicode hexcode, e.g. "1f600"
 * @prop {string} group The unicode group, e.g. "smileys-emotion"
 * @prop {string} subgroup The unicode subgroup, e.g. "face-smiling"
 * @prop {string} annotation A description for the emoji, e.g. "grinning face"
 * @prop {string[]} shortcodes Shortcodes for the emoji, e.g. [":smile:"]
 * @prop {string} emoticons Plaintext emoticons that are equivalent to the emoji, e.g. ":D"
 */

/** @type {EmojiBank} */
const EMOJIS = {
  definitions: {},
  byShortcode: {},
  shortcodes: [],
};

function assertIntegrity(json) {
  if (!Array.isArray(json)) {
    throw Error("Data corrupt");
  }
  for (const emoji of json) {
    if (typeof emoji.emoji !== "string") {
      throw Error("Data corrupt");
    }
    if (typeof emoji.hexcode !== "string") {
      throw Error("Data corrupt");
    }
    for (const shortcode of emoji.shortcodes) {
      if (typeof shortcode !== "string") {
        throw Error("Data corrupt");
      }
    }
  }
}

/**
 * @typedef {object} AddOverride
 * @prop {string[]} add A list of shortcodes to add to the end of the list.
 */

/**
 * @typedef {object} PreferOverride
 * @prop {string[]} prefer A list of shortcodes to add to the *front* of the list, meaning the first of these will be the preferred alias.
 */

/**
 * @typedef {object} ReplaceOverride
 * @prop {string[]} replace A list of shortcodes to completely replace the original shortcodes with.
 */

/**
 * Our list of overrides to apply.
 * @type {Record<string, (AddOverride | PreferOverride | ReplaceOverride)>}
 */
const OVERRIDES = {
  "🎉": { add: [":tada:"] },
  "💥": { prefer: [":bang:", ":boom:", ":explosion:"] },
  "♠️": { replace: [":spades:", ":suite-spades:"] },
  "♥️": { replace: [":hearts:", ":suite-hearts:"] },
  "♦️": { replace: [":diamonds:", ":suite-diamonds:"] },
  "♣️": { replace: [":clubs:", ":suite-clubs:"] },
  "💝": { add: [":heart-gift:"] },
  "💖": { add: [":heart-sparkling:"] },
  "💗": { add: [":heart-pulse:"] },
  "💓": { add: [":heart-beating:"] },
  "💔": { add: [":heart-broken:"] },
  "❤️‍🔥": { add: [":heart-fire:"] },
  "❤️‍🩹": { add: [":heart-bandaged:"] },
  "❤️": { prefer: [":heart:", ":heart-red:"] },
  "🩷": { add: [":heart-pink:"] },
  "🧡": { add: [":heart-orange:"] },
  "💛": { add: [":heart-yellow:"] },
  "💚": { add: [":heart-green:"] },
  "💙": { add: [":heart-blue:"] },
  "🩵": { add: [":light-blue-heart:"] },
  "💜": { add: [":heart-purple:"] },
  "🤎": { add: [":heart-brown:"] },
  "🖤": { add: [":heart-black:"] },
  "🩶": { add: [":heart-grey:"] },
  "🤍": { add: [":heart-white:"] },
  "#️⃣": { add: [":hash:"] },
};

/**
 * Apply local overrides to certain emoji definitions.
 *
 * @param {EmojiDefinition} emoji The emoji definition to modify
 */
function applyOverrides(emoji) {
  const override = OVERRIDES[emoji.emoji];
  if (!override) {
    return;
  }

  const actionKeys = Object.keys(override).filter((k) =>
    ["add", "prefer", "replace"].includes(k),
  );
  if (actionKeys.length !== 1) {
    console.error(
      "An emoji override should have exactly one of add, prefer, or replace. You defined an override with zero, two, or more:",
      emoji.emoji,
      "=",
      override,
    );
    throw Error("Override error");
  }

  if ("add" in override) {
    emoji.shortcodes = [...emoji.shortcodes, ...override.add];
  }
  if ("prefer" in override) {
    emoji.shortcodes = [...override.prefer, ...emoji.shortcodes];
  }
  if ("replace" in override) {
    emoji.shortcodes = [...override.replace];
  }

  return emoji;
}

/**
 * Convert an external emoji to a local emoji definition.
 *
 * @param {EmojiFamily.Emoji} jsonEmoji The external emoji to convert
 * @returns {EmojiDefinition} The locally defined emoji
 */
function convertToEmoji(jsonEmoji) {
  let { emoji, hexcode, shortcodes } = jsonEmoji;
  shortcodes = shortcodes.map((s) => s.toLowerCase()); // some emoji.family shortcodes contain uppercase, e.g. "Ophiuchus", for some reason
  shortcodes = shortcodes.filter((s) => !s.match(/^:\d/)); // remove shortcodes that start with numbers

  /** @type {EmojiDefinition} */
  let def = {
    emoji,
    hexcode,
    shortcodes,
  };
  try {
    const override = applyOverrides(def);
    def = { ...def, ...override };
  } catch (ex) {
    console.error("Calculating overrides failed", { def, jsonEmoji, ex });
  }
  return def;
}

/** Load emojis into the emoji record. */
async function loadEmojis() {
  const response = await fetch("https://www.emoji.family/api/emojis", {
    cache: "default",
    headers: {
      Accept: "application/json",
    },
  });
  /** @type {EmojiFamily.Emoji} */
  const json = await response.json();
  assertIntegrity(json);

  for (const item of json) {
    const emoji = convertToEmoji(item);

    EMOJIS.definitions[emoji.emoji] = emoji;
    for (let shortcode of emoji.shortcodes) {
      shortcode = shortcode.replaceAll(":", "");
      EMOJIS.byShortcode[shortcode] = emoji.emoji;
      EMOJIS.shortcodes.push(shortcode);
    }
  }
}

/** Save emojis to disk. */
function saveEmojis() {
  const json = JSON.stringify(EMOJIS);
  fs.writeFileSync(path.join(process.cwd(), "src/data/emojis.json"), json, {
    encoding: "utf-8",
  });
}

async function main() {
  await loadEmojis();
  saveEmojis();
}

main();
