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
            className="w-full h-[600px] md:h-[700px] object-cover"
          />
        </div>

        {/* Contenido - Más grande y pegado */}
        <div className="w-full md:w-1/2 flex flex-col justify-center p-8 md:p-16">
          <h3 className="text-3xl md:text-4xl font-bold text-text font-bigShouldersText mb-6">
            {title}
          </h3>
          <p className="text-lg md:text-xl text-gray-600 font-workSans mb-6">
            {description}
          </p>

          {/* Lista de características si se proporciona */}
          {features && features.length > 0 && (
            <ul className="space-y-3 mb-6">
              {features.map((feature, index) => (
                <li
                  key={index}
                  className="flex items-center text-gray-600 font-workSans"
                >
                  <span className="text-green-500 mr-3 text-xl">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
          )}

          {/* Contenido personalizado */}
          {children}

          <Link
            href={buttonLink}
            className="mt-8 bg-primary text-white px-6 py-3 rounded-lg font-workSans hover:bg-red-600 w-fit transition-colors"
          >
            {buttonText}
          </Link>
        </div>
      </div>
    </section>
  );
}
