/**
 * Script de prueba para el sistema de leads
 * Ejecutar: node --loader ts-node/esm testLeads.ts
 */

import { LeadService } from "./lib/services/leadService";

async function testLeadSystem() {
  console.log("🧪 Iniciando prueba del sistema de leads...\n");

  try {
    // 1. Crear un lead de prueba
    console.log("1️⃣ Creando lead de prueba...");
    const lead = await LeadService.createLead({
      nombre: "María García",
      correo: "maria.test@ejemplo.com",
      telefono: "600123456",
      cuerpoMensaje:
        "Necesito asesoramiento urgente sobre un despido improcedente. Trabajo en Madrid desde hace 5 años y me han despedido sin causa justificada. Tengo toda la documentación disponible y necesito actuar rápido.",
      urlPagina: "https://lexhoy.com/despido-improcedente",
      tituloPost: "Guía Completa sobre Despidos Improcedentes 2024",
      fuente: "test",
    });

    console.log("✅ Lead creado:", {
      id: lead.id,
      estado: lead.estado,
      especialidad: lead.especialidad,
      provincia: lead.provincia,
      calidad: lead.puntuacion_calidad,
      precioBase: lead.precio_base,
    });

    console.log("\n📝 Resumen IA generado:");
    console.log(lead.resumen_ia);

    // 2. Obtener leads disponibles
    console.log("\n\n2️⃣ Obteniendo leads disponibles...");
    const disponibles = await LeadService.getAvailableLeads();
    console.log(`✅ Leads disponibles: ${disponibles.length}`);

    // 3. Estadísticas
    console.log("\n\n3️⃣ Estadísticas del sistema...");
    const stats = await LeadService.getStats();
    console.log("📊 Estadísticas:", stats);

    console.log("\n\n✅ ¡Prueba completada exitosamente!");
    console.log("\n📌 Próximos pasos:");
    console.log("   1. Configurar webhook en WordPress");
    console.log("   2. Crear UI del marketplace");
    console.log("   3. Probar flujo completo");
  } catch (error) {
    console.error("\n❌ Error en la prueba:", error);
    if (error instanceof Error) {
      console.error("Mensaje:", error.message);
      console.error("Stack:", error.stack);
    }
  }
}

testLeadSystem();
