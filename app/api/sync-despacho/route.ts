import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Endpoint para sincronizar datos completos de un despacho desde WordPress a Supabase
export async function POST(request: Request) {
  try {
    const { objectId } = await request.json();
    if (!objectId) {
      return NextResponse.json({ error: "Falta objectId" }, { status: 400 });
    }

    // 1. Consultar WordPress para obtener los datos completos del despacho
    const username = process.env.NEXT_PUBLIC_WP_USER;
    const appPassword = process.env.NEXT_PUBLIC_WP_APP_PASSWORD;
    const auth = Buffer.from(`${username}:${appPassword}`).toString("base64");
    const wpRes = await fetch(
      `https://lexhoy.com/wp-json/wp/v2/despacho?object_id=${objectId}`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (!wpRes.ok) {
      return NextResponse.json(
        { error: "Error consultando WordPress" },
        { status: 500 }
      );
    }
    const wpData = await wpRes.json();
    if (!wpData || !wpData.length) {
      return NextResponse.json(
        { error: "Despacho no encontrado en WordPress" },
        { status: 404 }
      );
    }
    const despachoWP = wpData[0];

    // 2. Transformar los datos al esquema de Supabase
    const despachoSupabase = {
      object_id: despachoWP.meta?.object_id || objectId,
      nombre: despachoWP.title?.rendered || "",
      descripcion: despachoWP.excerpt?.rendered || "",
      sedes: despachoWP.meta?.sedes || [],
      num_sedes: Array.isArray(despachoWP.meta?.sedes)
        ? despachoWP.meta.sedes.length
        : 0,
      areas_practica: despachoWP.meta?.areas_practica || [],
      ultima_actualizacion: despachoWP.modified || new Date().toISOString(),
      slug: despachoWP.slug || "",
      fechaCreacion: despachoWP.date
        ? new Date(despachoWP.date).toISOString()
        : new Date().toISOString(),
      fechaActualizacion: despachoWP.modified
        ? new Date(despachoWP.modified).toISOString()
        : new Date().toISOString(),
      verificado: despachoWP.meta?.verificado ?? false,
      activo: despachoWP.meta?.activo ?? true,
      localidad: despachoWP.meta?.localidad || "",
      provincia: despachoWP.meta?.provincia || "",
      telefono: despachoWP.meta?.telefono || "",
    };

    // 3. Guardar o actualizar el despacho en Supabase
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    // Si ya existe, actualiza; si no, inserta
    const { data: existing } = await supabase
      .from("despachos")
      .select("id")
      .eq("object_id", despachoSupabase.object_id)
      .single();
    let result;
    if (existing) {
      result = await supabase
        .from("despachos")
        .update(despachoSupabase)
        .eq("object_id", despachoSupabase.object_id);
    } else {
      result = await supabase.from("despachos").insert(despachoSupabase);
    }
    if (result.error) {
      console.error("Supabase error:", result.error);
      return NextResponse.json(
        { error: "Error guardando en Supabase", details: result.error },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true, despacho: despachoSupabase });
  } catch (err) {
    return NextResponse.json(
      { error: "Error inesperado", details: String(err) },
      { status: 500 }
    );
  }
}
