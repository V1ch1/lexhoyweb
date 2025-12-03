import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const { error } = await supabaseAdmin
      .from("notificaciones")
      .update({ leida: true, updated_at: new Date().toISOString() })
      .eq("user_id", session.user.id)
      .eq("leida", false);

    if (error) {
      console.error("Error marking all notifications as read:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Internal error in mark-all-read API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
