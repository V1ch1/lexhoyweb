import { createClient } from "@supabase/supabase-js";

// Configura tus claves aquí
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// IDs a migrar
const OLD_ID = "a7c9db08-579d-4094-895e-b1ca31178094";
const NEW_ID = "c88ca0e0-0db0-4027-80a1-e281618f4288";

async function updateReferences() {
  // Actualiza referencias en solicitudes_despacho
  await supabase
    .from("solicitudes_despacho")
    .update({ user_id: NEW_ID })
    .eq("user_id", OLD_ID);

  // Actualiza referencias en user_despachos
  await supabase
    .from("user_despachos")
    .update({ user_id: NEW_ID })
    .eq("user_id", OLD_ID);

  // Agrega aquí otras tablas/columnas si es necesario

  console.log(
    "Referencias actualizadas. Ahora puedes eliminar el usuario antiguo."
  );
}

updateReferences().catch(console.error);
