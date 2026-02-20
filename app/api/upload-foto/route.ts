import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/api-auth";

export async function POST(request: Request) {
  try {
    const { user, error: authError } = await requireAuth();

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado. Sesión faltante." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const bucket = (formData.get("bucket") as string) || "despachos-fotos";
    const path = (formData.get("path") as string) || "perfiles";
    
    if (!file) {
      return NextResponse.json({ error: "Archivo faltante" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const fileName = `${path}/${timestamp}-${random}.webp`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type || "image/webp",
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("❌ Error al subir usando Service Role:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(bucket).getPublicUrl(uploadData.path);

    return NextResponse.json({
      success: true,
      url: publicUrl,
    });
  } catch (error) {
    console.error("❌ Error inesperado en upload-foto:", error);
    return NextResponse.json(
      { error: "Error de servidor al subir foto", details: error instanceof Error ? error.message : "Desconocido" },
      { status: 500 }
    );
  }
}
