/**
 * Script para verificar asignaciones de despachos
 * Verifica tanto user_despachos como owner_email
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Cargar variables de entorno desde .env.local
function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  
  if (!fs.existsSync(envPath)) {
    console.error("❌ Error: No se encontró el archivo .env.local");
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, "utf-8");
  const lines = envContent.split("\n");

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=").replace(/^["']|["']$/g, "");
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    }
  });
}

loadEnvFile();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkUserDespachos() {
  console.log("🔍 Verificando asignaciones de despachos...\n");

  const emails = ["blancoyenbatea@gmail.com", "blancocasal@gmail.com"];

  for (const email of emails) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`👤 Usuario: ${email}`);
    console.log("=".repeat(80));

    // 1. Obtener datos del usuario
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, nombre, apellidos, rol")
      .eq("email", email)
      .maybeSingle();

    if (userError || !user) {
      console.log("❌ Usuario no encontrado");
      continue;
    }

    console.log(`\n📋 Datos del usuario:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Nombre: ${user.nombre} ${user.apellidos}`);
    console.log(`   Rol: ${user.rol}`);

    // 2. Verificar asignaciones en user_despachos
    const { data: userDespachos, error: udError } = await supabase
      .from("user_despachos")
      .select("*")
      .eq("user_id", user.id);

    if (udError) {
      console.log(`\n⚠️ Error al consultar user_despachos:`, udError.message);
    } else {
      console.log(`\n📦 Asignaciones en user_despachos: ${userDespachos?.length || 0}`);
      
      if (userDespachos && userDespachos.length > 0) {
        for (const ud of userDespachos) {
          // Obtener datos del despacho (despacho_id es object_id, no id)
          const { data: despacho } = await supabase
            .from("despachos")
            .select("id, object_id, nombre")
            .eq("object_id", ud.despacho_id)
            .maybeSingle();

          console.log(`\n   ├─ Despacho ID: ${ud.despacho_id}`);
          console.log(`   │  Nombre: ${despacho?.nombre || "No encontrado"}`);
          console.log(`   │  Activo: ${ud.activo ? "✅ Sí" : "❌ No"}`);
          console.log(`   │  Fecha asignación: ${new Date(ud.fecha_asignacion).toLocaleString()}`);
          console.log(`   │  Asignado por: ${ud.asignado_por || "N/A"}`);
          console.log(`   │  Permisos: ${JSON.stringify(ud.permisos)}`);
        }
      }
    }

    // 3. Verificar despachos donde es owner (owner_email)
    const { data: ownedDespachos, error: ownedError } = await supabase
      .from("despachos")
      .select("id, object_id, nombre, owner_email")
      .eq("owner_email", email);

    if (ownedError) {
      console.log(`\n⚠️ Error al consultar despachos owned:`, ownedError.message);
    } else {
      console.log(`\n👑 Despachos como OWNER (owner_email): ${ownedDespachos?.length || 0}`);
      
      if (ownedDespachos && ownedDespachos.length > 0) {
        for (const despacho of ownedDespachos) {
          console.log(`\n   ├─ Despacho ID: ${despacho.object_id}`);
          console.log(`   │  Nombre: ${despacho.nombre}`);
          console.log(`   │  Owner Email: ${despacho.owner_email}`);
        }
      }
    }

    // 4. Resumen
    const totalAsignaciones = (userDespachos?.filter(ud => ud.activo)?.length || 0);
    const totalOwned = (ownedDespachos?.length || 0);
    const total = totalAsignaciones + totalOwned;

    console.log(`\n📊 RESUMEN:`);
    console.log(`   Asignaciones activas (user_despachos): ${totalAsignaciones}`);
    console.log(`   Despachos como owner (owner_email): ${totalOwned}`);
    console.log(`   TOTAL: ${total}`);
  }

  console.log(`\n${"=".repeat(80)}\n`);

  // 5. Estadísticas generales
  console.log("📈 ESTADÍSTICAS GENERALES:\n");

  const { count: totalDespachos } = await supabase
    .from("despachos")
    .select("*", { count: "exact", head: true });

  const { count: despachosConOwner } = await supabase
    .from("despachos")
    .select("*", { count: "exact", head: true })
    .not("owner_email", "is", null);

  const { count: totalAsignaciones } = await supabase
    .from("user_despachos")
    .select("*", { count: "exact", head: true })
    .eq("activo", true);

  console.log(`   Total despachos: ${totalDespachos}`);
  console.log(`   Despachos con owner_email: ${despachosConOwner}`);
  console.log(`   Asignaciones activas en user_despachos: ${totalAsignaciones}`);
  console.log(`   Despachos sin owner: ${(totalDespachos || 0) - (despachosConOwner || 0)}`);
}

checkUserDespachos().catch(console.error);
