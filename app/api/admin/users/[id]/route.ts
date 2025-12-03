
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@/lib/auth';

// Initialize Supabase Admin client for auth management
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    // 1. Verify Authentication and Authorization (Super Admin only)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // @ts-ignore - Custom session properties
    if (session.user.rol !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = id;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`[DELETE USER] Attempting to delete user: ${userId} by admin: ${session.user.email}`);

    // 2. Delete from Supabase Auth (this usually cascades to public.users if configured, but we'll be safe)
    // Using admin client to delete from auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Error deleting user from Auth:', authError);
      return NextResponse.json(
        { error: 'Error deleting user from authentication system', details: authError.message },
        { status: 500 }
      );
    }

    // 3. Delete from public.users (Explicitly, just in case cascade isn't set up or fails)
    // Note: If cascade is set up, this might return "0 rows affected" which is fine, or error if already gone.
    // We'll try to delete and ignore "not found" errors.
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (dbError) {
      console.error('Error deleting user from public DB:', dbError);
      // We don't return error here if auth deletion was successful, as the user is effectively locked out.
      // But we should log it.
    }

    console.log(`[DELETE USER] User ${userId} successfully deleted.`);

    return NextResponse.json({
      success: true,
      message: 'User successfully deleted from the system',
    });
  } catch (error) {
    console.error('Error in DELETE user route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
