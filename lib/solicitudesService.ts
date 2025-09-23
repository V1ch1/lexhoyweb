import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function crearSolicitudDespacho(
  userId: string,
  despachoId: number,
  userEmail: string,
  userName: string,
  despachoNombre: string,
  despachoLocalidad?: string,
  despachoProvincia?: string
) {
  const { data, error } = await supabase
    .from('solicitudes_despacho')
    .insert({
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      despacho_id: String(despachoId),
      despacho_nombre: despachoNombre,
      despacho_localidad: despachoLocalidad,
      despacho_provincia: despachoProvincia,
      estado: 'pendiente',
      fecha_solicitud: new Date().toISOString()
    })
    .select();
  if (error) {
    console.error('Error al crear solicitud:', error);
    throw error;
  }
  return data;
}

export async function obtenerSolicitudesPorUsuario(userId: string) {
  const { data, error } = await supabase
    .from('solicitudes_despacho')
    .select('*')
    .eq('user_id', userId)
    .order('fecha_solicitud', { ascending: false });
  if (error) throw error;
  return data;
}
