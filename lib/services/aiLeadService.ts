/**
 * Servicio de IA para procesar leads
 * Usa OpenAI para generar resúmenes anónimos y análisis de leads
 */

import OpenAI from "openai";

// Cliente de OpenAI (lazy initialization)
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export interface LeadData {
  nombre: string;
  correo: string;
  telefono?: string;
  cuerpoMensaje: string;
  urlPagina: string;
  tituloPost: string;
  ciudad?: string;
  provincia?: string;
}

export interface LeadAnalysis {
  resumen: string;
  especialidad: string;
  urgencia: "baja" | "media" | "alta" | "urgente";
  precioEstimado: number;
  puntuacionCalidad: number;
  nivelDetalle: "bajo" | "medio" | "alto";
  palabrasClave: string[];
  idioma: string;
  sentimiento: "positivo" | "neutro" | "negativo";
  ciudad?: string;
  provincia?: string;
}

export class AILeadService {
  /**
   * Procesa un lead y genera análisis completo con IA
   */
  static async processLead(leadData: LeadData): Promise<LeadAnalysis> {
    try {
      // Prompt actualizado con información de ubicación
      const prompt = this.buildPrompt(leadData);

      const completion = await getOpenAIClient().chat.completions.create({
        model: "gpt-4o-mini", // Más económico y rápido
        messages: [
          {
            role: "system",
            content: `Eres un asistente experto en analizar consultas legales en España. 
Tu tarea es analizar consultas de clientes potenciales y generar:
1. Un resumen ANÓNIMO (sin nombres, emails, teléfonos)
2. Clasificación de la consulta
3. Estimación de valor
4. Extracción de ubicación (Ciudad/Provincia)

IMPORTANTE: El resumen debe ser útil para abogados pero NO debe incluir datos personales.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Más determinista
      });

      const response = completion.choices[0].message.content;
      if (!response) {
        throw new Error("No se recibió respuesta de OpenAI");
      }

      const analysis = JSON.parse(response);

      // Si tenemos ubicación explícita en leadData, la usamos preferentemente
      if (leadData.ciudad) analysis.ciudad = leadData.ciudad;
      if (leadData.provincia) analysis.provincia = leadData.provincia;

      // Validar y normalizar respuesta
      return this.normalizeAnalysis(analysis);
    } catch (error) {
      console.error("Error procesando lead con IA:", error);
      
      // Fallback seguro en caso de error
      return {
        resumen: "Error al procesar con IA. Revise el mensaje original.",
        especialidad: "Derecho General",
        urgencia: "media",
        precioEstimado: 50,
        puntuacionCalidad: 50,
        nivelDetalle: "medio",
        palabrasClave: [],
        idioma: "es",
        sentimiento: "neutro",
        ciudad: leadData.ciudad,
        provincia: leadData.provincia,
      };
    }
  }

  /**
   * Construye el prompt para OpenAI
   */
  private static buildPrompt(leadData: LeadData): string {
    let ubicacionContexto = "";
    if (leadData.ciudad || leadData.provincia) {
      ubicacionContexto = `UBICACIÓN DETECTADA AUTOMÁTICAMENTE:\n- Ciudad: ${leadData.ciudad || "No especificada"}\n- Provincia: ${leadData.provincia || "No especificada"}`;
    }

    return `Analiza la siguiente consulta legal y devuelve un JSON con el análisis:

CONSULTA:
"${leadData.cuerpoMensaje}"

CONTEXTO:
- Página de origen: ${leadData.tituloPost}
- URL: ${leadData.urlPagina}
${ubicacionContexto}

INSTRUCCIONES:
Devuelve un JSON con esta estructura exacta:
{
  "resumen": "Resumen anónimo de la consulta (2-3 frases, SIN nombres ni datos personales)",
  "especialidad": "Área de derecho (ej: Laboral, Civil, Penal, Mercantil, etc.)",
  "provincia": "Provincia mencionada o la detectada en el contexto",
  "ciudad": "Ciudad mencionada o la detectada en el contexto",
  "urgencia": "baja|media|alta|urgente",
  "precioEstimado": 100,
  "palabrasClave": ["palabra1", "palabra2", "palabra3"],
  "puntuacionCalidad": 85,
  "nivelDetalle": "bajo|medio|alto",
  "idioma": "es",
  "sentimiento": "positivo|neutro|negativo"
}

CRITERIOS DE PRECIO:
- Consultas simples: 50-100€
- Consultas estándar: 100-300€
- Casos complejos: 300-1000€
- Casos muy complejos: 1000€+

Responde SOLO con el JSON, sin texto adicional.`;
  }

  /**
   * Normaliza y valida la respuesta de la IA
   */
  private static normalizeAnalysis(analysis: any): LeadAnalysis {
    const normalized: LeadAnalysis = {
      // Aceptamos resumen o resumenIA por compatibilidad
      resumen: analysis.resumen || analysis.resumenIA || "Análisis no disponible",
      especialidad: analysis.especialidad || "Derecho General",
      urgencia: ["baja", "media", "alta", "urgente"].includes(analysis.urgencia)
        ? analysis.urgencia
        : "media",
      precioEstimado: Number(analysis.precioEstimado) || 50,
      puntuacionCalidad: Number(analysis.puntuacionCalidad) || 50,
      nivelDetalle: ["bajo", "medio", "alto"].includes(analysis.nivelDetalle)
        ? analysis.nivelDetalle
        : "medio",
      palabrasClave: Array.isArray(analysis.palabrasClave)
        ? analysis.palabrasClave
        : [],
      idioma: analysis.idioma || "es",
      sentimiento: ["positivo", "neutro", "negativo"].includes(analysis.sentimiento)
        ? analysis.sentimiento
        : "neutro",
      ciudad: analysis.ciudad,
      provincia: analysis.provincia,
    };

    return normalized;
  }

  /**
   * Genera un resumen rápido para mostrar en listas
   */
  static async generateQuickSummary(mensaje: string): Promise<string> {
    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Eres un asistente legal. Genera un resumen de una sola frase (máximo 15 palabras) del problema legal.",
          },
          {
            role: "user",
            content: mensaje,
          },
        ],
        max_tokens: 50,
      });

      return (
        response.choices[0].message.content || "Sin resumen disponible"
      );
    } catch (error) {
      console.error("Error generando resumen rápido:", error);
      return mensaje.substring(0, 100) + "...";
    }
  }

  static meetsQualityStandards(analysis: LeadAnalysis): boolean {
    return analysis.puntuacionCalidad >= 30 && analysis.resumen.length > 10;
  }

  static calculateBasePrice(analysis: LeadAnalysis): number {
    let basePrice = 10; // Precio mínimo

    // Factor urgencia
    switch (analysis.urgencia) {
      case "urgente":
        basePrice += 40;
        break;
      case "alta":
        basePrice += 25;
        break;
      case "media":
        basePrice += 10;
        break;
    }

    // Factor especialidad (ejemplo simplificado)
    const especialidadesCaras = ["Penal", "Fiscal", "Mercantil"];
    if (
      especialidadesCaras.some((e) =>
        analysis.especialidad.toLowerCase().includes(e.toLowerCase())
      )
    ) {
      basePrice += 20;
    }

    // Factor calidad
    if (analysis.puntuacionCalidad > 80) basePrice += 20;
    else if (analysis.puntuacionCalidad > 60) basePrice += 10;

    return Math.min(Math.max(basePrice, 15), 150); // Mínimo 15€, Máximo 150€
  }
}
