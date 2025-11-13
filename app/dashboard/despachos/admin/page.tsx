"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/authContext";
import { supabase } from "@/lib/supabase";
import { SyncService } from "@/lib/syncService";
import { useRouter } from "next/navigation";

interface Despacho {
  id: string;
  nombre: string;
  slug: string;
  object_id?: string;
  activo: boolean;
  verificado: boolean;
  num_sedes: number;
  created_at: string;
  updated_at: string;
  owner_email?: string;
  sincronizado_wp: boolean;
}

export default function AdminDespachosPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [despachos, setDespachos] = useState<Despacho[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'verified' | 'unverified'>('all');

  // Verificar permisos de super admin
  useEffect(() => {
    const checkPermissions = async () => {
      if (!user) {
        router.push('/dashboard');
        return;
      }

      try {
        // Primero intentar obtener el rol de los metadatos del usuario (desde authContext)
        let role = user.role;
        
        console.log('🔍 Verificando permisos de administración:', {
          userId: user.id,
          email: user.email,
          roleFromContext: user.role,
        });
        
        // Si no está en el contexto, buscar en la tabla users
        if (!role) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('rol')  // La columna se llama 'rol' (sin 'e')
            .eq('id', user.id)
            .single();
          
          role = userData?.rol;
          
          console.log('🔍 Rol desde tabla users:', {
            rol: userData?.rol,
            error: error
          });
        }

        if (!role || role !== 'super_admin') {
          console.log('❌ Usuario no es super admin. Rol actual:', role);
          setUserRole('not_admin');
          return;
        }

        console.log('✅ Usuario verificado como super_admin');
        setUserRole(role);
      } catch (error) {
        console.error('Error verificando permisos:', error);
        setUserRole('not_admin');
      }
    };

    checkPermissions();
  }, [user, router]);

  // Cargar despachos
  useEffect(() => {
    const loadDespachos = async () => {
      if (userRole !== 'super_admin') return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('despachos')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDespachos(data || []);
      } catch (error) {
        console.error('Error cargando despachos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDespachos();
  }, [userRole]);

  // Filtrar despachos
  const filteredDespachos = despachos.filter(despacho => {
    const matchesSearch = despacho.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         despacho.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         despacho.owner_email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = (() => {
      switch (filter) {
        case 'active': return despacho.activo;
        case 'inactive': return !despacho.activo;
        case 'verified': return despacho.verificado;
        case 'unverified': return !despacho.verificado;
        default: return true;
      }
    })();

    return matchesSearch && matchesFilter;
  });

  // Eliminar despacho
  const handleDelete = async (despacho: Despacho) => {
    const confirmMessage = `⚠️ ATENCIÓN: Esta acción es IRREVERSIBLE

¿Estás seguro de que quieres eliminar el despacho "${despacho.nombre}"?

Esto eliminará:
✗ El despacho de NextJS
✗ El despacho de WordPress (si existe)
✗ El despacho de Algolia (si existe)
✗ Todas las sedes asociadas
✗ Todas las relaciones de usuario
✗ Todas las notificaciones relacionadas

Escribe "ELIMINAR" para confirmar:`;

    const confirmation = prompt(confirmMessage);
    
    if (confirmation !== 'ELIMINAR') {
      alert('❌ Eliminación cancelada');
      return;
    }

    try {
      setDeleting(despacho.id);
      
      const result = await SyncService.eliminarDespachoCompleto(despacho.id);
      
      if (result.success) {
        alert(`✅ Despacho "${despacho.nombre}" eliminado correctamente\n\nDetalles:\n${JSON.stringify(result.details, null, 2)}`);
        
        // Actualizar lista
        setDespachos(prev => prev.filter(d => d.id !== despacho.id));
      } else {
        alert(`❌ Error al eliminar despacho: ${result.error}`);
      }
    } catch (error) {
      console.error('Error eliminando despacho:', error);
      alert(`❌ Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setDeleting(null);
    }
  };

  if (userRole === 'not_admin') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <svg className="h-8 w-8 text-red-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold text-red-800">🛡️ Acceso Denegado</h2>
          </div>
          <p className="text-red-700 mb-4">Solo los super administradores pueden acceder a esta página de administración.</p>
          <div className="bg-white rounded-lg p-4 border border-red-200">
            <p className="text-sm text-gray-700 mb-2"><strong>Tu rol actual:</strong> {user?.role || 'No definido'}</p>
            <p className="text-sm text-gray-700"><strong>Rol requerido:</strong> super_admin</p>
          </div>
          <div className="mt-4">
            <button
              onClick={() => router.push('/dashboard/despachos')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              ← Volver a Despachos
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (userRole !== 'super_admin') {
    return (
      <div className="p-6">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center mt-2 text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🛡️ Administración de Despachos
        </h1>
        <p className="text-gray-600">
          Panel de administración para super admins - Gestión completa de despachos
        </p>
      </div>

      {/* Controles */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Buscar despachos
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, slug o email..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filtros */}
          <div>
            <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por estado
            </label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'active' | 'inactive' | 'verified' | 'unverified')}
              className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="verified">Verificados</option>
              <option value="unverified">No verificados</option>
            </select>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{despachos.length}</div>
            <div className="text-sm text-blue-800">Total</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {despachos.filter(d => d.activo).length}
            </div>
            <div className="text-sm text-green-800">Activos</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {despachos.filter(d => d.verificado).length}
            </div>
            <div className="text-sm text-yellow-800">Verificados</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {despachos.filter(d => d.sincronizado_wp).length}
            </div>
            <div className="text-sm text-purple-800">Sync WP</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">
              {filteredDespachos.length}
            </div>
            <div className="text-sm text-gray-800">Filtrados</div>
          </div>
        </div>
      </div>

      {/* Lista de despachos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Despachos ({filteredDespachos.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando despachos...</p>
          </div>
        ) : filteredDespachos.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No se encontraron despachos con los filtros aplicados
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Despacho
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sedes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Propietario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sincronización
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDespachos.map((despacho) => (
                  <tr key={despacho.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {despacho.nombre}
                        </div>
                        <div className="text-sm text-gray-500">
                          {despacho.slug}
                        </div>
                        {despacho.object_id && (
                          <div className="text-xs text-blue-600">
                            WP ID: {despacho.object_id}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          despacho.activo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {despacho.activo ? 'Activo' : 'Inactivo'}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          despacho.verificado 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {despacho.verificado ? 'Verificado' : 'Pendiente'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {despacho.num_sedes || 0} sede(s)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {despacho.owner_email || 'Sin propietario'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        despacho.sincronizado_wp 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {despacho.sincronizado_wp ? 'Sincronizado' : 'No sync'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/despachos/${despacho.slug}`)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => handleDelete(despacho)}
                          disabled={deleting === despacho.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deleting === despacho.id ? (
                            <span className="flex items-center">
                              <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-red-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Eliminando...
                            </span>
                          ) : (
                            'Eliminar'
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
