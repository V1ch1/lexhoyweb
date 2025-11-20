import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { supabaseAdmin } from "./lib/supabase";

async function debugLeads() {
  console.log("🔍 Debugging Leads Visibility...\n");

  if (!supabaseAdmin) {
    console.error("❌ supabaseAdmin not initialized. Check SUPABASE_SERVICE_ROLE_KEY.");
    return;
  }

  try {
    // 1. Check all leads (admin view)
    const { data: allLeads, error: adminError } = await supabaseAdmin
      .from("leads")
      .select("id, estado, especialidad, comprador_id, created_at");

    if (adminError) {
      console.error("❌ Error fetching leads as admin:", adminError);
    } else {
      console.log(`📊 Total leads in DB: ${allLeads?.length || 0}`);
      allLeads?.forEach(l => {
        console.log(`   - ${l.id.slice(0, 8)}... | Estado: ${l.estado} | Esp: ${l.especialidad}`);
      });
    }

    // 2. Check RLS policies (simulated)
    console.log("\n🤔 Checking RLS Policies:");
    console.log("   - Policy 'Despachos ven leads procesados':");
    console.log("     USING (estado IN ('procesado', 'en_subasta') AND EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.rol IN ('despacho_admin', 'usuario')))");

    // 3. Check users roles
    const { data: users, error: usersError } = await supabaseAdmin
      .from("users")
      .select("id, email, rol");
    
    if (usersError) {
      console.error("❌ Error fetching users:", usersError);
    } else {
      console.log(`\n👥 Users found: ${users?.length || 0}`);
      users?.forEach(u => {
        console.log(`   - ${u.email} | Rol: ${u.rol} | ID: ${u.id}`);
      });
    }

  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

debugLeads();
