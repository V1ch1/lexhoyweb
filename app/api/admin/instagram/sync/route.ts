import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { instagramService } from "@/lib/services/instagramService";

export async function POST() {
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

    // Obtener vídeos de Instagram
    const instagramVideos = await instagramService.getRecentMedia(50);

    const results = {
      total: instagramVideos.length,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Procesar cada vídeo
    for (const video of instagramVideos) {
      try {
        // Verificar si ya existe
        const { data: existing } = await supabaseAdmin
          .from("instagram_videos")
          .select("id, likes, views")
          .eq("instagram_url", video.permalink)
          .single();

        if (existing) {
          // Actualizar métricas
          await supabaseAdmin
            .from("instagram_videos")
            .update({
              likes: video.like_count || 0,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);

          results.updated++;
        } else {
          // Importar nuevo vídeo
          const title = instagramService.extractTitle(video.caption);
          const category = instagramService.detectCategory(video.caption);

          await supabaseAdmin.from("instagram_videos").insert({
            title,
            description: video.caption || "",
            video_url: video.media_url,
            thumbnail_url: video.thumbnail_url || video.media_url,
            instagram_url: video.permalink,
            likes: video.like_count || 0,
            views: 0, // Instagram API básica no da views
            category,
            created_at: video.timestamp,
          });

          results.imported++;
        }
      } catch (error) {
        console.error(`Error processing video ${video.id}:`, error);
        results.errors.push(`Video ${video.id}: ${error}`);
        results.skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sincronización completada: ${results.imported} importados, ${results.updated} actualizados, ${results.skipped} omitidos`,
      results,
    });
  } catch (error) {
    console.error("[INSTAGRAM_SYNC]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
