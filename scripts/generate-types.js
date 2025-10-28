import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = 'https://oepcitgbnqylfpdryffx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lcGNpdGdicW55bGZwZHJ5ZmZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDA2ODg4OTAsImV4cCI6MjAxNjI2NDg5MH0.0QZ4XZ9Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3';

const supabase = createClient(supabaseUrl, supabaseKey);

async function generateTypes() {
  try {
    // Obtener las tablas de la base de datos
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');

    if (tablesError) {
      console.error('Error al obtener las tablas:', tablesError);
      return;
    }

    // Crear un objeto para almacenar el esquema
    const schema = {
      public: {
        Tables: {},
        Views: {},
        Functions: {},
        Enums: {}
      }
    };

    // Obtener la estructura de cada tabla
    for (const table of tables) {
      const { data: columns, error: columnsError } = await supabase
        .rpc('get_columns', { table_name: table.tablename });

      if (!columnsError && columns) {
        schema.public.Tables[table.tablename] = {
          Row: columns.reduce((acc, column) => {
            acc[column.column_name] = column.data_type;
            return acc;
          }, {})
        };
      }
    }

    // Generar el contenido del archivo de tipos
    const typesContent = `// Tipos generados automáticamente - ${new Date().toISOString()}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database ${JSON.stringify(schema, null, 2).replace(/"([^"]+)":/g, '$1:')}`;

    // Escribir el archivo de tipos
    const typesPath = join(__dirname, '..', 'types', 'supabase.ts');
    writeFileSync(typesPath, typesContent);
    
    console.log('¡Tipos generados correctamente en types/supabase.ts!');
  } catch (error) {
    console.error('Error al generar tipos:', error);
  }
}

// Ejecutar la generación de tipos
generateTypes().catch(console.error);
