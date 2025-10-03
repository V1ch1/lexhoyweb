"use client";

import { useState } from "react";
import { DespachoService } from "@/lib/despachoService";

// Tipos de datos
interface DespachoWP {
  object_id: string;
  id?: string | number;
  title?: { rendered?: string };
  content?: { rendered?: string };
  meta?: {
    localidad?: string;
    provincia?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
  nombre: string;
  localidad?: string;
  provincia?: string;
  email_contacto?: string;
  telefono?: string;
}


interface Props {
  onImport?: (objectId: string) => void;
}

export default function BuscadorDespachosWordpress({ onImport }: Props) {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<DespachoWP[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importando, setImportando] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<{
    success: boolean;
    despacho?: {
      id: string | number;
      wp_id: string | number;
      titulo: string;
      contenido: string;
      estado: string;
      fecha_publicacion: string;
      actualizado_en: string;
      [key: string]: unknown;
    };
    message?: string;
    error?: string;
  } | null>(null);

  // Buscar despachos en WordPress usando la API real
  const buscarDespachos = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResultados([]);
    setImportResult(null);

    try {
      // Usamos el servicio para buscar el despacho por ID
      const { success, data, error } = await DespachoService.buscarDespacho(query);
      
      if (!success) {
        throw new Error(error || 'Error al buscar el despacho');
      }

      // Mapear el resultado al formato esperado por el componente
      const resultadoWP: DespachoWP = {
        object_id: data.id?.toString() || "",
        nombre: data.title?.rendered || 'Sin título',
        localidad: data.meta?.localidad || '',
        provincia: data.meta?.provincia || '',
        ...data
      };

      setResultados([resultadoWP]);
    } catch (err) {
      console.error('Error en buscarDespachos:', err);
      setError(err instanceof Error ? err.message : 'Error al buscar el despacho');
    } finally {
      setLoading(false);
    }
  };

  const importarDespacho = async (objectId: string) => {
    setImportando(objectId);
    setImportResult(null);
    setImportSummary(null);
    
    try {
      // 1. Primero buscamos el despacho en WordPress
      const { success: existeEnWP, data: wpDespacho } = await DespachoService.buscarDespacho(objectId);
      
      if (!existeEnWP || !wpDespacho) {
        throw new Error('No se encontró el despacho en WordPress');
      }

      // 2. Importamos el despacho a Supabase
      const { success, data: despachoImportado, error } = await DespachoService.importarDeWordPress(wpDespacho);
      
      if (success && despachoImportado) {
        setImportResult("✅ Despacho importado correctamente");
        setImportSummary({
          success: true,
          despacho: despachoImportado,
          message: 'El despacho se ha importado correctamente a la base de datos'
        });
        if (onImport) onImport(objectId);
      } else {
        throw new Error(error || 'Error al importar el despacho');
      }
    } catch (error) {
      console.error('Error en importarDespacho:', error);
      setImportResult(`❌ ${error instanceof Error ? error.message : 'Error al importar el despacho'}`);
      setImportSummary({
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    } finally {
      setImportando(null);
    }
  };

  return (
    <div className="mb-6">
      <form
        onSubmit={buscarDespachos}
        className="flex flex-col sm:flex-row gap-4 items-center mb-4"
      >
        <input
          type="text"
          className="border border-gray-300 rounded px-3 py-2 w-full sm:w-80"
          placeholder="Buscar despacho por ID"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          disabled={loading || !query}
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </form>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {resultados.length > 0 && (
        <div className="bg-gray-50 rounded p-4 overflow-x-auto">
          <h4 className="font-semibold mb-2">Resultados:</h4>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Nombre</th>
                <th className="text-left p-2">Localidad</th>
                <th className="text-left p-2">Provincia</th>
                <th className="text-left p-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((d) => (
                <tr key={d.object_id} className="border-b last:border-b-0">
                  <td className="p-2 font-medium">{d.nombre}</td>
                  <td className="p-2">{d.localidad || ""}</td>
                  <td className="p-2">{d.provincia || ""}</td>
                  <td className="p-2">
                    <button
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm disabled:opacity-50"
                      onClick={() => importarDespacho(d.object_id)}
                      disabled={importando === d.object_id}
                    >
                      {importando === d.object_id
                        ? "Importando..."
                        : "Importar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {importResult && (
            <div className="mt-2 text-sm font-semibold text-green-700">
              {importResult}
            </div>
          )}
          {importSummary && importSummary.despacho && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded p-4 text-xs text-gray-800">
              <div className="font-bold mb-2">Resumen de importación:</div>
              <pre className="overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(importSummary, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
