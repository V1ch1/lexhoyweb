"use client";

import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Despacho = {
  id: number;
  nombre?: string;
  nombre_despacho?: string;
  estado?: string;
  created_at?: string;
  // Add more fields as needed
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DespachosPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [despachos, setDespachos] = useState<Despacho[]>([]);
  const [loadingDespachos, setLoadingDespachos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Fetch despachos for admin
  useEffect(() => {
    const fetchDespachos = async () => {
      setLoadingDespachos(true);
      setError(null);
      const { data, error } = await supabase
        .from("despachos")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        setError("Error al cargar los despachos");
        setDespachos([]);
      } else {
        setDespachos(data || []);
      }
      setLoadingDespachos(false);
    };
    if (!user || user.role === "usuario") return;
    fetchDespachos();
  }, [user]);

  // Verificar permisos
  useEffect(() => {
    if (!isLoading && (!user || user.role === "usuario")) {
      router.push("/dashboard");
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
  if (!user || user.role === "usuario") {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-semibold text-red-800 mb-2">
          🔒 Acceso Restringido
        </h2>
        <p className="text-red-600">
          Solo los administradores de despacho y super administradores pueden
          acceder a esta sección.
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            📊 Estadísticas
          </h3>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            ⚡ Acciones Rápidas
          </h3>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            👤 Tu Acceso
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Rol:</span>
              <span className="font-semibold capitalize bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                {user.role === "super_admin" ? "Super Admin" : "Despacho Admin"}
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Lista de Despachos
          </h2>
          {loadingDespachos ? (
            <div className="text-center py-8 text-gray-500">
              Cargando despachos...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : despachos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No hay despachos registrados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      ID
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Nombre
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Estado
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Creado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {despachos.map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-2 text-sm text-gray-700">
                        {d.id}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {d.nombre || d.nombre_despacho || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            d.estado === "activo"
                              ? "bg-green-100 text-green-800"
                              : d.estado === "pendiente"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {d.estado || "Desconocido"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {d.created_at
                          ? new Date(d.created_at).toLocaleString()
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DespachosPage;
