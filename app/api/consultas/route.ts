import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "notificaciones@lexhoy.com";

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

    const body = await req.json();
    const { nombre, email, telefono, mensaje, lead_id, lead_title } = body;

    // Validar datos requeridos
    if (!nombre || !email || !mensaje) {
      return new NextResponse("Datos requeridos faltantes", { status: 400 });
    }

    // Obtener información del usuario
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("nombre, email, despacho_id")
      .eq("id", userId)
      .single();

    // Obtener nombre del despacho si tiene uno asignado
    let despachoNombre = null;
    if (user?.despacho_id) {
      const { data: despacho } = await supabaseAdmin
        .from("despachos")
        .select("nombre")
        .eq("id", user.despacho_id)
        .single();
      despachoNombre = despacho?.nombre;
    }

    // Guardar consulta en la base de datos
    const { data: consulta, error } = await supabaseAdmin
      .from("lead_consultas")
      .insert({
        lead_id,
        user_id: userId,
        despacho_id: user?.despacho_id || null,
        nombre,
        email,
        telefono: telefono || null,
        mensaje,
        lead_title: lead_title || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating consulta:", error);
      return new NextResponse("Error al crear consulta", { status: 500 });
    }

    // Enviar email de notificación a admin
    try {
      if (process.env.RESEND_API_KEY) {
        console.log("📧 Intentando enviar email de consulta...");
        console.log("From:", FROM_EMAIL);
        console.log("To:", "hola@blancoyenbatea.com");
        
        const emailResult = await resend.emails.send({
          from: `LexHoy <${FROM_EMAIL}>`,
          to: ["hola@blancoyenbatea.com"],
          subject: `Nueva consulta: ${lead_title || "Lead"}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #E04040;">Nueva Consulta de Lead</h2>
              
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Lead</h3>
                <p><strong>Título:</strong> ${lead_title || "Sin título"}</p>
              </div>

              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Datos del Usuario</h3>
                <p><strong>Nombre:</strong> ${nombre}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Teléfono:</strong> ${telefono || "No proporcionado"}</p>
                ${despachoNombre ? `<p><strong>Despacho:</strong> ${despachoNombre}</p>` : ""}
                <p><strong>Email de usuario:</strong> ${user?.email || email}</p>
              </div>

              <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107;">
                <h3 style="margin-top: 0; color: #856404;">Consulta</h3>
                <p style="white-space: pre-wrap;">${mensaje}</p>
              </div>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                <p style="color: #666; font-size: 12px;">
                  Responde directamente a ${email} para atender esta consulta.
                </p>
              </div>
            </div>
          `,
        });
        
        console.log("✅ Email enviado exitosamente:", emailResult);
      } else {
        console.warn("⚠️ RESEND_API_KEY no configurada");
      }
    } catch (emailError) {
      console.error("❌ Error sending email notification:", emailError);
      // No fallar la request si el email falla
    }

    return NextResponse.json({ success: true, data: consulta });
  } catch (error) {
    console.error("[CONSULTAS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
