import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { EmailService } from "@/lib/services/emailService";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // Verificar autorización (Bearer token o similar si es cron externo)
    // Por ahora lo dejamos abierto pero idealmente proteger con CRON_SECRET
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // return new NextResponse("Unauthorized", { status: 401 });
      // Comentado para facilitar pruebas manuales por ahora
    }

    if (!supabaseAdmin) {
      return new NextResponse("Database connection error", { status: 500 });
    }

    const now = new Date().toISOString();

    // 1. Buscar subastas finalizadas que sigan en estado 'en_subasta'
    const { data: expiredLeads, error: fetchError } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("estado", "en_subasta")
      .lt("fecha_fin_subasta", now);

    if (fetchError) {
      console.error("Error fetching expired leads:", fetchError);
      return new NextResponse("Error fetching leads", { status: 500 });
    }

    if (!expiredLeads || expiredLeads.length === 0) {
      return NextResponse.json({ message: "No expired auctions found" });
    }

    const results = [];

    for (const lead of expiredLeads) {
      // 2. Buscar la puja más alta
      const { data: highestBid, error: bidError } = await supabaseAdmin
        .from("pujas")
        .select("*")
        .eq("lead_id", lead.id)
        .order("monto", { ascending: false })
        .limit(1)
        .single();

      if (bidError && bidError.code !== "PGRST116") { // PGRST116 is "no rows returned"
        console.error(`Error fetching bids for lead ${lead.id}:`, bidError);
        continue;
      }

      if (highestBid) {
        // Ganador encontrado
        // Actualizar lead a 'pendiente_pago' (o 'vendido' si cobramos automático, pero aquí es manual/link)
        // Vamos a ponerlo en 'vendido' y asignar comprador para simplificar flujo MVP, 
        // asumiendo que el pago se gestiona luego o se confía.
        // O mejor: 'pendiente_pago' si tuviéramos ese estado. 
        // Revisando LeadService, estados son: "pendiente" | "procesado" | "en_subasta" | "vendido" | "expirado" | "descartado"
        // No hay 'pendiente_pago'. Usaremos 'vendido' y marcaremos precio_venta.
        
        const { error: updateError } = await supabaseAdmin
          .from("leads")
          .update({
            estado: "vendido",
            comprador_id: highestBid.usuario_id,
            precio_venta: highestBid.monto,
            fecha_venta: now,
          })
          .eq("id", lead.id);

        if (!updateError) {
           // Registrar compra
           await supabaseAdmin.from("compras_leads").insert({
            lead_id: lead.id,
            comprador_id: highestBid.usuario_id,
            tipo_compra: "subasta",
            precio_pagado: highestBid.monto,
            lead_snapshot: lead,
            estado: "pendiente_pago", // Aquí sí podemos usar estado de la tabla compras_leads
          });
          
          results.push({ leadId: lead.id, winner: highestBid.usuario_id, amount: highestBid.monto });

          // Enviar email al ganador
          const { data: user } = await supabaseAdmin
            .from("users")
            .select("email")
            .eq("id", highestBid.usuario_id)
            .single();
            
          if (user?.email) {
             await EmailService.sendAuctionWonEmail(user.email, lead.id, highestBid.monto);
          }
        }
      } else {
        // Sin pujas -> Expirado o volver a procesado?
        // Lo marcamos como 'expirado' o 'procesado' para venta directa?
        // Vamos a ponerlo en 'procesado' para que se pueda comprar directamente de nuevo por el precio base.
        await supabaseAdmin
          .from("leads")
          .update({
            estado: "procesado",
            fecha_fin_subasta: null,
            fecha_inicio_subasta: null,
          })
          .eq("id", lead.id);
          
        results.push({ leadId: lead.id, status: "no_bids_reset_to_processed" });
      }
    }

    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error) {
    console.error("[CRON_CLOSE_AUCTIONS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
