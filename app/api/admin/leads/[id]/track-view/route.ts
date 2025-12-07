import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(
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

    const { id } = await params;

    // Obtener rol del usuario
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("rol, despacho_id")
      .eq("id", userId)
      .single();

    // No registrar visualizaciones de super_admin
    if (user?.rol === "super_admin") {
      return NextResponse.json({ success: true, skipped: true });
    }

    // Registrar visualización
    const { error } = await supabaseAdmin.from("lead_views").insert({
      lead_id: id,
      user_id: userId,
      despacho_id: user?.despacho_id || null,
    });

    if (error) {
      console.error("Error tracking view:", error);
      // No fallar si hay error al registrar la vista
      return NextResponse.json({ success: false, error: error.message });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TRACK_VIEW]", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
