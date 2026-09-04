import { ImageResponse } from "next/og";
import { CrestGlyph } from "./lib/crestGlyph";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<CrestGlyph />, size);
}
