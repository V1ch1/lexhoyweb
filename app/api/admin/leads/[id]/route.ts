import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
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

    const { id } = await params;

    const { data: lead, error } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching lead:", error);
      return new NextResponse("Lead not found", { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("[ADMIN_LEAD_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
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

    const { id } = await params;
    const body = await req.json();
    const { estado, precio_base, fecha_fin_subasta } = body;

    // Validar datos
    if (!estado) {
      return new NextResponse("Estado requerido", { status: 400 });
    }

    const updateData: any = {
      estado,
      updated_at: new Date().toISOString(),
    };

    // Si se está actualizando el precio_base, registrar aprobación
    if (precio_base !== undefined) {
      updateData.precio_base = precio_base;
      updateData.aprobado_por = userId;
      updateData.fecha_aprobacion = new Date().toISOString();
    }

    if (estado === "en_subasta") {
       if (fecha_fin_subasta) {
          updateData.fecha_fin_subasta = fecha_fin_subasta;
          updateData.fecha_inicio_subasta = new Date().toISOString();
       }
    }

    const { data: lead, error } = await supabaseAdmin
      .from("leads")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating lead:", error);
      return new NextResponse("Error updating lead", { status: 500 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("[ADMIN_LEAD_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
