import { Metadata } from "next";
import FeatureBlock from "@/components/FeatureBlock";

export const metadata: Metadata = {
  title: "Sobre Nosotros - Lexhoy Portal",
  description:
    "Conoce la historia, misión y equipo detrás de Lexhoy.com, el principal portal de noticias jurídicas y directorio de despachos de abogados en España.",
};

export default function SobreNosotros() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 font-bigShouldersText mb-4 md:mb-6">
              Sobre Lexhoy.com
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 font-workSans max-w-3xl mx-auto px-4 md:px-0">
              Somos el principal portal de información jurídica y directorio de
              despachos de abogados en España, conectando profesionales del
              derecho con clientes que necesitan sus servicios.
            </p>
          </div>
        </div>
      </section>

      {/* Nuestra Historia */}
      <FeatureBlock
        title="Nuestra Historia"
        description="Lexhoy.com nació con la visión de revolucionar el sector jurídico digital en España. Comenzamos como un portal de noticias especializadas en el ámbito legal, pero pronto identificamos la necesidad de crear un puente entre los profesionales del derecho y los ciudadanos que requieren sus servicios."
        image="/images/imagen1Nosotros.webp"
        features={[
          "Portal de noticias jurídicas líder en España",
          "Base de datos más completa con +10.000 despachos verificados",
          "Referencia del sector para servicios jurídicos especializados",
          "Tecnología avanzada con integración Algolia y WordPress",
        ]}
        buttonText="Conocer Nuestros Servicios"
        buttonLink="/servicios"
      />

      {/* Nuestra Misión */}
      <FeatureBlock
        title="Nuestra Misión"
        description="Democratizar el acceso a servicios jurídicos de calidad, facilitando el encuentro entre despachos especializados y clientes que necesitan servicios específicos. Mantenemos a la comunidad jurídica informada y conectada."
        image="/images/Feature2.webp"
        reverse
        features={[
          "Información jurídica actualizada y especializada",
          "Conexión directa entre despachos y clientes potenciales",
          "Acceso simplificado a la justicia para todos",
          "Red profesional de más de 10.000 despachos",
        ]}
        buttonText="Registrar Despacho"
        buttonLink="/register"
      />

      {/* Nuestros Números */}
      <section className="bg-white py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-bigShouldersText mb-4 md:mb-6">
              Lexhoy en Números
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 font-workSans px-4 md:px-0">
              Datos que respaldan nuestro liderazgo en el sector jurídico
              digital
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary font-bigShouldersText mb-2">
                +10.000
              </div>
              <p className="text-gray-600 font-workSans">
                Despachos registrados
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary font-bigShouldersText mb-2">
                +50.000
              </div>
              <p className="text-gray-600 font-workSans">Usuarios mensuales</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary font-bigShouldersText mb-2">
                +50
              </div>
              <p className="text-gray-600 font-workSans">Leads generados/mes</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary font-bigShouldersText mb-2">
                52
              </div>
              <p className="text-gray-600 font-workSans">
                Provincias cubiertas
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nuestros Valores */}
      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-bigShouldersText mb-4 md:mb-6">
              Nuestros Valores
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="text-center">
              <div className="bg-primary/10 p-6 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">📰</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 font-workSans mb-2">
                Información Jurídica
              </h3>
              <p className="text-gray-600 font-workSans">
                Mantener a la comunidad jurídica informada con noticias,
                análisis y actualizaciones del sector legal español.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 p-6 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 font-workSans mb-2">
                Conexión Profesional
              </h3>
              <p className="text-gray-600 font-workSans">
                Facilitar el encuentro entre despachos de abogados
                especializados y clientes que necesitan servicios jurídicos
                específicos.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 p-6 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">⚖️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 font-workSans mb-2">
                Acceso a la Justicia
              </h3>
              <p className="text-gray-600 font-workSans">
                Democratizar el acceso a servicios jurídicos de calidad,
                haciendo más fácil encontrar el despacho adecuado para cada
                necesidad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-primary py-16">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl font-bold text-white font-bigShouldersText mb-4">
            ¿Quieres formar parte de nuestra red?
          </h2>
          <p className="text-xl text-white/90 font-workSans mb-8">
            Únete a más de 10.000 despachos que ya confían en Lexhoy para hacer
            crecer su negocio.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
            <a
              href="/register"
              className="bg-white text-primary px-8 py-3 rounded-lg font-workSans font-semibold hover:bg-gray-100 transition-colors"
            >
              Registrar mi Despacho
            </a>
            <a
              href="/contacto"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-workSans font-semibold hover:bg-white hover:text-primary transition-colors"
            >
              Contactar con Nosotros
            </a>
          </div>

          {/* Redes Sociales */}
          <div className="border-t border-white/20 pt-8">
            <p className="text-white/90 font-workSans mb-4">
              Síguenos en nuestras redes sociales para estar al día con las
              últimas noticias jurídicas
            </p>
            <div className="flex justify-center space-x-6">
              <a
                href="https://www.facebook.com/lexhoynoticias/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors"
              >
                <span className="sr-only">Facebook</span>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/lexhoynoticias/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors"
              >
                <span className="sr-only">Instagram</span>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 0C7.284 0 6.944.012 5.877.06 4.814.109 4.086.277 3.45.525a5.89 5.89 0 00-2.126 1.384A5.89 5.89 0 00.04 3.045C-.207 3.68-.375 4.408-.424 5.47-.472 6.537-.484 6.877-.484 9.593s.012 3.056.06 4.123c.049 1.062.217 1.79.465 2.426a5.89 5.89 0 001.384 2.126 5.89 5.89 0 002.126 1.384c.636.248 1.364.416 2.426.465 1.067.048 1.407.06 4.123.06s3.056-.012 4.123-.06c1.062-.049 1.79-.217 2.426-.465a5.89 5.89 0 002.126-1.384 5.89 5.89 0 001.384-2.126c.248-.636.416-1.364.465-2.426.048-1.067.06-1.407.06-4.123s-.012-3.056-.06-4.123c-.049-1.062-.217-1.79-.465-2.426A5.89 5.89 0 0016.95 1.909 5.89 5.89 0 0014.824.525C14.188.277 13.46.109 12.398.06 11.331.012 10.991 0 8.275 0H10zm0 1.802c2.67 0 2.987.01 4.042.059.976.045 1.505.207 1.858.344.467.182.8.398 1.15.748.35.35.566.683.748 1.15.137.353.3.882.344 1.857.048 1.055.058 1.37.058 4.041 0 2.67-.01 2.986-.058 4.04-.045.976-.207 1.505-.344 1.858a3.097 3.097 0 01-.748 1.15c-.35.35-.683.566-1.15.748-.353.137-.882.3-1.857.344-1.054.048-1.37.058-4.041.058-2.67 0-2.987-.01-4.04-.058-.976-.045-1.505-.207-1.858-.344a3.097 3.097 0 01-1.15-.748 3.098 3.098 0 01-.748-1.15c-.137-.353-.3-.882-.344-1.857-.048-1.055-.058-1.37-.058-4.041 0-2.67.01-2.986.058-4.04.045-.976.207-1.505.344-1.858.182-.467.398-.8.748-1.15.35-.35.683-.566 1.15-.748.353-.137.882-.3 1.857-.344 1.055-.048 1.37-.058 4.041-.058zM10 4.865a4.135 4.135 0 100 8.27 4.135 4.135 0 000-8.27zm0 6.823a2.688 2.688 0 110-5.376 2.688 2.688 0 010 5.376zm5.23-6.97a.965.965 0 11-1.93 0 .965.965 0 011.93 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/company/lex-hoy/about/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors"
              >
                <span className="sr-only">LinkedIn</span>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@lexhoy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors"
              >
                <span className="sr-only">TikTok</span>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-.88-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
                </svg>
              </a>
              <a
                href="https://www.youtube.com/@LexHoy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors"
              >
                <span className="sr-only">YouTube</span>
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
