import { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contacto - Lexhoy Portal",
  description:
    "Contacta con el equipo de Lexhoy.com. Estamos aquí para ayudarte con cualquier consulta sobre nuestros servicios para despachos de abogados.",
};

export default function Contacto() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 font-bigShouldersText mb-4 md:mb-6">
              Contacta con Nosotros
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 font-workSans max-w-3xl mx-auto px-4 md:px-0">
              ¿Tienes dudas sobre nuestros servicios? ¿Necesitas ayuda con tu
              registro? Nuestro equipo está aquí para ayudarte.
            </p>
          </div>
        </div>
      </section>

      {/* Información de Contacto y Formulario */}
      <section className="py-16" id="formulario-contacto">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Información de Contacto */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 font-bigShouldersText mb-8">
                Información de Contacto
              </h2>

              <div className="space-y-8">
                {/* Datos Generales */}
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <span className="text-2xl">📍</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 font-workSans mb-2">
                      Oficinas Centrales
                    </h3>
                    <p className="text-gray-600 font-workSans">
                      Calle Torreiro, 13 - 2ºB
                      <br />
                      15003 A Coruña, España
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <span className="text-2xl">📞</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 font-workSans mb-2">
                      Teléfono
                    </h3>
                    <p className="text-gray-600 font-workSans">
                      +34 649 528 552
                      <br />
                      Lunes a Viernes: 9:00 - 18:00
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <span className="text-2xl">✉️</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 font-workSans mb-2">
                      Email
                    </h3>
                    <p className="text-gray-600 font-workSans">
                      <a
                        href="mailto:contacto@lexhoy.com"
                        className="hover:text-primary transition-colors"
                      >
                        contacto@lexhoy.com
                      </a>
                      <br />
                      <a
                        href="mailto:despachos@lexhoy.com"
                        className="hover:text-primary transition-colors"
                      >
                        despachos@lexhoy.com
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Departamentos Específicos */}
              <div className="mt-12">
                <h3 className="text-2xl font-bold text-gray-900 font-bigShouldersText mb-6">
                  Departamentos Especializados
                </h3>

                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h4 className="text-lg font-bold text-gray-900 font-workSans mb-2">
                      Gestión de Despachos
                    </h4>
                    <p className="text-gray-600 font-workSans text-sm mb-2">
                      Altas, modificaciones y gestión de perfiles de despachos
                    </p>
                    <a
                      href="mailto:despachos@lexhoy.com"
                      className="text-primary hover:underline font-workSans"
                    >
                      despachos@lexhoy.com
                    </a>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h4 className="text-lg font-bold text-gray-900 font-workSans mb-2">
                      Responsable de Área
                    </h4>
                    <p className="text-gray-600 font-workSans text-sm mb-2">
                      Contacto directo con el responsable de gestión
                    </p>
                    <a
                      href="mailto:manuel.blanco@lexhoy.com"
                      className="text-primary hover:underline font-workSans"
                    >
                      manuel.blanco@lexhoy.com
                    </a>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h4 className="text-lg font-bold text-gray-900 font-workSans mb-2">
                      Soporte Técnico
                    </h4>
                    <p className="text-gray-600 font-workSans text-sm mb-2">
                      Ayuda con el portal, problemas técnicos, gestión de perfil
                    </p>
                    <a
                      href="mailto:contacto@lexhoy.com"
                      className="text-primary hover:underline font-workSans"
                    >
                      contacto@lexhoy.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulario de Contacto */}
            <ContactForm />
          </div>
        </div>
      </section>

      {/* FAQ Rápida */}
      <section className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 font-bigShouldersText mb-6">
              Preguntas Frecuentes
            </h2>
            <p className="text-gray-600 font-workSans">
              Respuestas rápidas a las consultas más comunes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-workSans mb-2">
                  ¿Cómo registro mi despacho?
                </h3>
                <p className="text-gray-600 font-workSans text-sm">
                  Puedes registrar tu despacho gratuitamente desde el botón
                  &quot;Registrar Despacho&quot; en la página principal. El
                  proceso toma menos de 5 minutos.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 font-workSans mb-2">
                  ¿Cuánto cuesta el servicio?
                </h3>
                <p className="text-gray-600 font-workSans text-sm">
                  No tiene coste.
                </p>
                
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 font-workSans mb-2">
                  ¿Cómo funciona el sistema de leads?
                </h3>
                <p className="text-gray-600 font-workSans text-sm">
                  Los leads se generan a través de nuestro portal principal
                  cuando los usuarios buscan servicios jurídicos. Te notificamos
                  cuando hay leads compatibles con tu especialidad.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-workSans mb-2">
                  ¿Puedo modificar mis datos después del registro?
                </h3>
                <p className="text-gray-600 font-workSans text-sm">
                  Sí, puedes actualizar toda la información de tu despacho desde
                  tu área personal en cualquier momento. Los cambios se
                  sincronizan automáticamente.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 font-workSans mb-2">
                  ¿Qué soporte técnico ofrecen?
                </h3>
                <p className="text-gray-600 font-workSans text-sm">
                  Ofrecemos soporte por email para todos los usuarios y soporte
                  prioritario para clientes de planes premium. También tenemos
                  una base de conocimientos online.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 font-workSans mb-2">
                  ¿Hay compromiso de permanencia?
                </h3>
                <p className="text-gray-600 font-workSans text-sm">
                  No, nuestros planes son flexibles sin compromiso de
                  permanencia. Puedes cancelar o cambiar de plan en cualquier
                  momento.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Final */}
      <section className="bg-primary py-16">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-3xl font-bold text-white font-bigShouldersText mb-4">
            ¿No has encontrado lo que buscas?
          </h2>
          <p className="text-xl text-white/90 font-workSans mb-8">
            Nuestro equipo estará encantado de ayudarte personalmente
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <a
              href="tel:+34649528552"
              className="bg-white text-primary px-8 py-3 rounded-lg font-workSans font-semibold hover:bg-gray-100 transition-colors text-center"
            >
              📞 Llamar Ahora
            </a>
            <a
              href="#formulario-contacto"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-workSans font-semibold hover:bg-white hover:text-primary transition-colors text-center"
            >
              📝 Formulario de Contacto
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
