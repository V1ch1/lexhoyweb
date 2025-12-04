"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import MobileMenu from "./MobileMenu";

export default function Navbar() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="bg-white shadow-md h-20 px-6 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <span className="text-2xl font-bold text-gray-900 font-playfair">
            LexHoy
          </span>
        </Link>

        {/* Navegación central - Hidden on mobile */}
        <div className="hidden md:flex space-x-8">
          <Link
            href="/sobre-nosotros"
            className="text-gray-700 hover:text-primary font-workSans font-medium transition-colors"
          >
            Sobre Nosotros
          </Link>
          <Link
            href="/servicios"
            className="text-gray-700 hover:text-primary font-workSans font-medium transition-colors"
          >
            Servicios
          </Link>
          <Link
            href="/contacto"
            className="text-gray-700 hover:text-primary font-workSans font-medium transition-colors"
          >
            Contacto
          </Link>
        </div>

        {/* Botones de acción - Hidden on mobile */}
        <div className="hidden md:flex items-center space-x-4">
          {!isAuthenticated ? (
            <>
              <Link
                href="/login"
                className="text-primary border border-primary px-4 py-2 rounded-lg hover:bg-primary hover:text-white font-workSans transition-colors"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/register"
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-600 font-workSans transition-colors"
              >
                Registrar Despacho
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-primary font-workSans font-medium transition-colors"
              >
                Dashboard
              </Link>
              <div className="flex items-center gap-3 border-l pl-4 ml-2">
                {session?.user?.image ? (
                  <Image
                    src={session.user.image}
                    alt="Avatar"
                    width={32}
                    height={32}
                    className="rounded-full border border-gray-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">
                    {session?.user?.name?.charAt(0) || "U"}
                  </div>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-sm text-gray-500 hover:text-red-600 font-medium"
                >
                  Salir
                </button>
              </div>
            </>
          )}
        </div>

        {/* Hamburger Button - Visible only on mobile */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Abrir menú"
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </>
  );
}
