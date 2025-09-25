
"use client";
import EditarDespachoWP from "@/components/EditarDespachoWP";
import { useParams } from "next/navigation";

// Puedes obtener las credenciales de WP de variables de entorno o contexto seguro
const wpUser = process.env.NEXT_PUBLIC_WP_USER || "";
const wpAppPassword = process.env.NEXT_PUBLIC_WP_APP_PASSWORD || "";

export default function EditarDespachoPage() {
  const params = useParams();
  const despachoId = params?.id;
  if (!despachoId) return <div>No se encontró el despacho</div>;
  return (
    <div className="max-w-3xl mx-auto py-8">
      <EditarDespachoWP despachoId={despachoId} wpUser={wpUser} wpAppPassword={wpAppPassword} />
    </div>
  );
}
