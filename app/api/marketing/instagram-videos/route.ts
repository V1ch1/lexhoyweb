import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// GET - Listar vídeos
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");

    let query = supabaseAdmin
      .from("instagram_videos")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    if (featured === "true") {
      query = query.eq("is_featured", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[INSTAGRAM_VIDEOS_GET]", error);
      return new NextResponse("Database error", { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("[INSTAGRAM_VIDEOS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// POST - Crear nuevo vídeo (solo admin)
export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verificar que sea super_admin
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("rol")
      .eq("id", userId)
      .single();

    if (user?.rol !== "super_admin") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      video_url,
      thumbnail_url,
      instagram_url,
      views,
      likes,
      category,
      is_featured,
      display_order,
    } = body;

    if (!title || !video_url) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("instagram_videos")
      .insert({
        title,
        description,
        video_url,
        thumbnail_url,
        instagram_url,
        views: views || 0,
        likes: likes || 0,
        category,
        is_featured: is_featured || false,
        display_order: display_order || 0,
      })
      .select()
      .single();

    if (error) {
      console.error("[INSTAGRAM_VIDEOS_POST]", error);
      return new NextResponse("Database error", { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[INSTAGRAM_VIDEOS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
