"use client";

import { useEffect, useState } from "react";
import { ClockIcon, UserIcon } from "@heroicons/react/24/outline";

interface HistoryChange {
  field: string;
  from: any;
  to: any;
}

interface HistoryEntry {
  id: string;
  edited_by: string;
  edited_at: string;
  changes: Record<string, { from: any; to: any }>;
  editor_name?: string;
  editor_email?: string;
}

interface LeadHistoryTimelineProps {
  leadId: string;
}

const formatFieldName = (field: string): string => {
  const fieldNames: Record<string, string> = {
    estado: "Estado",
    precio_base: "Precio Base",
    resumen_ia: "Resumen IA",
    especialidad: "Especialidad",
    provincia: "Provincia",
    ciudad: "Ciudad",
    urgencia: "Urgencia",
    palabras_clave: "Palabras Clave",
  };
  return fieldNames[field] || field;
};

const formatValue = (value: any): string => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "number") return value.toLocaleString("es-ES");
  return String(value);
};

export default function LeadHistoryTimeline({ leadId }: LeadHistoryTimelineProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [leadId]);

  const loadHistory = async () => {
    try {
      const response = await fetch(`/api/admin/leads/${leadId}/history`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Historial de Cambios
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Historial de Cambios
        </h2>
        <p className="text-sm text-gray-500 text-center py-8">
          No hay cambios registrados
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Historial de Cambios
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((entry, index) => (
          <div
            key={entry.id}
            className="relative bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 text-sm">
                <UserIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="font-medium text-gray-900 truncate">
                  {entry.editor_name || entry.editor_email || "Usuario"}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0 ml-2">
                <ClockIcon className="h-3 w-3" />
                {new Date(entry.edited_at).toLocaleString("es-ES", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>

            {/* Changes */}
            <div className="space-y-2">
              {Object.entries(entry.changes).map(([field, change]) => (
                <div key={field} className="text-sm">
                  <span className="font-medium text-gray-700 block mb-1">
                    {formatFieldName(field)}:
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-red-600 line-through flex-1 truncate">
                      {formatValue(change.from)}
                    </span>
                    <span className="text-gray-400">→</span>
                    <span className="text-green-600 font-medium flex-1 truncate">
                      {formatValue(change.to)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
