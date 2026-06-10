import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        background: "#F5F1EA",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22,
        fontStyle: "italic",
        fontFamily: "Georgia, serif",
        color: "#C4A96B",
        fontWeight: 400,
      }}
    >
      M
    </div>
  );
}
