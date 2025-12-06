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
    const {
      estado,
      precio_base,
      resumen_ia,
      especialidad,
      provincia,
      ciudad,
      urgencia,
      palabras_clave,
    } = body;

    // Construir objeto de actualización
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Actualizar solo los campos proporcionados
    if (estado !== undefined) updateData.estado = estado;
    if (resumen_ia !== undefined) updateData.resumen_ia = resumen_ia;
    if (especialidad !== undefined) updateData.especialidad = especialidad;
    if (provincia !== undefined) updateData.provincia = provincia;
    if (ciudad !== undefined) updateData.ciudad = ciudad;
    if (urgencia !== undefined) updateData.urgencia = urgencia;
    if (palabras_clave !== undefined) updateData.palabras_clave = palabras_clave;

    // Si se está actualizando el precio_base, registrar aprobación
    if (precio_base !== undefined) {
      updateData.precio_base = precio_base;
      updateData.aprobado_por = userId;
      updateData.fecha_aprobacion = new Date().toISOString();
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

export async function DELETE(
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

    const { error } = await supabaseAdmin
      .from("leads")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting lead:", error);
      return new NextResponse("Error deleting lead", { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[ADMIN_LEAD_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
