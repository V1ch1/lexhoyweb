import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md h-32 px-6 flex justify-between items-center">
      {/* Logo con Big Shoulders Inline Text */}
      <Link href="/">
        <h1 className="text-4xl font-bold text-text font-bigShouldersInline">
          Lexhoy Leads
        </h1>
      </Link>
      <div className="flex space-x-4">
        {/* Botón con Work Sans */}
        <Link
          href="/login"
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-600 font-workSans"
        >
          Acceso Plataforma
        </Link>
      </div>
    </nav>
  );
}
