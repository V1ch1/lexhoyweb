import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "5");
    const onlyUnread = searchParams.get("onlyUnread") === "true";

    let query = supabaseAdmin
      .from("notificaciones")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (onlyUnread) {
      query = query.eq("leida", false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get unread count
    const { count, error: countError } = await supabaseAdmin
      .from("notificaciones")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id)
      .eq("leida", false);

    if (countError) {
      console.error("Error counting unread notifications:", countError);
    }

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: count || 0
    });
  } catch (error) {
    console.error("Internal error in notifications API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
