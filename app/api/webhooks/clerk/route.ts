import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { createClient } from "@supabase/supabase-js";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET || "";

interface ClerkWebhookData {
  id: string;
  email_addresses?: Array<{ email_address: string }>;
  first_name?: string;
  last_name?: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    // Verificar firma del webhook
    const headerPayload = await headers();
    const svixId = headerPayload.get("svix-id");
    const svixTimestamp = headerPayload.get("svix-timestamp");
    const svixSignature = headerPayload.get("svix-signature");

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json(
        { error: "Missing svix headers" },
        { status: 400 }
      );
    }

    const payload = await req.json();
    const body = JSON.stringify(payload);

    // Verificar webhook signature
    const wh = new Webhook(webhookSecret);
    let evt: { type: string; data: ClerkWebhookData };

    try {
      evt = wh.verify(body, {
        "svix-id": svixId,
        "svix-timestamp": svixTimestamp,
        "svix-signature": svixSignature,
      }) as { type: string; data: ClerkWebhookData };
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Procesar evento
    const { type, data } = evt;

    switch (type) {
      case "user.created":
        await handleUserCreated(data);
        break;

      case "user.updated":
        await handleUserUpdated(data);
        break;

      case "user.deleted":
        await handleUserDeleted(data);
        break;

      default:
        console.log(`Unhandled webhook type: ${type}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleUserCreated(data: ClerkWebhookData) {
  const clerkId = data.id;
  const email = data.email_addresses?.[0]?.email_address;
  const firstName = data.first_name || "";
  const lastName = data.last_name || "";

  if (!email) {
    console.error("No email found for user");
    return;
  }

  try {
    // Determinar rol basado en email
    const adminEmails = [
      "jose@blancoyenbatea.com",
      "luis.ogando@blancoyenbatea.com",
      "manu@blancoyenbatea.com",
      "blancocasal@gmail.com", // Agregado
    ];
    const rol = adminEmails.includes(email) ? "super_admin" : "usuario";
    const plan = adminEmails.includes(email) ? "premium" : "basico";

    // Crear usuario en Supabase
    const { error } = await supabase.from("users").insert({
      id: clerkId, // Usar Clerk ID como ID principal
      email: email,
      nombre: firstName,
      apellidos: lastName,
      telefono: null,
      rol: rol,
      plan: plan,
      activo: true,
      email_verificado: true, // Clerk ya verificó el email
      estado: "aprobado",
      fecha_registro: new Date().toISOString(),
      ultimo_acceso: new Date().toISOString(),
    });

    if (error) {
      console.error("Error creating user in Supabase:", error);
      throw error;
    }

    console.log(`✅ User created in Supabase: ${email}`);
  } catch (error) {
    console.error("Error in handleUserCreated:", error);
    throw error;
  }
}

async function handleUserUpdated(data: ClerkWebhookData) {
  const clerkId = data.id;
  const email = data.email_addresses?.[0]?.email_address;
  const firstName = data.first_name || "";
  const lastName = data.last_name || "";

  try {
    const { error } = await supabase
      .from("users")
      .update({
        email: email,
        nombre: firstName,
        apellidos: lastName,
      })
      .eq("id", clerkId);

    if (error) {
      console.error("Error updating user in Supabase:", error);
      throw error;
    }

    console.log(`✅ User updated in Supabase: ${email}`);
  } catch (error) {
    console.error("Error in handleUserUpdated:", error);
    throw error;
  }
}

async function handleUserDeleted(data: ClerkWebhookData) {
  const clerkId = data.id;

  try {
    // Marcar como inactivo en lugar de eliminar (preservar relaciones)
    const { error } = await supabase
      .from("users")
      .update({ activo: false })
      .eq("id", clerkId);

    if (error) {
      console.error("Error deleting user in Supabase:", error);
      throw error;
    }

    console.log(`✅ User marked as inactive in Supabase: ${clerkId}`);
  } catch (error) {
    console.error("Error in handleUserDeleted:", error);
    throw error;
  }
}
