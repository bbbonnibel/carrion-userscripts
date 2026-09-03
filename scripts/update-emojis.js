const fs = require("fs-extra");
const path = require("path");

/**
 * Feed this to an `Array.filter` call to filter the array down to only unique elements.
 *
 * @example
 * ["a", "b", "c", "b"].filter(filterUnique) // ["a", "b", "c"]
 */
function filterUnique(value, index, array) {
  return array.indexOf(value) === index;
}

/**
 * Wrap a string in colons safely, `heart` --> `:heart:`
 * @param {string} s
 */
function wrapColons(s) {
  s = `:${s}:`;
  s = s.replaceAll("::", ":");
  return s;
}

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
 * @typedef {(AddOverride | PreferOverride | ReplaceOverride)} Override
 */

/**
 * Our list of overrides to apply.
 * @type {Record<string, Override>}
 */
const OVERRIDES = {
  "😇": { add: ["innocent"] },
  "👆️": { replace: ["point-up-2"] },
  "☝️": { replace: ["point-up", "index-finger"] },
  "👎️": { add: ["-1"] },
  "✊️": { add: ["fist-up"] },
  "🤛": { add: ["fist-left"] },
  "🤜": { add: ["fist-right"] },
  "🙌": { add: ["raised-hands"] },
  "🦾": { add: ["muscle-robot", "flex-robot", "bicep-robot", "strong-robot"] },
  "🦿": { add: ["leg-robot"] },
  "🎉": { add: ["tada"] },
  "💥": { prefer: ["bang", "boom", "explosion"] },
  "♠️": { replace: ["spades", "suite-spades"] },
  "♥️": { replace: ["hearts", "suite-hearts"] },
  "♦️": { replace: ["diamonds", "suite-diamonds"] },
  "♣️": { replace: ["clubs", "suite-clubs"] },
  "💝": { add: ["heart-gift"] },
  "💖": { add: ["heart-sparkling"] },
  "💗": { add: ["heart-pulse"] },
  "💓": { add: ["heart-beating"] },
  "💔": { add: ["heart-broken"] },
  "❤️‍🔥": { add: ["heart-fire"] },
  "❤️‍🩹": { add: ["heart-bandaged"] },
  "❤️": { prefer: ["heart", "heart-red"] },
  "🩷": { add: ["heart-pink"] },
  "🧡": { add: ["heart-orange"] },
  "💛": { add: ["heart-yellow"] },
  "💚": { add: ["heart-green"] },
  "💙": { add: ["heart-blue"] },
  "🩵": { add: ["light-blue-heart"] },
  "💜": { add: ["heart-purple"] },
  "🤎": { add: ["heart-brown"] },
  "🖤": { add: ["heart-black"] },
  "🩶": { add: ["heart-grey"] },
  "🤍": { add: ["heart-white"] },
  "#️⃣": { add: ["hash"] },
  "🏴‍☠️": { prefer: ["pirate-flag", "skull-and-crossbones-flag", "jolly-roger"] },
  "🚩": { prefer: ["red-flag"] },
  "🏁": { prefer: ["checkered-flag"] },
  "🏳️‍🌈": { prefer: ["rainbow-flag", "pride-flag", "lgbt-flag", "queer-flag"] },
  "🏳️‍⚧️": { prefer: ["trans-flag", "transgender-flag"] },
};

// Validate overrides
for (const [key, override] of Object.entries(OVERRIDES)) {
  if (!Object.hasOwn(OVERRIDES, key)) continue;
  const actionKeys = Object.keys(override).filter((k) =>
    ["add", "prefer", "replace"].includes(k),
  );

  if (actionKeys.length !== 1) {
    console.error(
      "An emoji override should have exactly one of add, prefer, or replace. You defined an override with zero, two, or more:",
      key,
      "=",
      override,
    );
    throw Error("Override error");
  }
}

/**
 * Apply a local override to an emoji definition.
 *
 * @param {EmojiDefinition} def The emoji definition to modify
 * @param {Override} override The override to apply
 * @returns {EmojiDefinition} A modified emoji definition
 */
function applyOverride(def, override) {
  def = { ...def, shortcodes: [...def.shortcodes] };

  if ("add" in override) {
    def.shortcodes = [...def.shortcodes, ...override.add.map(wrapColons)];
  }
  if ("prefer" in override) {
    def.shortcodes = [...override.prefer.map(wrapColons), ...def.shortcodes];
  }
  if ("replace" in override) {
    def.shortcodes = [...override.replace.map(wrapColons)];
  }

  def.shortcodes = def.shortcodes.filter(filterUnique);

  return def;
}

/**
 * Convert an external emoji to a local emoji definition.
 *
 * @param {EmojiFamily.Emoji} jsonEmoji The external emoji to convert
 * @returns {EmojiDefinition} The locally defined emoji
 */
function convertToEmoji(jsonEmoji) {
  let { emoji, shortcodes } = jsonEmoji;
  shortcodes = shortcodes.map((s) => s.toLowerCase()); // some emoji.family shortcodes contain uppercase, e.g. "Ophiuchus", for some reason
  shortcodes = shortcodes.filter((s) => !s.match(/^:\d/)); // remove shortcodes that start with numbers

  return {
    emoji,
    shortcodes,
  };
}

/**
 * Get emoji JSON from the API.
 */
async function getEmojiJson() {
  const response = await fetch("https://www.emoji.family/api/emojis", {
    cache: "default",
    headers: {
      Accept: "application/json",
    },
  });
  /** @type {EmojiFamily.Emoji[]} */
  const json = await response.json();
  assertIntegrity(json);
  return json;
}

/**
 * Create the emoji list.
 * @param {EmojiDefinition[]} apiEmojis Emojis from the API.
 */
function buildEmojiList(apiEmojis) {
  /** @type {Map<string, EmojiDefinition>} */
  const map = new Map();

  for (const def of apiEmojis) {
    map.set(def.emoji, def);
  }

  for (const [key, override] of Object.entries(OVERRIDES)) {
    /** @type {EmojiDefinition} */
    let def = map.get(key) ?? { emoji: key, shortcodes: [] };
    def = applyOverride(def, override);
    map.set(key, def);
  }

  return [...map.values()];
}

/** Load emojis into the emoji record. */
async function processEmojis() {
  const json = await getEmojiJson();
  console.log("Retrieved emoji JSON with", json.length, "entries.");
  const apiEmojis = json.map((j) => convertToEmoji(j));
  const emojis = buildEmojiList(apiEmojis);

  console.log(
    "Working with",
    emojis.length,
    "entries, including",
    Object.keys(OVERRIDES).length,
    "overrides",
  );

  for (const emoji of emojis) {
    EMOJIS.definitions[emoji.emoji] = emoji;
    for (let shortcode of emoji.shortcodes) {
      shortcode = shortcode.replaceAll(":", "");
      EMOJIS.byShortcode[shortcode] = emoji.emoji;
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
  await processEmojis();
  saveEmojis();
}

main();
