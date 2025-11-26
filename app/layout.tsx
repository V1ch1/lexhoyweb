"use client"; // Asegúrate de que este archivo sea un Client Component

import { usePathname } from "next/navigation"; // Importamos el hook de Next.js para obtener la ruta actual
import { SessionProvider } from "next-auth/react";
import Navbar from "@/components/Navbar"; // Navbar genérico
import Footer from "@/components/Footer"; // Footer
import { Inter, Work_Sans, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

// Fuentes
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-inter",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-work-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
  style: ["normal", "italic"],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Ocultar navbar y footer en dashboard y admin
  const isAdminOrDashboard =
    pathname.startsWith("/dashboard") || pathname.startsWith("/admin");

  return (
    <SessionProvider>
      <html
        lang="es"
        className={`${inter.variable} ${workSans.variable} ${playfair.variable}`}
      >
        <body
          suppressHydrationWarning={true}
          className={`${inter.className} font-sans bg-gray-50`}
        >
          {/* Solo mostramos el Navbar genérico si no estamos en dashboard o admin */}
          {!isAdminOrDashboard && <Navbar />}

          <main className="w-full min-h-screen">{children}</main>

          {/* Solo mostramos el Footer si no estamos en dashboard o admin */}
          {!isAdminOrDashboard && <Footer />}
          <Toaster position="top-right" richColors closeButton />
        </body>
      </html>
    </SessionProvider>
  );
}
