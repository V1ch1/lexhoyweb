import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!supabaseAdmin) {
      return new NextResponse("Database connection error", { status: 500 });
    }

    // Verificar rol de admin
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("rol")
      .eq("id", userId)
      .single();

    if (userError || user?.rol !== "super_admin") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await req.json();
    const { cuerpo_mensaje, especialidad, provincia, precio_base } = body;

    // Validar datos requeridos
    if (!cuerpo_mensaje) {
      return new NextResponse("Mensaje del lead requerido", { status: 400 });
    }

    // Crear lead
    const { data: lead, error } = await supabaseAdmin
      .from("leads")
      .insert({
        cuerpo_mensaje,
        especialidad: especialidad || null,
        provincia: provincia || null,
        precio_base: precio_base || null,
        estado: "procesado", // Estado inicial para leads manuales
        fuente: "manual", // Indicar que fue creado manualmente
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating lead:", error);
      return new NextResponse("Error al crear lead", { status: 500 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("[ADMIN_LEAD_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
