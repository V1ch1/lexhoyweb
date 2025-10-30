import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="w-full h-screen flex">
      {/* Bloque Izquierdo - Texto centrado */}
      <div className="w-1/2 flex flex-col justify-center items-center p-10">
        <h1 className="text-5xl font-bold text-text font-playfair text-center">
          Portal Exclusivo para Despachos de Abogados
        </h1>
        <p className="text-lg text-gray-600 text-center mt-4 max-w-lg">
          Gestiona tu despacho, actualiza tu perfil profesional y conecta con
          clientes potenciales a través de nuestra red de más de 10.000
          despachos en España.
        </p>
        <div className="flex space-x-4 mt-6">
          <Link
            href="/register"
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-colors"
          >
            Registrar Despacho
          </Link>
          <Link
            href="/login"
            className="border border-primary text-primary px-6 py-3 rounded-lg hover:bg-primary hover:text-white transition-colors"
          >
            Acceder al Portal
          </Link>
        </div>
      </div>

      {/* Bloque Derecho - Imagen */}
      <div className="w-1/2 relative">
        <Image
          src="/images/imageHero.webp"
          alt="Despacho de abogados profesional"
          fill
          className="object-cover"
        />
      </div>
    </section>
  );
}
