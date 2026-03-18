import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BR Masters - Palpites de Futebol",
  description: "O melhor jogo de palpites de futebol do Brasil. Faça suas previsões, escale o ranking e prove que você é um verdadeiro mestre!",
  icons: {
    icon: [{ url: "/images/brm-icon.svg", type: "image/svg+xml" }],
    shortcut: "/images/brm-icon.svg",
    apple: "/images/brm-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
