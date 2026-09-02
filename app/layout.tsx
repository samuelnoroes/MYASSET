import type { Metadata } from "next";
import { DM_Serif_Display, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = DM_Serif_Display({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MyAsset — Gestão de carteira para corretores",
  description:
 "A carteira de imóveis do corretor numa tela só: visitas agendadas, metas de VGV, ficha pronta para compartilhar com o cliente e dados de mercado na palma da mão.",
  openGraph: {
    title: "MyAsset — Gestão de carteira para corretores",
    description:
 "A ferramenta que o corretor de alta performance usa para gerir a carteira, as visitas e as metas.",
    siteName: "MyAsset",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyAsset",
    description: "Gestão de carteira imobiliária para corretores.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="font-sans bg-cream text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
