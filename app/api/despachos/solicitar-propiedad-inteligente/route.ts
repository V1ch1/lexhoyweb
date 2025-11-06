import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const WORDPRESS_API_URL = "https://lexhoy.com/wp-json/wp/v2";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { despachoId, origen, wordpressId } = body;

    console.log("📋 [Solicitud Inteligente]", { despachoId, origen, wordpressId });

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Obtener usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Usuario no válido" }, { status: 401 });
    }

    // Obtener datos del usuario
    const { data: userData } = await supabase
      .from("users")
      .select("email, nombre, apellidos")
      .eq("id", user.id)
      .single();

    const userEmail = userData?.email || user.email;
    const userName = userData?.nombre 
      ? `${userData.nombre} ${userData.apellidos || ""}`.trim()
      : user.email?.split("@")[0] || "Usuario";

    let finalDespachoId = despachoId;

    // Si el despacho viene de WordPress, importarlo primero
    if (origen === "wordpress" && wordpressId) {
      console.log("📥 [Importar] Despacho desde WordPress:", wordpressId);

      try {
        // Obtener datos completos del despacho desde WordPress
        const wpResponse = await fetch(`${WORDPRESS_API_URL}/despacho/${wordpressId}`);
        if (!wpResponse.ok) {
          throw new Error("Error al obtener despacho de WordPress");
        }

        const despacho = await wpResponse.json();

        // Preparar datos del despacho
        const despachoData = {
          wordpress_id: despacho.id,
          nombre: despacho.title?.rendered || "Sin nombre",
          slug: despacho.slug || `despacho-${despacho.id}`,
          status: "publish",
          created_at: despacho.date_gmt || new Date().toISOString(),
          updated_at: despacho.modified_gmt || new Date().toISOString(),
        };

        // Verificar si ya existe
        const { data: existingDespacho } = await supabase
          .from("despachos")
          .select("id")
          .eq("wordpress_id", wordpressId)
          .single();

        if (existingDespacho) {
          console.log("✅ [Importar] Despacho ya existe:", existingDespacho.id);
          finalDespachoId = existingDespacho.id;
        } else {
          // Insertar despacho
          const { data: newDespacho, error: despachoError } = await supabase
            .from("despachos")
            .insert([despachoData])
            .select()
            .single();

          if (despachoError) {
            console.error("❌ [Importar] Error al crear despacho:", despachoError);
            throw despachoError;
          }

          console.log("✅ [Importar] Despacho creado:", newDespacho.id);
          finalDespachoId = newDespacho.id;

          // Importar sedes si existen
          const sedesData = Array.isArray(despacho.meta?._despacho_sedes) 
            ? despacho.meta._despacho_sedes 
            : [];

          if (sedesData.length > 0) {
            console.log(`📍 [Importar] Importando ${sedesData.length} sedes...`);

            const sedesToInsert = sedesData.map((sede: any) => ({
              despacho_id: newDespacho.id,
              wp_sede_id: sede.id_sede || null,
              nombre: sede.nombre || `Sede de ${despachoData.nombre}`,
              descripcion: sede.descripcion || "",
              web: sede.web || "",
              telefono: sede.telefono || "",
              email_contacto: sede.email_contacto || "",
              persona_contacto: sede.persona_contacto || "",
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
              ano_fundacion: sede.ano_fundacion ? parseInt(String(sede.ano_fundacion)) : null,
              tamano_despacho: sede.tamano_despacho || "",
              especialidades: sede.especialidades || "",
              servicios_especificos: sede.servicios_especificos || "",
              areas_practica: Array.isArray(sede.areas_practica) ? sede.areas_practica : [],
              foto_perfil: sede.foto_perfil || null,
              estado_verificacion: sede.estado_verificacion || "pendiente",
              estado_registro: sede.estado_registro || "activo",
              is_verified: Boolean(sede.is_verified),
              es_principal: Boolean(sede.es_principal),
              activa: sede.activa !== false,
              horarios: sede.horarios || {},
              redes_sociales: sede.redes_sociales || {},
              observaciones: sede.observaciones || "",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }));

            const { error: sedesError } = await supabase
              .from("sedes")
              .insert(sedesToInsert);

            if (sedesError) {
              console.error("❌ [Importar] Error al crear sedes:", sedesError);
            } else {
              console.log(`✅ [Importar] ${sedesData.length} sedes importadas`);
            }
          }
        }
      } catch (importError) {
        console.error("❌ [Importar] Error:", importError);
        return NextResponse.json(
          { error: "Error al importar despacho", details: importError instanceof Error ? importError.message : "Unknown" },
          { status: 500 }
        );
      }
    }

    // Obtener datos del despacho
    const { data: despacho } = await supabase
      .from("despachos")
      .select(`
        id,
        nombre,
        sedes (
          localidad,
          provincia
        )
      `)
      .eq("id", finalDespachoId)
      .single();

    if (!despacho) {
      return NextResponse.json({ error: "Despacho no encontrado" }, { status: 404 });
    }

    const sede = despacho.sedes?.[0] || {};

    // Verificar si el usuario ya es propietario del despacho
    const { data: despachoCompleto } = await supabase
      .from("despachos")
      .select("owner_email")
      .eq("id", finalDespachoId)
      .single();

    if (despachoCompleto?.owner_email === userEmail) {
      return NextResponse.json(
        { error: "Ya eres propietario de este despacho" },
        { status: 400 }
      );
    }

    // Verificar si ya tiene acceso a través de user_despachos
    const { data: userDespacho } = await supabase
      .from("user_despachos")
      .select("id")
      .eq("user_id", user.id)
      .eq("despacho_id", finalDespachoId)
      .single();

    if (userDespacho) {
      return NextResponse.json(
        { error: "Ya tienes acceso a este despacho" },
        { status: 400 }
      );
    }

    // Verificar si ya existe una solicitud pendiente (solo pendientes, no aprobadas)
    // Las aprobadas se ignoran porque el usuario pudo haberse desasignado
    const { data: existingSolicitud } = await supabase
      .from("solicitudes_despacho")
      .select("id, estado")
      .eq("user_id", user.id)
      .eq("despacho_id", finalDespachoId)
      .eq("estado", "pendiente")
      .single();

    if (existingSolicitud) {
      return NextResponse.json(
        { 
          error: "Ya tienes una solicitud pendiente para este despacho",
          solicitudId: existingSolicitud.id,
        },
        { status: 400 }
      );
    }

    // Crear solicitud
    const { data: solicitud, error: solicitudError } = await supabase
      .from("solicitudes_despacho")
      .insert({
        user_id: user.id,
        user_email: userEmail,
        user_name: userName,
        despacho_id: finalDespachoId,
        despacho_nombre: despacho.nombre,
        despacho_localidad: sede.localidad || null,
        despacho_provincia: sede.provincia || null,
        estado: "pendiente",
        fecha_solicitud: new Date().toISOString(),
      })
      .select()
      .single();

    if (solicitudError) {
      console.error("❌ Error al crear solicitud:", solicitudError);
      return NextResponse.json(
        { error: "Error al crear solicitud", details: solicitudError.message },
        { status: 500 }
      );
    }

    console.log("✅ Solicitud creada:", solicitud.id);

    // Notificar a super admins
    try {
      // En desarrollo local, usar localhost; en producción usar la URL configurada
      const baseUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000'
        : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
      
      console.log("📧 Enviando notificación a:", `${baseUrl}/api/notificar-solicitud`);
      
      const notifResponse = await fetch(`${baseUrl}/api/notificar-solicitud`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          solicitudId: solicitud.id,
          userName,
          userEmail,
          despachoNombre: despacho.nombre,
          despachoLocalidad: sede.localidad,
          despachoProvincia: sede.provincia,
        }),
      });

      if (!notifResponse.ok) {
        const errorData = await notifResponse.json();
        console.error("⚠️ Error en respuesta de notificación:", errorData);
      } else {
        const responseData = await notifResponse.json();
        console.log("✅ Notificación enviada correctamente:", responseData);
      }
    } catch (notifError) {
      console.error("⚠️ Error al notificar:", notifError);
    }

    return NextResponse.json({
      success: true,
      message: origen === "wordpress" 
        ? "Despacho importado y solicitud creada correctamente"
        : "Solicitud creada correctamente",
      solicitudId: solicitud.id,
      despachoId: finalDespachoId,
      importado: origen === "wordpress",
    });
  } catch (error) {
    console.error("💥 Error en solicitud inteligente:", error);
    return NextResponse.json(
      {
        error: "Error al procesar solicitud",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
