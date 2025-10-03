import { NextResponse } from "next/server";
import { UserService } from "@/lib/userService";

const userService = new UserService();

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const despachos = await userService.getUserDespachos(userId);

    // Transformar los datos para que coincidan con la interfaz esperada
    const transformedDespachos = despachos.map((d: any) => ({
      id: d.despachos?.id || d.despachoId, // Usar el id del despacho, no el de user_despachos
      nombre: d.despachos?.nombre || 'Sin nombre',
      localidad: d.despachos?.localidad,
      provincia: d.despachos?.provincia,
      telefono: d.despachos?.telefono,
      email: d.despachos?.email,
      web: d.despachos?.web,
      descripcion: d.despachos?.descripcion,
      num_sedes: d.despachos?.num_sedes || 0,
      estado: d.despachos?.estado_verificacion || 'pendiente',
      created_at: d.fechaAsignacion || d.despachos?.created_at,
    }));

    return NextResponse.json(transformedDespachos, { status: 200 });
  } catch (error) {
    console.error("Error fetching user despachos:", error);
    return NextResponse.json(
      {
        error: "Error fetching despachos",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
