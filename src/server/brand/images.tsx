import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/config/site";
import { PAGE_BACKGROUND } from "@/config/site-schema";
import { capabilities } from "@/content/capabilities";

/**
 * Brand images generated at build time from the site config, so a renamed or
 * recolored deployment gets matching icons and a matching social card.
 */

const { accent } = site.theme;

/** The logo mark as standalone SVG, for the favicon. */
export function markSvg(): string {
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">',
    `<rect x="1.5" y="1.5" width="14.5" height="14.5" rx="4.25" fill="${accent.base}" opacity="0.45"/>`,
    `<rect x="8" y="8" width="14.5" height="14.5" rx="4.25" fill="${accent.base}"/>`,
    `<circle cx="15.25" cy="15.25" r="2.4" fill="${accent.contrast}"/>`,
    "</svg>",
  ].join("");
}

function Mark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect
        x="1.5"
        y="1.5"
        width="14.5"
        height="14.5"
        rx="4.25"
        fill={accent.base}
        opacity="0.45"
      />
      <rect x="8" y="8" width="14.5" height="14.5" rx="4.25" fill={accent.base} />
      <circle cx="15.25" cy="15.25" r="2.4" fill={accent.contrast} />
    </svg>
  );
}

/**
 * Square app icon. The background runs to the edges and the mark stays inside
 * the central safe zone, so the same image works as a maskable icon and on iOS.
 */
export function appIcon(size: number): ImageResponse {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0f1115",
      }}
    >
      <Mark size={Math.round(size * 0.56)} />
    </div>,
    { width: size, height: size },
  );
}

const fontFile = (name: string) =>
  readFile(path.join(process.cwd(), "node_modules/geist/dist/fonts/geist-sans", name));

/** 1200 x 630 card used when a page is shared. */
export async function socialCard(): Promise<ImageResponse> {
  const [semibold, regular] = await Promise.all([
    fontFile("Geist-SemiBold.ttf"),
    fontFile("Geist-Regular.ttf"),
  ]);

  const headline = site.product.tagline;
  // Long taglines step down in size so they stay within two lines.
  const headlineSize = headline.length > 44 ? 60 : headline.length > 30 ? 72 : 84;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        backgroundColor: PAGE_BACKGROUND,
        backgroundImage: `radial-gradient(circle at 85% -10%, ${accent.base}66 0%, ${accent.base}00 55%), radial-gradient(circle at 0% 110%, ${accent.base}33 0%, ${accent.base}00 45%)`,
        color: "#f3f4f6",
        fontFamily: "Geist",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <Mark size={56} />
          <div style={{ marginLeft: 18, fontSize: 36, fontWeight: 600, letterSpacing: "-0.02em" }}>
            {site.product.name}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#7f8592" }}>{site.host}</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            maxWidth: 980,
            fontSize: headlineSize,
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: "-0.035em",
          }}
        >
          {headline}
        </div>
        <div
          style={{
            display: "flex",
            maxWidth: 900,
            marginTop: 26,
            fontSize: 30,
            lineHeight: 1.4,
            color: "#a6abb6",
          }}
        >
          Build, deploy and govern autonomous AI agents on one platform.
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {capabilities.map((capability) => (
          <div
            key={capability.slug}
            style={{
              display: "flex",
              marginRight: 10,
              marginTop: 10,
              padding: "8px 16px",
              borderRadius: 999,
              border: "1px solid rgba(255, 255, 255, 0.16)",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              fontSize: 20,
              color: "#c9cdd6",
            }}
          >
            {capability.name}
          </div>
        ))}
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Geist", data: semibold, weight: 600, style: "normal" },
        { name: "Geist", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
