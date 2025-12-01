/**
 * Script para Sincronizar Roles de Usuarios
 * 
 * Ajusta automáticamente los roles de usuarios según sus asignaciones:
 * - Si tiene despacho_admin pero no tiene despachos → cambiar a usuario
 * - Si tiene usuario pero tiene despachos → cambiar a despacho_admin
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Cargar variables de entorno
function loadEnvFile() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    console.error("❌ Error: No se encontró .env.local");
    process.exit(1);
  }
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=").replace(/^["']|["']$/g, "");
      if (key && value) process.env[key.trim()] = value.trim();
    }
  });
}

loadEnvFile();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function syncUserRoles() {
  console.log("🔄 SINCRONIZACIÓN DE ROLES DE USUARIOS");
  console.log("=".repeat(80));

  const changes = [];

  // 1. Obtener todos los usuarios (excepto super_admin)
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, email, nombre, apellidos, rol")
    .neq("rol", "super_admin")
    .order("email");

  if (usersError) {
    console.error("❌ Error al obtener usuarios:", usersError.message);
    process.exit(1);
  }

  console.log(`\n👥 Usuarios a verificar: ${users?.length || 0}\n`);

  // 2. Obtener todos los despachos
  const { data: despachos, error: despachosError } = await supabase
    .from("despachos")
    .select("id, object_id, nombre, owner_email");

  if (despachosError) {
    console.error("❌ Error al obtener despachos:", despachosError.message);
    process.exit(1);
  }

  // 3. Obtener todas las asignaciones activas
  const { data: userDespachos, error: udError } = await supabase
    .from("user_despachos")
    .select("*")
    .eq("activo", true);

  if (udError) {
    console.error("❌ Error al obtener asignaciones:", udError.message);
    process.exit(1);
  }

  // 4. Verificar cada usuario
  for (const user of users || []) {
    console.log(`\n📧 ${user.email}`);
    console.log(`   Rol actual: ${user.rol}`);

    // Contar despachos del usuario
    const ownedDespachos = despachos?.filter(d => d.owner_email === user.email) || [];
    const assignedDespachos = userDespachos?.filter(ud => ud.user_id === user.id) || [];
    
    // Verificar que las asignaciones sean válidas
    const validAssignments = assignedDespachos.filter(ud =>
      despachos?.some(d => d.object_id === ud.despacho_id)
    );

    const totalDespachos = ownedDespachos.length + validAssignments.length;

    console.log(`   Despachos como owner: ${ownedDespachos.length}`);
    console.log(`   Asignaciones válidas: ${validAssignments.length}`);
    console.log(`   Total despachos: ${totalDespachos}`);

    // Determinar rol correcto
    let correctRole = user.rol;
    let needsChange = false;

    if (totalDespachos > 0 && user.rol === "usuario") {
      correctRole = "despacho_admin";
      needsChange = true;
      console.log(`   ⚠️ CAMBIO NECESARIO: usuario → despacho_admin`);
    } else if (totalDespachos === 0 && user.rol === "despacho_admin") {
      correctRole = "usuario";
      needsChange = true;
      console.log(`   ⚠️ CAMBIO NECESARIO: despacho_admin → usuario`);
    } else {
      console.log(`   ✅ Rol correcto`);
    }

    if (needsChange) {
      console.log(`   🔄 Actualizando rol a: ${correctRole}...`);
      
      const { error: updateError } = await supabase
        .from("users")
        .update({ rol: correctRole })
        .eq("id", user.id);

      if (updateError) {
        console.log(`   ❌ Error: ${updateError.message}`);
        changes.push({
          user: user.email,
          from: user.rol,
          to: correctRole,
          success: false,
          error: updateError.message,
        });
      } else {
        console.log(`   ✅ Rol actualizado correctamente`);
        changes.push({
          user: user.email,
          from: user.rol,
          to: correctRole,
          success: true,
          despachos: totalDespachos,
        });
      }
    }
  }

  // 5. Resumen
  console.log("\n" + "=".repeat(80));
  console.log("📊 RESUMEN DE SINCRONIZACIÓN");
  console.log("=".repeat(80));

  const successful = changes.filter(c => c.success);
  const failed = changes.filter(c => !c.success);

  console.log(`\n✅ Cambios exitosos: ${successful.length}`);
  successful.forEach(c => {
    console.log(`   ${c.user}: ${c.from} → ${c.to} (${c.despachos} despachos)`);
  });

  if (failed.length > 0) {
    console.log(`\n❌ Errores: ${failed.length}`);
    failed.forEach(c => {
      console.log(`   ${c.user}: ${c.error}`);
    });
  }

  if (changes.length === 0) {
    console.log("\n✅ No se requirieron cambios - todos los roles están correctos");
  }

  // Guardar log
  const logPath = path.join(process.cwd(), "role-sync-log.json");
  fs.writeFileSync(logPath, JSON.stringify(changes, null, 2));
  console.log(`\n💾 Log guardado en: ${logPath}`);

  console.log("\n" + "=".repeat(80));
}

syncUserRoles()
  .then(() => {
    console.log("\n✨ Sincronización completada");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error fatal:", error);
    process.exit(1);
  });
