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

    // Obtener el lead actual para comparar cambios
    const { data: currentLead } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("id", id)
      .single();

    // Construir objeto de actualización
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Construir objeto de cambios para el historial
    const changes: any = {};

    // Actualizar solo los campos proporcionados y registrar cambios
    if (estado !== undefined && estado !== currentLead?.estado) {
      updateData.estado = estado;
      changes.estado = { from: currentLead?.estado, to: estado };
    }
    if (resumen_ia !== undefined && resumen_ia !== currentLead?.resumen_ia) {
      updateData.resumen_ia = resumen_ia;
      changes.resumen_ia = { from: currentLead?.resumen_ia, to: resumen_ia };
    }
    if (especialidad !== undefined && especialidad !== currentLead?.especialidad) {
      updateData.especialidad = especialidad;
      changes.especialidad = { from: currentLead?.especialidad, to: especialidad };
    }
    if (provincia !== undefined && provincia !== currentLead?.provincia) {
      updateData.provincia = provincia;
      changes.provincia = { from: currentLead?.provincia, to: provincia };
    }
    if (ciudad !== undefined && ciudad !== currentLead?.ciudad) {
      updateData.ciudad = ciudad;
      changes.ciudad = { from: currentLead?.ciudad, to: ciudad };
    }
    if (urgencia !== undefined && urgencia !== currentLead?.urgencia) {
      updateData.urgencia = urgencia;
      changes.urgencia = { from: currentLead?.urgencia, to: urgencia };
    }
    if (palabras_clave !== undefined) {
      updateData.palabras_clave = palabras_clave;
      changes.palabras_clave = { from: currentLead?.palabras_clave, to: palabras_clave };
    }

    // Si se está actualizando el precio_base, registrar aprobación
    if (precio_base !== undefined && precio_base !== currentLead?.precio_base) {
      updateData.precio_base = precio_base;
      updateData.aprobado_por = userId;
      updateData.fecha_aprobacion = new Date().toISOString();
      changes.precio_base = { from: currentLead?.precio_base, to: precio_base };
    }

    // Actualizar el lead
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

    // Guardar en el historial solo si hubo cambios
    if (Object.keys(changes).length > 0) {
      await supabaseAdmin.from("lead_history").insert({
        lead_id: id,
        edited_by: userId,
        changes: changes,
      });
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
