/**
 * Script para revisar datos actuales en Supabase antes de migración a Clerk
 *
 * Revisa:
 * - Usuarios existentes
 * - Despachos con owner_email
 * - Asignaciones en user_despachos
 */

const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");

// Cargar variables de entorno
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function revisarDatos() {
  console.log("\n========================================");
  console.log("REVISIÓN DE DATOS SUPABASE PRE-MIGRACIÓN");
  console.log("========================================\n");

  try {
    // 1. Revisar usuarios
    console.log("📊 1. USUARIOS");
    console.log("─────────────────────────────────────────\n");

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, nombre, apellidos, rol, plan, activo, fecha_registro")
      .order("fecha_registro", { ascending: false });

    if (usersError) {
      console.error("❌ Error consultando usuarios:", usersError);
    } else {
      console.log(`Total usuarios: ${users.length}\n`);

      if (users.length > 0) {
        users.forEach((u, i) => {
          console.log(`${i + 1}. ${u.email}`);
          console.log(`   Nombre: ${u.nombre} ${u.apellidos || ""}`);
          console.log(
            `   Rol: ${u.rol} | Plan: ${u.plan} | Activo: ${u.activo}`
          );
          console.log(`   ID: ${u.id}`);
          console.log(
            `   Registro: ${new Date(u.fecha_registro).toLocaleString("es-ES")}\n`
          );
        });
      } else {
        console.log("✅ No hay usuarios registrados\n");
      }
    }

    // 2. Revisar despachos con propietarios
    console.log("\n📊 2. DESPACHOS CON PROPIETARIOS");
    console.log("─────────────────────────────────────────\n");

    const { data: despachos, error: despachosError } = await supabase
      .from("despachos")
      .select("id, nombre, owner_email, estado, fecha_registro")
      .not("owner_email", "is", null)
      .order("fecha_registro", { ascending: false });

    if (despachosError) {
      console.error("❌ Error consultando despachos:", despachosError);
    } else {
      console.log(`Total despachos con propietarios: ${despachos.length}\n`);

      if (despachos.length > 0) {
        despachos.forEach((d, i) => {
          console.log(`${i + 1}. ${d.nombre}`);
          console.log(`   Propietario: ${d.owner_email}`);
          console.log(`   Estado: ${d.estado}`);
          console.log(`   ID: ${d.id}`);
          console.log(
            `   Registro: ${new Date(d.fecha_registro).toLocaleString("es-ES")}\n`
          );
        });
      } else {
        console.log("✅ No hay despachos con propietarios asignados\n");
      }
    }

    // 3. Revisar asignaciones user_despachos
    console.log("\n📊 3. ASIGNACIONES USER_DESPACHOS");
    console.log("─────────────────────────────────────────\n");

    const { data: assignments, error: assignmentsError } = await supabase
      .from("user_despachos")
      .select(
        `
        id,
        user_id,
        despacho_id,
        activo,
        permisos,
        users!inner(email, nombre),
        despachos!inner(nombre)
      `
      )
      .eq("activo", true)
      .order("created_at", { ascending: false });

    if (assignmentsError) {
      console.error("❌ Error consultando asignaciones:", assignmentsError);
    } else {
      console.log(`Total asignaciones activas: ${assignments.length}\n`);

      if (assignments.length > 0) {
        assignments.forEach((a, i) => {
          console.log(
            `${i + 1}. Usuario: ${a.users.email} (${a.users.nombre})`
          );
          console.log(`   Despacho: ${a.despachos.nombre}`);
          console.log(`   Permisos: ${JSON.stringify(a.permisos)}`);
          console.log(`   ID: ${a.id}\n`);
        });
      } else {
        console.log("✅ No hay asignaciones activas\n");
      }
    }

    // 4. Revisar leads (opcional)
    console.log("\n📊 4. LEADS (COMPRAS)");
    console.log("─────────────────────────────────────────\n");

    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("id, user_id, estado, created_at")
      .limit(10);

    if (leadsError) {
      console.error("❌ Error consultando leads:", leadsError);
    } else {
      console.log(`Total leads (muestra primeros 10): ${leads.length}\n`);

      if (leads.length > 0) {
        console.log("⚠️  HAY LEADS EN EL SISTEMA - Revisar antes de migrar\n");
        leads.forEach((l, i) => {
          console.log(`${i + 1}. Lead ID: ${l.id}`);
          console.log(`   User: ${l.user_id}`);
          console.log(`   Estado: ${l.estado}`);
          console.log(
            `   Fecha: ${new Date(l.created_at).toLocaleString("es-ES")}\n`
          );
        });
      } else {
        console.log("✅ No hay leads registrados\n");
      }
    }

    // Resumen y recomendación
    console.log("\n========================================");
    console.log("RESUMEN Y RECOMENDACIÓN");
    console.log("========================================\n");

    const totalData =
      users.length + despachos.length + assignments.length + leads.length;

    if (totalData === 0) {
      console.log("✅ BASE DE DATOS LIMPIA");
      console.log("   → Migración LIMPIA recomendada");
      console.log("   → Tiempo estimado: 2-3 horas");
      console.log("   → Sin riesgo de pérdida de datos\n");
    } else {
      console.log("⚠️  HAY DATOS EXISTENTES");
      console.log(`   → Usuarios: ${users.length}`);
      console.log(`   → Despachos: ${despachos.length}`);
      console.log(`   → Asignaciones: ${assignments.length}`);
      console.log(`   → Leads: ${leads.length}\n`);

      if (users.length > 0) {
        console.log("📋 RECOMENDACIÓN:");
        console.log("   1. Hacer backup completo de Supabase");
        console.log("   2. Exportar lista de emails de usuarios");
        console.log("   3. Comunicar a usuarios sobre cambio de autenticación");
        console.log("   4. Implementar migración con preservación de IDs\n");
      }
    }
  } catch (error) {
    console.error("\n❌ Error general:", error);
  }
}

// Ejecutar
revisarDatos()
  .then(() => {
    console.log("✅ Revisión completada\n");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
