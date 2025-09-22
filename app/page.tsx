import Hero from "@/components/Hero";
import SectionTitle from "@/components/SectionTitle";
import FeatureBlock from "@/components/FeatureBlock";

export default function Home() {
  return (
    <main className="w-full">
      <Hero />
      <SectionTitle />

      <FeatureBlock
        title="Gestiona tu Despacho de Abogados"
        description="Accede a tu área personal donde puedes actualizar los datos de tu despacho, gestionar especialidades jurídicas y mantener tu perfil siempre actualizado en nuestro directorio."
        image="/images/Feature1.webp"
      />

      <FeatureBlock
        title="Recibe Leads de Calidad"
        description="Conecta con clientes potenciales verificados que buscan servicios jurídicos. Nuestro sistema te notifica de nuevos leads según tu especialidad y ubicación."
        image="/images/Feature2.webp"
        reverse
      />
    </main>
  );
}
