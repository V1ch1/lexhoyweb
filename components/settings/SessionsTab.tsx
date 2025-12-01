import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ComputerDesktopIcon, DevicePhoneMobileIcon, GlobeAltIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

interface Session {
  id: string;
  status: string;
  lastActiveAt: Date | null;
  expireAt: Date | null;
  clientId: string;
}

interface SessionsTabProps {
  loading: boolean;
}

export default function SessionsTab({ loading }: SessionsTabProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Cargar sesiones al montar el componente
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const response = await fetch('/api/user/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Error al cargar sesiones:', error);
    } finally {
      setSessionsLoading(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    try {
      const response = await fetch('/api/user/revoke-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al cerrar sesión');
      }

      // Recargar sesiones
      await loadSessions();
      toast.success('Sesión cerrada exitosamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al cerrar sesión. Por favor, inténtalo de nuevo.');
    }
  };

  const revokeAllOtherSessions = async () => {
    if (!confirm('¿Estás seguro de que quieres cerrar todas las demás sesiones?')) {
      return;
    }

    try {
      const response = await fetch('/api/user/revoke-all-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al cerrar sesiones');
      }

      const result = await response.json();
      
      // Recargar sesiones
      await loadSessions();
      toast.success(result.message || 'Todas las demás sesiones han sido cerradas');
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Error al cerrar sesiones. Por favor, inténtalo de nuevo.');
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Nunca';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Hace menos de 1 minuto';
    if (minutes < 60) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  };

  const getDeviceIcon = () => {
    return <ComputerDesktopIcon className="h-5 w-5 text-gray-500" />;
  };

  if (sessionsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sesiones Activas</h3>
        <p className="text-sm text-gray-500">
          Gestiona y revisa los dispositivos que tienen acceso a tu cuenta.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
          <p className="text-gray-500">No hay sesiones activas</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200">
            {sessions.map((session, index) => {
              const isCurrent = index === 0; // La primera sesión es la actual
              
              return (
                <li key={session.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {getDeviceIcon()}
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">
                              Sesión {index + 1}
                              {isCurrent && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Sesión actual
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="mt-1 text-sm text-gray-500">
                            <p>Estado: {session.status}</p>
                            <div className="flex items-center mt-1">
                              <GlobeAltIcon className="h-4 w-4 text-gray-400 mr-1" />
                              <span>ID: {session.clientId || 'Desconocido'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-sm text-gray-500">{formatDate(session.lastActiveAt)}</p>
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => revokeSession(session.id)}
                            disabled={loading}
                            className="mt-2 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cerrar sesión
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {sessions.length > 1 && (
        <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
          <div className="flex">
            <div className="flex-shrink-0">
              <ArrowTopRightOnSquareIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">¿Ves una sesión sospechosa?</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Si ves una sesión que no reconoces, cierra la sesión de ese dispositivo y cambia tu contraseña de inmediato.
                </p>
                <button
                  type="button"
                  onClick={revokeAllOtherSessions}
                  disabled={loading}
                  className="mt-2 inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cerrar todas las demás sesiones
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900">Seguridad de la cuenta</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Para mayor seguridad, te recomendamos cambiar tu contraseña regularmente y no compartir tus credenciales de inicio de sesión.</p>
          </div>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => window.location.href = '/dashboard/settings/cuenta'}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cambiar contraseña
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
