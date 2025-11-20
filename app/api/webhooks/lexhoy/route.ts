/**
 * API Route para recibir leads desde LexHoy.com (WordPress)
 * POST /api/webhooks/lexhoy
 */

import { NextRequest, NextResponse } from "next/server";
import { LeadService } from "@/lib/services/leadService";

// Secret para validar que el webhook viene de WordPress
const WEBHOOK_SECRET = process.env.LEXHOY_WEBHOOK_SECRET || "change-me-in-production";

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar secret
    const authHeader = request.headers.get("x-webhook-secret");
    if (authHeader !== WEBHOOK_SECRET) {
      console.error("❌ Webhook secret inválido");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Parsear body
    const body = await request.json();
    console.log("📥 Webhook recibido desde LexHoy.com:", {
      nombre: body.nombre,
      email: body.correo || body.email,
      post: body.tituloPost || body.titulo_post,
    });

    // 3. Validar datos requeridos
    const requiredFields = ["nombre", "cuerpoMensaje", "urlPagina", "tituloPost"];
    const missingFields = requiredFields.filter(field => !body[field] && !body[field.toLowerCase()]);
    
    if (missingFields.length > 0) {
      console.error("❌ Campos faltantes:", missingFields);
      return NextResponse.json(
        { 
          error: "Missing required fields", 
          missing: missingFields 
        },
        { status: 400 }
      );
    }

    // Normalizar nombres de campos (WordPress puede enviar snake_case o camelCase)
    const leadInput = {
      nombre: body.nombre || body.name,
      correo: body.correo || body.email || body.correo_electronico,
      telefono: body.telefono || body.phone || body.telefono_contacto,
      cuerpoMensaje: body.cuerpoMensaje || body.cuerpo_mensaje || body.mensaje || body.message,
      urlPagina: body.urlPagina || body.url_pagina || body.page_url,
      tituloPost: body.tituloPost || body.titulo_post || body.post_title,
      fuente: body.fuente || body.source || "lexhoy.com",
      utmSource: body.utm_source || body.utmSource,
      utmMedium: body.utm_medium || body.utmMedium,
      utmCampaign: body.utm_campaign || body.utmCampaign,
      aceptaTerminos: body.acepta_terminos || body.aceptaTerminos || body.checkbox || false,
      aceptaPrivacidad: body.acepta_privacidad || body.aceptaPrivacidad || true,
    };

    // Validar email
    if (!leadInput.correo || !leadInput.correo.includes("@")) {
      console.error("❌ Email inválido:", leadInput.correo);
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // 4. Crear lead (esto automáticamente lo procesa con IA)
    console.log("🚀 Creando lead...");
    const lead = await LeadService.createLead(leadInput);

    console.log("✅ Lead creado exitosamente:", {
      id: lead.id,
      estado: lead.estado,
      especialidad: lead.especialidad,
      calidad: lead.puntuacion_calidad,
    });

    // 5. Responder a WordPress
    return NextResponse.json({
      success: true,
      data: {
        leadId: lead.id,
        estado: lead.estado,
        especialidad: lead.especialidad,
        puntuacionCalidad: lead.puntuacion_calidad,
        mensaje:
          lead.estado === "procesado"
            ? "Lead procesado y disponible en marketplace"
            : lead.estado === "descartado"
            ? "Lead descartado por baja calidad"
            : "Lead en procesamiento",
      },
    });
  } catch (error) {
    console.error("❌ Error procesando webhook:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

// Método GET para verificar que el endpoint está activo
export async function GET() {
  return NextResponse.json({
    status: "active",
    endpoint: "/api/webhooks/lexhoy",
    method: "POST",
    description: "Webhook para recibir leads desde LexHoy.com (WordPress)",
    requiredHeaders: {
      "x-webhook-secret": "Required for authentication",
      "content-type": "application/json",
    },
    requiredFields: [
      "nombre",
      "correo",
      "cuerpoMensaje",
      "urlPagina",
      "tituloPost",
    ],
    optionalFields: [
      "telefono",
      "fuente",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "acepta_terminos",
      "acepta_privacidad",
    ],
  });
}
