/**
 * API Route para obtener leads comprados por el usuario
 * GET /api/leads/purchased
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { LeadService } from "@/lib/services/leadService";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const leads = await LeadService.getPurchasedLeads(userId);

    return NextResponse.json({
      success: true,
      data: leads,
    });
  } catch (error) {
    console.error("Error obteniendo leads comprados:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
