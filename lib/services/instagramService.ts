// Servicio para integración con Instagram Graph API
interface InstagramMedia {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  like_count?: number;
  comments_count?: number;
  timestamp: string;
}

interface InstagramResponse {
  data: InstagramMedia[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

export class InstagramService {
  private accessToken: string;
  private userId: string;

  constructor() {
    this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || "";
    this.userId = process.env.INSTAGRAM_USER_ID || "";
  }

  /**
   * Obtener posts recientes de Instagram
   */
  async getRecentMedia(limit: number = 50): Promise<InstagramMedia[]> {
    if (!this.accessToken || !this.userId) {
      throw new Error("Instagram credentials not configured");
    }

    const fields = [
      "id",
      "caption",
      "media_type",
      "media_url",
      "thumbnail_url",
      "permalink",
      "like_count",
      "comments_count",
      "timestamp",
    ].join(",");

    const url = `https://graph.instagram.com/v18.0/${this.userId}/media?fields=${fields}&limit=${limit}&access_token=${this.accessToken}`;

    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Instagram API error: ${JSON.stringify(error)}`);
      }

      const data: InstagramResponse = await response.json();
      
      // Filtrar solo vídeos
      return data.data.filter((media) => media.media_type === "VIDEO");
    } catch (error) {
      console.error("[INSTAGRAM_SERVICE] Error fetching media:", error);
      throw error;
    }
  }

  /**
   * Obtener métricas de un post específico
   */
  async getMediaInsights(mediaId: string): Promise<{ views?: number }> {
    // Nota: Las métricas de vídeo requieren permisos adicionales
    // Por ahora retornamos 0, se puede implementar más adelante
    return { views: 0 };
  }

  /**
   * Detectar categoría basada en caption y hashtags
   */
  detectCategory(caption?: string): string | null {
    if (!caption) return null;

    const lowerCaption = caption.toLowerCase();

    const categories: { [key: string]: string[] } = {
      civil: ["civil", "contrato", "herencia", "propiedad", "divorcio"],
      penal: ["penal", "delito", "condena", "juicio", "sentencia"],
      laboral: ["laboral", "despido", "nómina", "contrato laboral", "trabajador"],
      mercantil: ["mercantil", "empresa", "sociedad", "comercio"],
      familia: ["familia", "custodia", "pensión", "alimentos"],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((keyword) => lowerCaption.includes(keyword))) {
        return category;
      }
    }

    return "general";
  }

  /**
   * Extraer título del caption (primeras palabras)
   */
  extractTitle(caption?: string): string {
    if (!caption) return "Vídeo de Instagram";

    // Quitar hashtags y menciones
    let clean = caption.replace(/#\w+/g, "").replace(/@\w+/g, "").trim();

    // Tomar primeras 100 caracteres
    if (clean.length > 100) {
      clean = clean.substring(0, 97) + "...";
    }

    return clean || "Vídeo de Instagram";
  }
}

export const instagramService = new InstagramService();
