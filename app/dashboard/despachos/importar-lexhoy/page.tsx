"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import BuscadorDespachosWordpress from "@/components/BuscadorDespachosWordpress";

export default function ImportarLexhoyPage() {
  const router = useRouter();
  const [importSuccess, setImportSuccess] = useState(false);

  const handleImportSuccess = () => {
    setImportSuccess(true);
    setTimeout(() => {
      router.push('/dashboard/despachos/ver-despachos');
    }, 2000);
  };

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/dashboard/despachos')}
          className="mb-3 text-blue-600 hover:text-blue-700 font-medium flex items-center text-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Despachos
        </button>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Importar Despacho de Lexhoy
        </h1>
        <p className="text-lg text-gray-600">
          Busca e importa tu despacho desde el directorio de Lexhoy
        </p>
      </div>

      {/* Success Message */}
      {importSuccess && (
        <div className="mb-6 p-4 rounded-lg flex items-center bg-green-50 text-green-800">
          <svg className="h-5 w-5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>¡Despacho importado correctamente! Redirigiendo...</span>
        </div>
      )}

      {/* Info Card */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              ¿Cómo funciona la importación?
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Busca tu despacho en el directorio de Lexhoy</li>
                <li>Selecciona el despacho correcto de los resultados</li>
                <li>El despacho se importará automáticamente a tu cuenta</li>
                <li>Podrás gestionar toda la información desde el panel</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Buscador Component */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <BuscadorDespachosWordpress onImportSuccess={handleImportSuccess} />
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 bg-gray-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ¿No encuentras tu despacho?
        </h3>
        <p className="text-gray-600 mb-4">
          Si no encuentras tu despacho en el directorio de Lexhoy, puedes:
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push('/dashboard/despachos/crear')}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Dar de Alta Nuevo Despacho
          </button>
          <button
            onClick={() => router.push('/dashboard/despachos/ver-despachos')}
            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Ver Todos los Despachos
          </button>
        </div>
      </div>
    </div>
  );
}
