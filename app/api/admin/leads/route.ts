import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!supabaseAdmin) {
      return new NextResponse("Database connection error", { status: 500 });
    }

    // Verificar rol de admin
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("rol")
      .eq("id", userId)
      .single();

    if (userError || user?.rol !== "super_admin") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Obtener todos los leads
    const { data: leads, error } = await supabaseAdmin
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching leads:", error);
      return new NextResponse("Error fetching leads", { status: 500 });
    }

    return NextResponse.json(leads);
  } catch (error) {
    console.error("[ADMIN_LEADS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!supabaseAdmin) {
      return new NextResponse("Database connection error", { status: 500 });
    }

    // Verificar rol de admin
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("rol")
      .eq("id", userId)
      .single();

    if (userError || user?.rol !== "super_admin") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const {
      nombre,
      correo,
      telefono,
      cuerpo_mensaje,
      url_pagina,
      titulo_post,
      fuente,
      especialidad,
      provincia,
      ciudad,
      urgencia,
      precio_base,
      precio_venta_directa,
      procesar_con_ia,
    } = body;

    // Validar datos requeridos
    if (!cuerpo_mensaje || !nombre || !correo) {
      return new NextResponse("Datos requeridos faltantes", { status: 400 });
    }

    let leadData: any = {
      nombre,
      correo,
      telefono: telefono || null,
      cuerpo_mensaje,
      url_pagina: url_pagina || "https://lexhoy.com/manual",
      titulo_post: titulo_post || "Lead creado manualmente",
      fuente: fuente || "manual",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Si se debe procesar con IA
    if (procesar_con_ia) {
      // Importar dinámicamente el servicio de IA solo en el servidor
      const { AILeadService } = await import("@/lib/services/aiLeadService");

      const analysis = await AILeadService.processLead({
        nombre,
        correo,
        telefono,
        cuerpoMensaje: cuerpo_mensaje,
        urlPagina: url_pagina || "https://lexhoy.com/manual",
        tituloPost: titulo_post || "Lead creado manualmente",
      });

      const cumpleCalidad = AILeadService.meetsQualityStandards(analysis);
      const precioBaseIA = cumpleCalidad
        ? AILeadService.calculateBasePrice(analysis)
        : null;

      leadData = {
        ...leadData,
        especialidad: analysis.especialidad,
        provincia: analysis.provincia,
        ciudad: analysis.ciudad,
        urgencia: analysis.urgencia,
        resumen_ia: analysis.resumen,
        precio_estimado: analysis.precioEstimado,
        palabras_clave: analysis.palabrasClave,
        estado: cumpleCalidad ? "procesado" : "descartado",
        precio_base: precioBaseIA,
        puntuacion_calidad: analysis.puntuacionCalidad,
        nivel_detalle: analysis.nivelDetalle,
        procesado_at: new Date().toISOString(),
      };
    } else {
      // Crear manualmente sin IA
      leadData = {
        ...leadData,
        especialidad: especialidad || null,
        provincia: provincia || null,
        ciudad: ciudad || null,
        urgencia: urgencia || "media",
        precio_base: precio_base || null,
        precio_venta_directa: precio_venta_directa || null,
        estado: "procesado",
      };
    }

    // Crear lead
    const { data: lead, error } = await supabaseAdmin
      .from("leads")
      .insert(leadData)
      .select()
      .single();

    if (error) {
      console.error("Error creating lead:", error);
      return new NextResponse("Error al crear lead", { status: 500 });
    }

    // Enviar notificaciones si el lead está en estado "procesado"
    if (lead.estado === "procesado" && lead.precio_base) {
      try {
        // Obtener usuarios despacho_admin activos
        const { data: despachoAdmins } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("rol", "despacho_admin")
          .eq("estado", "activo");

        if (despachoAdmins && despachoAdmins.length > 0) {
          // Importar servicios
          const { EmailService } = await import("@/lib/services/emailService");
          const { NotificationService } = await import("@/lib/notificationService");

          // Enviar notificaciones a cada despacho_admin
          await Promise.allSettled(
            despachoAdmins.map(async (admin) => {
              // Email (respeta preferencias)
              await EmailService.sendNewLeadAvailable(admin.id, {
                id: lead.id,
                especialidad: lead.especialidad || "General",
                urgencia: lead.urgencia || "media",
                puntuacion_calidad: lead.puntuacion_calidad || 50,
                precio: lead.precio_base,
              });

              // Notificación dashboard (siempre)
              await NotificationService.create({
                userId: admin.id,
                tipo: "nuevo_lead",
                titulo: `🎯 Nuevo Lead: ${lead.especialidad || "General"}`,
                mensaje: `Lead de ${lead.urgencia || "media"} urgencia disponible. Precio: ${lead.precio_base}€`,
                url: `/dashboard/leads/${lead.id}`,
                metadata: {
                  leadId: lead.id,
                  especialidad: lead.especialidad,
                  urgencia: lead.urgencia,
                  precio: lead.precio_base,
                },
              });
            })
          );

          console.log(`✅ Notificaciones enviadas a ${despachoAdmins.length} despachos`);
        }
      } catch (notifError) {
        console.error("Error enviando notificaciones:", notifError);
        // No fallar la creación del lead si las notificaciones fallan
      }
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("[ADMIN_LEAD_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

