/**
 * Script para probar el webhook de leads
 */

const WEBHOOK_URL = "http://localhost:3000/api/webhooks/lexhoy";
const WEBHOOK_SECRET = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6";

const testLead = {
  nombre: "María García",
  correo: "maria.test@ejemplo.com",
  telefono: "600123456",
  cuerpoMensaje:
    "Necesito asesoramiento urgente sobre un despido improcedente. Trabajo en Madrid desde hace 5 años y me han despedido sin causa justificada. Tengo toda la documentación disponible y necesito actuar rápido. Mi presupuesto es de unos 1000€.",
  urlPagina: "https://lexhoy.com/despido-improcedente",
  tituloPost: "Guía Completa sobre Despidos Improcedentes 2024",
};

async function testWebhook() {
  console.log("🧪 Probando webhook de leads...\n");
  console.log("📍 URL:", WEBHOOK_URL);
  console.log("📝 Lead de prueba:", testLead.nombre, "-", testLead.correo);
  console.log("\n⏳ Enviando request...\n");

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-secret": WEBHOOK_SECRET,
      },
      body: JSON.stringify(testLead),
    });

    const data = await response.json();

    if (response.ok) {
      console.log("✅ Lead creado exitosamente!\n");
      console.log("📊 Respuesta:", JSON.stringify(data, null, 2));
      console.log("\n🎯 Próximo paso:");
      console.log(
        "   Ve a Supabase → Table Editor → leads para ver el lead creado"
      );
    } else {
      console.log("❌ Error:", response.status, response.statusText);
      console.log("📄 Respuesta:", JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("❌ Error al enviar request:", error);
    console.log("\n💡 Asegúrate de que:");
    console.log("   1. El servidor está corriendo (npm run dev)");
    console.log("   2. OPENAI_API_KEY está configurada en .env.local");
    console.log("   3. El puerto 3000 está disponible");
  }
}

testWebhook();
