/**
 * 🧪 LOAD TEST - REGISTRO DE USUARIOS EN PRODUCCIÓN
 *
 * Simula múltiples usuarios registrándose simultáneamente
 * para probar el sistema de reintentos y capacidad del servidor.
 *
 * IMPORTANTE:
 * - Usa emails temporales para no contaminar la base de datos
 * - Permite limpiar usuarios de prueba después
 * - Monitorea tiempos de respuesta y errores
 */

// Imports
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');

// Cargar variables de entorno de producción
dotenv.config({ path: '.env.production' });

// Configuración
const PRODUCTION_URL =
  process.env.PRODUCTION_URL || "https://despachos.lexhoy.com";
const NUM_USUARIOS = parseInt(process.env.NUM_USUARIOS) || 10;
const DELAY_ENTRE_GRUPOS = parseInt(process.env.DELAY_MS) || 0; // 0 = todos a la vez

// Cliente Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Colores para consola
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

/**
 * Genera datos de usuario de prueba
 */
function generarUsuarioPrueba(index) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);

  return {
    fullName: `Usuario Test ${index}`,
    email: `test-load-${timestamp}-${random}@ejemplo.com`,
    password: "TestPassword123!",
    confirmPassword: "TestPassword123!",
    acceptTerms: true,
  };
}

/**
 * Simula el registro de un usuario usando Supabase directamente
 * (igual que lo hace el frontend en producción)
 */
async function registrarUsuario(userData, index) {
  const startTime = Date.now();

  try {
    console.log(
      `${colors.cyan}[Usuario ${index}]${colors.reset} Iniciando registro: ${userData.email}`
    );

    // Registrar usuario en Supabase Auth (igual que AuthRegisterService)
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          nombre: userData.fullName.split(" ")[0],
          apellidos: userData.fullName.split(" ").slice(1).join(" "),
        },
        emailRedirectTo: `${PRODUCTION_URL}/auth/confirm`,
      },
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    if (signUpError) {
      console.log(
        `${colors.red}❌ [Usuario ${index}]${colors.reset} Error: ${signUpError.message} (${duration}ms)`
      );
      return {
        success: false,
        index,
        email: userData.email,
        duration,
        error: signUpError.message,
      };
    }

    if (!authData.user) {
      console.log(
        `${colors.red}❌ [Usuario ${index}]${colors.reset} Error: No se pudo crear usuario (${duration}ms)`
      );
      return {
        success: false,
        index,
        email: userData.email,
        duration,
        error: "No se pudo crear usuario",
      };
    }

    console.log(
      `${colors.green}✅ [Usuario ${index}]${colors.reset} Registrado exitosamente en ${duration}ms`
    );
    return {
      success: true,
      index,
      email: userData.email,
      userId: authData.user.id,
      duration,
      error: null,
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(
      `${colors.red}❌ [Usuario ${index}]${colors.reset} Excepción: ${error.message} (${duration}ms)`
    );
    return {
      success: false,
      index,
      email: userData.email,
      duration,
      error: error.message,
    };
  }
}

/**
 * Ejecuta el test de carga
 */
