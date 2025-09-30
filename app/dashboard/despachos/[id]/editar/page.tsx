"use client";
import EditarDespachoWP from "@/components/EditarDespachoWP";
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

// Utilidad para decodificar entidades HTML
function decodeHtml(html: string) {
  if (!html) return "";
  const txt =
    typeof window !== "undefined" ? document.createElement("textarea") : null;
  if (!txt) return html;
  txt.innerHTML = html;
  return txt.value;
}

const wpUser = process.env.NEXT_PUBLIC_WP_USER || "";
const wpAppPassword = process.env.NEXT_PUBLIC_WP_APP_PASSWORD || "";

export default function EditarDespachoPage() {
  const params = useParams();
  let despachoId = params?.id;
  if (Array.isArray(despachoId)) {
    despachoId = despachoId[0];
  }
  const [nombreDespacho, setNombreDespacho] = useState<string>("");

  // Obtener el nombre del despacho desde WP para el título
  useEffect(() => {
    const fetchNombre = async () => {
      if (!despachoId) return;
      try {
        const auth = btoa(`${wpUser}:${wpAppPassword}`);
        const res = await fetch(
          `https://lexhoy.com/wp-json/wp/v2/despacho/${despachoId}`,
          {
            headers: {
              Authorization: `Basic ${auth}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (!res.ok) return;
        const data = await res.json();
        setNombreDespacho(decodeHtml(data?.title?.rendered || ""));
      } catch {}
    };
    fetchNombre();
  }, [despachoId]);

  if (!despachoId) return <div>No se encontró el despacho</div>;
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900 truncate">
          {nombreDespacho || "Editar Despacho"}
        </h1>
        <button
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded px-3 py-2 shadow border border-gray-200"
          onClick={() => window.history.back()}
        >
          ← Volver
        </button>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <EditarDespachoWP
          despachoId={despachoId}
          wpUser={wpUser}
          wpAppPassword={wpAppPassword}
        />
      </div>
    </div>
  );
}
