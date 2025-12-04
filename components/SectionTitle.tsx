"use client"; // Necesario porque los contadores usan hooks de estado

import { useEffect, useState } from "react";

export default function SectionTitle() {
  return (
    <section className="w-full py-16 md:py-24 lg:py-32 flex bg-black flex-col items-center text-center px-4 md:px-6">
      <div className="container">
        {/* Texto Principal */}
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white font-playfair">
          ¿Por qué elegir nuestra plataforma?
        </h2>

        {/* Subtítulo */}
        <p className="text-base md:text-lg text-white mt-4 px-4 md:px-0">
          Descubre cómo nuestra plataforma te ayuda a conseguir leads de alta
          calidad y mejorar tus conversiones.
        </p>

        {/* Contadores */}
        <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 w-full">
          <Counter number={2980} label="Leads generados" />
          <Counter number={1200} label="Clientes satisfechos" />
          <Counter number={98} label="Porcentaje de éxito" suffix="%" />
        </div>
      </div>
    </section>
  );
}

// Componente de Contador Animado
function Counter({
  number,
  label,
  suffix = "",
}: {
  number: number;
  label: string;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = number;
    const duration = 2000; // 2 segundos
    const stepTime = Math.abs(Math.floor(duration / end));

    const timer = setInterval(() => {
      start += 1;
      if (start >= end) {
        clearInterval(timer);
        start = end;
      }
      setCount(start);
    }, stepTime);

    return () => clearInterval(timer);
  }, [number]);

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary">
        {count}
        {suffix}
      </h3>
      <p className="text-base md:text-lg text-white font-workSans">{label}</p>
    </div>
  );
}