async function ejecutarLoadTest() {
  console.log(`\n${"=".repeat(70)}`);
  console.log(
    `${colors.magenta}🧪 LOAD TEST - REGISTRO DE USUARIOS${colors.reset}`
  );
  console.log(`${"=".repeat(70)}`);
  console.log(`${colors.blue}URL:${colors.reset} ${PRODUCTION_URL}`);
  console.log(`${colors.blue}Usuarios:${colors.reset} ${NUM_USUARIOS}`);
  console.log(
    `${colors.blue}Delay entre grupos:${colors.reset} ${DELAY_ENTRE_GRUPOS}ms`
  );
  console.log(
    `${colors.blue}Modo:${colors.reset} ${DELAY_ENTRE_GRUPOS === 0 ? "Todos simultáneos" : "Grupos escalonados"}`
  );
  console.log(`${"=".repeat(70)}\n`);

  console.log(
    `${colors.yellow}⏳ Generando usuarios de prueba...${colors.reset}\n`
  );

  // Generar usuarios
  const usuarios = Array.from({ length: NUM_USUARIOS }, (_, i) =>
    generarUsuarioPrueba(i + 1)
  );

  console.log(
    `${colors.yellow}🚀 Iniciando registros simultáneos...${colors.reset}\n`
  );

  const startTime = Date.now();

  // Ejecutar todos los registros en paralelo
  const resultados = await Promise.all(
    usuarios.map((usuario, index) => registrarUsuario(usuario, index + 1))
  );

  const endTime = Date.now();
  const totalDuration = endTime - startTime;

  // Analizar resultados
  console.log(`\n${"=".repeat(70)}`);
  console.log(`${colors.magenta}📊 RESULTADOS DEL TEST${colors.reset}`);
  console.log(`${"=".repeat(70)}\n`);

  const exitosos = resultados.filter((r) => r.success);
  const fallidos = resultados.filter((r) => !r.success);
  const tasaExito = (exitosos.length / resultados.length) * 100;

  console.log(`${colors.blue}Tiempo total:${colors.reset} ${totalDuration}ms`);
  console.log(
    `${colors.green}Exitosos:${colors.reset} ${exitosos.length}/${resultados.length} (${tasaExito.toFixed(1)}%)`
  );
  console.log(
    `${colors.red}Fallidos:${colors.reset} ${fallidos.length}/${resultados.length}`
  );

  if (exitosos.length > 0) {
    const tiempos = exitosos.map((r) => r.duration);
    const promedioTiempo = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
    const minimoTiempo = Math.min(...tiempos);
    const maximoTiempo = Math.max(...tiempos);

    console.log(`\n${colors.cyan}⏱️  Tiempos de respuesta:${colors.reset}`);
    console.log(`   Promedio: ${promedioTiempo.toFixed(0)}ms`);
    console.log(`   Mínimo:   ${minimoTiempo}ms`);
    console.log(`   Máximo:   ${maximoTiempo}ms`);
  }

  if (fallidos.length > 0) {
    console.log(`\n${colors.yellow}⚠️  Errores encontrados:${colors.reset}`);

    // Agrupar errores por tipo
    const erroresPorTipo = {};
    fallidos.forEach((f) => {
      const errorKey = f.error || "Desconocido";
      erroresPorTipo[errorKey] = (erroresPorTipo[errorKey] || 0) + 1;
    });

    Object.entries(erroresPorTipo).forEach(([error, count]) => {
      console.log(`   ${count}x ${error}`);
    });
  }

  // Recomendaciones
  console.log(
    `\n${colors.magenta}💡 ANÁLISIS Y RECOMENDACIONES${colors.reset}`
  );
  console.log(`${"=".repeat(70)}`);

  if (tasaExito >= 90) {
    console.log(
      `${colors.green}✅ EXCELENTE${colors.reset}: El sistema maneja bien ${NUM_USUARIOS} usuarios simultáneos.`
    );
    console.log(`   Puedes escalar a campañas más grandes con confianza.`);
  } else if (tasaExito >= 70) {
    console.log(
      `${colors.yellow}⚠️  ACEPTABLE${colors.reset}: ${tasaExito.toFixed(1)}% de éxito.`
    );
    console.log(`   El sistema de reintentos está funcionando.`);
    console.log(`   Recomendación: Lanzamiento gradual (50-100 emails/día).`);
  } else if (tasaExito >= 50) {
    console.log(
      `${colors.yellow}⚠️  LIMITADO${colors.reset}: Solo ${tasaExito.toFixed(1)}% de éxito.`
    );
    console.log(
      `   Recomendación: Lanzamiento muy gradual (25-50 emails/día).`
    );
    console.log(`   Considera upgrade a Supabase Pro si esperas más tráfico.`);
  } else {
    console.log(
      `${colors.red}❌ CRÍTICO${colors.reset}: Menos del 50% de éxito.`
    );
    console.log(`   El sistema no está listo para campaña masiva.`);
    console.log(`   Acciones requeridas:`);
    console.log(`   1. Revisar logs de Supabase y Vercel`);
    console.log(`   2. Verificar límites de rate limiting`);
    console.log(`   3. Considerar upgrade a Supabase Pro ANTES de lanzar`);
  }

  // Información de limpieza
  console.log(
    `\n${colors.cyan}🧹 LIMPIEZA DE USUARIOS DE PRUEBA${colors.reset}`
  );
  console.log(`${"=".repeat(70)}`);
  console.log(`Para limpiar los usuarios de prueba creados, ejecuta:`);
  console.log(
    `${colors.yellow}node scripts/limpiar-usuarios-prueba.js${colors.reset}\n`
  );

  // Guardar emails para limpieza
  const emailsCreados = exitosos.map((r) => r.email);
  if (emailsCreados.length > 0) {
    fs.writeFileSync(
      "scripts/usuarios-prueba-creados.json",
      JSON.stringify(emailsCreados, null, 2)
    );
    console.log(
      `${colors.green}✅ Emails guardados en scripts/usuarios-prueba-creados.json${colors.reset}\n`
    );
  }
}

// Ejecutar test
ejecutarLoadTest().catch((error) => {
  console.error(`${colors.red}Error fatal:${colors.reset}`, error);
  process.exit(1);
});
