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
  function updateShortcodes(emoji, shortcodes) {
    emoji.shortcodes = shortcodes;
    emoji.default = shortcodes[0];
  }
  emoji = { ...emoji };
  switch (emoji.emoji) {
    case "💥":
      updateShortcodes(emoji, [
        ":bang:",
        ":boom:",
        ":explosion:",
        ":collison:",
      ]);
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
  /** @type {EmojiDefinition} */
  const emoji = {
    emoji: jsonEmoji.emoji,
    default: jsonEmoji.shortcodes[0],
    hexcode: jsonEmoji.hexcode,
    shortcodes: jsonEmoji.shortcodes,
  };
  const override = applyOverrides(emoji);
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
      EMOJIS.byShortcode[shortcode] = emoji;
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
