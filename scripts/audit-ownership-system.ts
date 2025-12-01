/**
 * Script de Auditoría Completa del Sistema de Ownership
 * 
 * Genera un reporte detallado de:
 * - Todos los despachos y su estado de ownership
 * - Asignaciones en user_despachos (válidas e inválidas)
 * - Usuarios con rol despacho_admin
 * - Recomendaciones de limpieza
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

interface AuditResult {
  despachos: any[];
  userDespachos: any[];
  users: any[];
  issues: string[];
  recommendations: string[];
}

async function auditOwnershipSystem(): Promise<AuditResult> {
  const result: AuditResult = {
    despachos: [],
    userDespachos: [],
    users: [],
    issues: [],
    recommendations: [],
  };

  console.log("🔍 AUDITORÍA COMPLETA DEL SISTEMA DE OWNERSHIP");
  console.log("=".repeat(80));

  // 1. AUDITAR DESPACHOS
  console.log("\n📦 1. AUDITANDO DESPACHOS...\n");
  
  const { data: despachos, error: despachosError } = await supabase
    .from("despachos")
    .select("id, object_id, nombre, owner_email, num_sedes")
    .order("id");

  if (despachosError) {
    console.error("❌ Error:", despachosError.message);
    result.issues.push(`Error al consultar despachos: ${despachosError.message}`);
    return result;
  }

  result.despachos = despachos || [];
  
  const despachosConOwner = despachos?.filter(d => d.owner_email) || [];
  const despachosSinOwner = despachos?.filter(d => !d.owner_email) || [];

  console.log(`   Total despachos: ${despachos?.length || 0}`);
  console.log(`   Con owner: ${despachosConOwner.length} ✅`);
  console.log(`   Sin owner: ${despachosSinOwner.length} ⚠️`);

  console.log("\n   Detalle de despachos:");
  despachos?.forEach((d, i) => {
    const status = d.owner_email ? "✅" : "⚠️";
    console.log(`   ${i + 1}. ${status} ${d.nombre}`);
    console.log(`      ID: ${d.id} | Object ID: ${d.object_id}`);
    console.log(`      Owner: ${d.owner_email || "Sin asignar"}`);
    console.log(`      Sedes: ${d.num_sedes || 0}`);
  });

  // 2. AUDITAR USER_DESPACHOS
  console.log("\n\n👥 2. AUDITANDO ASIGNACIONES (user_despachos)...\n");

  const { data: userDespachos, error: udError } = await supabase
    .from("user_despachos")
    .select("*")
    .order("fecha_asignacion", { ascending: false });

  if (udError) {
    console.error("❌ Error:", udError.message);
    result.issues.push(`Error al consultar user_despachos: ${udError.message}`);
  } else {
    result.userDespachos = userDespachos || [];
    
    const activas = userDespachos?.filter(ud => ud.activo) || [];
    const inactivas = userDespachos?.filter(ud => !ud.activo) || [];

    console.log(`   Total asignaciones: ${userDespachos?.length || 0}`);
    console.log(`   Activas: ${activas.length}`);
    console.log(`   Inactivas: ${inactivas.length}`);

    // Verificar validez de asignaciones activas
    console.log("\n   Verificando validez de asignaciones activas:");
    
    const despachoObjectIds = new Set(despachos?.map(d => d.object_id) || []);
    
    for (const ud of activas) {
      const isValid = despachoObjectIds.has(ud.despacho_id);
      const status = isValid ? "✅ VÁLIDA" : "❌ HUÉRFANA";
      
      // Obtener email del usuario
      const { data: user } = await supabase
        .from("users")
        .select("email, nombre, apellidos, rol")
        .eq("id", ud.user_id)
        .single();

      // Obtener nombre del despacho si existe
      const despacho = despachos?.find(d => d.object_id === ud.despacho_id);

      console.log(`\n   ${status}`);
      console.log(`      Usuario: ${user?.email || "No encontrado"} (${user?.rol || "N/A"})`);
      console.log(`      Despacho ID: ${ud.despacho_id}`);
      console.log(`      Despacho: ${despacho?.nombre || "❌ NO ENCONTRADO"}`);
      console.log(`      Fecha asignación: ${new Date(ud.fecha_asignacion).toLocaleString()}`);
      console.log(`      Permisos: ${JSON.stringify(ud.permisos)}`);

      if (!isValid) {
        result.issues.push(
          `Asignación huérfana: ${user?.email} → ${ud.despacho_id} (despacho no existe)`
        );
        result.recommendations.push(
          `Eliminar asignación huérfana de ${user?.email} (ID: ${ud.id})`
        );
      }
    }
  }

  // 3. AUDITAR USUARIOS CON DESPACHO_ADMIN
  console.log("\n\n👤 3. AUDITANDO USUARIOS CON ROL DESPACHO_ADMIN...\n");

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, email, nombre, apellidos, rol")
    .eq("rol", "despacho_admin")
    .order("email");

  if (usersError) {
    console.error("❌ Error:", usersError.message);
    result.issues.push(`Error al consultar usuarios: ${usersError.message}`);
  } else {
    result.users = users || [];
    
    console.log(`   Total usuarios con despacho_admin: ${users?.length || 0}\n`);

    for (const user of users || []) {
      console.log(`   📧 ${user.email}`);
      console.log(`      Nombre: ${user.nombre} ${user.apellidos}`);

      // Verificar si es owner de algún despacho
      const ownedDespachos = despachos?.filter(d => d.owner_email === user.email) || [];
      
      // Verificar asignaciones en user_despachos
      const assignments = userDespachos?.filter(
        ud => ud.user_id === user.id && ud.activo
      ) || [];

      // Verificar si las asignaciones son válidas
      const validAssignments = assignments.filter(ud => 
        despachos?.some(d => d.object_id === ud.despacho_id)
      );

      console.log(`      Despachos como owner: ${ownedDespachos.length}`);
      ownedDespachos.forEach(d => {
        console.log(`         ✅ ${d.nombre} (ID: ${d.object_id})`);
      });

      console.log(`      Asignaciones en user_despachos: ${assignments.length}`);
      console.log(`      Asignaciones válidas: ${validAssignments.length}`);
      
      const totalValid = ownedDespachos.length + validAssignments.length;
      
      if (totalValid === 0) {
        console.log(`      ⚠️ PROBLEMA: Tiene rol despacho_admin pero NO tiene despachos`);
        result.issues.push(
          `Usuario ${user.email} tiene rol despacho_admin sin despachos asignados`
        );
        result.recommendations.push(
          `Cambiar rol de ${user.email} a 'usuario' O asignarle un despacho`
        );
      } else {
        console.log(`      ✅ OK: Tiene ${totalValid} despacho(s) asignado(s)`);
      }
      
      console.log("");
    }
  }

  // 4. VERIFICAR CONSISTENCIA
  console.log("\n📊 4. VERIFICACIÓN DE CONSISTENCIA...\n");

  // Verificar owners que no son despacho_admin
  const allUsers = await supabase.from("users").select("email, rol");
  const userRoles = new Map(
    allUsers.data?.map(u => [u.email, u.rol]) || []
  );

  despachosConOwner.forEach(d => {
    const ownerRole = userRoles.get(d.owner_email);
    if (ownerRole && ownerRole !== "despacho_admin" && ownerRole !== "super_admin") {
      console.log(`   ⚠️ ${d.owner_email} es owner de "${d.nombre}" pero tiene rol: ${ownerRole}`);
      result.issues.push(
        `Owner ${d.owner_email} de "${d.nombre}" tiene rol incorrecto: ${ownerRole}`
      );
      result.recommendations.push(
        `Promover ${d.owner_email} a despacho_admin`
      );
    }
  });

  // 5. RESUMEN Y RECOMENDACIONES
  console.log("\n" + "=".repeat(80));
  console.log("📋 RESUMEN DE AUDITORÍA");
  console.log("=".repeat(80));

  console.log(`\n✅ ESTADO GENERAL:`);
  console.log(`   Despachos totales: ${despachos?.length || 0}`);
  console.log(`   Despachos con owner: ${despachosConOwner.length}`);
  console.log(`   Despachos sin owner: ${despachosSinOwner.length}`);
  console.log(`   Asignaciones activas: ${userDespachos?.filter(ud => ud.activo).length || 0}`);
  console.log(`   Usuarios despacho_admin: ${users?.length || 0}`);

  console.log(`\n⚠️ PROBLEMAS ENCONTRADOS: ${result.issues.length}`);
  result.issues.forEach((issue, i) => {
    console.log(`   ${i + 1}. ${issue}`);
  });

  console.log(`\n💡 RECOMENDACIONES: ${result.recommendations.length}`);
  result.recommendations.forEach((rec, i) => {
    console.log(`   ${i + 1}. ${rec}`);
  });

  console.log("\n" + "=".repeat(80));

  return result;
}

// Ejecutar auditoría
auditOwnershipSystem()
  .then((result) => {
    // Guardar resultado en archivo JSON
    const outputPath = path.join(process.cwd(), "audit-report.json");
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`\n💾 Reporte guardado en: ${outputPath}`);
    
    // Código de salida según problemas encontrados
    process.exit(result.issues.length > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error("\n❌ Error fatal:", error);
    process.exit(1);
  });
