import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Verify ownership and update
    const { error } = await supabaseAdmin
      .from("notificaciones")
      .update({ leida: true, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", session.user.id); // Ensure user owns the notification

    if (error) {
      console.error("Error marking notification as read:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Internal error in mark-read API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
