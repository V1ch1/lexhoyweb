import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/api-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Endpoint para crear un nuevo despacho
 * Crea en Next.js y envía a WordPress
 */
export async function POST(request: Request) {
  try {
    const { user, error: authError } = await requireAuth();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Obtener datos del body
    const body = await request.json();
    const { nombre, sedes } = body;

    // Validar campos requeridos
    if (!nombre) {
      return NextResponse.json(
        { error: "El nombre del despacho es requerido" },
        { status: 400 }
      );
    }

    // Validar que haya al menos una sede
    if (!sedes || !Array.isArray(sedes) || sedes.length === 0) {
      return NextResponse.json(
        { error: "Debe proporcionar al menos una sede" },
        { status: 400 }
      );
    }

    // Validar campos requeridos de la sede principal
    const sedePrincipal = sedes[0];
    if (
      !sedePrincipal.localidad ||
      !sedePrincipal.provincia ||
      !sedePrincipal.telefono ||
      !sedePrincipal.email_contacto
    ) {
      return NextResponse.json(
        {
          error:
            "Faltan campos requeridos en la sede principal: localidad, provincia, teléfono, email",
        },
        { status: 400 }
      );
    }

    // Generar slug único
    const baseSlug = nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
      .replace(/[^a-z0-9\s-]/g, "") // Eliminar caracteres especiales
      .replace(/\s+/g, "-") // Espacios a guiones
      .replace(/-+/g, "-") // Múltiples guiones a uno
      .trim();

    // Verificar si el slug ya existe
    let slug = baseSlug;
    let counter = 1;
    let slugExists = true;

    while (slugExists) {
      const { data: existing } = await supabase
        .from("despachos")
        .select("id")
        .eq("slug", slug)
        .single();

      if (!existing) {
        slugExists = false;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // Obtener email del usuario
    const userEmail = body.user_email || user.email;

    // Crear despacho en Next.js
    const { data: despacho, error: despachoError } = await supabase
      .from("despachos")
      .insert({
        nombre,
        slug,
        status: "publish", // Publicado para sincronizar con WordPress
        num_sedes: sedes.length,
        owner_email: userEmail, // Email del propietario
        wordpress_id: null, // Se asignará cuando se sincronice con WP
        featured_media_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (despachoError) {
      console.error("Error al crear despacho:", despachoError);
      throw despachoError;
    }

    // Obtener el user_id de la tabla users usando el email
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", userEmail)
      .single();

    if (userError || !userData) {
      console.error(
        "⚠️ No se encontró el usuario en la tabla users:",
        userError
      );
      // Intentar crear el usuario en la tabla users si no existe
      const { data: newUser, error: createUserError } = await supabase
        .from("users")
        .insert({
          id: user.id, // Usar el ID de auth
          email: userEmail,
          role: "despacho_admin",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (createUserError) {
        console.error(
          "❌ Error al crear usuario en tabla users:",
          createUserError
        );
      } else {
      }
    }

    const finalUserId = userData?.id || user.id;

    // Asignar despacho al usuario en user_despachos (solo campos que existen)
    const { error: userDespachoError } = await supabase
      .from("user_despachos")
      .insert({
        user_id: finalUserId,
        despacho_id: despacho.id,
        // Los demás campos se asignan por defecto en la BD
      });

    if (userDespachoError) {
      console.error(
        "❌ Error al asignar despacho al usuario:",
        userDespachoError
      );
    } else {
    }

    // Obtener TODOS los super_admin para notificar
    const { data: superAdmins } = await supabase
      .from("users")
      .select("id")
      .eq("role", "super_admin");

    // Enviar notificación a TODOS los super_admin
    if (superAdmins && superAdmins.length > 0) {
      const notificaciones = superAdmins.map((admin) => ({
        user_id: admin.id,
        tipo: "nuevo_despacho",
        titulo: "Nuevo despacho creado",
        mensaje: `El usuario ${userEmail} ha creado el despacho "${nombre}"`,
        leida: false,
        url: `/dashboard/admin/despachos/${despacho.id}`,
        metadata: {
          despacho_id: despacho.id,
          user_email: userEmail,
          nombre_despacho: nombre,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { error: notifError } = await supabase
        .from("notificaciones")
        .insert(notificaciones);

      if (notifError) {
        console.error("Error al crear notificaciones:", notifError);
      } else {
      }
    }

    // Crear todas las sedes
    const sedesData = sedes.map(
      (sede: {
        nombre: string;
        descripcion?: string;
        calle?: string;
        numero?: string;
        piso?: string;
        localidad: string;
        provincia: string;
        codigo_postal?: string;
        pais?: string;
        telefono: string;
        email_contacto: string;
        persona_contacto?: string;
        web?: string;
        numero_colegiado?: string;
        colegio?: string;
        experiencia?: string;
        areas_practica?: string[];
        especialidades?: string;
        servicios_especificos?: string;
        ano_fundacion?: string;
        tamano_despacho?: string;
        horarios?: {
          lunes?: string;
          martes?: string;
          miercoles?: string;
          jueves?: string;
          viernes?: string;
          sabado?: string;
          domingo?: string;
        };
        redes_sociales?: {
          facebook?: string;
          twitter?: string;
          linkedin?: string;
          instagram?: string;
        };
        foto_perfil?: string;
        observaciones?: string;
        es_principal?: boolean;
      }) => ({
        despacho_id: despacho.id,
        nombre: sede.nombre || "Sede",
        descripcion: sede.descripcion || "",
        es_principal: sede.es_principal || false,
        calle: sede.calle || "",
        numero: sede.numero || "",
        piso: sede.piso || "",
        localidad: sede.localidad,
        provincia: sede.provincia,
        codigo_postal: sede.codigo_postal || "",
        pais: sede.pais || "España",
        telefono: sede.telefono,
        email_contacto: sede.email_contacto,
        persona_contacto: sede.persona_contacto || "",
        web: sede.web || "",
        numero_colegiado: sede.numero_colegiado || "",
        colegio: sede.colegio || "",
        experiencia: sede.experiencia || "",
        areas_practica: sede.areas_practica || [],
        especialidades: sede.especialidades || "",
        servicios_especificos: sede.servicios_especificos || "",
        ano_fundacion: sede.ano_fundacion ? parseInt(sede.ano_fundacion) : null,
        tamano_despacho: sede.tamano_despacho || "",
        horarios: sede.horarios || {},
        redes_sociales: sede.redes_sociales || {},
        foto_perfil: sede.foto_perfil || "",
        observaciones: sede.observaciones || "",
        activa: true,
        estado_verificacion: "pendiente",
      })
    );

    const { error: sedesError } = await supabase
      .from("sedes")
      .insert(sedesData);

    if (sedesError) {
      console.error("❌ Error al crear sedes:", sedesError);
      console.error(
        "📋 Datos que causaron el error:",
        JSON.stringify(sedesData, null, 2)
      );
      // No lanzamos error, el despacho ya está creado
    } else {
    }

    // Esperar 1 segundo para asegurar que las sedes estén completamente guardadas
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Sincronización completa usando el nuevo sistema modular
    console.log(
      "🔄 Iniciando sincronización completa (Supabase → WordPress → Algolia)..."
    );
    console.log(`   Despacho ID: ${despacho.id}`);
    console.log(`   Nombre: ${nombre}`);
    console.log(`   Sedes: ${sedes.length}`);

    let syncResult: {
      success: boolean;
      objectId?: string;
      wordpressId?: number;
      error?: string;
    } = {
      success: false,
      error: "No ejecutado",
    };

    try {
      const { SyncOrchestrator } = await import("@/lib/sync");
      syncResult = await SyncOrchestrator.sincronizarCompleto(
        despacho.id,
        false
      );

      if (syncResult.success) {
        console.log("✅ Sincronización completa exitosa");
        console.log(`   WordPress ID: ${syncResult.wordpressId}`);
        console.log(`   Algolia Object ID: ${syncResult.objectId}`);
      } else {
        console.error("⚠️ Error en sincronización:", syncResult.error);
        // No fallar la creación, el despacho ya está en Supabase
        // Se puede sincronizar manualmente después
      }
    } catch (syncError) {
      console.error("❌ Excepción en sincronización:", syncError);
      syncResult = {
        success: false,
        error:
          syncError instanceof Error ? syncError.message : "Error desconocido",
      };
      // No lanzar error, continuar con la respuesta
    }

    console.log("📊 Resultado de sincronización:", syncResult);

    return NextResponse.json({
      success: true,
      message: "Despacho creado correctamente",
      despachoId: despacho.id,
      wordpressId: syncResult.wordpressId,
      objectId: syncResult.objectId,
      sincronizado: syncResult.success,
      sedesCreadas: !sedesError,
      sedesError: sedesError
        ? {
            message: sedesError.message,
            details: sedesError.details,
            hint: sedesError.hint,
            code: sedesError.code,
          }
        : null,
    });
  } catch (error) {
    console.error("Error al crear despacho:", error);
    return NextResponse.json(
      {
        error: "Error al crear despacho",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
