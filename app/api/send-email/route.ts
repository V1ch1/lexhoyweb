import { NextResponse } from "next/server";
import { Resend } from "resend";

// Inicializar Resend con la API key del lado del servidor
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, html, from } = body;

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos (to, subject, html)" },
        { status: 400 }
      );
    }

    // Enviar email usando Resend
    const { data, error } = await resend.emails.send({
      from: from || `LexHoy <${process.env.RESEND_FROM_EMAIL || 'notificaciones@lexhoy.com'}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      console.error("❌ Error de Resend:", error);
      return NextResponse.json(
        { error: "Error al enviar el correo", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("❌ Error en /api/send-email:", error);
    return NextResponse.json(
      { error: "Error interno", details: String(error) },
      { status: 500 }
    );
  }
}
