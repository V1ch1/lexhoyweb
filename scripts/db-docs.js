import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from 'dotenv';

// Obtener la ruta al directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputFile = path.join(process.cwd(), "DATABASE_SCHEMA.md");

// Cargar variables de entorno

// Cargar variables de entorno desde el archivo .env en la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Verificar variables de entorno requeridas
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'  // Cambiado para que coincida con tu .env
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Error: La variable de entorno ${envVar} no está definida`);
    console.error('Por favor, asegúrate de que el archivo .env contenga las siguientes variables:');
    console.error('NEXT_PUBLIC_SUPABASE_URL');
    console.error('SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,  // Usando el nombre correcto de la variable
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function documentTable(tableName) {
  let markdown = `## Tabla: \`${tableName}\`\n\n`;

  // Obtener metadatos de la tabla
  try {
    console.log(`🔍 Obteniendo metadatos para tabla: ${tableName}`);

    const { data, error: tableInfoError } = await supabase.rpc(
      "get_table_info",
      {
        p_table_name: tableName,
      }
    );

    if (tableInfoError) {
      console.error("Error al obtener metadatos:", tableInfoError);
      throw tableInfoError;
    }

    if (data) {
      const info = typeof data === "string" ? JSON.parse(data) : data;

      // Añadir descripción si existe
      if (info.description) {
        markdown += `> ${info.description}\n\n`;
      }

      // Añadir información de claves primarias
      if (info.primary_keys && info.primary_keys.length > 0) {
        markdown += "### 🔑 Claves Primarias\n\n";
        markdown +=
          info.primary_keys.map((pk) => `- ${pk.column_name}`).join("\n") +
          "\n\n";
      }

      // Añadir información de claves foráneas
      if (info.foreign_keys && info.foreign_keys.length > 0) {
        markdown += "### 🔗 Relaciones\n\n";
        markdown +=
          info.foreign_keys
            .map(
              (fk) =>
                `- **${fk.column_name}** → ${fk.foreign_table_name}.${fk.foreign_column_name}`
            )
            .join("\n") + "\n\n";
      }

      // Añadir información de índices
      if (info.indexes && info.indexes.length > 0) {
        markdown += "### 📊 Índices\n\n";
        markdown +=
          info.indexes
            .map(
              (idx) =>
                `- **${idx.indexname}** (${idx.column_names}) ${idx.is_unique ? "🔒 Único" : ""}`
            )
            .join("\n") + "\n\n";
      }

      // Añadir información de restricciones
      if (info.constraints && info.constraints.length > 0) {
        markdown += "### ⚠️ Restricciones\n\n";
        markdown +=
          info.constraints
            .map((con) => `- **${con.constraint_name}**: ${con.definition}`)
            .join("\n") + "\n\n";
      }
    }
  } catch (error) {
    console.error(
      `⚠️ Error al obtener metadatos de la tabla ${tableName}:`,
      error.message
    );
    markdown += `> ⚠️ No se pudieron obtener los metadatos de la tabla: ${error.message}\n\n`;
  }

  // Obtener información de columnas
  try {
    const { data: columns, error } = await supabase.rpc("get_table_columns", {
      p_table_name: tableName,
    });

    if (error) throw error;

    if (columns && columns.length > 0) {
      markdown +=
        "### Columnas\n\n| Nombre | Tipo | ¿Nulo? | Valor por defecto |\n|--------|------|--------|-------------------|\n";

      columns.forEach((col) => {
        markdown += `| ${col.column_name} | ${col.data_type} | ${col.is_nullable === "YES" ? "Sí" : "No"}`;
        markdown += ` | ${col.column_default || "Ninguno"} |\n`;
      });
      markdown += "\n";
    } else {
      markdown += "> ℹ️ No se encontraron columnas para esta tabla.\n\n";
    }
  } catch (error) {
    console.error(
      `⚠️ Error al obtener columnas de la tabla ${tableName}:`,
      error.message
    );
    markdown += `> ⚠️ No se pudieron obtener las columnas de la tabla: ${error.message}\n\n`;
  }

  markdown += "---\n\n";
  return markdown;
}

async function documentDatabase() {
  try {
    console.log("🚀 Iniciando generación de documentación...");

    // Get list of tables using direct SQL query
    const { data: tables, error } = await supabase
      .rpc("get_public_tables")
      .select("tablename")
      .order("tablename");

    if (error) {
      console.error("Error al obtener las tablas:", error);
      throw new Error(
        "No se pudo obtener la lista de tablas. Asegúrate de que la función get_public_tables exista en tu base de datos."
      );
    }
    if (!tables || tables.length === 0) {
      throw new Error("No se encontraron tablas en la base de datos");
    }

    let markdown = `# Documentación de la Base de Datos\n\n> Generado el: ${new Date().toISOString()}\n\n`;

    // Process each table
    for (const table of tables) {
      if (!table || !table.tablename) continue;
      const tableName = table.tablename;

      console.log(`📄 Procesando tabla: ${tableName}`);
      markdown += await documentTable(tableName);
    }

    await fs.writeFile(outputFile, markdown, "utf8");
    console.log(`\n✅ Documentación guardada en: ${outputFile}`);
  } catch (error) {
    console.error("\n❌ Error al generar la documentación:", error.message);
    if (error.details) console.error("Detalles:", error.details);
    process.exit(1);
  }
}

// Execute the main function
documentDatabase();
