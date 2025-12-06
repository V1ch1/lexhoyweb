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

    // Obtener historial con información del usuario que editó
    const { data: history, error } = await supabaseAdmin
      .from("lead_history")
      .select(`
        *,
        users:edited_by (
          nombre,
          email
        )
      `)
      .eq("lead_id", id)
      .order("edited_at", { ascending: false });

    if (error) {
      console.error("Error fetching history:", error);
      return new NextResponse("Error fetching history", { status: 500 });
    }

    return NextResponse.json(history || []);
  } catch (error) {
    console.error("[ADMIN_LEAD_HISTORY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
