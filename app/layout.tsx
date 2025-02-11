import type { Metadata } from "next";
import {
  Big_Shoulders_Inline_Text,
  Big_Shoulders_Text,
  Work_Sans,
} from "next/font/google";
import Navbar from "@/components/Navbar";
import "./globals.css";

// Fuente para el logo (Big Shoulders Inline Text)
export const bigShouldersInlineText = Big_Shoulders_Inline_Text({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-big-shoulders-inline-text", // Definimos la variable CSS
});

// Fuente principal para textos (Big Shoulders Text)
const bigShouldersText = Big_Shoulders_Text({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-big-shoulders-text",
});

// Fuente para botones (Work Sans)
const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-work-sans",
});

export const metadata: Metadata = {
  title: "Lexhoy - Plataforma de Leads",
  description: "Compra y vende leads de alta calidad con Lexhoy.",
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://lexhoy.com",
    siteName: "Lexhoy",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body
        className={`${bigShouldersText.variable} ${workSans.variable} bg-background text-text font-bigShouldersText`}
      >
        <Navbar />
        <main className="w-full">{children}</main>
      </body>
    </html>
  );
}
