/**
 * @typedef {object} EmojiBank
 * @prop {Record<RawEmoji, EmojiDefinition>} definitions All emojis, indexed by the text representation of the emoji itself: e.g. "😀" is a key.
 * @prop {Record<string, RawEmoji>} byShortcode Emojis, mapped by their shortcode (minus colons), e.g. "smile" -> "😀"
 * @prop {string[]} shortcodes The full list of shortcodes, with colons stripped.
 */

/** @typedef {"🩷" | "💛"} RawEmoji An actual emoji, e.g. "😀" */

/**
 * @typedef {object} EmojiDefinition
 * @prop {RawEmoji} emoji The emoji itself, e.g. "😀"
 * @prop {string} hexcode The unicode hexcode, e.g. "1f600"
 * @prop {string} default The default shortcode for this emoji
 * @prop {string[]} shortcodes Shortcodes for the emoji, e.g. [":smile:"]
 */
