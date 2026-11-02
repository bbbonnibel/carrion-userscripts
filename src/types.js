/**
 * @typedef {object} EmojiBank
 * @prop {Record<RawEmoji, EmojiDefinition>} definitions All emojis, indexed by the text representation of the emoji itself: e.g. "😀" is a key.
 * @prop {Record<string, RawEmoji>} byShortcode Emojis, mapped by their shortcode (minus colons), e.g. "smile" -> "😀"
 */

/** @typedef {"🩷" | "💛"} RawEmoji An actual emoji, e.g. "😀" */

/**
 * @typedef {object} EmojiDefinition
 * @prop {RawEmoji} emoji The emoji itself, e.g. "😀"
 * @prop {number} [weight] The default weight modifier applied to this emoji
 * @prop {string[]} shortcodes Shortcodes for the emoji, e.g. [":smile:"]
 */
