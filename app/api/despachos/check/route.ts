import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const object_id = searchParams.get("object_id");
  
  if (!object_id) {
    return NextResponse.json({ error: "object_id requerido" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('despachos')
      .select('id')
      .eq('object_id', object_id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error verificando despacho:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      exists: !!data,
      despachoId: data?.id 
    });
    
  } catch (error) {
    console.error('Error en check:', error);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
