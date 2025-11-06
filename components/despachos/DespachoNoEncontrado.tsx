import { useRouter } from "next/navigation";

export function DespachoNoEncontrado() {
  const router = useRouter();

  return (
    <>
      {/* Sección: ¿No encuentras tu despacho? */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border-2 border-blue-200 p-6">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            ¿No encuentras tu despacho?
          </h3>
          <p className="text-gray-700">
            Puedes buscarlo en nuestro directorio de Lexhoy.com o darlo
            de alta manualmente
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {/* Botón Buscar en Lexhoy.com */}
          <button
            onClick={() => router.push("/dashboard/despachos/ver-despachos")}
            className="group relative bg-white hover:bg-blue-50 border-2 border-blue-300 hover:border-blue-500 rounded-xl p-6 transition-all duration-200 hover:shadow-lg"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-100 group-hover:bg-blue-200 rounded-full p-4 mb-4 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-blue-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                Buscar mi despacho
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Busca tu despacho en nuestro directorio de más de 10,000
                despachos jurídicos y solicita la propiedad
              </p>
              <span className="text-blue-600 font-semibold text-sm group-hover:underline">
                Buscar despacho →
              </span>
            </div>
          </button>

          {/* Botón Dar de alta nuevo despacho */}
          <button
            onClick={() => router.push("/dashboard/despachos/crear")}
            className="group relative bg-white hover:bg-green-50 border-2 border-green-300 hover:border-green-500 rounded-xl p-6 transition-all duration-200 hover:shadow-lg"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-green-100 group-hover:bg-green-200 rounded-full p-4 mb-4 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                Dar de alta nuevo despacho
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Crea un despacho desde cero con toda la información necesaria
              </p>
              <span className="text-green-600 font-semibold text-sm group-hover:underline">
                Crear despacho →
              </span>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
