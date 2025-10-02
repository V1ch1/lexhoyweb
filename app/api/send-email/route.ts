import { NextResponse } from "next/server";
import { EmailService } from "@/lib/emailService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, template, data } = body;

    if (!to || !subject || !template) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos" },
        { status: 400 }
      );
    }

    let html = "";

    // Seleccionar template
    switch (template) {
      case "solicitud-recibida":
        html = EmailService.templateSolicitudRecibida(data);
        break;
      case "solicitud-aprobada":
        html = EmailService.templateSolicitudAprobada(data);
        break;
      case "solicitud-rechazada":
        html = EmailService.templateSolicitudRechazada(data);
        break;
      case "usuario-nuevo":
        html = EmailService.templateUsuarioNuevo(data);
        break;
      default:
        return NextResponse.json(
          { error: "Template no válido" },
          { status: 400 }
        );
    }

    // Enviar email
    const success = await EmailService.send({ to, subject, html });

    if (!success) {
      return NextResponse.json(
        { error: "Error enviando email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en /api/send-email:", error);
    return NextResponse.json(
      { error: "Error interno", details: String(error) },
      { status: 500 }
    );
  }
}
