// import { DespachoService } from '@/lib/supabase';
import { Lead, Sede } from "@/lib/types";

// Esta es una página de ejemplo del dashboard que muestra cómo usar el backend
// En desarrollo real, necesitarás autenticación con Supabase Auth

export default async function DashboardPage() {
  // Ejemplo de uso del servicio (en producción, obtén el despachoId del usuario autenticado)
  // const despachoService = new DespachoService();
  // const leads = await despachoService.getLeadsByDespacho(despachoId);
  // const sedes = await despachoService.getSedesByDespacho(despachoId);

  // Simular datos mientras configuramos Supabase
  const mockLeads: Lead[] = [
    {
      id: "1",
      despacho_id: "mock-despacho",
      cliente_nombre: "María García",
      cliente_email: "maria@email.com",
      cliente_telefono: "+34 123 456 789",
      consulta: "Consulta sobre divorcio contencioso",
      especialidad: "Derecho de Familia",
      urgencia: "alta",
      presupuestoEstimado: 2500,
      provincia: "Madrid",
      ciudad: "Madrid",
      estado: "nuevo",
      fechaCreacion: new Date(),
      fuente: "web",
    },
    {
      id: "2",
      despacho_id: "mock-despacho",
      cliente_nombre: "Carlos López",
      cliente_email: "carlos@empresa.com",
      cliente_telefono: "+34 987 654 321",
      consulta: "Asesoramiento para constitución de sociedad",
      especialidad: "Derecho Mercantil",
      urgencia: "media",
      presupuestoEstimado: 1500,
      provincia: "Barcelona",
      ciudad: "Barcelona",
      estado: "contactado",
      fechaCreacion: new Date(Date.now() - 86400000), // Ayer
      fuente: "referencia",
    },
  ];

  const mockSedes: Sede[] = [
    {
      id: 1,
      nombre: "Sede Central Madrid",
      localidad: "Madrid",
      provincia: "Madrid",
      calle: "Calle Gran Vía",
      numero: "25",
      codigo_postal: "28013",
      telefono: "+34 91 123 45 67",
      email_contacto: "madrid@despacho.com",
      es_principal: true,
      activa: true,
      areas_practica: ["civil", "familiar", "mercantil"],
      estado_verificacion: "verificado",
      estado_registro: "activo",
      is_verified: true,
      horarios: {
        lunes: "9:00-18:00",
        martes: "9:00-18:00",
        miercoles: "9:00-18:00",
        jueves: "9:00-18:00",
        viernes: "9:00-15:00",
      },
      redes_sociales: {
        linkedin: "https://linkedin.com/company/despacho",
        facebook: "https://facebook.com/despacho",
      },
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header del Dashboard */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard - Lexhoy Portal
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Último acceso: {new Date().toLocaleDateString("es-ES")}
              </span>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">U</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tarjetas de Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">L</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Leads Totales
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockLeads.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">N</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Leads Nuevos
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockLeads.filter((lead) => lead.estado === "nuevo").length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">S</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Sedes Activas
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {mockSedes.filter((sede) => sede.activa).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold">€</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Valor Estimado
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  €
                  {mockLeads
                    .reduce(
                      (sum, lead) => sum + (lead.presupuestoEstimado || 0),
                      0
                    )
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Lista de Leads Recientes */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Leads Recientes
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {mockLeads.map((lead) => (
                <div key={lead.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {lead.cliente_nombre}
                      </h4>
                      <p className="text-sm text-gray-500 truncate max-w-xs">
                        {lead.consulta}
                      </p>
                      <div className="flex items-center mt-1 space-x-2">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            lead.estado === "nuevo"
                              ? "bg-green-100 text-green-800"
                              : lead.estado === "contactado"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {lead.estado === "nuevo"
                            ? "Nuevo"
                            : lead.estado === "contactado"
                            ? "Contactado"
                            : "Cerrado"}
                        </span>
                        <span className="text-xs text-gray-500">
                          {lead.especialidad}
                        </span>
                        {lead.presupuestoEstimado && (
                          <span className="text-xs text-gray-500">
                            €{lead.presupuestoEstimado.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {lead.fechaCreacion.toLocaleDateString("es-ES")}
                      </p>
                      <p className="text-xs text-gray-400">{lead.provincia}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                Ver todos los leads →
              </button>
            </div>
          </div>

          {/* Información de Sedes */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Mis Sedes</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {mockSedes.map((sede) => (
                <div key={sede.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 flex items-center">
                        {sede.nombre}
                        {sede.es_principal && (
                          <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            Principal
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {sede.calle} {sede.numero}, {sede.localidad}
                      </p>
                      <p className="text-sm text-gray-500">
                        {sede.telefono} • {sede.email_contacto}
                      </p>

                      {/* Especialidades */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {sede.areas_practica.map((area, index) => (
                          <span
                            key={index}
                            className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800"
                          >
                            {area}
                          </span>
                        ))}
                      </div>

                      {/* Horarios */}
                      {sede.horarios && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">
                            Horario: {sede.horarios.lunes || "No especificado"}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end space-y-1">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          sede.estado_verificacion === "verificado"
                            ? "bg-green-100 text-green-800"
                            : sede.estado_verificacion === "pendiente"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {sede.estado_verificacion === "verificado"
                          ? "Verificada"
                          : sede.estado_verificacion === "pendiente"
                          ? "Pendiente"
                          : "Rechazada"}
                      </span>

                      {/* Redes sociales */}
                      {sede.redes_sociales && (
                        <div className="flex space-x-1">
                          {sede.redes_sociales.linkedin && (
                            <a
                              href={sede.redes_sociales.linkedin}
                              className="text-blue-600 hover:text-blue-800"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <span className="text-xs">LinkedIn</span>
                            </a>
                          )}
                          {sede.redes_sociales.facebook && (
                            <a
                              href={sede.redes_sociales.facebook}
                              className="text-blue-600 hover:text-blue-800"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <span className="text-xs">Facebook</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                Gestionar sedes →
              </button>
            </div>
          </div>
        </div>

        {/* Estado de la Integración */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white font-bold">⚡</span>
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-blue-900">
                Estado del Backend - Supabase
              </h3>
              <div className="mt-2 text-sm text-blue-800">
                <p className="mb-2">
                  <strong>✅ Configuración completada:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>
                    TypeScript interfaces actualizadas con estructura Algolia
                  </li>
                  <li>Servicio Supabase configurado con métodos CRUD</li>
                  <li>
                    Schema SQL completo con tablas, índices y políticas RLS
                  </li>
                  <li>Documentación detallada de configuración</li>
                  <li>Estructura multi-sede preparada</li>
                </ul>

                <p className="mt-4 mb-2">
                  <strong>📋 Próximos pasos:</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Crear proyecto en Supabase y ejecutar el schema SQL</li>
                  <li>Configurar variables de entorno en .env.local</li>
                  <li>Implementar autenticación de usuarios</li>
                  <li>Conectar formularios con la base de datos</li>
                  <li>Integrar búsqueda con Algolia</li>
                </ul>

                <div className="mt-4 p-3 bg-blue-100 rounded">
                  <p className="text-xs text-blue-700">
                    <strong>Nota:</strong> Este dashboard muestra datos de
                    ejemplo. Una vez configurado Supabase, se conectará
                    automáticamente con datos reales. Consulta{" "}
                    <code>docs/SUPABASE_SETUP.md</code> para la configuración
                    completa.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
