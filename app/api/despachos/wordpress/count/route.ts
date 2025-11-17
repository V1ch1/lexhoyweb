import { NextResponse } from "next/server";

/**
 * Obtiene el conteo total de despachos en WordPress
 * GET /api/despachos/wordpress/count
 */
export async function GET() {
  try {
    console.log("🔢 Obteniendo conteo total de despachos en WordPress...");

    // Realizar una consulta directa a la API de WordPress para obtener el total
    const wpApiUrl =
      process.env.WORDPRESS_API_URL || "https://lexhoy.es/wp-json/wp/v2";
    const response = await fetch(`${wpApiUrl}/despacho?per_page=1&_fields=id`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "LexHoy-NextJS/1.0",
      },
    });

    if (!response.ok) {
      console.error(
        "❌ Error en la respuesta de WordPress:",
        response.status,
        response.statusText
      );
      return NextResponse.json(
        { total: 0, error: "Error conectando con WordPress" },
        { status: 500 }
      );
    }

    // WordPress incluye el total en el header X-WP-Total
    const total = parseInt(response.headers.get("X-WP-Total") || "0");

    console.log("📊 Total de despachos en WordPress:", total);

    return NextResponse.json({
      total,
      source: "wordpress",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error obteniendo total de WordPress:", error);
    return NextResponse.json(
      { total: 0, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
