import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MyAsset",
    short_name: "MyAsset",
    description: "Gestão de carteira e IA imobiliária no WhatsApp.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0C0D0F",
    theme_color: "#0C0D0F",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png" },
    ],
  };
}
