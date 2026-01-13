/**
 * API Route para recibir leads desde LexHoy.com (WordPress)
 * POST /api/webhooks/lexhoy
 */

import { NextRequest, NextResponse } from "next/server";
import { LeadService } from "@/lib/services/leadService";

export async function POST(request: NextRequest) {
  // Verificar que el secret esté configurado en las variables de entorno
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
  
  if (!WEBHOOK_SECRET) {
    console.error("❌ WEBHOOK_SECRET no está configurado en las variables de entorno");
    return NextResponse.json(
      { error: "Webhook not configured" },
      { status: 500 }
    );
  }

  try {
    // 1. Verificar secret
    const authHeader = request.headers.get("x-webhook-secret");
    
    if (authHeader !== WEBHOOK_SECRET) {
      console.error("❌ Webhook secret inválido", {
        recibido: authHeader ? "***" : "no enviado"
      });
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Parsear body
    const body = await request.json();
    
    // 🔍 LOG DE DEBUGGING DETALLADO
    console.log("📥 Webhook recibido - RAW BODY:", JSON.stringify(body, null, 2));
    console.log("🔍 Claves recibidas:", Object.keys(body));

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

    // Helper para buscar valor insensible a mayúsculas/minúsculas
    const findField = (keys: string[]) => {
      for (const key of keys) {
        if (body[key]) return body[key];
        if (body[key.toLowerCase()]) return body[key.toLowerCase()];
      }
      return undefined;
    };

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
      
      // ✅ Nuevos campos de ubicación (búsqueda robusta)
      ciudad: findField(['ciudad', 'localidad', 'city', 'locality', 'town']),
      provincia: findField(['provincia', 'province', 'state', 'region']),
    };

    console.log("📍 Ubicación detectada:", { 
        ciudadRaw: body.ciudad || body.localidad,
        provinciaRaw: body.provincia,
        ciudadExtracted: leadInput.ciudad, 
        provinciaExtracted: leadInput.provincia 
    });

    // ✅ Concatenar ubicación al mensaje para asegurarnos que la IA lo detecte
    if (leadInput.ciudad || leadInput.provincia) {
        const ubicacionInfo = `\n\n--- Información de Ubicación ---\nCiudad: ${leadInput.ciudad || 'No especificada'}\nProvincia: ${leadInput.provincia || 'No especificada'}`;
        leadInput.cuerpoMensaje += ubicacionInfo;
    }

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
