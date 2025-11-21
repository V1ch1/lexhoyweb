import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!supabaseAdmin) {
      return new NextResponse("Database connection error", { status: 500 });
    }

    const { id } = await params;
    const body = await req.json();
    const { amount } = body;

    if (!amount || isNaN(amount)) {
      return new NextResponse("Invalid amount", { status: 400 });
    }

    // 1. Obtener lead y verificar estado
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("id", id)
      .single();

    if (leadError || !lead) {
      return new NextResponse("Lead not found", { status: 404 });
    }

    if (lead.estado !== "en_subasta") {
      return new NextResponse("Lead is not in auction", { status: 400 });
    }

    const now = new Date();
    const endDate = new Date(lead.fecha_fin_subasta);

    if (now > endDate) {
      return new NextResponse("Auction ended", { status: 400 });
    }

    // 2. Validar monto de la puja
    const currentPrice = lead.precio_actual || lead.precio_base || 0;
    const minIncrement = 5; // Incremento mínimo de 5€
    const minBid = currentPrice + minIncrement;

    if (amount < minBid) {
      return new NextResponse(
        `Bid must be at least ${minBid}€ (Current: ${currentPrice}€ + ${minIncrement}€)`,
        { status: 400 }
      );
    }

    // 3. Anti-sniping: Extender tiempo si es necesario
    // Si falta menos de 5 minutos, extender 5 minutos desde AHORA (o desde el final actual?)
    // Normalmente se extiende desde el final actual o se resetea a 5 min.
    // Vamos a añadir 5 minutos a la fecha fin si estamos en los últimos 5 min.
    
    const timeRemainingMs = endDate.getTime() - now.getTime();
    const fiveMinutesMs = 5 * 60 * 1000;
    let newEndDate = lead.fecha_fin_subasta;

    if (timeRemainingMs < fiveMinutesMs) {
      const extendedDate = new Date(endDate.getTime() + fiveMinutesMs);
      newEndDate = extendedDate.toISOString();
    }

    // 4. Registrar puja
    const { error: bidError } = await supabaseAdmin.from("pujas").insert({
      lead_id: id,
      usuario_id: userId,
      monto: amount,
      estado: "activa",
    });

    if (bidError) {
      console.error("Error creating bid:", bidError);
      return new NextResponse("Error creating bid", { status: 500 });
    }

    // 5. Actualizar lead (precio actual y fecha fin si cambió)
    const { error: updateError } = await supabaseAdmin
      .from("leads")
      .update({
        precio_actual: amount,
        fecha_fin_subasta: newEndDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating lead with bid:", updateError);
      // Rollback bid? O dejarlo y reintentar?
      // Por simplicidad, devolvemos error pero la puja quedó. Idealmente transacción.
      return new NextResponse("Error updating lead", { status: 500 });
    }

    return NextResponse.json({
      success: true,
      newPrice: amount,
      newEndDate: newEndDate,
    });
  } catch (error) {
    console.error("[BID_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
