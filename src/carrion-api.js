/** @typedef {("red"|"orange"|"yellow"|"green"|"blue"|"purple"|"pink"|"brown"|"teal"|"white"|"black"|"gray"|"dark_red"|"dark_orange"|"dark_yellow"|"dark_green"|"dark_blue"|"dark_purple"|"dark_pink"|"dark_brown"|"dark_teal")} Carrion.Api.V1.Color */

/** @typedef {("unlisted"|"public")} Carrion.Api.V1.ProfileVisibility */

/** @typedef {("favorite"|"yes"|"maybe"|"no")} Carrion.Api.V1.KinkPreference */

/** @typedef {("Cisgender"|"Transgender")} Carrion.Api.V1.CisTransStatus */

/**
 * @typedef {object} Carrion.Api.V1.PreferenceWithContext
 * @prop {string[]} context
 * @prop {Carrion.Api.V1.KinkPreference} preference
 */

/**
 * @typedef {object} Carrion.Api.V1.CustomKink
 * @prop {string} name
 * @prop {Carrion.Api.V1.KinkPreference} preference
 * @prop {string} description
 */

/**
 * @typedef {Record<string, (Carrion.Api.V1.KinkPreference | Carrion.Api.V1.PreferenceWithContext)} Carrion.Api.V1.Kinks
 */

/**
 * @typedef {object} Carrion.Api.V1.Character
 * @prop {number} id
 * @prop {string} name
 * @prop {string} description The character's full markdown description
 * @prop {string} blurb The character's short blurb
 * @prop {string} species The character's species.
 * @prop {string} age The character's age.
 * @prop {string} gender_presentation Female, male, etc.
 * @prop {string} pronouns
 * @prop {string} orientation
 * @prop {string} avatar_url The character's avatar image URL
 * @prop {boolean} is_online
 * @prop {Carrion.Api.V1.ProfileVisibility} visibility
 * @prop {?string} last_seen ISO timestamp
 * @prop {Record<string, (string | string[])>} profile_tags
 * @prop {string[]} anatomical_features
 * @prop {string[]} languages
 * @prop {Carrion.Api.V1.Color} name_color
 * @prop {Carrion.Api.V1.Kinks} kinks
 * @prop {Carrion.Api.V1.CustomKink[]} custom_kinks
 * @prop {object} contact_info
 * @prop {[]} image_urls
 * @prop {(""|Carrion.Api.V1.CisTransStatus)} cis_trans_status Whether the character is cis or trans (or undefined).
 * @prop {string} intent
 * @prop {string} created_at ISO timestamp
 * @prop {string} updated_at ISO timestamp
 */
