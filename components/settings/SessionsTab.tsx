import { useState } from 'react';
import { ComputerDesktopIcon, ArrowTopRightOnSquareIcon, DevicePhoneMobileIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

interface Session {
  id: string;
  device: string;
  os: string;
  browser: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

interface SessionsTabProps {
  loading: boolean;
}

export default function SessionsTab({ loading }: SessionsTabProps) {
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: '1',
      device: 'Windows 10',
      os: 'Windows',
      browser: 'Chrome 98.0.4758.102',
      ip: '192.168.1.1',
      location: 'Madrid, España',
      lastActive: 'Hace 2 minutos',
      isCurrent: true,
    },
    {
      id: '2',
      device: 'iPhone 13',
      os: 'iOS 15.3.1',
      browser: 'Safari 15.3',
      ip: '192.168.1.2',
      location: 'Barcelona, España',
      lastActive: 'Hace 1 hora',
      isCurrent: false,
    },
    {
      id: '3',
      device: 'MacBook Pro',
      os: 'macOS 12.2.1',
      browser: 'Safari 15.3',
      ip: '192.168.1.3',
      location: 'Valencia, España',
      lastActive: 'Ayer a las 14:30',
      isCurrent: false,
    },
  ]);

  const revokeSession = async (sessionId: string) => {
    // TODO: Implement session revocation
    setSessions(sessions.filter(session => session.id !== sessionId));
  };

  const revokeAllOtherSessions = () => {
    // TODO: Implement revoke all other sessions
    setSessions(sessions.filter(session => session.isCurrent));
  };

  const getDeviceIcon = (os: string) => {
    const osLower = os.toLowerCase();
    if (osLower.includes('windows') || osLower.includes('macos') || osLower.includes('linux')) {
      return <ComputerDesktopIcon className="h-5 w-5 text-gray-500" />;
    } else if (osLower.includes('ios') || osLower.includes('android')) {
      return <DevicePhoneMobileIcon className="h-5 w-5 text-gray-500" />;
    }
    return <GlobeAltIcon className="h-5 w-5 text-gray-500" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sesiones Activas</h3>
        <p className="text-sm text-gray-500">
          Gestiona y revisa los dispositivos que tienen acceso a tu cuenta.
        </p>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {sessions.map((session) => (
            <li key={session.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {getDeviceIcon(session.os)}
                    </div>
                    <div className="ml-4">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900">
                          {session.device}
                          {session.isCurrent && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Sesión actual
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        <p>{session.os} • {session.browser}</p>
                        <div className="flex items-center mt-1">
                          <GlobeAltIcon className="h-4 w-4 text-gray-400 mr-1" />
                          <span>{session.location}</span>
                          <span className="mx-1">•</span>
                          <span>{session.ip}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-sm text-gray-500">{session.lastActive}</p>
                    {!session.isCurrent && (
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
          ))}
        </ul>
      </div>

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

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900">Seguridad de la cuenta</h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Para mayor seguridad, te recomendamos cambiar tu contraseña regularmente y no compartir tus credenciales de inicio de sesión.</p>
          </div>
          <div className="mt-5">
            <button
              type="button"
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
