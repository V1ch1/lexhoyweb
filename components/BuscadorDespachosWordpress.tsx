"use client";

import { useState } from "react";

// Utilidad para decodificar entidades HTML
function decodeHtml(html: string): string {
  if (typeof window !== "undefined") {
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  } else {
    // SSR fallback
    return html
      .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#8211;/g, "–");
  }
}

interface SedeWP {
  localidad?: string;
  provincia?: string;
  web?: string;
  telefono?: string;
  email?: string;
}
interface MetaWP {
  localidad?: string;
  provincia?: string;
  email_contacto?: string;
  telefono?: string;
  _despacho_sedes?: SedeWP[];
  _despacho_email?: string[];
  _despacho_telefono?: string[];
}

interface DespachoWP {
  object_id: string;
  nombre: string;
  localidad?: string;
  provincia?: string;
  email_contacto?: string;
  telefono?: string;
}

interface Props {
  onImport?: (objectId: string) => void;
}

export default function BuscadorDespachosWordpress({ onImport }: Props) {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<DespachoWP[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importando, setImportando] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importSummary, setImportSummary] = useState<any | null>(null);

  // Buscar despachos en WordPress usando la API real
  const buscarDespachos = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResultados([]);
    setImportResult(null);
    try {
      const res = await fetch(
        `/api/search-despachos?query=${encodeURIComponent(query)}`
      );
      if (!res.ok) throw new Error("Error al buscar despachos");
      const data = await res.json();
      console.log("API WordPress data:", data);
      // Mapear resultados a la interfaz DespachoWP
      const resultadosWP: DespachoWP[] = (data || []).map(
        (d: unknown, i: number) => {
          if (typeof d === "object" && d !== null) {
            const obj = d as Record<string, unknown>;
            console.log(`Despacho[${i}]`, obj);
            // Localidad principal
            const localidadPrincipal =
              obj.meta &&
              typeof obj.meta === "object" &&
              obj.meta !== null &&
              "localidad" in obj.meta
                ? (obj.meta as MetaWP).localidad
                : obj.meta &&
                  typeof obj.meta === "object" &&
                  obj.meta !== null &&
                  Array.isArray((obj.meta as MetaWP)._despacho_sedes) &&
                  (obj.meta as MetaWP)._despacho_sedes?.[0]?.localidad
                ? (obj.meta as MetaWP)._despacho_sedes?.[0]?.localidad
                : "";

            // Buscar sede que coincida con la localidad principal
            let sedeCoincidente: SedeWP | undefined;
            if (
              obj.meta &&
              typeof obj.meta === "object" &&
              obj.meta !== null &&
              Array.isArray((obj.meta as MetaWP)._despacho_sedes)
            ) {
              sedeCoincidente = (obj.meta as MetaWP)._despacho_sedes?.find(
                (sede) =>
                  sede.localidad &&
                  sede.localidad.toLowerCase() ===
                    localidadPrincipal?.toLowerCase()
              );
            }

            return {
              object_id: obj.id?.toString() || obj.object_id || "",
              nombre:
                obj.title &&
                typeof obj.title === "object" &&
                obj.title !== null &&
                "rendered" in obj.title
                  ? decodeHtml(
                      (obj.title as { rendered?: string }).rendered || ""
                    )
                  : decodeHtml(
                      typeof obj.nombre === "string" ? obj.nombre : ""
                    ),
              localidad: localidadPrincipal,
              provincia:
                obj.meta &&
                typeof obj.meta === "object" &&
                obj.meta !== null &&
                "provincia" in obj.meta
                  ? (obj.meta as MetaWP).provincia
                  : obj.meta &&
                    typeof obj.meta === "object" &&
                    obj.meta !== null &&
                    Array.isArray((obj.meta as MetaWP)._despacho_sedes) &&
                    (obj.meta as MetaWP)._despacho_sedes?.[0]?.provincia
                  ? (obj.meta as MetaWP)._despacho_sedes?.[0]?.provincia
                  : "",
              // ...no mostrar email ni teléfono
              ...obj,
            };
          }
          return { object_id: "", nombre: "" };
        }
      );
      setResultados(resultadosWP);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Error buscando despachos en WordPress");
      } else {
        setError("Error buscando despachos en WordPress");
      }
    } finally {
      setLoading(false);
    }
  };

  const importarDespacho = async (objectId: string) => {
    setImportando(objectId);
    setImportResult(null);
    setImportSummary(null);
    try {
      const res = await fetch("/api/sync-despacho", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setImportResult("✅ Despacho importado correctamente");
        setImportSummary(data);
        if (onImport) onImport(objectId);
      } else {
        setImportResult(data.error || "❌ Error al importar el despacho");
        setImportSummary(null);
      }
    } catch {
      setImportResult("❌ Error de red o del servidor");
      setImportSummary(null);
    } finally {
      setImportando(null);
    }
  };

  return (
    <div className="mb-6">
      <form
        onSubmit={buscarDespachos}
        className="flex flex-col sm:flex-row gap-4 items-center mb-4"
      >
        <input
          type="text"
          className="border border-gray-300 rounded px-3 py-2 w-full sm:w-80"
          placeholder="Buscar despacho por nombre"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          disabled={loading || !query}
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </form>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {resultados.length > 0 && (
        <div className="bg-gray-50 rounded p-4 overflow-x-auto">
          <h4 className="font-semibold mb-2">Resultados:</h4>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Nombre</th>
                <th className="text-left p-2">Localidad</th>
                <th className="text-left p-2">Provincia</th>
                <th className="text-left p-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((d) => (
                <tr key={d.object_id} className="border-b last:border-b-0">
                  <td className="p-2 font-medium">{d.nombre}</td>
                  <td className="p-2">{d.localidad || ""}</td>
                  <td className="p-2">{d.provincia || ""}</td>
                  <td className="p-2">
                    <button
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 text-sm disabled:opacity-50"
                      onClick={() => importarDespacho(d.object_id)}
                      disabled={importando === d.object_id}
                    >
                      {importando === d.object_id
                        ? "Importando..."
                        : "Importar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {importResult && (
            <div className="mt-2 text-sm font-semibold text-green-700">
              {importResult}
            </div>
          )}
          {importSummary && importSummary.despacho && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded p-4 text-xs text-gray-800">
              <div className="font-bold mb-2">Resumen de importación:</div>
              <pre className="overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(importSummary, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
