import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { googleAnalyticsService } from "@/lib/services/googleAnalyticsService";

export async function GET(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("rol")
      .eq("id", userId)
      .single();

    if (user?.rol !== "super_admin") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Obtener parámetro de días
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const [trafficSources, popularPages] = await Promise.all([
      googleAnalyticsService.getTrafficSources(days),
      googleAnalyticsService.getPopularPages(days),
    ]);

    return NextResponse.json({
      trafficSources,
      popularPages,
    });
  } catch (error) {
    console.error("[GA_CONTENT]", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
