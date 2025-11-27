import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { UserService } from "@/lib/userService";
import { validateUUID, ValidationError, sanitizeString, validateNotEmpty } from "@/lib/validation";
import { getRequiredEnvVar } from "@/lib/env";
import { requireSuperAdmin } from "@/lib/api-auth";

const userService = new UserService();

export async function POST(request: Request) {
  try {
    // Verificar autenticación y rol de super admin con NextAuth
    const { user, error: authError } = await requireSuperAdmin();
    if (authError) return authError;

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
