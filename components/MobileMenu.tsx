"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Slide-in Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 font-playfair">
            Menú
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Cerrar menú"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Menu Content */}
        <div className="flex flex-col h-[calc(100%-80px)] overflow-y-auto">
          {/* Navigation Links */}
          <nav className="flex flex-col p-6 space-y-4">
            <Link
              href="/"
              onClick={onClose}
              className="text-gray-700 hover:text-primary font-workSans font-medium text-lg transition-colors py-2"
            >
              Inicio
            </Link>
            <Link
              href="/sobre-nosotros"
              onClick={onClose}
              className="text-gray-700 hover:text-primary font-workSans font-medium text-lg transition-colors py-2"
            >
              Sobre Nosotros
            </Link>
            <Link
              href="/servicios"
              onClick={onClose}
              className="text-gray-700 hover:text-primary font-workSans font-medium text-lg transition-colors py-2"
            >
              Servicios
            </Link>
            <Link
              href="/contacto"
              onClick={onClose}
              className="text-gray-700 hover:text-primary font-workSans font-medium text-lg transition-colors py-2"
            >
              Contacto
            </Link>
          </nav>

          {/* Divider */}
          <div className="border-t border-gray-200 my-4" />

          {/* Auth Section */}
          <div className="px-6 pb-6 space-y-3">
            {!isAuthenticated ? (
              <>
                <Link
                  href="/login"
                  onClick={onClose}
                  className="block w-full text-center text-primary border border-primary px-4 py-3 rounded-lg hover:bg-primary hover:text-white font-workSans font-medium transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/register"
                  onClick={onClose}
                  className="block w-full text-center bg-primary text-white px-4 py-3 rounded-lg hover:bg-red-600 font-workSans font-medium transition-colors"
                >
                  Registrar Despacho
                </Link>
              </>
            ) : (
              <>
                {/* User Info */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {session?.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt="Avatar"
                      width={40}
                      height={40}
                      className="rounded-full border border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold">
                      {session?.user?.name?.charAt(0) || "U"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {session?.user?.name || "Usuario"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {session?.user?.email}
                    </p>
                  </div>
                </div>

                {/* Dashboard Link */}
                <Link
                  href="/dashboard"
                  onClick={onClose}
                  className="block w-full text-center bg-primary text-white px-4 py-3 rounded-lg hover:bg-red-600 font-workSans font-medium transition-colors"
                >
                  Ir al Dashboard
                </Link>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    onClose();
                    signOut({ callbackUrl: "/" });
                  }}
                  className="block w-full text-center text-gray-700 border border-gray-300 px-4 py-3 rounded-lg hover:bg-gray-50 font-workSans font-medium transition-colors"
                >
                  Cerrar Sesión
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
