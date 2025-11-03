import { NextResponse } from "next/server";
import { NotificationService } from "@/lib/notificationService";
import { EmailService } from "@/lib/emailService";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      solicitudId,
      userName,
      userEmail,
      despachoNombre,
      despachoLocalidad,
      despachoProvincia,
    } = body;

    console.log("📬 Notificando solicitud de despacho:", solicitudId);

    // 1. Obtener todos los super_admin
    const { data: superAdmins, error: adminError } = await supabase
      .from("users")
      .select("id, email")
      .eq("rol", "super_admin");

    if (adminError) {
      console.error("Error obteniendo super_admins:", adminError);
      throw adminError;
    }

    if (!superAdmins || superAdmins.length === 0) {
      console.warn("⚠️ No hay super_admins para notificar");
      return NextResponse.json(
        { message: "No hay super_admins para notificar" },
        { status: 200 }
      );
    }

    console.log(`📧 Enviando notificaciones a ${superAdmins.length} super_admins`);

    // 2. Crear notificaciones para todos los super_admins
    const adminIds = superAdmins.map((admin) => admin.id);
    const ubicacion = [despachoLocalidad, despachoProvincia]
      .filter(Boolean)
      .join(", ");

    await NotificationService.createMany(adminIds, {
      tipo: "solicitud_despacho",
      titulo: "Nueva solicitud de despacho",
      mensaje: `${userName} ha solicitado la propiedad del despacho "${despachoNombre}"${
        ubicacion ? ` en ${ubicacion}` : ""
      }`,
      url: "/admin/users?tab=solicitudes",
      metadata: {
        solicitudId,
        userName,
        userEmail,
        despachoNombre,
      },
    });

    console.log(`✅ ${adminIds.length} notificaciones creadas`);

    // 3. Enviar emails a todos los super_admins
    const emailPromises = superAdmins.map((admin) =>
      EmailService.send({
        to: admin.email,
        subject: "Nueva solicitud de despacho - LexHoy",
        html: EmailService.templateSolicitudRecibida({
          userName,
          userEmail,
          despachoName: despachoNombre,
          fecha: new Date().toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          url: "https://despachos.lexhoy.com/admin/users?tab=solicitudes",
        }),
      })
    );

    await Promise.all(emailPromises);
    console.log(`✅ ${superAdmins.length} emails enviados`);

    return NextResponse.json(
      {
        message: "Notificaciones y emails enviados correctamente",
        notificados: superAdmins.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error en notificar-solicitud:", error);
    return NextResponse.json(
      {
        error: "Error al enviar notificaciones",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
