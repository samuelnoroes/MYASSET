import { ImageResponse } from "next/og";
import { CrestGlyph } from "../lib/crestGlyph";

// Ícone 512x512 para o manifest (Android "Adicionar à tela inicial" / splash).
export async function GET() {
  return new ImageResponse(<CrestGlyph />, { width: 512, height: 512 });
}
