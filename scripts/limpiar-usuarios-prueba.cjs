/**
 * 🧹 LIMPIEZA DE USUARIOS DE PRUEBA
 *
 * Elimina los usuarios creados durante el load test
 * para mantener la base de datos limpia.
 */

const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Cargar variables de entorno
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Error: Faltan variables de entorno SUPABASE");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Colores
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
};

async function limpiarUsuariosPrueba() {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`${colors.cyan}🧹 LIMPIEZA DE USUARIOS DE PRUEBA${colors.reset}`);
  console.log(`${"=".repeat(70)}\n`);

  // Leer archivo de emails
  const emailsPath = path.join(__dirname, "usuarios-prueba-creados.json");

  if (!fs.existsSync(emailsPath)) {
    console.log(
      `${colors.yellow}⚠️  No se encontró archivo de emails de prueba${colors.reset}`
    );
    console.log(`   Buscando usuarios con patrón "test-load-"...\n`);

    // Buscar usuarios de prueba por patrón
    const { data: usuarios, error } = await supabase
      .from("users")
      .select("id, email")
      .ilike("email", "test-load-%");

    if (error) {
      console.error(
        `${colors.red}❌ Error al buscar usuarios:${colors.reset}`,
        error
      );
      return;
    }

    if (!usuarios || usuarios.length === 0) {
      console.log(
        `${colors.green}✅ No hay usuarios de prueba para limpiar${colors.reset}\n`
      );
      return;
    }

    await eliminarUsuarios(usuarios.map((u) => u.email));
    return;
  }

  // Leer emails del archivo
  const emails = JSON.parse(fs.readFileSync(emailsPath, "utf8"));

  console.log(
    `${colors.cyan}📋 Usuarios a eliminar:${colors.reset} ${emails.length}\n`
  );

  await eliminarUsuarios(emails);

  // Eliminar archivo de emails
  fs.unlinkSync(emailsPath);
  console.log(`${colors.green}✅ Archivo de emails eliminado${colors.reset}\n`);
}

async function eliminarUsuarios(emails) {
  let eliminados = 0;
  let errores = 0;

  for (const email of emails) {
    try {
      // 1. Obtener usuario
      const { data: usuario, error: getUserError } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();

      if (getUserError || !usuario) {
        console.log(
          `${colors.yellow}⚠️  Usuario no encontrado:${colors.reset} ${email}`
        );
        continue;
      }

      // 2. Eliminar de auth.users (esto elimina en cascada de la tabla users)
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(
        usuario.id
      );

      if (deleteAuthError) {
        console.error(
          `${colors.red}❌ Error eliminando:${colors.reset} ${email}`,
          deleteAuthError.message
        );
        errores++;
      } else {
        console.log(`${colors.green}✅ Eliminado:${colors.reset} ${email}`);
        eliminados++;
      }
    } catch (error) {
      console.error(
        `${colors.red}❌ Excepción:${colors.reset} ${email}`,
        error.message
      );
      errores++;
    }
  }

  console.log(`\n${colors.cyan}📊 RESUMEN${colors.reset}`);
  console.log(`${colors.green}Eliminados:${colors.reset} ${eliminados}`);
  console.log(`${colors.red}Errores:${colors.reset} ${errores}\n`);
}

limpiarUsuariosPrueba().catch((error) => {
  console.error(`${colors.red}Error fatal:${colors.reset}`, error);
  process.exit(1);
});
