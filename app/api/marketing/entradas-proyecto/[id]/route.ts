import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireSuperAdmin } from "@/lib/api-auth";

// PATCH - Actualizar estado de entrada (solo super_admin)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Verificar autenticación y rol de super admin con NextAuth
    const { user, error: authError } = await requireSuperAdmin();

    if (authError) {
      return authError;
    }

    // Obtener datos del body
    const body = await request.json();
    const { estado, titulo, descripcion, imagen_url } = body;

    // Preparar datos a actualizar
    const updateData: Record<string, unknown> = {};

    if (estado) {
      if (!["borrador", "publicada", "despublicada"].includes(estado)) {
        return NextResponse.json(
          { error: "Estado no válido" },
          { status: 400 }
        );
      }
      updateData.estado = estado;
    }

    if (titulo !== undefined) {
      if (titulo.trim().length < 3) {
        return NextResponse.json(
          { error: "El título debe tener al menos 3 caracteres" },
          { status: 400 }
        );
      }
      updateData.titulo = titulo.trim();
    }

    if (descripcion !== undefined) {
      if (descripcion.trim().length < 10) {
        return NextResponse.json(
          { error: "La descripción debe tener al menos 10 caracteres" },
          { status: 400 }
        );
      }
      updateData.descripcion = descripcion.trim();
    }

    if (imagen_url !== undefined) {
      updateData.imagen_url = imagen_url || null;
    }

    // Actualizar entrada
    const { data: entrada, error: updateError } = await supabase
      .from("entradas_proyecto")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error al actualizar entrada:", updateError);
      return NextResponse.json(
        { error: "Error al actualizar la entrada" },
        { status: 500 }
      );
    }

    if (!entrada) {
      return NextResponse.json(
        { error: "Entrada no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      entrada,
      message: "Entrada actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error en PATCH /api/marketing/entradas-proyecto/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar entrada (solo super_admin)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Verificar autenticación y rol de super admin con NextAuth
    const { user, error: authError } = await requireSuperAdmin();

    if (authError) {
      return authError;
    }

    // Eliminar entrada
    const { error: deleteError } = await supabase
      .from("entradas_proyecto")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error al eliminar entrada:", deleteError);
      return NextResponse.json(
        { error: "Error al eliminar la entrada" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Entrada eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error en DELETE /api/marketing/entradas-proyecto/[id]:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
