import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/api-auth";
import { getRequiredEnvVar } from "@/lib/env";

export async function PATCH(request: Request) {
  try {
    console.log("🔍 [API /user/profile] Solicitud de actualización de perfil recibida");

    // Verificar autenticación
    const { user, error: authError } = await requireAuth();
    if (authError) {
      console.error("❌ [API /user/profile] Error de autenticación");
      return authError;
    }

    console.log("✅ [API /user/profile] Usuario autenticado:", user.id);

    // Obtener datos del body
    const body = await request.json();
    const { nombre, apellidos, telefono, localidad, provincia } = body;

    console.log("📝 [API /user/profile] Datos a actualizar:", { nombre, apellidos, telefono, localidad, provincia });

    // Crear cliente Supabase con Service Role para bypass RLS
    const supabase = createClient(
      getRequiredEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
      getRequiredEnvVar("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Actualizar el perfil del usuario
    const { data, error } = await supabase
      .from("users")
      .update({
        nombre: nombre || null,
        apellidos: apellidos || null,
        telefono: telefono || null,
        localidad: localidad || null,
        provincia: provincia || null,
        // updated_at eliminado porque no existe en la tabla
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      console.error("❌ [API /user/profile] Error al actualizar perfil:", error);
      return NextResponse.json(
        { error: "Error al actualizar el perfil", details: error.message },
        { status: 500 }
      );
    }

    console.log("✅ [API /user/profile] Perfil actualizado exitosamente");

    return NextResponse.json({
      success: true,
      message: "Perfil actualizado correctamente",
      user: {
        id: data.id,
        email: data.email,
        nombre: data.nombre,
        apellidos: data.apellidos,
        telefono: data.telefono,
        localidad: data.localidad,
        provincia: data.provincia,
      },
    });
  } catch (error) {
    console.error("💥 [API /user/profile] Error completo:", error);
    return NextResponse.json(
      {
        error: "Error al actualizar el perfil",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    const supabase = createClient(
      getRequiredEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
      getRequiredEnvVar("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data, error } = await supabase
      .from("users")
      .select("id, email, nombre, apellidos, telefono, localidad, provincia, rol")
      .eq("id", user.id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener perfil" },
      { status: 500 }
    );
  }
}
