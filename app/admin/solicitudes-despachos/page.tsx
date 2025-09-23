'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserService } from '@/lib/userService';
import { useAuth } from '@/lib/authContext';

const userService = new UserService();

interface SolicitudExtendida {
  id: string;
  user_id: string;
  despacho_id: string;
  fecha_solicitud: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  justificacion: string;
  tipo_solicitud: 'propiedad' | 'colaboracion' | 'otro';
  documentos_adjuntos?: string[];
  fecha_respuesta?: string;
  respondido_por?: string;
  motivo_rechazo?: string;
  users: {
    nombre: string;
    apellidos: string;
    email: string;
  };
  despachos: {
    nombre: string;
  };
}

export default function SolicitudesDespacchosPage() {
  const router = useRouter();
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const [solicitudes, setSolicitudes] = useState<SolicitudExtendida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estado para modal de rechazo
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<SolicitudExtendida | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  const loadSolicitudes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getSolicitudesDespachosPendientes();
      setSolicitudes(data);
    } catch (error) {
      console.error('Error loading solicitudes:', error);
      setError('Error al cargar las solicitudes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && currentUser?.role !== 'super_admin') {
      router.push('/dashboard');
      return;
    }

    if (currentUser?.role === 'super_admin') {
      loadSolicitudes();
    }
  }, [authLoading, currentUser, router, loadSolicitudes]);

  const handleAprobar = async (solicitudId: string) => {
    if (!currentUser) return;
    
    try {
      await userService.aprobarSolicitudDespacho(solicitudId, currentUser.id);
      setSuccessMessage('Solicitud aprobada exitosamente');
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadSolicitudes(); // Recargar lista
    } catch (error) {
      console.error('Error al aprobar solicitud:', error);
      setError('Error al aprobar la solicitud');
    }
  };

  const handleRechazar = async () => {
    if (!selectedSolicitud || !currentUser || !motivoRechazo.trim()) return;
    
    try {
      await userService.rechazarSolicitudDespacho(selectedSolicitud.id, currentUser.id, motivoRechazo);
      setSuccessMessage('Solicitud rechazada');
      setTimeout(() => setSuccessMessage(null), 3000);
      setShowRejectModal(false);
      setSelectedSolicitud(null);
      setMotivoRechazo('');
      await loadSolicitudes(); // Recargar lista
    } catch (error) {
      console.error('Error al rechazar solicitud:', error);
      setError('Error al rechazar la solicitud');
    }
  };

  const openRejectModal = (solicitud: SolicitudExtendida) => {
    setSelectedSolicitud(solicitud);
    setShowRejectModal(true);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setSelectedSolicitud(null);
    setMotivoRechazo('');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Solicitudes de Asignación de Despachos
                </h1>
                <p className="text-gray-600">
                  Gestiona las solicitudes de usuarios para acceder a despachos
                </p>
              </div>
              <button
                onClick={() => router.push('/admin/users')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Volver a Usuarios
              </button>
            </div>
          </div>
        </div>

        {/* Mensajes */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  ✅ {successMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  ❌ {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Solicitudes */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Solicitudes Pendientes ({solicitudes.length})
            </h2>
          </div>
          
          {solicitudes.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">📝</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay solicitudes pendientes</h3>
              <p className="text-gray-500">
                Todas las solicitudes de asignación de despachos han sido procesadas.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {solicitudes.map((solicitud) => (
                <div key={solicitud.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {solicitud.users.nombre} {solicitud.users.apellidos}
                        </h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          solicitud.tipo_solicitud === 'propiedad' 
                            ? 'bg-blue-100 text-blue-800'
                            : solicitud.tipo_solicitud === 'colaboracion'
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {solicitud.tipo_solicitud === 'propiedad' ? 'Propietario' : 
                           solicitud.tipo_solicitud === 'colaboracion' ? 'Colaborador' : 'Otro'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Email:</p>
                          <p className="text-sm font-medium">{solicitud.users.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Despacho solicitado:</p>
                          <p className="text-sm font-medium">{solicitud.despachos.nombre}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Fecha de solicitud:</p>
                          <p className="text-sm font-medium">
                            {new Date(solicitud.fecha_solicitud).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Tipo de solicitud:</p>
                          <p className="text-sm font-medium capitalize">{solicitud.tipo_solicitud}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Justificación:</p>
                        <div className="bg-gray-50 p-3 rounded border">
                          <p className="text-sm text-gray-800">{solicitud.justificacion}</p>
                        </div>
                      </div>

                      {solicitud.documentos_adjuntos && solicitud.documentos_adjuntos.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-600 mb-2">Documentos adjuntos:</p>
                          <div className="space-y-1">
                            {solicitud.documentos_adjuntos.map((doc, idx) => (
                              <a 
                                key={idx}
                                href={doc} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm block"
                              >
                                📎 Documento {idx + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-6">
                      <button
                        onClick={() => handleAprobar(solicitud.id)}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => openRejectModal(solicitud)}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de Rechazo */}
        {showRejectModal && selectedSolicitud && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Rechazar Solicitud
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Solicitud de {selectedSolicitud.users.nombre} {selectedSolicitud.users.apellidos} 
                para el despacho {selectedSolicitud.despachos.nombre}
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo del rechazo:
                </label>
                <textarea
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Explica por qué se rechaza esta solicitud..."
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={closeRejectModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRechazar}
                  disabled={!motivoRechazo.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  Rechazar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}