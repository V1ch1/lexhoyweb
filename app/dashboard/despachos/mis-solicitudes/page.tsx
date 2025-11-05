'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabase';

interface Solicitud {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  despacho_id: string;
  despacho_nombre: string;
  despacho_localidad?: string;
  despacho_provincia?: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  fecha_solicitud: string;
  fecha_respuesta?: string;
  notas_respuesta?: string;
}

export default function MisSolicitudesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [cancelando, setCancelando] = useState<string | null>(null);

  // Load user's solicitudes
  useEffect(() => {
    const loadSolicitudes = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setMessage({
            type: 'error',
            text: 'No estás autenticado'
          });
          return;
        }

        const response = await fetch('/api/mis-solicitudes', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Error al cargar las solicitudes');
        }

        const data = await response.json();
        setSolicitudes(data);
      } catch (error) {
        console.error('Error al cargar las solicitudes:', error);
        setMessage({
          type: 'error',
          text: 'Error al cargar las solicitudes. Por favor, inténtalo de nuevo.'
        });
      } finally {
        setLoading(false);
      }
    };

    loadSolicitudes();
  }, [user]);

  // Cancelar solicitud
  const handleCancelarSolicitud = async (solicitudId: string) => {
    try {
      setCancelando(solicitudId);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setMessage({
          type: 'error',
          text: 'No estás autenticado'
        });
        return;
      }

      const response = await fetch('/api/cancelar-solicitud-despacho', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ solicitudId }),
      });

      if (!response.ok) {
        throw new Error('Error al cancelar la solicitud');
      }

      // Actualizar lista local
      setSolicitudes(prev => prev.filter(s => s.id !== solicitudId));
      
      setMessage({
        type: 'success',
        text: 'Solicitud cancelada correctamente'
      });
    } catch (error) {
      console.error('Error al cancelar solicitud:', error);
      setMessage({
        type: 'error',
        text: 'Error al cancelar la solicitud. Por favor, inténtalo de nuevo.'
      });
    } finally {
      setCancelando(null);
    }
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'aprobada':
        return 'bg-green-100 text-green-800';
      case 'rechazada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return '⏳';
      case 'aprobada':
        return '✅';
      case 'rechazada':
        return '❌';
      default:
        return '📋';
    }
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
          Mis Solicitudes
        </h1>
        <p className="text-lg text-gray-600">
          Revisa el estado de tus solicitudes de acceso a despachos
        </p>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <svg className="h-5 w-5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-5 w-5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <span className="sr-only">Cargando solicitudes...</span>
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tienes solicitudes</h3>
              <p className="mt-1 text-sm text-gray-500">
                Cuando solicites acceso a un despacho, aparecerá aquí.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => router.push('/dashboard/despachos/ver-despachos')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Buscar Despachos
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {solicitudes.map((solicitud) => (
                <div
                  key={solicitud.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {solicitud.despacho_nombre}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoBadge(solicitud.estado)}`}>
                          {getEstadoIcon(solicitud.estado)} {solicitud.estado.charAt(0).toUpperCase() + solicitud.estado.slice(1)}
                        </span>
                      </div>
                      
                      {(solicitud.despacho_localidad || solicitud.despacho_provincia) && (
                        <p className="text-sm text-gray-600 mb-2">
                          📍 {solicitud.despacho_localidad}{solicitud.despacho_provincia && `, ${solicitud.despacho_provincia}`}
                        </p>
                      )}
                      
                      <p className="text-sm text-gray-500">
                        Solicitado el {new Date(solicitud.fecha_solicitud).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      
                      {solicitud.fecha_respuesta && (
                        <p className="text-sm text-gray-500 mt-1">
                          Respondido el {new Date(solicitud.fecha_respuesta).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                      
                      {solicitud.notas_respuesta && (
                        <div className={`mt-3 border-l-4 p-3 rounded ${
                          solicitud.estado === 'rechazada' 
                            ? 'bg-red-50 border-red-500' 
                            : 'bg-blue-50 border-blue-400'
                        }`}>
                          <p className={`text-sm font-semibold mb-1 ${
                            solicitud.estado === 'rechazada' ? 'text-red-900' : 'text-blue-900'
                          }`}>
                            {solicitud.estado === 'rechazada' ? '❌ Motivo del rechazo:' : '📝 Nota del administrador:'}
                          </p>
                          <p className={`text-sm ${
                            solicitud.estado === 'rechazada' ? 'text-red-800' : 'text-blue-800'
                          }`}>
                            {solicitud.notas_respuesta}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4">
                      {solicitud.estado === 'pendiente' && (
                        <button
                          onClick={() => handleCancelarSolicitud(solicitud.id)}
                          disabled={cancelando === solicitud.id}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                        >
                          {cancelando === solicitud.id ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Cancelando...
                            </>
                          ) : (
                            'Cancelar Solicitud'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
