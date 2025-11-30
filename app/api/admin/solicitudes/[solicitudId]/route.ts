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
    
    // Leer el body UNA SOLA VEZ al principio
    const body = await request.json();
    const { accion, motivo, nuevoEstado: nuevoEstadoBody } = body;

    // Validar acción
    if (!accion || !["aprobar", "rechazar", "revocar", "modificar"].includes(accion)) {
      return NextResponse.json(
        { error: "Acción inválida. Debe ser 'aprobar', 'rechazar', 'revocar' o 'modificar'" },
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

    // Validar estado según acción
    if (accion === "aprobar" || accion === "rechazar") {
      // Aprobar/Rechazar solo si está pendiente
      if (solicitud.estado !== "pendiente") {
        return NextResponse.json(
          { error: "Solo se pueden aprobar/rechazar solicitudes pendientes" },
          { status: 400 }
        );
      }
    } else if (accion === "revocar") {
      // Revocar solo si está aprobada
      if (solicitud.estado !== "aprobado") {
        return NextResponse.json(
          { error: "Solo se pueden revocar solicitudes aprobadas" },
          { status: 400 }
        );
      }
    } else if (accion === "modificar") {
      // Modificar puede aplicarse a cualquier estado
      // Se requiere el nuevo estado en el body
      if (!nuevoEstadoBody || !["pendiente", "aprobado", "rechazado", "cancelada"].includes(nuevoEstadoBody)) {
        return NextResponse.json(
          { error: "Para modificar se requiere un 'nuevoEstado' válido (pendiente, aprobado, rechazado, cancelada)" },
          { status: 400 }
        );
      }
    }

    // Determinar el nuevo estado
    let nuevoEstado: string;
    if (accion === "aprobar") {
      nuevoEstado = "aprobado";
    } else if (accion === "rechazar") {
      nuevoEstado = "rechazado";
    } else if (accion === "revocar") {
      nuevoEstado = "rechazado"; // Al revocar, marcamos como rechazada
    } else {
      // modificar - usar el nuevoEstado del body ya parseado
      nuevoEstado = nuevoEstadoBody;
    }

    const estadoAnterior = solicitud.estado;
    console.log(`🔄 Cambio de estado: ${estadoAnterior} → ${nuevoEstado}`);

    // Actualizar la solicitud
    const updateData: Record<string, unknown> = {
      estado: nuevoEstado,
      fecha_respuesta: new Date().toISOString(),
    };
    
    // Añadir notas si es rechazo o revocación
    if ((accion === "rechazar" || accion === "revocar") && motivo) {
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

    // ========================================
    // LÓGICA DE TRANSICIÓN DE ESTADOS
    // ========================================
    
    // Para la acción "modificar", necesitamos manejar las transiciones de estado
    if (accion === "modificar") {
      const estabaAprobado = estadoAnterior === "aprobado";
      const seraAprobado = nuevoEstado === "aprobado";

      // CASO 1: De APROBADO → (PENDIENTE, RECHAZADO, CANCELADA)
      // Necesitamos revocar el acceso
      if (estabaAprobado && !seraAprobado) {
        console.log("🔄 Revocando acceso al despacho...");
        
        // 1. Eliminar owner_email del despacho
        const { error: removeOwnerError } = await supabase
          .from("despachos")
          .update({ owner_email: null })
          .eq("id", solicitud.despacho_id);

        if (removeOwnerError) {
          console.error("Error eliminando propietario:", removeOwnerError);
        } else {
          console.log("✅ owner_email eliminado del despacho");
        }

        // 2. Eliminar relación en user_despachos
        const { error: deleteRelError } = await supabase
          .from("user_despachos")
          .delete()
          .eq("user_id", solicitud.user_id)
          .eq("despacho_id", solicitud.despacho_id);

        if (deleteRelError) {
          console.error("⚠️ Error eliminando relación user_despachos:", deleteRelError);
        } else {
          console.log("✅ Relación user_despachos eliminada");
        }

        // 3. Verificar si el usuario tiene otros despachos
        const { data: otrosDespachos, error: otrosError } = await supabase
          .from("user_despachos")
          .select("id")
          .eq("user_id", solicitud.user_id);

        if (otrosError) {
          console.error("Error verificando otros despachos:", otrosError);
        }

        // 4. Si no tiene otros despachos, degradar a usuario normal
        if (!otrosDespachos || otrosDespachos.length === 0) {
          const { error: roleError } = await supabase
            .from("users")
            .update({ rol: "usuario" })
            .eq("id", solicitud.user_id);

          if (roleError) {
            console.error("⚠️ Error degradando usuario:", roleError);
          } else {
            console.log("✅ Usuario degradado a 'usuario'");
          }
        }
      }

      // CASO 2: De (PENDIENTE, RECHAZADO, CANCELADA) → APROBADO
      // Necesitamos asignar el acceso
      if (!estabaAprobado && seraAprobado) {
        console.log("🔄 Asignando acceso al despacho...");
        
        // 0. Verificar que el despacho no tenga ya un propietario
        const { data: despachoActual, error: despachoError } = await supabase
          .from("despachos")
          .select("owner_email")
          .eq("id", solicitud.despacho_id)
          .single();

        if (despachoError) {
          console.error("Error verificando despacho:", despachoError);
          // Revertir el cambio de estado
          await supabase
            .from("solicitudes_despacho")
            .update({ estado: estadoAnterior })
            .eq("id", solicitudId);
          
          return NextResponse.json(
            { error: "Error al verificar el despacho" },
            { status: 500 }
          );
        }

        if (despachoActual?.owner_email) {
          // Revertir el cambio de estado
          await supabase
            .from("solicitudes_despacho")
            .update({ estado: estadoAnterior })
            .eq("id", solicitudId);
          
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
            .update({ estado: estadoAnterior })
            .eq("id", solicitudId);

          return NextResponse.json(
            { error: "Error al asignar propietario" },
            { status: 500 }
          );
        } else {
          console.log("✅ owner_email asignado al despacho");
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
          console.error("⚠️ Error promoviendo usuario:", roleError);
        } else {
          console.log("✅ Usuario promovido a 'despacho_admin'");
        }
      }
    }

    // REVOCAR: Eliminar propietario del despacho y degradar rol del usuario
    if (accion === "revocar") {
      // 1. Eliminar owner_email del despacho
      const { error: removeOwnerError } = await supabase
        .from("despachos")
        .update({ owner_email: null })
        .eq("id", solicitud.despacho_id);

      if (removeOwnerError) {
        console.error("Error eliminando propietario:", removeOwnerError);
        return NextResponse.json(
          { error: "Error al eliminar propietario del despacho" },
          { status: 500 }
        );
      }

      // 2. Verificar si el usuario tiene otros despachos
      const { data: otrosDespachos, error: otrosError } = await supabase
        .from("user_despachos")
        .select("id")
        .eq("user_id", solicitud.user_id)
        .neq("despacho_id", solicitud.despacho_id);

      if (otrosError) {
        console.error("Error verificando otros despachos:", otrosError);
      }

      // 3. Si no tiene otros despachos, degradar a usuario normal
      if (!otrosDespachos || otrosDespachos.length === 0) {
        const { error: roleError } = await supabase
          .from("users")
          .update({ rol: "usuario" })
          .eq("id", solicitud.user_id);

        if (roleError) {
          console.error("⚠️ Error degradando usuario:", roleError);
        } else {
          console.log("✅ Usuario degradado a 'usuario'");
        }
      }

      // 4. Eliminar relación en user_despachos
      const { error: deleteRelError } = await supabase
        .from("user_despachos")
        .delete()
        .eq("user_id", solicitud.user_id)
        .eq("despacho_id", solicitud.despacho_id);

      if (deleteRelError) {
        console.error("⚠️ Error eliminando relación user_despachos:", deleteRelError);
      } else {
        console.log("✅ Relación user_despachos eliminada");
      }
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

    // ========================================
    // NOTIFICACIONES Y EMAILS
    // ========================================
    
    // Determinar qué tipo de notificación enviar basado en la transición de estado
    let tipoNotificacion: "aprobacion" | "rechazo" | "ninguna" = "ninguna";
    let tipoTemplate: "bienvenida" | "acceso-restaurado" | "rechazo-inicial" | "acceso-revocado" | null = null;
    
    // Transiciones que resultan en APROBACIÓN
    if (nuevoEstado === "aprobado" && estadoAnterior !== "aprobado") {
      tipoNotificacion = "aprobacion";
      // Determinar si es primera aprobación o re-aprobación
      tipoTemplate = estadoAnterior === "pendiente" ? "bienvenida" : "acceso-restaurado";
      console.log(`📧 Transición ${estadoAnterior} → ${nuevoEstado}: Enviando email de ${tipoTemplate === "bienvenida" ? "BIENVENIDA" : "ACCESO RESTAURADO"}`);
    }
    // Transiciones que resultan en RECHAZO
    else if (nuevoEstado === "rechazado" && estadoAnterior !== "rechazado") {
      tipoNotificacion = "rechazo";
      // Determinar si es primer rechazo o revocación de acceso
      tipoTemplate = estadoAnterior === "aprobado" ? "acceso-revocado" : "rechazo-inicial";
      console.log(`📧 Transición ${estadoAnterior} → ${nuevoEstado}: Enviando email de ${tipoTemplate === "acceso-revocado" ? "ACCESO REVOCADO" : "RECHAZO INICIAL"}`);
    }
    // CANCELACIÓN desde aprobado (similar a revocación)
    else if (nuevoEstado === "cancelada" && estadoAnterior === "aprobado") {
      tipoNotificacion = "rechazo";
      tipoTemplate = "acceso-revocado";
      console.log(`📧 Transición ${estadoAnterior} → ${nuevoEstado}: Enviando email de ACCESO REVOCADO`);
    }
    // Otras transiciones no envían email
    else {
      console.log(`ℹ️ Transición ${estadoAnterior} → ${nuevoEstado}: No se envía email`);
    }

    if (tipoNotificacion !== "ninguna" && tipoTemplate) {
      try {
        const esAprobacion = tipoNotificacion === "aprobacion";

        // Crear notificación en la base de datos
        await NotificationService.create({
          userId: solicitud.user_id,
          tipo: esAprobacion ? "solicitud_aprobada" : "solicitud_rechazada",
          titulo: esAprobacion ? "Solicitud aprobada" : "Solicitud rechazada",
          mensaje: esAprobacion
            ? `Tu solicitud para el despacho "${solicitud.despacho_nombre}" ha sido aprobada. Ya puedes gestionar tu despacho.`
            : `Tu solicitud para el despacho "${solicitud.despacho_nombre}" ha sido rechazada.${motivo ? ` Motivo: ${motivo}` : ""}`,
          url: esAprobacion ? "/dashboard/despachos" : "/dashboard",
          metadata: {
            solicitudId,
            despachoId: solicitud.despacho_id,
            despachoNombre: solicitud.despacho_nombre,
          },
        });

        // Seleccionar la plantilla de email correcta según el contexto
        let emailHtml: string;
        let emailSubject: string;

        switch (tipoTemplate) {
          case "bienvenida":
            emailSubject = "🎉 ¡Bienvenido a LexHoy! Tu despacho ha sido aprobado";
            emailHtml = EmailService.templateSolicitudBienvenida({
              userName: solicitud.user_name,
              userEmail: solicitud.user_email,
              despachoName: solicitud.despacho_nombre,
              url: "https://despachos.lexhoy.com/dashboard/despachos",
            });
            break;

          case "acceso-restaurado":
            emailSubject = "✅ Tu acceso al despacho ha sido restaurado - LexHoy";
            emailHtml = EmailService.templateSolicitudAccesoRestaurado({
              userName: solicitud.user_name,
              userEmail: solicitud.user_email,
              despachoName: solicitud.despacho_nombre,
              url: "https://despachos.lexhoy.com/dashboard/despachos",
            });
            break;

          case "rechazo-inicial":
            emailSubject = "Actualización sobre tu solicitud - LexHoy";
            emailHtml = EmailService.templateSolicitudRechazada({
              userName: solicitud.user_name,
              userEmail: solicitud.user_email,
              despachoName: solicitud.despacho_nombre,
              motivoRechazo: motivo || "No se especificó un motivo",
            });
            break;

          case "acceso-revocado":
            emailSubject = "⚠️ Actualización importante sobre tu despacho - LexHoy";
            emailHtml = EmailService.templateSolicitudAccesoRevocado({
              userName: solicitud.user_name,
              userEmail: solicitud.user_email,
              despachoName: solicitud.despacho_nombre,
              motivoRechazo: motivo || "No se especificó un motivo",
            });
            break;

          default:
            throw new Error(`Template type not recognized: ${tipoTemplate}`);
        }

        // Enviar email al usuario
        const emailSent = await EmailService.send({
          to: solicitud.user_email,
          subject: emailSubject,
          html: emailHtml,
        });

        if (emailSent) {
          console.log(`✅ Email de ${tipoTemplate.toUpperCase()} enviado exitosamente a ${solicitud.user_email}`);
        } else {
          console.error(`⚠️ El email de ${tipoTemplate} no se pudo enviar, pero la notificación en app se creó`);
        }
      } catch (notifError) {
        console.error("⚠️ Error al notificar al usuario:", notifError);
        // No fallar la operación si falla la notificación
      }
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
