import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || '';
  const id = searchParams.get('id');
  if (!query && !id) {
    return NextResponse.json([], { status: 200 });
  }

  // Configura tus credenciales de WordPress
  const username = process.env.NEXT_PUBLIC_WP_USER;
  const appPassword = process.env.NEXT_PUBLIC_WP_APP_PASSWORD;
  const auth = Buffer.from(`${username}:${appPassword}`).toString('base64');

  try {
    let wpRes;
    if (id) {
      wpRes = await fetch(`https://lexhoy.com/wp-json/wp/v2/despacho/${id}`, {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      });
      if (!wpRes.ok) {
        return NextResponse.json([], { status: 200 });
      }
      const despacho = await wpRes.json();
      return NextResponse.json([despacho], { status: 200 });
    } else {
      wpRes = await fetch(`https://lexhoy.com/wp-json/wp/v2/despacho?search=${encodeURIComponent(query)}&per_page=10`, {
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      });
      if (!wpRes.ok) {
        return NextResponse.json({ error: 'Error consultando WordPress' }, { status: 500 });
      }
      const data = await wpRes.json();
      return NextResponse.json(data, { status: 200 });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
