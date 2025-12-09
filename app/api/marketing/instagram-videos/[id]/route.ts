import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// PUT - Actualizar vídeo
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const { id } = params;

    const { data, error } = await supabaseAdmin
      .from("instagram_videos")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[INSTAGRAM_VIDEOS_PUT]", error);
      return new NextResponse("Database error", { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[INSTAGRAM_VIDEOS_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// DELETE - Eliminar vídeo
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const { id } = params;

    const { error } = await supabaseAdmin
      .from("instagram_videos")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[INSTAGRAM_VIDEOS_DELETE]", error);
      return new NextResponse("Database error", { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[INSTAGRAM_VIDEOS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
