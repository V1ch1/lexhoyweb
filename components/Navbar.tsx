import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md h-20 px-6 flex justify-between items-center">
      {/* Logo */}
      <Link href="/">
        <h1 className="text-3xl font-bold text-text font-bigShouldersInlineText">
          Lexhoy Portal
        </h1>
      </Link>
      
      {/* Navegación central */}
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

      {/* Botones de acción */}
      <div className="flex space-x-4">
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
      </div>
    </nav>
  );
}
