import { LeadService } from "@/lib/services/leadService";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import {
  EyeIcon,
  PencilSquareIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

export default async function AdminLeadsListPage() {
  const leads = await LeadService.getAllLeads();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-playfair">
            Listado de Leads
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra y edita todos los leads del sistema.
          </p>
        </div>
        <Link
          href="/dashboard/admin/leads-new"
          className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          Crear Lead Manual
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  ID / Fecha
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Resumen / Especialidad
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Estado
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Precio Base
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Calidad
                </th>
                <th
                  scope="col"
                  className="relative px-6 py-3"
                >
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    No hay leads registrados.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {lead.id.substring(0, 8)}...
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 line-clamp-1 max-w-xs">
                        {lead.resumen_ia || lead.cuerpo_mensaje.substring(0, 50)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {lead.especialidad || "Sin especialidad"} • {lead.provincia || "Sin provincia"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          lead.estado === "vendido"
                            ? "bg-green-100 text-green-800"
                            : lead.estado === "procesado"
                            ? "bg-blue-100 text-blue-800"
                            : lead.estado === "en_subasta"
                            ? "bg-purple-100 text-purple-800"
                            : lead.estado === "descartado"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {lead.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.precio_base ? formatCurrency(lead.precio_base) : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {lead.puntuacion_calidad ? (
                        <span className={lead.puntuacion_calidad >= 70 ? "text-green-600 font-medium" : "text-yellow-600"}>
                          {lead.puntuacion_calidad}/100
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {/* Botón de aprobar solo para leads pendientes o procesados sin precio_base */}
                        {(lead.estado === "pendiente" || (lead.estado === "procesado" && !lead.aprobado_por)) && (
                          <Link
                            href={`/dashboard/admin/lead-approve/${lead.id}`}
                            className="text-gray-400 hover:text-green-600 transition-colors"
                            title="Aprobar precio"
                          >
                            <CheckCircleIcon className="h-5 w-5" />
                          </Link>
                        )}
                        <Link
                          href={`/dashboard/leads/${lead.id}`}
                          className="text-gray-400 hover:text-primary transition-colors"
                          title="Ver detalles"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
