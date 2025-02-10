import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="w-full h-screen flex">
      {/* Bloque Izquierdo - Texto centrado */}
      <div className="w-1/2 flex flex-col justify-center items-center p-10">
        <h1 className="text-5xl font-bold text-text font-bigShouldersText text-center">
          Impulsa tu negocio con leads de alta calidad
        </h1>
        <p className="text-lg text-gray-600 text-center mt-4">
          Encuentra compradores potenciales y aumenta tus ventas con nuestra
          plataforma.
        </p>
        <Link
          href="/register"
          className="bg-primary text-white px-4 py-2 mt-4 rounded-lg hover:bg-red-600 font-workSans"
        >
          Regístrate ahora
        </Link>
      </div>

      {/* Bloque Derecho - Imagen corregida */}
      <div className="w-1/2 relative">
        <Image
          src="/images/imageHero.webp" // ✅ Usamos la ruta directa en public/
          alt="Imagen representativa"
          fill // ✅ Nueva forma en Next.js 13+
          className="object-cover"
        />
      </div>
    </section>
  );
}
