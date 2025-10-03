"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function EditDespachoPage() {
  const params = useParams();
  const router = useRouter();
  const despachoId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  
  const [loading, setLoading] = useState(true);
  const [objectId, setObjectId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDespacho = async () => {
      if (!despachoId) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("despachos")
          .select("object_id")
          .eq("id", despachoId)
          .single();

        if (error) {
          console.error("Error fetching despacho:", error);
          return;
        }

        if (data?.object_id) {
          setObjectId(data.object_id);
          // Redirigir a la página de edición con el object_id
          router.replace(`/dashboard/despachos/${data.object_id}/editar`);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDespacho();
  }, [despachoId, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!objectId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Despacho no encontrado</h2>
          <p className="text-gray-600 mb-4">No se pudo encontrar el despacho solicitado.</p>
          <button
            onClick={() => router.push("/dashboard/settings?tab=mis-despachos")}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Volver a Mis Despachos
          </button>
        </div>
      </div>
    );
  }

  return null; // Se redirige automáticamente
}
