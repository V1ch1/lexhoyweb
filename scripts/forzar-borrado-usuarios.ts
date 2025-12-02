import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const EMAILS_TO_DELETE = [
  'blancocasal@gmail.com',
  'blancoyenbatea@gmail.com'
];

async function forzarBorrado() {
  console.log('🗑️ FORZANDO BORRADO DE USUARIOS\n');
  console.log('='.repeat(80));

  for (const email of EMAILS_TO_DELETE) {
    console.log(`\n🔍 Procesando: ${email}`);
    
    // 1. Obtener ID de public.users
    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
      
    let userId = publicUser?.id;

    if (userId) {
        console.log(`   🆔 ID encontrado en public.users: ${userId}`);
        
        // 1.1 Limpiar tablas relacionadas
        console.log('   🧹 Limpiando tablas relacionadas...');
        
        // user_despachos
        const { error: errUD } = await supabase.from('user_despachos').delete().eq('user_id', userId);
        if (errUD) console.error('   ❌ Error user_despachos:', errUD.message);
        
        // solicitudes_despacho
        const { error: errSD } = await supabase.from('solicitudes_despacho').delete().eq('user_id', userId);
        if (errSD) console.error('   ❌ Error solicitudes_despacho:', errSD.message);
        
        // notificaciones
        const { error: errNotif } = await supabase.from('notificaciones').delete().eq('user_id', userId);
        if (errNotif) console.error('   ❌ Error notificaciones:', errNotif.message);
        
        // LEADS (comprador_id)
        // Verificar cuántos hay antes
        const { count: countBefore } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('comprador_id', userId);
        console.log(`   📊 Leads con comprador_id antes: ${countBefore}`);

        // BORRAR LEADS en lugar de actualizar
        const { error: errLeadsComp } = await supabase
            .from('leads')
            .delete()
            .eq('comprador_id', userId);
            
        if (errLeadsComp) {
            console.error('   ❌ Error borrando leads (comprador_id):', errLeadsComp.message);
        } else {
            console.log('   ✅ Leads borrados (comprador_id)');
        }

        // Verificar cuántos hay después
        const { count: countAfter } = await supabase
            .from('leads')
            .select('*', { count: 'exact', head: true })
            .eq('comprador_id', userId);
        console.log(`   📊 Leads con comprador_id después: ${countAfter}`);

        // LEADS (aprobado_por)
        const { error: errLeadsApp } = await supabase
            .from('leads')
            .update({ aprobado_por: null })
            .eq('aprobado_por', userId);
            
        if (errLeadsApp) console.error('   ❌ Error liberando leads (aprobado_por):', errLeadsApp.message);
        
        // Limpiar owner_email en despachos
        const { error: errDesp } = await supabase.from('despachos').update({ owner_email: null }).eq('owner_email', email);
        if (errDesp) console.error('   ❌ Error despachos owner_email:', errDesp.message);

        // 2. Eliminar de public.users explícitamente
        console.log('   🗑️ Eliminando de public.users...');
        const { error: delPublicError } = await supabase
            .from('users')
            .delete()
            .eq('id', userId);
            
        if (delPublicError) {
            console.error('   ❌ Error eliminando de public.users:', delPublicError.message);
        } else {
            console.log('   ✅ Eliminado de public.users');
        }
    } else {
        console.log('   ⚠️ No encontrado en public.users');
    }

    // 3. Buscar en Auth para asegurar borrado
    console.log('   🔍 Buscando en Auth...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
        console.error('   ❌ Error listando usuarios de Auth:', listError);
    } else {
        const authUser = (users as any[]).find(u => u.email === email);
        if (authUser) {
            console.log(`   🆔 ID encontrado en Auth: ${authUser.id}`);
            console.log('   🗑️ Eliminando de Auth...');
            const { error: delAuthError } = await supabase.auth.admin.deleteUser(authUser.id);
            
            if (delAuthError) {
                console.error('   ❌ Error eliminando de Auth:', delAuthError.message);
            } else {
                console.log('   ✅ Eliminado de Auth');
            }
        } else {
            console.log('   ℹ️ No encontrado en Auth (ya estaba borrado)');
        }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ PROCESO COMPLETADO\n');
}

forzarBorrado().catch(console.error);
