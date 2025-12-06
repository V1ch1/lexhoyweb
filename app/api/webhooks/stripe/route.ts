import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import Stripe from "stripe";
import { headers } from "next/headers";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "No signature provided" },
        { status: 400 }
      );
    }

    // Verificar el evento de Stripe
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Manejar el evento
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const leadId = session.metadata?.leadId;
      const userId = session.metadata?.userId;

      if (!leadId || !userId) {
        console.error("Missing metadata in session");
        return NextResponse.json(
          { error: "Missing metadata" },
          { status: 400 }
        );
      }

      // Actualizar el lead en Supabase
      if (!supabaseAdmin) {
        console.error("Supabase admin client not available");
        return NextResponse.json(
          { error: "Server configuration error" },
          { status: 500 }
        );
      }
      
      const { error: updateError } = await supabaseAdmin
        .from("leads")
        .update({
          estado: "vendido",
          comprador_id: userId,
          precio_venta: session.amount_total ? session.amount_total / 100 : null,
          fecha_compra: new Date().toISOString(),
        })
        .eq("id", leadId);

      if (updateError) {
        console.error("Error updating lead:", updateError);
        return NextResponse.json(
          { error: "Error updating lead" },
          { status: 500 }
        );
      }

      // Crear notificación para el comprador
      await supabaseAdmin.from("notificaciones").insert({
        user_id: userId,
        titulo: "¡Lead comprado exitosamente!",
        mensaje: `Has adquirido un lead legal. Ahora puedes ver toda la información de contacto.`,
        tipo: "lead_comprado",
        url: `/dashboard/leads/${leadId}`,
        leido: false,
      });

      // Enviar email de confirmación
      try {
        // Obtener datos del comprador
        const { data: comprador } = await supabaseAdmin
          .from("users")
          .select("nombre, email")
          .eq("id", userId)
          .single();

        // Obtener datos completos del lead
        const { data: leadCompleto } = await supabaseAdmin
          .from("leads")
          .select("*")
          .eq("id", leadId)
          .single();

        if (comprador && leadCompleto) {
          // Llamar al backend para enviar el email
          await fetch(`${process.env.BACKEND_URL || 'https://api.lexhoy.com'}/api/send-purchase-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: comprador.email,
              leadData: leadCompleto,
              compradorNombre: comprador.nombre || comprador.email
            })
          }).catch(err => {
            console.error("⚠️ Error enviando email de confirmación:", err.message);
          });
        }
      } catch (emailError) {
        console.error("⚠️ Error preparando email de confirmación:", emailError);
        // No fallar el webhook si falla el email
      }

      console.log(`Lead ${leadId} vendido a usuario ${userId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
