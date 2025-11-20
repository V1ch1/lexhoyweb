import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

interface LeadCardProps {
  lead: {
    id: string;
    especialidad: string;
    provincia: string;
    urgencia: string;
    resumen_ia: string;
    precio_base: number;
    puntuacion_calidad: number;
    created_at: string;
  };
}

export function LeadCard({ lead }: LeadCardProps) {
  const getUrgenciaColor = (urgencia: string) => {
    switch (urgencia) {
      case "urgente":
        return "bg-red-100 text-red-800 border-red-200";
      case "alta":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "media":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-green-100 text-green-800 border-green-200";
    }
  };

  const getCalidadColor = (puntos: number) => {
    if (puntos >= 90) return "text-green-600";
    if (puntos >= 70) return "text-blue-600";
    if (puntos >= 50) return "text-yellow-600";
    return "text-gray-600";
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-5 flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
            {lead.especialidad || "General"}
          </span>
          {lead.provincia && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
              {lead.provincia}
            </span>
          )}
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getUrgenciaColor(
            lead.urgencia
          )} uppercase`}
        >
          {lead.urgencia}
        </span>
      </div>

      <div className="flex-grow">
        <p className="text-gray-600 text-sm line-clamp-3 mb-4">
          {lead.resumen_ia}
        </p>
      </div>

      <div className="border-t border-gray-100 pt-4 mt-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Calidad del Lead</span>
            <span
              className={`text-sm font-bold ${getCalidadColor(
                lead.puntuacion_calidad
              )}`}
            >
              {lead.puntuacion_calidad}/100
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-xs text-gray-500">Precio</span>
            <span className="text-lg font-bold text-gray-900">
              {lead.precio_base}€
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center gap-3">
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(lead.created_at), {
              addSuffix: true,
              locale: es,
            })}
          </span>
          <Link
            href={`/dashboard/leads/${lead.id}`}
            className="bg-[#E04040] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#c83838] transition-colors"
          >
            Ver Detalle
          </Link>
        </div>
      </div>
    </div>
  );
}
