import { ImageResponse } from "next/og";
import { CrestGlyph } from "../lib/crestGlyph";

// Ícone 192x192 para o manifest (Android "Adicionar à tela inicial").
export async function GET() {
  return new ImageResponse(<CrestGlyph />, { width: 192, height: 192 });
}
