import Image from "next/image";
import Link from "next/link";

interface FeatureBlockProps {
  title: string;
  description: string;
  image: string;
  reverse?: boolean; // Si es true, invierte la disposición
  features?: string[]; // Lista de características
  buttonText?: string; // Texto personalizado del botón
  buttonLink?: string; // Link personalizado del botón
  children?: React.ReactNode; // Contenido personalizado adicional
}

export default function FeatureBlock({
  title,
  description,
  image,
  reverse,
  features,
  buttonText = "Más información",
  buttonLink = "/contacto",
  children,
}: FeatureBlockProps) {
  return (
    <section className="w-full flex justify-center relative">
      <div
        className={`w-full flex flex-col md:flex-row items-center ${
          reverse ? "md:flex-row-reverse" : ""
        }`}
      >
        {/* Imagen - Asegurar que ocupa toda la mitad */}
        <div className="w-full md:w-1/2 relative">
          <Image
            src={image}
            alt={title}
            width={1200} // Imagen más grande
            height={800}
            className="w-full h-[300px] md:h-[500px] lg:h-[700px] object-cover"
          />
        </div>

        {/* Contenido - Más grande y pegado */}
        <div className="w-full md:w-1/2 flex flex-col justify-center p-6 md:p-12 lg:p-16">
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-text font-bigShouldersText mb-4 md:mb-6">
            {title}
          </h3>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 font-workSans mb-4 md:mb-6">
            {description}
          </p>

          {/* Lista de características si se proporciona */}
          {features && features.length > 0 && (
            <ul className="space-y-2 md:space-y-3 mb-4 md:mb-6">
              {features.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-center text-sm md:text-base text-gray-600 font-workSans"
                >
                  <span className="text-green-500 mr-2 md:mr-3 text-lg md:text-xl">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          )}

          {/* Contenido personalizado */}
          {children}

          <Link
            href={buttonLink}
            className="mt-6 md:mt-8 bg-primary text-white px-6 py-3 rounded-lg font-workSans hover:bg-red-600 w-fit transition-colors text-sm md:text-base"
          >
            {buttonText}
          </Link>
        </div>
      </div>
    </section>
  );
}
