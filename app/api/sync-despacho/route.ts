import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Endpoint para sincronizar datos completos de un despacho desde WordPress a Supabase
export async function POST(request: Request) {
  try {
    // Recibe todos los datos posibles del despacho
    const body = await request.json();
    const {
      objectId,
      nombre,
      descripcion,
      localidad,
      provincia,
      slug,
      num_sedes,
      areas_practica,
    } = body;
    if (!objectId) {
      return NextResponse.json({ error: "Falta objectId" }, { status: 400 });
    }

    // 1. Consultar WordPress para obtener los datos completos del despacho
    const username = process.env.NEXT_PUBLIC_WP_USER;
    const appPassword = process.env.NEXT_PUBLIC_WP_APP_PASSWORD;
    const auth = Buffer.from(`${username}:${appPassword}`).toString("base64");
    let despachoWP = null;
    // Si el objectId es numérico, usar el endpoint directo por ID
    if (/^\d+$/.test(objectId)) {
      const wpRes = await fetch(
        `https://lexhoy.com/wp-json/wp/v2/despacho/${objectId}`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (wpRes.ok) {
        despachoWP = await wpRes.json();
      }
    } else {
      // Si no es numérico, buscar por object_id y filtrar
      const wpRes = await fetch(
        `https://lexhoy.com/wp-json/wp/v2/despacho?object_id=${objectId}`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (wpRes.ok) {
        const wpData = await wpRes.json();
        if (wpData && wpData.length) {
          despachoWP =
            wpData.find(
              (d: any) =>
                d.id?.toString() === objectId || d.meta?.object_id === objectId
            ) || wpData[0];
        }
      }
    }

    // Si no se encuentra en WordPress, usar los datos del body
    if (!despachoWP) {
      despachoWP = {
        meta: {
          object_id: objectId,
          _despacho_sedes: [],
          areas_practica: areas_practica || [],
        },
        title: { rendered: nombre || "" },
        excerpt: { rendered: descripcion || "" },
        slug: slug || (nombre ? nombre.toLowerCase().replace(/ /g, "-") : ""),
        date: new Date().toISOString(),
        modified: new Date().toISOString(),
      };
      if (localidad || provincia) {
        despachoWP.meta._despacho_sedes.push({ localidad, provincia });
      }
    }

    // 2. Transformar los datos al esquema de Supabase
    const despachoSupabase = {
      object_id: despachoWP.meta?.object_id || objectId,
      nombre: despachoWP.title?.rendered || "",
      descripcion: despachoWP.excerpt?.rendered || "",
      num_sedes: Array.isArray(despachoWP.meta?._despacho_sedes)
        ? despachoWP.meta._despacho_sedes.length
        : 0,
      areas_practica: despachoWP.meta?.areas_practica || [],
      ultima_actualizacion: despachoWP.modified || new Date().toISOString(),
      slug: despachoWP.slug || "",
      fecha_creacion: despachoWP.date
        ? new Date(despachoWP.date).toISOString()
        : new Date().toISOString(),
      fecha_actualizacion: despachoWP.modified
        ? new Date(despachoWP.modified).toISOString()
        : new Date().toISOString(),
      verificado: despachoWP.meta?.verificado ?? false,
      activo: despachoWP.meta?.activo ?? true,
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
    let despachoId: string;
    let result;
    if (existing) {
      despachoId = existing.id;
      result = await supabase
        .from("despachos")
        .update(despachoSupabase)
        .eq("object_id", despachoSupabase.object_id);
    } else {
      const insertResult = await supabase
        .from("despachos")
        .insert(despachoSupabase)
        .select("id");
      if (insertResult.error) {
        console.error("Supabase error:", insertResult.error);
        return NextResponse.json(
          { error: "Error guardando en Supabase", details: insertResult.error },
          { status: 500 }
        );
      }
      despachoId = insertResult.data[0].id;
      result = insertResult;
    }
    if (result.error) {
      console.error("Supabase error:", result.error);
      return NextResponse.json(
        { error: "Error guardando en Supabase", details: result.error },
        { status: 500 }
      );
    }

    // 4. Sincronizar sedes (borrar las antiguas y crear las nuevas)
    if (Array.isArray(despachoWP.meta?._despacho_sedes)) {
      // Eliminar sedes antiguas
      await supabase.from("sedes").delete().eq("despacho_id", despachoId);
      // Mostrar datos de cada sede para depuración
      // Solo dejar el log de sedes para depuración (elimina otros console.log si existen)
      despachoWP.meta._despacho_sedes.forEach((sede: any, idx: number) => {
        console.log(`Sede[${idx}]`, sede);
      });
      // Insertar nuevas sedes
      const sedesToInsert = despachoWP.meta._despacho_sedes.map(
        (sede: any, idx: number) => ({
          despacho_id: despachoId,
          nombre: sede.nombre || `Sede ${idx + 1}`,
          descripcion: sede.descripcion || "",
          web: sede.web || "",
          ano_fundacion: sede.ano_fundacion || "",
          tamano_despacho: sede.tamano_despacho || "",
          persona_contacto: sede.persona_contacto || sede.contacto || "",
          email_contacto: sede.email_contacto || sede.email || "",
          telefono: sede.telefono || sede.telefono_contacto || "",
          numero_colegiado: sede.numero_colegiado || "",
          colegio: sede.colegio || "",
          experiencia: sede.experiencia || "",
          calle: sede.calle || "",
          numero: sede.numero || "",
          piso: sede.piso || "",
          localidad: sede.localidad || "",
          provincia: sede.provincia || "",
          codigo_postal: sede.codigo_postal || "",
          pais: sede.pais || "España",
          especialidades: sede.especialidades || "",
          servicios_especificos: sede.servicios_especificos || "",
          areas_practica: Array.isArray(sede.areas_practica)
            ? sede.areas_practica
            : [],
          estado_verificacion: sede.estado_verificacion || "pendiente",
          estado_registro: sede.estado_registro || "activo",
          is_verified: sede.is_verified ?? false,
          es_principal: idx === 0,
          activa: true,
          foto_perfil: sede.foto_perfil || "",
          horarios: sede.horarios || {},
          redes_sociales: sede.redes_sociales || {},
          observaciones: sede.observaciones || "",
        })
      );
      if (sedesToInsert.length > 0) {
        const sedesResult = await supabase.from("sedes").insert(sedesToInsert);
        if (sedesResult.error) {
          console.error("Supabase error (sedes):", sedesResult.error);
          return NextResponse.json(
            {
              error: "Error guardando sedes en Supabase",
              details: sedesResult.error,
            },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({ success: true, despacho: despachoSupabase });
  } catch (err) {
    return NextResponse.json(
      { error: "Error inesperado", details: String(err) },
      { status: 500 }
    );
  }
}
