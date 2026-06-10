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
  title: "MyAsset — Gestão de portfólio imobiliário",
  description:
 "Acompanhe yield, ROI e fluxo de caixa dos seus imóveis com clareza. Cadastre ativos, lance receitas e despesas, e veja o desempenho do seu portfólio em tempo real.",
  openGraph: {
    title: "MyAsset — Gestão de portfólio imobiliário",
    description:
 "A clareza que o investidor imobiliário sempre quis sobre o próprio patrimônio.",
    siteName: "MyAsset",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MyAsset",
    description: "Gestão de portfólio imobiliário para investidores.",
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
