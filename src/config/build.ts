import "server-only";

/**
 * When this build ran, rounded to the minute. The demo workspace anchors its
 * sample data to this instant, so "2 minutes ago" stays consistent between the
 * prerendered HTML and the browser, and each deploy refreshes the dates.
 */
export const buildTime = Math.floor(Date.now() / 60_000) * 60_000;
