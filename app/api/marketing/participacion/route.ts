import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/api-auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { entradaId, entradaTitulo, userId, userName, userEmail, mensaje } =
      body;

    // Validaciones
    if (!entradaId || !entradaTitulo || !userId || !userName || !userEmail) {
      return NextResponse.json(
        { error: "Faltan datos requeridos" },
        { status: 400 }
      );
    }

    // Verificar que el usuario existe y está autenticado con NextAuth
    const { user, error: authError } = await requireAuth();

    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Guardar la solicitud de participación en la base de datos
    const { data, error } = await supabase
      .from("participaciones_marketing")
      .insert({
        entrada_id: entradaId,
        entrada_titulo: entradaTitulo,
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        mensaje: mensaje || "",
        estado: "pendiente",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error al guardar participación:", error);
      throw error;
    }

    // TODO: Enviar email de notificación al equipo de marketing
    // await EmailService.send({...})

    return NextResponse.json({
      success: true,
      message: "Solicitud de participación enviada correctamente",
      data,
    });
  } catch (error) {
    console.error("❌ Error en endpoint de participación:", error);
    return NextResponse.json(
      {
        error: "Error al procesar la solicitud",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
