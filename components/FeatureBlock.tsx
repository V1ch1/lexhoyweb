import Image from "next/image";
import Link from "next/link";

interface FeatureBlockProps {
  title: string;
  description: string;
  image: string;
  reverse?: boolean; // Si es true, invierte la disposición
}

export default function FeatureBlock({
  title,
  description,
  image,
  reverse,
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
            className="w-full h-[800px] object-cover"
          />
        </div>

        {/* Contenido - Más grande y pegado */}
        <div className="w-full md:w-1/2 flex flex-col justify-center p-16">
          <h3 className="text-4xl font-bold text-text font-bigShouldersText">
            {title}
          </h3>
          <p className="text-xl text-gray-600 font-workSans mt-6">
            {description}
          </p>

          <Link
            href="/contacto"
            className="mt-8 bg-primary text-white px-4 py-2 rounded-lg font-workSans hover:bg-red-600 w-fit"
          >
            Más información
          </Link>
        </div>
      </div>
    </section>
  );
}
