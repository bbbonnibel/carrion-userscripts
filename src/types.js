/**
 * @typedef {object} EmojiBank
 * @prop {Record<RawEmoji, EmojiDefinition[]>} all All emojis, indexed by the text representation of the emoji itself: e.g. "😀" is a key.
 * @prop {Record<string, RawEmoji[]>} prefix2 Emojis, mapped by the first two characters of a shortcode: e.g. ":s" → all emojis with a shortcode starting with ":s".
 * @prop {Record<string, RawEmoji[]>} prefix3 Emojis, mapped by their first three characters of a shortcode: e.g. ":sm" → all emojis with a shortcode starting with ":sm".
 */

/** @typedef {string} RawEmoji An actual emoji, e.g. "😀" */

/**
 * @typedef {object} EmojiDefinition
 * @prop {RawEmoji} emoji The emoji itself, e.g. "😀"
 * @prop {string} hexcode The unicode hexcode, e.g. "1f600"
 * @prop {string[]} shortcodes Shortcodes for the emoji, e.g. [":smile:"]
 */
