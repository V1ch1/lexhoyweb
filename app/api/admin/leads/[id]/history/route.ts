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

    // Obtener historial
    const { data: history, error } = await supabaseAdmin
      .from("lead_history")
      .select("*")
      .eq("lead_id", id)
      .order("edited_at", { ascending: false });

    if (error) {
      console.error("Error fetching history:", error);
      return new NextResponse("Error fetching history", { status: 500 });
    }

    // Enriquecer con información de usuarios
    const enrichedHistory = await Promise.all(
      (history || []).map(async (entry: any) => {
        const { data: userData } = await supabaseAdmin
          .from("users")
          .select("nombre, email")
          .eq("id", entry.edited_by)
          .single();

        return {
          ...entry,
          editor_name: userData?.nombre || null,
          editor_email: userData?.email || null,
        };
      })
    );

    return NextResponse.json(enrichedHistory);
  } catch (error) {
    console.error("[ADMIN_LEAD_HISTORY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
