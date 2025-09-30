import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const objectId = searchParams.get("objectId");
  if (!objectId) {
    return NextResponse.json({ error: "Falta objectId" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("despachos")
    .select("id, object_id, nombre")
    .eq("object_id", objectId)
    .single();
  if (error || !data) {
    return NextResponse.json(
      { error: "Despacho no encontrado" },
      { status: 404 }
    );
  }
  return NextResponse.json(data, { status: 200 });
}
