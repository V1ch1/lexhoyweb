/**
 * Script de backup de usuarios antes de migración a Clerk
 *
 * Exporta todos los usuarios actuales a JSON para preservar la información
 */

const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

// Cargar variables de entorno
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function backupUsuarios() {
  console.log("\n========================================");
  console.log("BACKUP DE USUARIOS PRE-MIGRACIÓN CLERK");
  console.log("========================================\n");

  try {
    // 1. Obtener todos los usuarios de Supabase DB
    console.log("📦 Obteniendo usuarios de la base de datos...\n");

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*")
      .order("fecha_registro", { ascending: false });

    if (usersError) {
      console.error("❌ Error consultando usuarios:", usersError);
      process.exit(1);
    }

    console.log(`✅ ${users.length} usuarios encontrados\n`);

    // 2. Obtener usuarios de Supabase Auth
    console.log("🔐 Obteniendo usuarios de Supabase Auth...\n");

    const { data: authUsers, error: authError } =
      await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("❌ Error consultando auth:", authError);
      process.exit(1);
    }

    console.log(`✅ ${authUsers.users.length} usuarios en Auth\n`);

    // 3. Combinar información
    const backupData = {
      fecha_backup: new Date().toISOString(),
      total_usuarios_db: users.length,
      total_usuarios_auth: authUsers.users.length,
      usuarios: users.map((dbUser) => {
        const authUser = authUsers.users.find((au) => au.id === dbUser.id);
        return {
          // Datos de la BD
          id: dbUser.id,
          email: dbUser.email,
          nombre: dbUser.nombre,
          apellidos: dbUser.apellidos,
          rol: dbUser.rol,
          plan: dbUser.plan,
          activo: dbUser.activo,
          despacho_id: dbUser.despacho_id,
          fecha_registro: dbUser.fecha_registro,
          // Datos de Auth
          email_confirmed: authUser?.email_confirmed_at ? true : false,
          created_at: authUser?.created_at,
          last_sign_in: authUser?.last_sign_in_at,
          phone: authUser?.phone,
        };
      }),
    };

    // 4. Guardar backup
    const backupDir = path.join(__dirname, "backups");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `usuarios-pre-clerk-${timestamp}.json`;
    const filepath = path.join(backupDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));

    console.log("✅ Backup creado exitosamente\n");
    console.log(`📁 Archivo: ${filepath}\n`);

    // 5. Crear lista de emails para comunicación
    const emailList = users.map((u) => u.email).join("\n");
    const emailFilePath = path.join(
      backupDir,
      `emails-usuarios-${timestamp}.txt`
    );
    fs.writeFileSync(emailFilePath, emailList);

    console.log(`📧 Lista de emails guardada: ${emailFilePath}\n`);

    // 6. Resumen
    console.log("========================================");
    console.log("RESUMEN DEL BACKUP");
    console.log("========================================\n");
    console.log(`Total usuarios: ${users.length}`);
    console.log(
      `Emails confirmados: ${backupData.usuarios.filter((u) => u.email_confirmed).length}`
    );
    console.log(`Usuarios activos: ${users.filter((u) => u.activo).length}`);
    console.log(
      `Super admins: ${users.filter((u) => u.rol === "super_admin").length}`
    );
    console.log(
      `Despacho admins: ${users.filter((u) => u.rol === "despacho_admin").length}`
    );
    console.log("\nUsuarios:\n");
    users.forEach((u, i) => {
      const confirmed = authUsers.users.find((au) => au.id === u.id)
        ?.email_confirmed_at
        ? "✓"
        : "✗";
      console.log(
        `${i + 1}. [${confirmed}] ${u.email} - ${u.nombre} ${u.apellidos || ""} (${u.rol})`
      );
    });

    console.log("\n✅ Backup completado exitosamente");
    console.log(
      "\n⚠️  IMPORTANTE: Guarda este backup antes de continuar con la migración\n"
    );
  } catch (error) {
    console.error("\n❌ Error durante backup:", error);
    process.exit(1);
  }
}

// Ejecutar
backupUsuarios()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
