/**
 * API Route para listar leads disponibles en el marketplace
 * GET /api/leads
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { LeadService } from "@/lib/services/leadService";

export async function GET(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Obtener parámetros de búsqueda
    const searchParams = request.nextUrl.searchParams;
    const filters = {
      especialidad: searchParams.get("especialidad") || undefined,
      provincia: searchParams.get("provincia") || undefined,
      urgencia: searchParams.get("urgencia") || undefined,
      precioMax: searchParams.get("precioMax")
        ? parseFloat(searchParams.get("precioMax")!)
        : undefined,
    };

    // 3. Obtener leads disponibles
    const leads = await LeadService.getAvailableLeads(filters);

    return NextResponse.json({
      success: true,
      data: leads,
      count: leads.length,
    });
  } catch (error) {
    console.error("Error obteniendo leads:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
