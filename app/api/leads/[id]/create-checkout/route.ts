import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import Stripe from "stripe";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-11-17.clover",
    });
    const { id: leadId } = await params;
    
    // Verificar autenticación
    const session = await auth();
    const user = session?.user;

    if (!user?.id) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener información del lead
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { error: "Lead no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el lead esté disponible para compra
    if (lead.estado !== "procesado" && lead.estado !== "pendiente") {
      return NextResponse.json(
        { error: "Este lead ya no está disponible para compra" },
        { status: 400 }
      );
    }

    // Verificar que el lead no haya sido vendido
    if (lead.vendido) {
      return NextResponse.json(
        { error: "Este lead ya ha sido vendido" },
        { status: 400 }
      );
    }

    // Crear sesión de Checkout de Stripe
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Lead Legal - ${lead.especialidad || "General"}`,
              description: lead.resumen_ia || "Consulta legal",
            },
            unit_amount: Math.round(lead.precio_base * 100), // Convertir a centavos
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/leads/${leadId}?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/leads/${leadId}?payment=cancelled`,
      metadata: {
        leadId: leadId,
        userId: user.id,
      },
    });

    return NextResponse.json({ sessionId: stripeSession.id, url: stripeSession.url });
  } catch (error) {
    console.error("Error creando sesión de Stripe:", error);
    return NextResponse.json(
      { error: "Error al procesar el pago" },
      { status: 500 }
    );
  }
}
