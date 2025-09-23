import Link from "next/link";

export default function PublicNavbar() {
  return (
    <nav className="bg-white shadow-md h-20 px-6 flex justify-between items-center">
      {/* Logo */}
      <Link href="/" className="cursor-pointer no-underline" prefetch={false}>
        <h1 className="text-3xl font-bold text-gray-900">
          Lexhoy Portal
        </h1>
      </Link>
      
      {/* Navegación central */}
      <div className="hidden md:flex space-x-8">
        <Link
          href="/sobre-nosotros"
          className="text-gray-700 hover:text-red-600 font-medium transition-colors"
        >
          Sobre Nosotros
        </Link>
        <Link
          href="/servicios"
          className="text-gray-700 hover:text-red-600 font-medium transition-colors"
        >
          Servicios
        </Link>
        <Link
          href="/contacto"
          className="text-gray-700 hover:text-red-600 font-medium transition-colors"
        >
          Contacto
        </Link>
      </div>

      {/* Botones de acción */}
      <div className="flex space-x-4">
        <Link
          href="/login"
          className="text-red-600 border border-red-600 px-4 py-2 rounded-lg hover:bg-red-600 hover:text-white transition-colors"
        >
          Iniciar Sesión
        </Link>
        <Link
          href="/register"
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Registrar Despacho
        </Link>
      </div>
    </nav>
  );
}