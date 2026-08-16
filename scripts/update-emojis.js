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
  all: {},
  prefix2: {},
  prefix3: {},
};

/**
 * Put an emoji into an emoji record.
 * @param {Record<string, Emoji[]>} record The record to alter
 * @param {string} key The record key
 * @param {Emoji} value The value to insert
 */
function putEmoji(record, key, value) {
  if (!(key in record)) {
    record[key] = [];
  }
  record[key]?.push(value);
}

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
    /** @type {Emoji} (from autocomplete/main.js) */
    const emoji = {
      emoji: item.emoji,
      hexcode: item.hexcode,
      shortcodes: item.shortcodes,
    };

    EMOJIS.all[emoji.emoji] = emoji;
    for (const shortcode of emoji.shortcodes) {
      const shortDef = { emoji: emoji.emoji, shortcode: shortcode };
      putEmoji(EMOJIS.prefix2, shortcode.slice(0, 2), shortDef);
      putEmoji(EMOJIS.prefix3, shortcode.slice(0, 3), shortDef);
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
