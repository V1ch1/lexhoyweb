import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || "vento";

  const { data, error } = await supabase
    .from("despachos")
    .select("id, nombre, slug, wordpress_id, estado_verificacion, estado_publicacion, status, object_id")
    .ilike("nombre", `%${query}%`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ despachos: data }, { status: 200 });
}
