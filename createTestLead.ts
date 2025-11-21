// Script para crear un lead de prueba
import { LeadService } from "./lib/services/leadService";

async function createTestLead() {
  try {
    console.log("🧪 Creando lead de prueba...");
    
    const lead = await LeadService.createLead({
      nombre: "Juan Pérez",
      correo: "juan.perez@ejemplo.com",
      telefono: "600123456",
      cuerpoMensaje: "Necesito asesoramiento urgente sobre un despido improcedente. Me han despedido de mi empresa después de 5 años trabajando y creo que no han seguido el procedimiento correcto. Tengo toda la documentación disponible y necesito saber cuáles son mis opciones legales.",
      urlPagina: "https://lexhoy.com/despido-improcedente",
      tituloPost: "Guía Completa sobre Despidos Improcedentes 2024",
      fuente: "test",
      aceptaTerminos: true,
      aceptaPrivacidad: true,
    });

    console.log("✅ Lead de prueba creado:");
    console.log("ID:", lead.id);
    console.log("Estado:", lead.estado);
    console.log("Especialidad:", lead.especialidad);
    console.log("Precio estimado IA:", lead.precio_estimado);
    console.log("Calidad:", lead.puntuacion_calidad);
    console.log("\n📋 Resumen IA:");
    console.log(lead.resumen_ia);
    
  } catch (error) {
    console.error("❌ Error creando lead de prueba:", error);
  }
}

createTestLead();
