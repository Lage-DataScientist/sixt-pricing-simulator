import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIXT Pricing Simulator",
  description: "Simulador de Pricing de Protecoes SIXT Portugal - SMART+, All Inclusive e Pack Easy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt" className={`${inter.variable} h-full antialiased bg-background`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
