/** @typedef {("red"|"orange"|"yellow"|"green"|"blue"|"purple"|"pink"|"brown"|"teal"|"white"|"black"|"gray"|"dull_red"|"dull_orange"|"dull_yellow"|"dull_green"|"dull_blue"|"dull_purple"|"dull_pink"|"dull_brown"|"dull_teal")} Carrion.Color */

/**
 * @typedef {object} Carrion.Bookmark
 * @prop {number} character_id The numeric character ID
 * @prop {string} name The character name
 * @prop {string} added_at The date the character was added to bookmarks.
 */

/**
 * @typedef {object} Carrion.ChatWindow
 * @prop {Carrion.Drakensberg} [drakensberg] The drakensberg service
 * @prop {Carrion.SocialManager} [socialManager] The social manager service
 */

/**
 * @typedef {object} Carrion.Drakensberg
 * @prop {(username: string) => string | undefined} getAvatar Get a user's avatar URL.
 * @prop {(username: string) => Carrion.CharacterBadge[] | undefined} getBadges Get any badge roles related to a user.
 */

/** @typedef {"bot" | "janitor" | "pre-alpha" | "alpha" | "subscriber" | "recruiter-1" | "broke-the-website"} Carrion.CharacterBadge */
