import Hero from "@/components/Hero";
import SectionTitle from "@/components/SectionTitle";
import FeatureBlock from "@/components/FeatureBlock";

export default function Home() {
  return (
    <main className="w-full">
      <Hero />
      <SectionTitle />

      <FeatureBlock
        title="Obtén Leads de Alta Calidad"
        description="Nuestra plataforma te conecta con clientes potenciales verificados y listos para comprar tus productos o servicios."
        image="/images/Feature1.webp"
      />

      <FeatureBlock
        title="Automatiza Tu Proceso de Ventas"
        description="Optimiza tu negocio con herramientas inteligentes que te ayudarán a gestionar tus leads de manera efectiva."
        image="/images/Feature2.webp"
        reverse
      />
    </main>
  );
}
