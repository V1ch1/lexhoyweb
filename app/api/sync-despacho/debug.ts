import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // 1. Obtener información básica
    const url = new URL(request.url);
    console.log('\n===== NUEVA SOLICITUD =====');
    console.log(`URL: ${url}`);
    console.log(`Método: ${request.method}`);
    
    // 2. Mostrar headers
    console.log('\nHEADERS:');
    request.headers.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });
    
    // 3. Obtener el cuerpo
    const body = await request.text();
    console.log('\nCUERPO DE LA SOLICITUD:');
    console.log(body || '(vacío)');
    
    // 4. Devolver una respuesta simple
    return NextResponse.json(
      { 
        status: 'success',
        message: 'Solicitud recibida',
        body: body || null,
        headers: Object.fromEntries(request.headers.entries())
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error en el servidor:', error);
    return NextResponse.json(
      { 
        status: 'error',
        error: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
