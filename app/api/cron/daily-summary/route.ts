import { NextResponse } from 'next/server';
import { EmailService } from '@/lib/services/emailService';

export async function GET(request: Request) {
  // Verificar autenticación del cron (header secreto)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const result = await EmailService.sendDailySummaries();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
