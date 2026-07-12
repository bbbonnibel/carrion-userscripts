/* eslint-disable no-unused-vars */

/** @typedef {null | undefined | object | string | number} GMPrimitive */

/**
 * Set the value of a key in the script's store.
 *
 * @global
 * @param {string} key The name of the key whose value we're setting.
 * @param {GMPrimitive} value The value to set to that key.
 */
function GM_setValue(key, value) {}

/**
 * Ge tthe value of a key from the script's store.
 *
 * @global
 * @param {string} key The key whose value we're returning.
 * @param {GMPrimitive} [defaultValue] A default value to be returned if the key doesn't exist in store.
 * @returns {GMPrimitive | null} The value stored for this key, or else the default value.
 */
function GM_getValue(key, defaultValue) {}
