"use client";

import { useState } from "react";

// Tipos de datos
type StringOrNumber = string | number;
type Primitive = string | number | boolean | undefined;

interface BaseUbicacion {
  localidad?: string;
  provincia?: string;
  direccion?: string;
  codigo_postal?: string;
}

interface Ubicacion extends BaseUbicacion {
  [key: string]: Primitive | Record<string, unknown>;
}

interface Sede extends BaseUbicacion {
  localidad: string;
  provincia: string;
  [key: string]: Primitive | Record<string, unknown>;
}

interface MetaData extends BaseUbicacion {
  _despacho_sedes?: Sede[];
  [key: string]: Primitive | Sede[] | Record<string, unknown> | undefined;
}

interface DespachoWP {
  object_id: string;
  id?: string | number;
  title?: { rendered?: string };
  content?: { rendered?: string };
  meta?: MetaData;
  localidad?: string;
  provincia?: string;
  nombre: string;
  email_contacto?: string;
  telefono?: string;
  ubicacion?: Ubicacion;
  _fromWordPress?: boolean;
  _fromSupabase?: boolean;
  [key: string]: Primitive | { rendered?: string } | MetaData | Ubicacion | undefined;
}

interface Props {
  onImport?: (objectId: string) => void;
}

export default function BuscadorDespachosWordpress({ onImport }: Props) {
  const [query, setQuery] = useState("");
  // Estado para la paginación
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 5,  // Reducido de 10 a 5 resultados por página
    total: 0,
    totalPages: 1
  });

  const [resultados, setResultados] = useState<DespachoWP[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importando, setImportando] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<Record<string, string>>({});
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
  const buscarDespachos = async (e: React.FormEvent | null, page: number = 1) => {
    e?.preventDefault?.();
    setLoading(true);
    setError(null);
    setImportResult({});

    try {
      console.log('🔍 Buscando despacho:', query, 'Página:', page);
      
      // Usar el endpoint de búsqueda con paginación
      const res = await fetch(
        `/api/search-despachos?query=${encodeURIComponent(query)}&page=${page}&perPage=${pagination.perPage}`
      );
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al buscar despachos');
      }

      const response = await res.json();
      console.log('📊 Resultados:', response);

      // Verificar si la respuesta incluye paginación
      if (response.pagination) {
        setPagination(prev => ({
          ...prev,
          page: response.pagination.page || page,
          total: response.pagination.total || 0,
          totalPages: response.pagination.totalPages || 1,
          perPage: response.pagination.perPage || prev.perPage
        }));
      } else {
        // Si no hay paginación en la respuesta, asumir que es de WordPress
        setPagination(prev => ({
          ...prev,
          page,
          total: response.length || 0,
          totalPages: 1
        }));
      }

      const data = response.data || response; // Soporte para respuesta antigua

      if (!data || data.length === 0) {
        setError('No se encontraron despachos con ese nombre');
        setResultados([]);
        return;
      }
      
      // Debug: Mostrar la estructura de los datos recibidos
      console.log('📦 Datos recibidos del API:', JSON.parse(JSON.stringify(data)));

      // Función para decodificar entidades HTML
      const decodeHtml = (html: any) => {
        if (!html) return '';
        const text = typeof html === 'string' ? html : html.rendered || '';
        return text
          .replace(/&#(\d+);/g, (match: string, dec: string) => String.fromCharCode(parseInt(dec, 10)))
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
      };
      
      // Mapear resultados al formato esperado
      const resultadosFormateados = data.map((d: any) => {
        console.log('🔍 Estructura del elemento:', JSON.parse(JSON.stringify(d)));
        
        // Extraer datos de ubicación de diferentes estructuras posibles
        const locationData = {
          // 1. Datos directos del objeto
          direct: {
            localidad: d.localidad || '',
            provincia: d.provincia || ''
          },
          // 2. Datos del meta
          meta: {
            localidad: d.meta?.localidad || '',
            provincia: d.meta?.provincia || ''
          },
          // 3. Datos de la primera sede
          sedePrincipal: Array.isArray(d.meta?._despacho_sedes) && d.meta._despacho_sedes.length > 0 
            ? d.meta._despacho_sedes[0] 
            : null,
          // 4. Datos de ubicación directa en el objeto
          ubicacion: d.ubicacion || {}
        };
        
        console.log('📍 Datos de ubicación extraídos:', locationData);
        
        // Determinar la localidad y provincia finales
        const localidad = locationData.sedePrincipal?.localidad || 
                         locationData.direct.localidad || 
                         locationData.meta.localidad ||
                         locationData.ubicacion.localidad ||
                         'No especificada';
                         
        const provincia = locationData.sedePrincipal?.provincia || 
                         locationData.direct.provincia || 
                         locationData.meta.provincia ||
                         locationData.ubicacion.provincia ||
                         'No especificada';
        
        // Crear el objeto de resultado
        const resultado = {
          object_id: d.id?.toString() || d.object_id || "",
          nombre: decodeHtml(d.title?.rendered || d.title || d.nombre || 'Sin título'),
          localidad: localidad,
          provincia: provincia,
          meta: {
            ...(d.meta || {}),
            localidad: localidad,
            provincia: provincia
          },
          // Mantener los datos originales para referencia
          _originalData: {
            ...d,
            // Ocultar propiedades grandes del console.log para mejor legibilidad
            content: d.content ? '[CONTENT]' : undefined,
            excerpt: d.excerpt ? '[EXCERPT]' : undefined
          }
        };
        
        console.log('📄 Resultado final:', JSON.parse(JSON.stringify(resultado)));
        return resultado;
      });

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
    setImportResult(prev => ({ ...prev, [objectId]: '' }));
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
          ? "✅ Despacho actualizado correctamente"
          : "✅ Despacho importado correctamente";
        setImportResult(prev => ({ ...prev, [objectId]: mensaje }));
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
      setImportResult(prev => ({ ...prev, [objectId]: `❌ ${error instanceof Error ? error.message : 'Error al importar'}` }));
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
        onSubmit={(e) => buscarDespachos(e, 1)}
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
      <div className="mt-4 max-h-[70vh] overflow-y-auto">
        {resultados.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
                <h4 className="font-semibold text-gray-900 text-base whitespace-nowrap">
                  {pagination.total} {pagination.total === 1 ? 'resultado' : 'resultados'} encontrados
                </h4>
                
                {pagination.totalPages > 1 && (
                  <div className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm">
                    <button
                      onClick={() => buscarDespachos(null, Math.max(1, pagination.page - 1))}
                      disabled={pagination.page === 1 || loading}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        pagination.page === 1 || loading
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      &larr; Anterior
                    </button>
                    <span className="text-sm text-gray-600 px-2 py-1 bg-gray-50 rounded">
                      {pagination.page} / {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => buscarDespachos(null, Math.min(pagination.totalPages, pagination.page + 1))}
                      disabled={pagination.page >= pagination.totalPages || loading}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        pagination.page >= pagination.totalPages || loading
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      Siguiente &rarr;
                    </button>
                  </div>
                )}
              </div>
              
              <div className="overflow-x-auto max-h-[40vh]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Localidad
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Provincia
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {resultados.map((d) => {
                      // Extraer todos los datos de ubicación disponibles
                      const meta = d.meta || {} as MetaData;
                      const primeraSede = Array.isArray(meta._despacho_sedes) && meta._despacho_sedes.length > 0 
                        ? meta._despacho_sedes[0] 
                        : null;
                      
                      // Determinar qué mostrar en la interfaz
                      const displayLocation = {
                        // Mostrar información de contacto si está disponible
                        localidad: primeraSede?.localidad || 
                                 (meta.localidad || d.localidad || d.ubicacion?.localidad || '').trim() || 
                                 'Sin ubicación registrada',
                                  
                        provincia: primeraSede?.provincia || 
                                  (meta.provincia || d.provincia || d.ubicacion?.provincia || '').trim() || 
                                  'No especificada',
                                  
                        // Mostrar información de contacto si está disponible
                        contacto: d.email_contacto || d.telefono 
                                ? `Contacto: ${d.email_contacto || ''} ${d.telefono ? `| Tel: ${d.telefono}` : ''}`.trim()
                                : null,
                                  
                        // Mostrar enlace al perfil si es de WordPress
                        enlace: d._fromWordPress 
                              ? `https://lexhoy.com/despacho/${meta.slug || ''}` 
                              : null
                      };
                      
                      // Depuración detallada
                      console.log('🔍 Datos completos del despacho:', {
                        id: d.id,
                        nombre: d.title?.rendered || d.nombre,
                        meta: meta,
                        primeraSede,
                        displayLocation
                      });
                      
                      console.log('📍 Ubicación a mostrar:', displayLocation);
                      
                      const yaImportado = d._fromSupabase || false;
                      const mensajeResultado = importResult[d.object_id];
                      
                      return (
                        <tr key={d.object_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {d.nombre}
                              {mensajeResultado && (
                                <div className={`text-xs mt-1 font-semibold ${mensajeResultado.includes('✅') ? 'text-green-600' : 'text-red-600'}`}>
                                  {mensajeResultado}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="font-medium">
                              {displayLocation.localidad}
                            </div>
                            {displayLocation.contacto && (
                              <div className="text-xs text-gray-500 mt-1">
                                {displayLocation.contacto}
                              </div>
                            )}
                            {displayLocation.enlace && (
                              <a 
                                href={displayLocation.enlace} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:underline mt-1 block"
                                title="Ver perfil completo"
                              >
                                Ver perfil en Lexhoy
                              </a>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="font-medium">
                              {displayLocation.provincia}
                            </div>
                            {d.id && d.id !== 'N/A' && (
                              <div className="text-xs text-gray-400 mt-1">
                                ID: {d.id}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              className={`${
                                yaImportado 
                                  ? 'bg-amber-600 hover:bg-amber-700' 
                                  : 'bg-green-600 hover:bg-green-700'
                              } text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm`}
                              onClick={() => importarDespacho(d.object_id)}
                              disabled={importando === d.object_id}
                            >
                              {importando === d.object_id
                                ? "Sincronizando..."
                                : yaImportado 
                                  ? "🔄 Actualizar" 
                                  : "📥 Importar"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {pagination.totalPages > 1 && (
                <div className="mt-4 flex justify-center sm:justify-end">
                  <div className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm">
                    <button
                      onClick={() => buscarDespachos(null, Math.max(1, pagination.page - 1))}
                      disabled={pagination.page === 1 || loading}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        pagination.page === 1 || loading
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      &larr; Anterior
                    </button>
                    <span className="text-sm text-gray-600 px-2 py-1 bg-gray-50 rounded">
                      {pagination.page} / {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => buscarDespachos(null, Math.min(pagination.totalPages, pagination.page + 1))}
                      disabled={pagination.page >= pagination.totalPages || loading}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        pagination.page >= pagination.totalPages || loading
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      Siguiente &rarr;
                    </button>
                  </div>
                </div>
              )}
              
              {importSummary?.despacho && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded p-4 text-xs text-gray-800">
                  <div className="font-bold mb-2">Resumen de importación:</div>
                  <pre className="overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(importSummary, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : null}
        
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
}
