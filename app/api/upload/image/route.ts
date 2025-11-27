import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/api-auth";
import { getRequiredEnvVar } from "@/lib/env";

export async function POST(request: Request) {
  try {
    // Verificar autenticación
    const { user, error: authError } = await requireAuth();
    if (authError) {
      console.error("❌ [API /upload/image] Error de autenticación");
      return authError;
    }

    console.log("✅ [API /upload/image] Usuario autenticado:", user.id);

    // Obtener el archivo del FormData
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const bucketName = (formData.get("bucket") as string) || "entradas-proyecto";

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "El archivo debe ser una imagen" },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "La imagen no debe superar los 5MB" },
        { status: 400 }
      );
    }

    // Crear cliente Supabase con Service Role para bypass RLS
    const supabase = createClient(
      getRequiredEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
      getRequiredEnvVar("SUPABASE_SERVICE_ROLE_KEY"),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Generar nombre único
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExtension = file.name.split('.').pop() || 'webp';
    const fileName = `${timestamp}-${randomString}.${fileExtension}`;

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Subir a Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ [API /upload/image] Error al subir:", uploadError);
      return NextResponse.json(
        { error: "Error al subir la imagen", details: uploadError.message },
        { status: 500 }
      );
    }

    // Obtener URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(data.path);

    console.log("✅ [API /upload/image] Imagen subida exitosamente:", publicUrl);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: data.path,
    });
  } catch (error) {
    console.error("💥 [API /upload/image] Error completo:", error);
    return NextResponse.json(
      {
        error: "Error al procesar la imagen",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
