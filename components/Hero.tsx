"use client";

import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  return (
    <section className="w-full min-h-[600px] md:h-screen flex flex-col md:flex-row">
      {/* Bloque Izquierdo - Texto centrado */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-10 order-2 md:order-1">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text font-playfair text-center">
          Portal Exclusivo para Despachos de Abogados
        </h1>
        <p className="text-base md:text-lg text-gray-600 text-center mt-4 max-w-lg px-4 md:px-0">
          Gestiona tu despacho, actualiza tu perfil profesional y conecta con
          clientes potenciales a través de nuestra red de más de 10.000
          despachos en España.
        </p>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-6 w-full sm:w-auto px-4 sm:px-0">
          {!isAuthenticated ? (
            <>
              <Link
                href="/register"
                className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors text-center"
              >
                Registrar Despacho
              </Link>
              <Link
                href="/login"
                className="border border-primary text-primary px-6 py-3 rounded-lg hover:bg-primary hover:text-white transition-colors text-center"
              >
                Acceder al Portal
              </Link>
            </>
          ) : (
            <Link
              href="/dashboard"
              className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-red-600 transition-colors font-medium text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all text-center"
            >
              Ir a mi Dashboard
            </Link>
          )}
        </div>
      </div>

      {/* Bloque Derecho - Imagen */}
      <div className="w-full md:w-1/2 relative h-[300px] md:h-auto order-1 md:order-2">
        <Image
          src="/images/imageHero.webp"
          alt="Despacho de abogados profesional"
          fill
          className="object-cover"
          priority
        />
      </div>
    </section>
  );
}
