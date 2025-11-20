/**
 * API Route para obtener detalle y comprar un lead específico
 * GET /api/leads/[id] - Ver detalle
 * POST /api/leads/[id] - Comprar lead
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { LeadService } from "@/lib/services/leadService";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const lead = await LeadService.getLeadById(params.id, userId);

    // Registrar visualización
    await LeadService.trackView(params.id, userId);

    return NextResponse.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    console.error("Error obteniendo lead:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const action = body.action;

    if (action === "buy") {
      // Compra directa
      const lead = await LeadService.buyLead(params.id, userId);

      return NextResponse.json({
        success: true,
        data: lead,
        message: "Lead comprado exitosamente",
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error procesando acción:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
