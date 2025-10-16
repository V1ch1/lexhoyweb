import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(
  request: Request,
  { params }: { params: { userId: string, despachoId: string } }
) {
  try {
    const { userId, despachoId } = params;

    if (!userId || !despachoId) {
      return NextResponse.json(
        { error: "User ID and Despacho ID are required" },
        { status: 400 }
      );
    }

    console.log(`🚀 Disassociating despacho ${despachoId} from user ${userId}`);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Actualizar el owner_email en la tabla despachos a null
    const { error: updateError } = await supabase
      .from("despachos")
      .update({ 
        owner_email: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", despachoId);
    
    if (updateError) throw updateError;

    // 2. Delete the relationship from user_despachos
    const { error } = await supabase
      .from('user_despachos')
      .delete()
      .eq('user_id', userId)
      .eq('despacho_id', despachoId);

    if (error) {
      console.error('Error disassociating despacho:', error);
      return NextResponse.json(
        { error: 'Error al desasociar el despacho' },
        { status: 500 }
      );
    }

    console.log(`Successfully disassociated despacho ${despachoId} from user ${userId}`);
    console.log(`✅ Successfully disassociated despacho ${despachoId} from user ${userId}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in despacho disassociation:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
