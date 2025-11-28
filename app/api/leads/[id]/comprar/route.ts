import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { LeadService } from "@/lib/services/leadService";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "No autenticado" },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Comprar el lead usando LeadService
    const lead = await LeadService.buyLead(id, userId);

    return NextResponse.json({
      success: true,
      data: lead,
      message: "Lead comprado exitosamente",
    });
  } catch (error: any) {
    console.error("[LEAD_PURCHASE]", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al comprar el lead",
      },
      { status: 500 }
    );
  }
}
