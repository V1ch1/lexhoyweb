import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import BuscadorDespachosWordpress from "@/components/BuscadorDespachosWordpress";

interface DespachoNoEncontradoProps {
  onImportSuccess?: () => void;
}

export function DespachoNoEncontrado({ onImportSuccess }: DespachoNoEncontradoProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);

  // Escuchar evento del sidebar para abrir modal
  useEffect(() => {
    const handleOpenModal = () => {
      setShowModal(true);
    };

    window.addEventListener('openImportModal', handleOpenModal);

    return () => {
      window.removeEventListener('openImportModal', handleOpenModal);
    };
  }, []);

  return (
    <>
      {/* Sección: ¿No encuentras tu despacho? */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border-2 border-blue-200 p-6">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            ¿No encuentras tu despacho?
          </h3>
          <p className="text-gray-700">
            Puedes importarlo desde nuestro directorio de Lexhoy.com o darlo
            de alta manualmente
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {/* Botón Importar desde Lexhoy.com */}
          <button
            onClick={() => setShowModal(true)}
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
                Importar desde Lexhoy.com
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Busca tu despacho en nuestro directorio de más de 10,000
                despachos jurídicos
              </p>
              <span className="text-blue-600 font-semibold text-sm group-hover:underline">
                Buscar e importar →
              </span>
            </div>
          </button>

          {/* Botón Dar de alta nuevo despacho */}
          <button
            onClick={() => router.push("/dashboard/despachos/nuevo")}
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

      {/* Modal para importar desde Lexhoy.com */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-[90%] max-w-[90%] max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-3 text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
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
                <div>
                  <h2 className="text-2xl font-bold">
                    Importar Despacho desde Lexhoy.com
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    Busca tu despacho en nuestro directorio
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">¿Cómo funciona?</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>
                        Busca tu despacho por nombre, localidad o provincia
                      </li>
                      <li>
                        Haz clic en &quot;Importar&quot; para añadirlo a la
                        plataforma
                      </li>
                      <li>
                        Una vez importado, aparecerá en la lista principal
                      </li>
                      <li>Podrás solicitar la propiedad para gestionarlo</li>
                    </ol>
                  </div>
                </div>
              </div>
              <BuscadorDespachosWordpress
                onImport={async (objectId) => {
                  try {
                    // Llamar a la API para importar el despacho
                    const response = await fetch('/api/despachos/wordpress/importar', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ objectId }),
                    });

                    const result = await response.json();

                    if (!response.ok) {
                      throw new Error(result.error || 'Error al importar el despacho');
                    }

                    // Cerrar el modal
                    setShowModal(false);
                    
                    // Notificar al componente padre si es necesario
                    if (onImportSuccess) {
                      onImportSuccess();
                    }
                    
                    return { success: true };
                  } catch (error) {
                    console.error('Error al importar el despacho:', error);
                    return { 
                      success: false, 
                      error: error instanceof Error ? error.message : 'Error desconocido al importar el despacho' 
                    };
                  }
                }}
                onClose={() => setShowModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
