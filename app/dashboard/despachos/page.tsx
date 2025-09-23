'use client';

import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const DespachosPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Verificar permisos
  useEffect(() => {
    if (!isLoading && (!user || user.role === 'usuario')) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Mostrar loading mientras verifica la sesión
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Verificar permisos
  if (!user || user.role === 'usuario') {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-semibold text-red-800 mb-2">🔒 Acceso Restringido</h2>
        <p className="text-red-600">
          Solo los administradores de despacho y super administradores pueden acceder a esta sección.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Despachos</h1>
        <p className="text-gray-600 mt-2">
          Gestiona la información de los despachos jurídicos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Card de información */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">📊 Estadísticas</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Despachos:</span>
              <span className="font-semibold">-</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Activos:</span>
              <span className="font-semibold text-green-600">-</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pendientes:</span>
              <span className="font-semibold text-yellow-600">-</span>
            </div>
          </div>
        </div>

        {/* Card de acciones */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">⚡ Acciones Rápidas</h3>
          <div className="space-y-3">
            <button className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
              + Nuevo Despacho
            </button>
            <button className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors">
              📋 Ver Todos
            </button>
            <button className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
              📄 Exportar
            </button>
          </div>
        </div>

        {/* Card de información del usuario */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">👤 Tu Acceso</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Rol:</span>
              <span className="font-semibold capitalize bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                {user.role === 'super_admin' ? 'Super Admin' : 'Despacho Admin'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Permisos:</span>
              <span className="font-semibold text-green-600">Completos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sección principal */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Lista de Despachos</h2>
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-lg font-medium mb-2">Funcionalidad en desarrollo</h3>
            <p>Pronto podrás gestionar todos los despachos desde aquí.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DespachosPage;