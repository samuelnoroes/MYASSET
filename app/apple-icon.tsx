import { ImageResponse } from "next/og";
import { CrestGlyph } from "./lib/crestGlyph";

// iOS usa este arquivo (via <link rel="apple-touch-icon">, injetado
// automaticamente pelo Next) quando alguém adiciona o site à tela inicial.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<CrestGlyph boxSize={size.width} />, size);
}
