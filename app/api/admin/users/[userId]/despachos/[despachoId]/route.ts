import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { UserService } from "@/lib/userService";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const userService = new UserService();

/**
 * Endpoint para desasignar un despacho de un usuario (solo para super_admin)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string; despachoId: string }> }
) {
  try {
    // Obtener token de autenticación
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar usuario autenticado usando el JWT token directamente
    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Verificar que sea super_admin
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("rol, email, nombre")
      .eq("id", user.id)
      .single();

    if (userError || userData?.rol !== "super_admin") {
      return NextResponse.json({ 
        error: `No tienes permisos para realizar esta acción. Tu rol es: ${userData?.rol || 'desconocido'}` 
      }, { status: 403 });
    }

    const { userId, despachoId } = await params;

    // Validar parámetros
    if (!userId || !despachoId) {
      return NextResponse.json(
        { error: "userId y despachoId son requeridos" },
        { status: 400 }
      );
    }

    // Obtener información del despacho antes de desasignar
    const { data: despachoInfo, error: despachoError } = await supabase
      .from("despachos")
      .select("nombre, owner_email")
      .eq("id", despachoId)
      .single();

    if (despachoError || !despachoInfo) {
      return NextResponse.json(
        { error: "Despacho no encontrado" },
        { status: 404 }
      );
    }

    // Obtener información del usuario
    const { data: targetUser, error: targetUserError } = await supabase
      .from("users")
      .select("email, nombre, apellidos")
      .eq("id", userId)
      .single();

    if (targetUserError || !targetUser) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Desasignar el despacho
    await userService.unassignDespachoFromUser(userId, despachoId);

    // Verificar si el despacho ahora está disponible para solicitud
    const isAvailable = await userService.isDespachoAvailableForClaim(despachoId);

    // Crear notificación para el usuario afectado
    const notificationMessage = isAvailable 
      ? `Tu acceso al despacho "${despachoInfo.nombre}" ha sido removido. El despacho ahora está disponible para solicitud de propiedad.`
      : `Tu acceso al despacho "${despachoInfo.nombre}" ha sido removido.`;

    await supabase
      .from("notificaciones")
      .insert({
        user_id: userId,
        tipo: "despacho_desasignado",
        titulo: "Acceso a despacho removido",
        mensaje: notificationMessage,
        leida: false,
        metadata: {
          despacho_id: despachoId,
          despacho_nombre: despachoInfo.nombre,
          available_for_claim: isAvailable,
          admin_action: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    return NextResponse.json({
      success: true,
      message: "Despacho desasignado exitosamente",
      despacho: {
        id: despachoId,
        nombre: despachoInfo.nombre,
        available_for_claim: isAvailable
      },
      user: {
        id: userId,
        email: targetUser.email,
        nombre: targetUser.nombre,
        apellidos: targetUser.apellidos
      }
    });

  } catch (error) {
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}