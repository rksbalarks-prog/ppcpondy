/**
 * External app links.
 *
 * There are two separate apps:
 *   - "Pondy Property" (buy & sell)  -> THIS app. "Property" choices stay here.
 *   - "Rent" (rentals)               -> the SEPARATE Rent app. "Rent" redirects.
 *
 * The Rent app login serves BOTH cities at the same address, so Rent Pondy and
 * Rent Chennai both go to https://rentpondy.com/login. Override via .env if the
 * address ever changes:
 *
 *     REACT_APP_RENT_APP_URL=https://rentpondy.com/login
 */

const RENT_APP_URL = process.env.REACT_APP_RENT_APP_URL || 'https://rentpondy.com/login';

/**
 * Full URL of the Rent app for a city. Both cities currently share one address.
 * @param {'pondicherry'|'chennai'} _city  (reserved for future per-city URLs)
 * @returns {string} the Rent app URL.
 */
export const getRentUrl = (_city) => RENT_APP_URL;

/** Is the Rent app address configured? (Always true now that there is a default.) */
export const isRentAppConfigured = () => Boolean(RENT_APP_URL);
