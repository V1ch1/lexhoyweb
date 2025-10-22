"use client"; // Asegúrate de que este archivo sea un Client Component

import { usePathname } from "next/navigation"; // Importamos el hook de Next.js para obtener la ruta actual
import Navbar from "@/components/Navbar"; // Navbar genérico
import Footer from "@/components/Footer"; // Footer
import { AuthProvider } from "@/lib/authContext"; // Contexto de autenticación
import { Inter, Work_Sans } from "next/font/google";
import { Toaster } from 'react-hot-toast';
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
    <html lang="es">
      <body
        suppressHydrationWarning={true}
        className={`${inter.variable} ${workSans.variable} font-sans bg-gray-50`}
      >
        <AuthProvider>
          {/* Solo mostramos el Navbar genérico si no estamos en dashboard o admin */}
          {!isAdminOrDashboard && <Navbar />}

          <main className="w-full">{children}</main>

          {/* Solo mostramos el Footer si no estamos en dashboard o admin */}
          {!isAdminOrDashboard && <Footer />}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
