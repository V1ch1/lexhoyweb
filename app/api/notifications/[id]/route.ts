import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// PATCH - Marcar notificación como leída
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { leida } = await request.json();

    const { error } = await supabase
      .from("notificaciones")
      .update({ leida })
      .eq("id", id);

    if (error) {
      console.error("Error actualizando notificación:", error);
      return NextResponse.json(
        { error: "Error actualizando notificación", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en PATCH /api/notifications/[id]:", error);
    return NextResponse.json(
      { error: "Error interno", details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar notificación
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { error } = await supabase
      .from("notificaciones")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error eliminando notificación:", error);
      return NextResponse.json(
        { error: "Error eliminando notificación", details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en DELETE /api/notifications/[id]:", error);
    return NextResponse.json(
      { error: "Error interno", details: String(error) },
      { status: 500 }
    );
  }
}
