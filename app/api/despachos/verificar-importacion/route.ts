import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wordpressId = searchParams.get("wordpress_id") || "74938";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Obtener el despacho
    const { data: despacho, error: despachoError } = await supabase
      .from("despachos")
      .select("*")
      .eq("wordpress_id", wordpressId)
      .single();

    if (despachoError) throw despachoError;

    // Obtener las sedes
    const { data: sedes, error: sedesError } = await supabase
      .from("sedes")
      .select("*")
      .eq("despacho_id", despacho.id);

    if (sedesError) throw sedesError;

    return NextResponse.json(
      {
        despacho: {
          id: despacho.id,
          nombre: despacho.nombre,
          email: despacho.email,
          telefono: despacho.telefono,
          wordpress_id: despacho.wordpress_id,
        },
        sedes: sedes.map((sede) => ({
          nombre_sede: sede.nombre_sede,
          calle: sede.calle,
          localidad: sede.localidad,
          provincia: sede.provincia,
          codigo_postal: sede.codigo_postal,
          telefono: sede.telefono,
          email: sede.email,
          areas_practica: {
            tipo: Array.isArray(sede.areas_practica)
              ? "array"
              : typeof sede.areas_practica,
            valor: sede.areas_practica,
          },
          horarios: {
            tipo: typeof sede.horarios,
            valor: sede.horarios,
          },
          redes_sociales: {
            tipo: typeof sede.redes_sociales,
            valor: sede.redes_sociales,
          },
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    const err = error as Error & { details?: string };
    return NextResponse.json(
      {
        error: err.message,
        details: err.details || null,
      },
      { status: 500 }
    );
  }
}
