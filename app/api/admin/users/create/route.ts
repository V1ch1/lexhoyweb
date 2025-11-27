import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireSuperAdmin } from "@/lib/api-auth";
import { UserRole, UserStatus } from "@/lib/types";

export async function POST(request: Request) {
  try {
    // 1. Verificar permisos de super admin
    const { user: adminUser, error: authError } = await requireSuperAdmin();
    if (authError) return authError;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Error de configuración del servidor (Service Role Key missing)" },
        { status: 500 }
      );
    }

    // 2. Obtener datos del body
    const body = await request.json();
    const { email, nombre, apellidos, telefono, rol } = body;

    if (!email || !nombre || !apellidos || !rol) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    // 3. Generar contraseña temporal
    const generateTemporaryPassword = () => {
      const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
      let password = "";
      for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };
    const temporaryPassword = generateTemporaryPassword();

    // 4. Crear usuario en Supabase Auth
    const { data: authUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: temporaryPassword,
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        nombre,
        apellidos,
        telefono,
        rol,
      },
    });

    if (createError) {
      console.error("Error creando usuario en Auth:", createError);
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      );
    }

    if (!authUser.user) {
      return NextResponse.json(
        { error: "No se pudo crear el usuario" },
        { status: 500 }
      );
    }

    // 5. Crear/Actualizar usuario en tabla public.users
    // Nota: Si existe un trigger, esto podría ser redundante o causar conflicto,
    // pero aseguramos que los datos estén correctos.
    // Usamos upsert para manejar el caso de que el trigger ya lo haya creado.
    const { data: dbUser, error: dbError } = await supabaseAdmin
      .from("users")
      .upsert({
        id: authUser.user.id,
        email,
        nombre,
        apellidos,
        telefono,
        rol: rol as UserRole,
        estado: "activo" as UserStatus,
        activo: true,
        email_verificado: true,
        fecha_registro: new Date().toISOString(),
        plan: "basico",
        // Campos de auditoría
        aprobado_por: adminUser.email,
        fecha_aprobacion: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error("Error creando usuario en DB:", dbError);
      // Intentar limpiar el usuario de Auth si falla la DB (rollback manual)
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json(
        { error: "Error al guardar datos del usuario en la base de datos" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: dbUser,
      temporaryPassword,
    });

  } catch (error) {
    console.error("Error en POST /api/admin/users/create:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
