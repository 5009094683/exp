const ID_ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";

/**
 * Seeded pseudo-random generator (mulberry32). The demo workspace must render
 * the same on the server and in the browser, so nothing here uses Math.random.
 */
export function createRandom(seed: number) {
  let state = seed >>> 0;

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    /** Float in [0, 1). */
    next,
    /** Integer in [min, max]. */
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    /** Float in [min, max). */
    float: (min: number, max: number) => min + next() * (max - min),
    pick: <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
    chance: (probability: number) => next() < probability,
    /** Identifier such as `run_01hx4k9m2q`. */
    id: (prefix: string, length = 10) => {
      let value = prefix;
      for (let index = 0; index < length; index += 1) {
        value += ID_ALPHABET[Math.floor(next() * ID_ALPHABET.length)];
      }
      return value;
    },
  };
}

export type Random = ReturnType<typeof createRandom>;

/** Stable 32-bit hash of a string, for deriving per-item seeds. */
export function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
