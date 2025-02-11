"use client"; // Asegúrate de que este archivo sea un Client Component

import { usePathname } from "next/navigation"; // Importamos el hook de Next.js para obtener la ruta actual
import Navbar from "@/components/Navbar"; // Navbar genérico
import { Big_Shoulders_Text, Work_Sans } from "next/font/google";
import "./globals.css";

// Fuentes
const bigShouldersText = Big_Shoulders_Text({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-big-shoulders-text",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-work-sans",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <html lang="es">
      <body
        className={`${bigShouldersText.variable} ${workSans.variable} bg-background text-text font-bigShouldersText`}
      >
        {/* Solo mostramos el Navbar genérico si no estamos en el dashboard */}
        {pathname.startsWith("/dashboard") ? null : <Navbar />}

        <main className="w-full">{children}</main>
      </body>
    </html>
  );
}
