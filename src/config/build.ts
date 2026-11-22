import "server-only";

/**
 * When this build ran, rounded to the minute. Prerendered pages use it wherever
 * they show a date, so the HTML is the same on the server and in the browser.
 * The demo console starts from it and then follows the visitor's clock.
 */
export const buildTime = Math.floor(Date.now() / 60_000) * 60_000;
