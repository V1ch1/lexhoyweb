import { Metadata } from "next";
import FeatureBlock from "@/components/FeatureBlock";
import SectionTitle from "@/components/SectionTitle";

export const metadata: Metadata = {
  title: "Servicios - Lexhoy Portal",
  description:
    "Descubre todos los servicios que Lexhoy.com ofrece a despachos de abogados: portal de noticias, directorio profesional, generación de leads y marketing digital legal.",
};

export default function Servicios() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 font-bigShouldersText mb-6">
              Nuestros Servicios
            </h1>
            <p className="text-xl text-gray-600 font-workSans max-w-3xl mx-auto">
              Descubre cómo Lexhoy.com puede ayudar a tu despacho a crecer y
              conectar con más clientes potenciales a través de nuestros
              servicios especializados.
            </p>
          </div>
        </div>
      </section>

      {/* Servicios con FeatureBlock */}
      <FeatureBlock
        title="Portal de Noticias Jurídicas"
        description="Mantente actualizado con las últimas noticias, análisis y cambios legislativos del sector legal español. Nuestro equipo de expertos juristas te mantiene informado de todo lo relevante para tu práctica profesional."
        image="/images/Feature1.webp"
        features={[
          "Noticias diarias del sector jurídico",
          "Análisis de cambios legislativos",
          "Jurisprudencia relevante",
          "Newsletter semanal especializada",
        ]}
        buttonText="Ver Noticias"
        buttonLink="https://lexhoy.com"
      />

      <FeatureBlock
        title="Directorio de Despachos de Abogados"
        description="Forma parte del directorio más completo de España con más de 10.000 despachos registrados. Los clientes pueden encontrarte fácilmente según tu especialidad y ubicación."
        image="/images/Feature2.webp"
        reverse
        features={[
          "Perfil profesional completo y verificado",
          "Búsqueda por especialidad jurídica",
          "Geolocalización y búsqueda por proximidad",
          "Integración con Algolia para búsquedas rápidas",
        ]}
        buttonText="Registrar Despacho"
        buttonLink="/register"
      />

      <FeatureBlock
        title="Generación de Leads Calificados"
        description="Recibe clientes potenciales verificados que buscan servicios jurídicos específicos. Nuestro sistema te conecta directamente con personas que necesitan tu especialidad."
        image="/images/imageHero.webp"
        features={[
          "Leads segmentados por especialidad jurídica",
          "Información completa del cliente potencial",
          "Dashboard para gestión y seguimiento",
          "Notificaciones en tiempo real",
        ]}
        buttonText="Ver Dashboard"
        buttonLink="/dashboard"
      />

      <FeatureBlock
        title="Marketing Digital Especializado"
        description="Potencia la visibilidad de tu despacho con nuestras estrategias de marketing digital especializadas en el sector jurídico, incluyendo SEO, content marketing y publicidad segmentada."
        image="/images/Feature1.webp"
        reverse
        features={[
          "Optimización SEO para búsquedas legales",
          "Content marketing jurídico especializado",
          "Publicidad digital segmentada",
          "Análisis y métricas de rendimiento",
        ]}
        buttonText="Solicitar Información"
        buttonLink="/contacto"
      />

      {/* Sección de Planes */}
      <section className="bg-white py-16">
        <div className="max-w-6xl mx-auto px-6">
          <SectionTitle />
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 font-bigShouldersText mb-6">
              Planes para tu Despacho
            </h2>
            <p className="text-xl text-gray-600 font-workSans">
              Elige el plan que mejor se adapte a las necesidades de tu despacho
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Plan Básico */}
            <div className="border border-gray-200 rounded-xl p-8 relative">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 font-bigShouldersText mb-2">
                  Básico
                </h3>
                <div className="text-4xl font-bold text-primary font-bigShouldersText mb-4">
                  Gratis
                </div>
                <p className="text-gray-600 font-workSans mb-6">
                  Perfecto para despachos que empiezan
                </p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-600 font-workSans">
                  <span className="text-green-500 mr-2">✓</span>
                  Perfil en el directorio
                </li>
                <li className="flex items-center text-gray-600 font-workSans">
                  <span className="text-green-500 mr-2">✓</span>
                  Acceso a noticias jurídicas
                </li>
                <li className="flex items-center text-gray-600 font-workSans">
                  <span className="text-green-500 mr-2">✓</span>
                  Hasta 5 leads/mes
                </li>
              </ul>
              <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-workSans font-semibold hover:bg-gray-200 transition-colors">
                Comenzar Gratis
              </button>
            </div>

            {/* Plan Profesional */}
            <div className="border-2 border-primary rounded-xl p-8 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-workSans font-semibold">
                  Más Popular
                </span>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 font-bigShouldersText mb-2">
                  Profesional
                </h3>
                <div className="text-4xl font-bold text-primary font-bigShouldersText mb-4">
                  €49<span className="text-lg">/mes</span>
                </div>
                <p className="text-gray-600 font-workSans mb-6">
                  Para despachos en crecimiento
                </p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-600 font-workSans">
                  <span className="text-green-500 mr-2">✓</span>
                  Todo lo del plan Básico
                </li>
                <li className="flex items-center text-gray-600 font-workSans">
                  <span className="text-green-500 mr-2">✓</span>
                  Hasta 25 leads/mes
                </li>
                <li className="flex items-center text-gray-600 font-workSans">
                  <span className="text-green-500 mr-2">✓</span>
                  Dashboard avanzado
                </li>
                <li className="flex items-center text-gray-600 font-workSans">
                  <span className="text-green-500 mr-2">✓</span>
                  Soporte prioritario
                </li>
              </ul>
              <button className="w-full bg-primary text-white py-3 rounded-lg font-workSans font-semibold hover:bg-red-600 transition-colors">
                Empezar Prueba Gratis
              </button>
            </div>

            {/* Plan Enterprise */}
            <div className="border border-gray-200 rounded-xl p-8 relative">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900 font-bigShouldersText mb-2">
                  Enterprise
                </h3>
                <div className="text-4xl font-bold text-primary font-bigShouldersText mb-4">
                  €149<span className="text-lg">/mes</span>
                </div>
                <p className="text-gray-600 font-workSans mb-6">
                  Para grandes despachos
                </p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-600 font-workSans">
                  <span className="text-green-500 mr-2">✓</span>
                  Todo lo del plan Profesional
                </li>
                <li className="flex items-center text-gray-600 font-workSans">
                  <span className="text-green-500 mr-2">✓</span>
                  Leads ilimitados
                </li>
                <li className="flex items-center text-gray-600 font-workSans">
                  <span className="text-green-500 mr-2">✓</span>
                  Marketing digital incluido
                </li>
                <li className="flex items-center text-gray-600 font-workSans">
                  <span className="text-green-500 mr-2">✓</span>
                  Account manager dedicado
                </li>
              </ul>
              <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-workSans font-semibold hover:bg-gray-200 transition-colors">
                Contactar Ventas
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Final */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl font-bold text-white font-bigShouldersText mb-4">
            ¿Listo para hacer crecer tu despacho?
          </h2>
          <p className="text-xl text-gray-300 font-workSans mb-8">
            Únete a miles de despachos que ya confían en Lexhoy para generar más
            clientes y hacer crecer su negocio.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <a
              href="/register"
              className="bg-primary text-white px-8 py-3 rounded-lg font-workSans font-semibold hover:bg-red-600 transition-colors"
            >
              Empezar Ahora
            </a>
            <a
              href="/contacto"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-workSans font-semibold hover:bg-white hover:text-gray-900 transition-colors"
            >
              Hablar con un Experto
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
