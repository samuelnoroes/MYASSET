import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        background: "#F5F1EA",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
      }}
    >
      <div
        style={{
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          fontSize: 120,
          color: "#2D4A3E",
          lineHeight: 1,
          marginBottom: 32,
        }}
      >
        MyAsset
      </div>
      <div
        style={{
          fontFamily: "system-ui, sans-serif",
          fontSize: 28,
          color: "#1A1A1A",
          opacity: 0.55,
          textAlign: "center",
          maxWidth: 700,
        }}
      >
        Gestão de portfólio imobiliário para investidores
      </div>
    </div>
  );
}
