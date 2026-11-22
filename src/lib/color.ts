export type Rgb = { r: number; g: number; b: number };

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function parseHex(value: string): Rgb | null {
  const match = HEX_PATTERN.exec(value.trim());
  if (!match) return null;

  const digits = match[1];
  const full =
    digits.length === 3
      ? digits
          .split("")
          .map((digit) => digit + digit)
          .join("")
      : digits;

  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  };
}

export function toHex({ r, g, b }: Rgb): string {
  const channel = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value)))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/** Linear mix of two colors; `weight` is the share of `b` (0..1). */
export function mix(a: Rgb, b: Rgb, weight: number): Rgb {
  return {
    r: a.r + (b.r - a.r) * weight,
    g: a.g + (b.g - a.g) * weight,
    b: a.b + (b.b - a.b) * weight,
  };
}

/** WCAG relative luminance. */
export function luminance({ r, g, b }: Rgb): number {
  const linear = (value: number) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/** WCAG contrast ratio between two colors (1..21). */
export function contrast(a: Rgb, b: Rgb): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

export type AccentPalette = {
  /** The configured accent, used for fills. */
  base: string;
  /** Slightly lighter fill for hover states. */
  hover: string;
  /** Tint that stays readable as text on the page background. */
  text: string;
  /** Text color to use on top of an accent fill. */
  contrast: string;
};

const WHITE: Rgb = { r: 255, g: 255, b: 255 };
const INK: Rgb = { r: 9, g: 10, b: 13 };

/**
 * Derives the accent shades the theme needs from one hex color, so a single
 * environment variable can rebrand the site without breaking legibility.
 */
export function deriveAccent(hex: string, backgroundHex: string): AccentPalette {
  const base = parseHex(hex);
  const background = parseHex(backgroundHex);
  if (!base || !background) {
    throw new Error(`Cannot derive accent palette from "${hex}" on "${backgroundHex}".`);
  }

  let text = base;
  for (let step = 0; step < 20 && contrast(text, background) < 6; step += 1) {
    text = mix(text, WHITE, 0.08);
  }

  return {
    base: toHex(base),
    hover: toHex(mix(base, WHITE, 0.12)),
    text: toHex(text),
    contrast: contrast(base, WHITE) >= contrast(base, INK) ? "#ffffff" : toHex(INK),
  };
}
