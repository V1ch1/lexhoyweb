import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) {
    return NextResponse.json([], { status: 200 });
  }

  // Leer el JWT del header Authorization
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  // Crear cliente Supabase con el token del usuario
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  try {
    const { data, error } = await supabase
      .from("solicitudes_despacho")
      .select("*")
      .eq("user_id", userId)
      .order("fecha_solicitud", { ascending: false });
    if (error) {
      return NextResponse.json(
        { error: "Error al consultar solicitudes", details: String(error) },
        { status: 500 }
      );
    }
    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Error al consultar solicitudes" },
      { status: 500 }
    );
  }
}
