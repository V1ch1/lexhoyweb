"use client";

import { useState } from "react";

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
      console.log('🔍 Buscando despacho:', query);
      
      // Usar el endpoint de búsqueda mejorado
      const res = await fetch(`/api/search-despachos?query=${encodeURIComponent(query)}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al buscar despachos');
      }

      const data = await res.json();
      console.log('📊 Resultados:', data);

      if (!data || data.length === 0) {
        setError('No se encontraron despachos con ese nombre');
        return;
      }

      // Función para decodificar entidades HTML
      const decodeHtml = (html: string) => {
        if (!html) return '';
        return html
          .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
      };
      
      // Mapear resultados al formato esperado
      const resultadosFormateados = data.map((d: {
        id: string | number;
        title?: { rendered?: string };
        meta?: { localidad?: string; provincia?: string; [key: string]: unknown };
        [key: string]: unknown;
      }) => ({
        object_id: d.id?.toString() || "",
        nombre: decodeHtml(d.title?.rendered || 'Sin título'),
        localidad: d.meta?.localidad || '',
        provincia: d.meta?.provincia || '',
        ...d
      }));

      setResultados(resultadosFormateados);
    } catch (err) {
      console.error('❌ Error en buscarDespachos:', err);
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
      console.log('📥 Importando/Actualizando despacho:', objectId);
      
      // 1. Verificar si el despacho ya existe en Supabase
      let yaExiste = false;
      const checkRes = await fetch(`/api/despachos/check?object_id=${encodeURIComponent(objectId)}`);
      if (checkRes.ok) {
        const checkData = await checkRes.json();
        yaExiste = checkData.exists;
        if (yaExiste) {
          console.log('ℹ️ El despacho ya existe, se actualizará con datos de WordPress');
        }
      }
      
      // 2. Si ya existe en Supabase, obtener los datos de WordPress directamente
      let wpDespacho;
      
      if (yaExiste) {
        // Buscar en WordPress por el object_id
        console.log('🌐 Buscando datos actualizados en WordPress...');
        const wpRes = await fetch(`https://lexhoy.com/wp-json/wp/v2/despacho/${objectId}`);
        
        if (!wpRes.ok) {
          throw new Error('No se encontró el despacho en WordPress. Verifica que el ID sea correcto.');
        }
        
        wpDespacho = await wpRes.json();
        console.log('📄 Datos de WordPress obtenidos:', wpDespacho);
      } else {
        // Buscar usando el endpoint de búsqueda
        const res = await fetch(`/api/search-despachos?id=${encodeURIComponent(objectId)}`);
        
        if (!res.ok) {
          throw new Error('No se encontró el despacho en WordPress');
        }

        const data = await res.json();
        
        if (!data || data.length === 0) {
          throw new Error('No se encontró el despacho en WordPress');
        }

        wpDespacho = data[0];
        console.log('📄 Despacho de WordPress:', wpDespacho);
      }

      // 3. Importar usando el endpoint API
      const importRes = await fetch('/api/importar-despacho', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ despachoWP: wpDespacho }),
      });

      if (!importRes.ok) {
        const errorData = await importRes.json();
        console.error('❌ Error del servidor:', errorData);
        throw new Error(errorData.details || errorData.error || 'Error al importar despacho');
      }

      const { success, despachoId, objectId: wpObjectId, error } = await importRes.json();
      
      if (success && despachoId) {
        const mensaje = yaExiste 
          ? "✅ Despacho actualizado correctamente desde WordPress"
          : "✅ Despacho importado correctamente desde WordPress";
        setImportResult(mensaje);
        setImportSummary({
          success: true,
          message: `${yaExiste ? 'Actualizado' : 'Importado'} correctamente. ID: ${despachoId}, Object ID: ${wpObjectId}`
        });
        if (onImport) onImport(objectId);
      } else {
        throw new Error(error || 'Error al importar el despacho');
      }
    } catch (error) {
      console.error('❌ Error en importarDespacho:', error);
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
          className="border border-gray-300 rounded px-3 py-2 w-full sm:w-80 text-gray-900 placeholder-gray-500"
          placeholder="Buscar despacho por nombre"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors font-medium"
          disabled={loading || !query}
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </form>
      {error && <div className="text-red-600 font-medium mb-2">{error}</div>}
      {resultados.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 overflow-x-auto">
          <h4 className="font-semibold text-gray-900 mb-3 text-base">
            Resultados ({resultados.length}):
          </h4>
          <table className="min-w-full">
            <thead>
              <tr className="border-b-2 border-gray-300 bg-gray-50">
                <th className="text-left p-3 font-semibold text-gray-900">Nombre</th>
                <th className="text-left p-3 font-semibold text-gray-900">Localidad</th>
                <th className="text-left p-3 font-semibold text-gray-900">Provincia</th>
                <th className="text-left p-3 font-semibold text-gray-900">Acción</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((d) => {
                // Extraer localidad y provincia de meta o de _despacho_sedes
                const localidad = d.meta?.localidad || 
                  (d.meta?._despacho_sedes && Array.isArray(d.meta._despacho_sedes) && d.meta._despacho_sedes[0]?.localidad) || 
                  d.localidad || 
                  '-';
                const provincia = d.meta?.provincia || 
                  (d.meta?._despacho_sedes && Array.isArray(d.meta._despacho_sedes) && d.meta._despacho_sedes[0]?.provincia) || 
                  d.provincia || 
                  '-';
                
                return (
                  <tr key={d.object_id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-medium text-gray-900">{d.nombre}</td>
                    <td className="p-3 text-gray-700">{localidad}</td>
                    <td className="p-3 text-gray-700">{provincia}</td>
                    <td className="p-3">
                      <button
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        onClick={() => importarDespacho(d.object_id)}
                        disabled={importando === d.object_id}
                      >
                        {importando === d.object_id
                          ? "Sincronizando..."
                          : "Importar/Actualizar"}
                      </button>
                    </td>
                  </tr>
                );
              })}
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
