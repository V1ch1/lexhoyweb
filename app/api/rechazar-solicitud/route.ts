import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { UserService } from "@/lib/userService";
import { validateUUID, ValidationError, sanitizeString, validateNotEmpty } from "@/lib/validation";
import { getRequiredEnvVar } from "@/lib/env";

const userService = new UserService();

export async function POST(request: Request) {
  try {
    // Leer el JWT del header Authorization
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Crear cliente Supabase con el token del usuario
    const SUPABASE_URL = getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_URL');
    const SUPABASE_ANON_KEY = getRequiredEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Verificar que el usuario sea super admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener el rol del usuario
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (userError || !userData || userData.rol !== "super_admin") {
      console.error("❌ Error de permisos:", { userError, userData });
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      );
    }

    // Obtener datos del body
    const body = await request.json();
    const { solicitudId, notas } = body;

    // Validar solicitudId
    if (!solicitudId || !validateUUID(solicitudId)) {
      throw new ValidationError("ID de solicitud inválido", "solicitudId");
    }

    // Validar y sanitizar notas (requeridas para rechazo)
    if (!notas || !validateNotEmpty(notas)) {
      throw new ValidationError("Debes proporcionar un motivo de rechazo", "notas");
    }
    
    const notasSanitizadas = sanitizeString(notas);

    // Rechazar la solicitud usando el servicio
    await userService.rejectSolicitudDespacho(
      solicitudId,
      user.id,
      notasSanitizadas
    );

    return NextResponse.json({
      success: true,
      message: "Solicitud rechazada correctamente",
    });
  } catch (error) {
    console.error("💥 Error al rechazar solicitud:", error);
    
    // Manejo especial para errores de validación
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, field: error.field },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        error: "Error al rechazar solicitud",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
