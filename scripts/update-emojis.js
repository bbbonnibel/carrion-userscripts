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
 * Apply local overrides to certain emoji definitions.
 *
 * @param {EmojiDefinition} emoji The emoji definition to modify
 */
function applyOverrides(emoji) {
  function replaceShortcodes(emoji, shortcodes) {
    emoji.shortcodes = shortcodes;
  }
  function addShortcodes(emoji, shortcodes) {
    emoji.shortcodes = [...emoji.shortcodes, ...shortcodes];
  }
  emoji = { ...emoji };
  switch (emoji.emoji) {
    case "🎉":
      addShortcodes(emoji, [":tada:"]);
      break;
    case "💥":
      replaceShortcodes(emoji, [
        ":bang:",
        ":boom:",
        ":explosion:",
        ":collison:",
      ]);
      break;
    case "♠️":
      replaceShortcodes(emoji, [":spades:", ":suite-spades:"]);
      break;
    case "♥️":
      replaceShortcodes(emoji, [":hearts:", ":suite-hearts:"]);
      break;
    case "♦️":
      replaceShortcodes(emoji, [":diamonds:", ":suite-diamonds:"]);
      break;
    case "♣️":
      replaceShortcodes(emoji, [":clubs:", ":suite-clubs:"]);
      break;
    case "💝":
      addShortcodes(emoji, [":heart-gift:"]);
      break;
    case "💖":
      addShortcodes(emoji, [":heart-sparkling:"]);
      break;
    case "💗":
      addShortcodes(emoji, [":heart-pulse:"]);
      break;
    case "💓":
      addShortcodes(emoji, [":heart-beating:"]);
      break;
    case "💔":
      addShortcodes(emoji, [":heart-broken:"]);
      break;
    case "❤️‍🔥":
      addShortcodes(emoji, [":heart-fire:"]);
      break;
    case "❤️‍🩹":
      addShortcodes(emoji, [":heart-bandaged:"]);
      break;
    case "❤️":
      replaceShortcodes(emoji, [":heart:", ":red-heart:", ":heart-red:"]);
      break;
    case "🩷":
      addShortcodes(emoji, [":heart-pink:"]);
      break;
    case "🧡":
      addShortcodes(emoji, [":heart-orange:"]);
      break;
    case "💛":
      addShortcodes(emoji, [":heart-yellow:"]);
      break;
    case "💚":
      addShortcodes(emoji, [":heart-green:"]);
      break;
    case "💙":
      addShortcodes(emoji, [":heart-blue:"]);
      break;
    case "🩵":
      addShortcodes(emoji, [":light-blue-heart:"]);
      break;
    case "💜":
      addShortcodes(emoji, [":heart-purple:"]);
      break;
    case "🤎":
      addShortcodes(emoji, [":heart-brown:"]);
      break;
    case "🖤":
      addShortcodes(emoji, [":heart-black:"]);
      break;
    case "🩶":
      addShortcodes(emoji, [":heart-grey:"]);
      break;
    case "🤍":
      addShortcodes(emoji, [":heart-white:"]);
      break;
    case "#️⃣":
      addShortcodes(emoji, [":hash:"]);
      break;
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
  const def = {
    emoji,
    default: shortcodes[0],
    hexcode,
    shortcodes,
  };
  const override = applyOverrides(def);
  return override;
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
