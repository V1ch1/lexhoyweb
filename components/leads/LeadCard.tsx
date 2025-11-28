import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { ClockIcon, FireIcon } from "@heroicons/react/24/outline";

interface LeadCardProps {
  lead: {
    id: string;
    especialidad: string;
    provincia: string;
    urgencia: string;
    resumen_ia: string;
    precio_base: number;
    precio_actual?: number;
    puntuacion_calidad: number;
    estado?: string;
    fecha_fin_subasta?: string;
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
    if (puntos >= 90) return "bg-green-500";
    if (puntos >= 70) return "bg-blue-500";
    if (puntos >= 50) return "bg-yellow-500";
    return "bg-gray-500";
  };

  const isAuction = lead.estado === "en_subasta";
  const timeRemaining = lead.fecha_fin_subasta
    ? formatDistanceToNow(new Date(lead.fecha_fin_subasta), {
        addSuffix: false,
        locale: es,
      })
    : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all p-5 flex flex-col h-full hover:border-primary/30">
      {/* Header with badges */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-2 flex-wrap">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
            {lead.especialidad || "General"}
          </span>
          {lead.provincia && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
              {lead.provincia}
            </span>
          )}
          {isAuction && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 uppercase flex items-center gap-1">
              <FireIcon className="h-3 w-3" />
              Subasta
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

      {/* Summary */}
      <div className="flex-grow mb-4">
        <p className="text-gray-600 text-sm line-clamp-3">
          {lead.resumen_ia}
        </p>
      </div>

      {/* Quality bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-500">Calidad del Lead</span>
          <span className="text-xs font-bold text-gray-900">
            {lead.puntuacion_calidad}/100
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${getCalidadColor(
              lead.puntuacion_calidad
            )} transition-all`}
            style={{ width: `${lead.puntuacion_calidad}%` }}
          ></div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 pt-4 mt-auto">
        {/* Auction timer */}
        {isAuction && timeRemaining && (
          <div className="flex items-center gap-1 text-xs text-purple-600 mb-3 bg-purple-50 px-2 py-1 rounded">
            <ClockIcon className="h-4 w-4" />
            <span className="font-medium">Finaliza en {timeRemaining}</span>
          </div>
        )}

        {/* Price and action */}
        <div className="flex justify-between items-center gap-3">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">
              {isAuction ? "Puja actual" : "Precio"}
            </span>
            <span className="text-xl font-bold text-gray-900">
              {lead.precio_actual || lead.precio_base}€
            </span>
          </div>
          <Link
            href={`/dashboard/leads/${lead.id}`}
            className="bg-[#E04040] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#c83838] transition-colors whitespace-nowrap"
          >
            {isAuction ? "Pujar" : "Ver Detalle"}
          </Link>
        </div>

        {/* Time ago */}
        <div className="mt-3 text-xs text-gray-400">
          {formatDistanceToNow(new Date(lead.created_at), {
            addSuffix: true,
            locale: es,
          })}
        </div>
      </div>
    </div>
  );
}
