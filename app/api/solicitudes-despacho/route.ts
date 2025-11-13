import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Habilitar logs detallados en desarrollo
const isDev = process.env.NODE_ENV === 'development';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    
    if (isDev) if (!userId) {
      if (isDev) return NextResponse.json([], { status: 200 });
    }

    // Leer el JWT del header Authorization
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) {
      if (isDev) console.error('🔒 No se encontró token de autenticación');
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Validar variables de entorno
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('❌ Error: Faltan variables de entorno de Supabase');
      return NextResponse.json(
        { error: "Error de configuración del servidor" }, 
        { status: 500 }
      );
    }

    // Crear cliente Supabase con el token del usuario
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      global: { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        } 
      },
    });

    if (isDev) // Consultar las solicitudes
    const { data, error, status } = await supabase
      .from("solicitudes_despacho")
      .select("*")
      .eq("user_id", userId)
      .order("fecha_solicitud", { ascending: false });

    if (error) {
      console.error('❌ Error en consulta a Supabase:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      
      return NextResponse.json(
        { 
          error: "Error al consultar solicitudes", 
          details: error.message,
          code: error.code
        },
        { status: status || 500 }
      );
    }

    if (isDev) return NextResponse.json(data || [], { status: 200 });
    
  } catch (error) {
    console.error('🔥 Error inesperado en la API:', error);
    return NextResponse.json(
      { 
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
