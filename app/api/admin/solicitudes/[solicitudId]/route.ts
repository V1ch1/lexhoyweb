import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { EmailService } from "@/lib/emailService";
import { NotificationService } from "@/lib/notificationService";
import { requireSuperAdmin } from "@/lib/api-auth";

/**
 * PATCH /api/admin/solicitudes/[solicitudId]
 * Aprobar o rechazar una solicitud de despacho
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ solicitudId: string }> }
) {
  try {
    const { solicitudId } = await params;
    const { accion, motivo } = await request.json();

    if (!accion || !["aprobar", "rechazar"].includes(accion)) {
      return NextResponse.json(
        { error: "Acción inválida. Debe ser 'aprobar' o 'rechazar'" },
        { status: 400 }
      );
    }

    // Usar Service Role para bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Verificar autenticación y rol de super admin con NextAuth
    const { user, error: authError } = await requireSuperAdmin();

    if (authError) {
      return authError;
    }

    // Obtener la solicitud
    const { data: solicitud, error: solicitudError } = await supabase
      .from("solicitudes_despacho")
      .select("*")
      .eq("id", solicitudId)
      .single();

    if (solicitudError || !solicitud) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    if (solicitud.estado !== "pendiente") {
      return NextResponse.json(
        { error: "La solicitud ya ha sido procesada" },
        { status: 400 }
      );
    }

    const nuevoEstado = accion === "aprobar" ? "aprobado" : "rechazado";

    // Actualizar la solicitud
    const updateData: Record<string, unknown> = {
      estado: nuevoEstado,
      fecha_respuesta: new Date().toISOString(),
    };
    
    // Solo añadir notas si es rechazo
    if (accion === "rechazar" && motivo) {
      updateData.notas_respuesta = motivo;
    }
    
    const { error: updateError } = await supabase
      .from("solicitudes_despacho")
      .update(updateData)
      .eq("id", solicitudId);

    if (updateError) {
      console.error("Error actualizando solicitud:", updateError);
      return NextResponse.json(
        { error: "Error al actualizar solicitud" },
        { status: 500 }
      );
    }

    // Si se aprueba, asignar el propietario
    if (accion === "aprobar") {
      // 0. Verificar que el despacho no tenga ya un propietario
      const { data: despachoActual, error: despachoError } = await supabase
        .from("despachos")
        .select("owner_email")
        .eq("id", solicitud.despacho_id)
        .single();

      if (despachoError) {
        console.error("Error verificando despacho:", despachoError);
        return NextResponse.json(
          { error: "Error al verificar el despacho" },
          { status: 500 }
        );
      }

      if (despachoActual?.owner_email) {
        return NextResponse.json(
          { 
            error: "Este despacho ya tiene un propietario asignado",
            details: `El despacho ya pertenece a ${despachoActual.owner_email}`
          },
          { status: 400 }
        );
      }

      // 1. Actualizar owner_email en despachos
      const { error: ownerError } = await supabase
        .from("despachos")
        .update({ owner_email: solicitud.user_email })
        .eq("id", solicitud.despacho_id);

      if (ownerError) {
        console.error("Error asignando propietario:", ownerError);
        // Revertir el estado de la solicitud
        await supabase
          .from("solicitudes_despacho")
          .update({ estado: "pendiente" })
          .eq("id", solicitudId);

        return NextResponse.json(
          { error: "Error al asignar propietario" },
          { status: 500 }
        );
      }

      // 2. Crear entrada en user_despachos si no existe
      const { error: userDespachoError } = await supabase
        .from("user_despachos")
        .insert({
          user_id: solicitud.user_id,
          despacho_id: solicitud.despacho_id,
        })
        .select()
        .single();

      if (userDespachoError) {
        // Si el error es por duplicado, no pasa nada
        if (userDespachoError.code !== '23505') {
          console.error("Error creando relación user_despachos:", userDespachoError);
        } else {
          console.log("✅ Relación user_despachos ya existía");
        }
      } else {
        console.log("✅ Relación user_despachos creada");
      }

      // 3. Promover al usuario a despacho_admin
      const { error: roleError } = await supabase
        .from("users")
        .update({ rol: "despacho_admin" })
        .eq("id", solicitud.user_id);

      if (roleError) {
        console.error("⚠️ Error promocionando usuario a despacho_admin:", roleError);
        // No revertir la operación, solo logear el error
      } else {
        console.log("✅ Usuario promocionado a despacho_admin");
      }
    }

    // Enviar notificación al usuario
    try {
      // Crear notificación en la base de datos
      await NotificationService.create({
        userId: solicitud.user_id,
        tipo: accion === "aprobar" ? "solicitud_aprobada" : "solicitud_rechazada",
        titulo:
          accion === "aprobar"
            ? "Solicitud aprobada"
            : "Solicitud rechazada",
        mensaje:
          accion === "aprobar"
            ? `Tu solicitud para el despacho "${solicitud.despacho_nombre}" ha sido aprobada. Ya puedes gestionar tu despacho.`
            : `Tu solicitud para el despacho "${solicitud.despacho_nombre}" ha sido rechazada.${motivo ? ` Motivo: ${motivo}` : ""}`,
        url: accion === "aprobar" ? "/dashboard/despachos" : "/dashboard",
        metadata: {
          solicitudId,
          despachoId: solicitud.despacho_id,
          despachoNombre: solicitud.despacho_nombre,
        },
      });

      // Enviar email al usuario
      const emailSent = await EmailService.send({
        to: solicitud.user_email,
        subject:
          accion === "aprobar"
            ? "Solicitud de despacho aprobada - LexHoy"
            : "Solicitud de despacho rechazada - LexHoy",
        html:
          accion === "aprobar"
            ? EmailService.templateSolicitudAprobada({
                userName: solicitud.user_name,
                userEmail: solicitud.user_email,
                despachoName: solicitud.despacho_nombre,
                url: "https://despachos.lexhoy.com/dashboard/despachos",
              })
            : EmailService.templateSolicitudRechazada({
                userName: solicitud.user_name,
                userEmail: solicitud.user_email,
                despachoName: solicitud.despacho_nombre,
                motivoRechazo: motivo || "No se especificó un motivo",
              }),
      });

      if (emailSent) {
        } else {
        console.error("⚠️ El email no se pudo enviar, pero la notificación en app se creó");
      }
    } catch (notifError) {
      console.error("⚠️ Error al notificar al usuario:", notifError);
      // No fallar la operación si falla la notificación
    }

    return NextResponse.json({
      success: true,
      message: `Solicitud ${nuevoEstado} correctamente`,
      solicitud: {
        id: solicitudId,
        estado: nuevoEstado,
      },
    });
  } catch (error) {
    console.error("💥 Error procesando solicitud:", error);
    return NextResponse.json(
      {
        error: "Error al procesar solicitud",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
