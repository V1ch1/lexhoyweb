"use client";

import { useAuth } from "@/lib/authContext";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";

// Utilidad para decodificar entidades HTML
function decodeHtmlEntities(str: string) {
  if (!str) return "";
  return str
    .replace(/&#([0-9]{1,4});/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#8211;/g, "–");
}
import { supabase } from "@/lib/supabase";

// ...existing code...
import BuscadorDespachosWordpress from "@/components/BuscadorDespachosWordpress";

type DespachoSummary = {
  id: string;
  object_id?: string;
  nombre: string;
  num_sedes: number;
  created_at: string;
  estado?: string;
  // Principal sede fields
  localidad?: string;
  provincia?: string;
  telefono?: string;
  email?: string;
  // Owner fields
  owner_nombre?: string;
  owner_apellidos?: string;
  owner_email?: string;
};

const DespachosPage = () => {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [despachos, setDespachos] = useState<DespachoSummary[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;
  const [loadingDespachos, setLoadingDespachos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Fetch despachos con useEffect bien configurado
  const fetchDespachos = async () => {
    setLoadingDespachos(true);
    setError(null);
    let query = supabase
      .from("despachos")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    if (search) {
      query = query.ilike("nombre", `%${search}%`);
    }
    const { data, error, count } = await query;
    if (error) {
      console.error("Supabase error al cargar despachos:", error);
      setError("Error al cargar los despachos: " + JSON.stringify(error));
      setDespachos([]);
      setTotal(0);
      setLoadingDespachos(false);
      return;
    }
    // Mostrar el objeto recibido en consola para análisis
    console.log("Despachos desde Supabase:", data);

    // Para cada despacho, obtener la sede principal
    const mapped = await Promise.all(
      (data || []).map(async (d: any) => {
        let sedePrincipal = null;
        if (d.id) {
          const { data: sedes } = await supabase
            .from("sedes")
            .select("*")
            .eq("despacho_id", d.id)
            .eq("es_principal", true)
            .single();
          sedePrincipal = sedes || null;
        }
        return {
          id: d.id,
          object_id: d.object_id,
          nombre: decodeHtmlEntities(d.nombre),
          num_sedes: d.num_sedes,
          created_at: d.created_at,
          estado: d.estado,
          localidad: sedePrincipal?.localidad || "",
          provincia: sedePrincipal?.provincia || "",
          telefono: sedePrincipal?.telefono || "",
          email: sedePrincipal?.email_contacto || "",
        };
      })
    );
    setDespachos(mapped);
    setTotal(count || 0);
    setLoadingDespachos(false);
  };

  // useEffect: llama a fetchDespachos cuando user está cargado y cambia page/search
  useEffect(() => {
    if (!user) return;
    fetchDespachos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page, search]);

  // Calcular totalPages para la paginación
  const totalPages = Math.ceil(total / PAGE_SIZE);

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
                {user?.role === "super_admin"
                  ? "Super Admin"
                  : "Despacho Admin"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Permisos:</span>
              <span className="font-semibold text-green-600">Completos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Buscador de despachos WordPress */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Buscar y vincular despacho desde WordPress
          </h2>
          <BuscadorDespachosWordpress onImport={fetchDespachos} />
        </div>
      </div>

      {/* Sección principal */}
      <div className="mt-8 bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Lista de Despachos
          </h2>
          <div className="mb-4 flex flex-col sm:flex-row gap-2 items-center justify-between">
            <input
              type="text"
              className="border border-gray-300 rounded px-3 py-2 w-full sm:w-80"
              placeholder="Buscar por nombre, localidad o provincia"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <div className="flex gap-2 items-center">
              <button
                className="px-2 py-1 rounded border text-xs"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <span className="text-xs">
                Página {page} de {totalPages || 1}
              </span>
              <button
                className="px-2 py-1 rounded border text-xs"
                disabled={page === totalPages || totalPages === 0}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Siguiente
              </button>
            </div>
          </div>
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
                      Nombre
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Localidad
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Provincia
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Teléfono
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Nº Sedes
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Propietario
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {despachos.map((d) => (
                    <tr key={d.id}>
                      <td className="px-4 py-2 text-sm font-semibold text-gray-900">
                        {d.nombre}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {d.localidad || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {d.provincia || "-"}
                      </td>
                      <td className="px-4 py-2 text-sm">{d.telefono || "-"}</td>
                      <td className="px-4 py-2 text-sm">{d.email || "-"}</td>
                      <td className="px-4 py-2 text-sm text-center">
                        {d.num_sedes}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        {/* Propietario no disponible en este join */}-
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <button
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs"
                          onClick={() =>
                            router.push(
                              `/dashboard/despachos/${d.object_id}/editar`
                            )
                          }
                        >
                          Editar
                        </button>
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
