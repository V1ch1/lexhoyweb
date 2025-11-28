import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: "Error de conexión a base de datos" },
        { status: 500 }
      );
    }

    // Verificar rol de admin
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("rol")
      .eq("id", userId)
      .single();

    if (userError || user?.rol !== "super_admin") {
      return NextResponse.json(
        { success: false, error: "No autorizado" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Verificar que el lead no esté vendido
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .select("estado, comprador_id")
      .eq("id", id)
      .single();

    if (leadError) {
      return NextResponse.json(
        { success: false, error: "Lead no encontrado" },
        { status: 404 }
      );
    }

    // No permitir eliminar leads vendidos
    if (lead.estado === "vendido" && lead.comprador_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: "No se puede eliminar un lead que ya ha sido vendido" 
        },
        { status: 400 }
      );
    }

    // Eliminar el lead
    const { error: deleteError } = await supabaseAdmin
      .from("leads")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting lead:", deleteError);
      return NextResponse.json(
        { success: false, error: "Error al eliminar el lead" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Lead eliminado exitosamente",
    });
  } catch (error: any) {
    console.error("[LEAD_DELETE]", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al eliminar el lead",
      },
      { status: 500 }
    );
  }
}
