'use client';

import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';

// Página principal del Dashboard
const DashboardPage = () => {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Mostrar loading mientras verifica la sesión
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario, el hook useAuth ya redirigirá al login
  if (!user) {
    return null;
  }

  return (
    <div>
      {/* Contenido del Dashboard sin header duplicado */}
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard - {user.role === 'super_admin' ? 'Super Administrador' : 'Despacho'}
          </h1>
          <p className="mt-2 text-gray-600">
            Bienvenido, {user.name}. {user.role === 'super_admin' ? 'Gestiona toda la plataforma desde este panel.' : 'Gestiona tu despacho desde este panel.'}
          </p>
          {user.role === 'super_admin' && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                💡 <strong>Tip:</strong> Como super administrador, también puedes acceder al{' '}
                <button 
                  onClick={() => router.push('/admin/users')}
                  className="text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  Panel de Administración
                </button>{' '}
                para gestionar usuarios y configuración avanzada.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card de Bienvenida */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              ¡Bienvenido, {user.name.split(' ')[0]}!
            </h2>
            <p className="text-gray-600">
              {user.role === 'super_admin' 
                ? 'Accede a todas las funcionalidades de administración desde este panel.'
                : 'Accede a todas las funcionalidades de tu despacho desde este panel.'
              }
            </p>
          </div>

          {/* Card de Administración (solo para super_admin) */}
          {user.role === 'super_admin' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Administración</h3>
              <p className="text-gray-600 mb-4">Gestiona usuarios y configuración del sistema</p>
              <button 
                onClick={() => router.push('/admin/users')}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
              >
                Panel Admin
              </button>
            </div>
          )}

          {/* Card de Leads */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Leads</h3>
            <p className="text-gray-600 mb-4">
              {user.role === 'super_admin' 
                ? 'Ver todos los leads del sistema'
                : 'Gestiona los leads de tu despacho'
              }
            </p>
            <button 
              onClick={() => router.push('/dashboard/leads')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Ver Leads
            </button>
          </div>

          {/* Card de Perfil */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Mi Perfil</h3>
            <p className="text-gray-600 mb-4">
              {user.role === 'super_admin' 
                ? 'Actualiza la información de tu perfil de administrador'
                : 'Actualiza la información de tu despacho'
              }
            </p>
            <button 
              onClick={() => router.push('/dashboard/perfil')}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Editar Perfil
            </button>
          </div>

          {/* Card de Estadísticas */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Estadísticas</h3>
            <div className="space-y-2">
              {user.role === 'super_admin' ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total usuarios:</span>
                    <span className="font-semibold">--</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Despachos activos:</span>
                    <span className="font-semibold">--</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Leads totales:</span>
                    <span className="font-semibold">--</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Leads este mes:</span>
                    <span className="font-semibold">--</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conversiones:</span>
                    <span className="font-semibold">--</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Card de Actividad Reciente */}
          <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Actividad Reciente</h3>
            <div className="text-center py-8 text-gray-500">
              <p>No hay actividad reciente</p>
              <p className="text-sm mt-2">
                {user.role === 'super_admin' 
                  ? 'Las nuevas actividades del sistema aparecerán aquí'
                  : 'Los nuevos leads aparecerán aquí'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
