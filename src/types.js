/**
 * @typedef {object|string|number|boolean|null|undefined} Primitive
 */

/**
 * @function GM_getValue
 * Get a value from the greasemonkey store from this script.
 * @global
 * @param {string} key The key to look up.
 * @param {Primitive} defaultValue A default value to use if no value is found.
 * @returns {Primitive} the value stored at `key`.
 */

/**
 * @function GM_setValue
 * Store a value in the greasemonkey store for this script.
 * @global
 * @param {string} key The key for which the value should be set.
 * @param {Primitive} value The value to be set for the key.
 */
