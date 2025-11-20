/**
 * Servicio de IA para procesar leads
 * Usa OpenAI para generar resúmenes anónimos y análisis de leads
 */

import OpenAI from "openai";

// Inicializar cliente de OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface LeadData {
  nombre: string;
  correo: string;
  telefono?: string;
  cuerpoMensaje: string;
  urlPagina: string;
  tituloPost: string;
}

export interface LeadAnalysis {
  resumenIA: string;
  especialidad: string;
  provincia?: string;
  ciudad?: string;
  urgencia: "baja" | "media" | "alta" | "urgente";
  precioEstimado: number;
  palabrasClave: string[];
  puntuacionCalidad: number; // 1-100
  nivelDetalle: "bajo" | "medio" | "alto";
}

export class AILeadService {
  /**
   * Procesa un lead y genera análisis completo con IA
   */
  static async processLead(leadData: LeadData): Promise<LeadAnalysis> {
    try {
      const prompt = this.buildPrompt(leadData);

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Más económico y rápido
        messages: [
          {
            role: "system",
            content: `Eres un asistente experto en analizar consultas legales en España. 
Tu tarea es analizar consultas de clientes potenciales y generar:
1. Un resumen ANÓNIMO (sin nombres, emails, teléfonos)
2. Clasificación de la consulta
3. Estimación de valor

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

      // Validar y normalizar respuesta
      return this.normalizeAnalysis(analysis);
    } catch (error) {
      console.error("Error procesando lead con IA:", error);
      throw error;
    }
  }

  /**
   * Construye el prompt para OpenAI
   */
  private static buildPrompt(leadData: LeadData): string {
    return `Analiza la siguiente consulta legal y devuelve un JSON con el análisis:

CONSULTA:
"${leadData.cuerpoMensaje}"

CONTEXTO:
- Página de origen: ${leadData.tituloPost}
- URL: ${leadData.urlPagina}

INSTRUCCIONES:
Devuelve un JSON con esta estructura exacta:
{
  "resumenIA": "Resumen anónimo de la consulta (2-3 frases, SIN nombres ni datos personales)",
  "especialidad": "Área de derecho (ej: Laboral, Civil, Penal, Mercantil, etc.)",
  "provincia": "Provincia mencionada o null",
  "ciudad": "Ciudad mencionada o null",
  "urgencia": "baja|media|alta|urgente",
  "precioEstimado": 100,
  "palabrasClave": ["palabra1", "palabra2", "palabra3"],
  "puntuacionCalidad": 85,
  "nivelDetalle": "bajo|medio|alto",
  "razonamiento": "Breve explicación de la puntuación"
}

CRITERIOS DE CALIDAD (1-100):
- 90-100: Consulta muy detallada, urgente, con presupuesto claro
- 70-89: Consulta clara con contexto suficiente
- 50-69: Consulta básica pero válida
- 30-49: Consulta vaga o poco detallada
- 1-29: Consulta muy pobre o spam

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
    // Valores por defecto
    const defaults: LeadAnalysis = {
      resumenIA: "Consulta legal pendiente de análisis",
      especialidad: "General",
      provincia: undefined,
      ciudad: undefined,
      urgencia: "media",
      precioEstimado: 100,
      palabrasClave: [],
      puntuacionCalidad: 50,
      nivelDetalle: "medio",
    };

    // Validar urgencia
    const urgenciaValida = ["baja", "media", "alta", "urgente"];
    if (!urgenciaValida.includes(analysis.urgencia)) {
      analysis.urgencia = "media";
    }

    // Validar nivel detalle
    const nivelValido = ["bajo", "medio", "alto"];
    if (!nivelValido.includes(analysis.nivelDetalle)) {
      analysis.nivelDetalle = "medio";
    }

    // Validar puntuación (1-100)
    if (
      typeof analysis.puntuacionCalidad !== "number" ||
      analysis.puntuacionCalidad < 1 ||
      analysis.puntuacionCalidad > 100
    ) {
      analysis.puntuacionCalidad = 50;
    }

    // Validar precio
    if (
      typeof analysis.precioEstimado !== "number" ||
      analysis.precioEstimado < 0
    ) {
      analysis.precioEstimado = 100;
    }

    // Asegurar que palabras clave es un array
    if (!Array.isArray(analysis.palabrasClave)) {
      analysis.palabrasClave = [];
    }

    return {
      ...defaults,
      ...analysis,
    };
  }

  /**
   * Genera un resumen rápido sin análisis completo (para testing)
   */
  static async generateQuickSummary(mensaje: string): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Genera un resumen breve y anónimo de esta consulta legal. NO incluyas nombres ni datos personales. Máximo 2 frases.",
          },
          {
            role: "user",
            content: mensaje,
          },
        ],
        max_tokens: 150,
        temperature: 0.3,
      });

      return (
        completion.choices[0].message.content ||
        "Consulta legal pendiente de análisis"
      );
    } catch (error) {
      console.error("Error generando resumen rápido:", error);
      return "Consulta legal pendiente de análisis";
    }
  }

  /**
   * Calcula el precio base para subasta basado en el análisis
   */
  static calculateBasePrice(analysis: LeadAnalysis): number {
    let basePrice = analysis.precioEstimado * 0.1; // 10% del precio estimado

    // Ajustar por calidad
    if (analysis.puntuacionCalidad >= 80) {
      basePrice *= 1.5;
    } else if (analysis.puntuacionCalidad >= 60) {
      basePrice *= 1.2;
    } else if (analysis.puntuacionCalidad < 40) {
      basePrice *= 0.7;
    }

    // Ajustar por urgencia
    if (analysis.urgencia === "urgente") {
      basePrice *= 1.3;
    } else if (analysis.urgencia === "alta") {
      basePrice *= 1.15;
    }

    // Redondear a múltiplo de 5
    return Math.round(basePrice / 5) * 5;
  }

  /**
   * Verifica si un lead cumple los criterios mínimos de calidad
   */
  static meetsQualityStandards(analysis: LeadAnalysis): boolean {
    // Rechazar leads con puntuación muy baja
    if (analysis.puntuacionCalidad < 30) {
      return false;
    }

    // Rechazar leads sin especialidad clara
    if (!analysis.especialidad || analysis.especialidad === "General") {
      return false;
    }

    // Rechazar resúmenes muy cortos (probable spam)
    if (analysis.resumenIA.length < 50) {
      return false;
    }

    return true;
  }
}
