import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { UserService } from "@/lib/userService";
import { validateUUID, ValidationError, sanitizeString } from "@/lib/validation";
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

    // Sanitizar notas si existen
    const notasSanitizadas = notas ? sanitizeString(notas) : "Solicitud aprobada";

    // Aprobar la solicitud usando el servicio
    await userService.approveSolicitudDespacho(
      solicitudId,
      user.id,
      notasSanitizadas
    );

    return NextResponse.json({
      success: true,
      message: "Solicitud aprobada correctamente",
    });
  } catch (error) {
    console.error("💥 Error completo al aprobar solicitud:", error);
    console.error("💥 Stack trace:", error instanceof Error ? error.stack : "No stack");
    
    // Manejo especial para errores de validación
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, field: error.field },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        error: "Error al aprobar solicitud",
        details: error instanceof Error ? error.message : JSON.stringify(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
