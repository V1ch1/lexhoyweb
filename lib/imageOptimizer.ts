/**
 * Utilidad para optimizar imágenes
 * Redimensiona a 500x500px y convierte a WebP para mejor rendimiento
 */

import { supabase } from "./supabase";

export interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png";
}

export interface OptimizedImage {
  dataUrl: string;
  blob: Blob;
  size: number;
  width: number;
  height: number;
  format: string;
}

export class ImageOptimizer {
  /**
   * Optimiza una imagen para foto de perfil de despacho
   * Tamaño: 500x500px, Formato: WebP, Calidad: 85%
   */
  static async optimizeProfileImage(file: File): Promise<OptimizedImage> {
    return this.optimizeImage(file, {
      maxWidth: 500,
      maxHeight: 500,
      quality: 0.85,
      format: "webp",
    });
  }

  /**
   * Optimiza una imagen con opciones personalizadas
   */
  static async optimizeImage(
    file: File,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizedImage> {
    const {
      maxWidth = 500,
      maxHeight = 500,
      quality = 0.85,
      format = "webp",
    } = options;

    return new Promise((resolve, reject) => {
      // Validar que es una imagen
      if (!file.type.startsWith("image/")) {
        reject(new Error("El archivo debe ser una imagen"));
        return;
      }

      // Validar tamaño máximo (5MB)
      if (file.size > 5 * 1024 * 1024) {
        reject(new Error("La imagen no puede superar los 5MB"));
        return;
      }

      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("No se pudo crear el contexto del canvas"));
        return;
      }

      img.onload = () => {
        try {
          // Calcular dimensiones manteniendo proporción
          const { width: newWidth, height: newHeight } =
            this.calculateDimensions(
              img.width,
              img.height,
              maxWidth,
              maxHeight
            );

          // Configurar canvas
          canvas.width = newWidth;
          canvas.height = newHeight;

          // Limpiar canvas con fondo blanco para WebP
          if (format === "webp") {
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, newWidth, newHeight);
          }

          // Dibujar imagen redimensionada con suavizado
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, newWidth, newHeight);

          // Convertir a blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Error al procesar la imagen"));
                return;
              }

              // Crear data URL
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  dataUrl: reader.result as string,
                  blob,
                  size: blob.size,
                  width: newWidth,
                  height: newHeight,
                  format: blob.type,
                });
              };
              reader.onerror = () =>
                reject(new Error("Error al leer la imagen optimizada"));
              reader.readAsDataURL(blob);
            },
            `image/${format}`,
            quality
          );
        } catch (error) {
          reject(new Error(`Error al procesar la imagen: ${error}`));
        }
      };

      img.onerror = () => reject(new Error("Error al cargar la imagen"));

      // Cargar imagen
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Error al leer el archivo"));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Calcula las dimensiones manteniendo la proporción
   */
  private static calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    // Siempre mantener la proporción original
    const ratio = Math.min(
      maxWidth / originalWidth,
      maxHeight / originalHeight
    );

    return {
      width: Math.round(originalWidth * ratio),
      height: Math.round(originalHeight * ratio),
    };
  }

  /**
   * Valida si una imagen cumple con los requisitos
   */
  static validateImage(file: File): { valid: boolean; error?: string } {
    // Validar tipo
    if (!file.type.startsWith("image/")) {
      return { valid: false, error: "El archivo debe ser una imagen" };
    }

    // Validar tamaño
    if (file.size > 5 * 1024 * 1024) {
      return { valid: false, error: "La imagen no puede superar los 5MB" };
    }

    // Validar formatos soportados
    const supportedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!supportedTypes.includes(file.type)) {
      return {
        valid: false,
        error: "Formato no soportado. Use JPG, PNG, GIF o WebP",
      };
    }

    return { valid: true };
  }

  /**
   * Obtiene información de una imagen
   */
  static async getImageInfo(file: File): Promise<{
    width: number;
    height: number;
    size: number;
    type: string;
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          size: file.size,
          type: file.type,
        });
      };

      img.onerror = () => reject(new Error("Error al cargar la imagen"));

      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Error al leer el archivo"));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Formatea el tamaño de archivo en formato legible
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Optimiza y sube una imagen a Supabase Storage
   * Retorna la URL pública de la imagen
   */
  static async uploadToSupabase(
    file: File,
    options: {
      bucket?: string;
      path?: string;
      despachoId?: string;
    } = {}
  ): Promise<{ url: string; size: number }> {
    const {
      bucket = "despachos-fotos",
      path = "perfiles",
      despachoId,
    } = options;

    try {
      // Optimizar la imagen primero
      const optimized = await this.optimizeProfileImage(file);

      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const fileName = despachoId
        ? `${path}/${despachoId}-${timestamp}.webp`
        : `${path}/${timestamp}-${random}.webp`;

      // Convertir blob a ArrayBuffer para subirlo correctamente
      const arrayBuffer = await optimized.blob.arrayBuffer();

      // Subir a Supabase Storage usando ArrayBuffer
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, arrayBuffer, {
          contentType: "image/webp",
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        console.error("❌ Error al subir imagen a Supabase:", error);
        throw new Error(`Error al subir imagen: ${error.message}`);
      }

      // Obtener URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(fileName);

      console.log("✅ Imagen subida a Supabase:", {
        url: publicUrl,
        size: this.formatFileSize(optimized.size),
        dimensions: `${optimized.width}x${optimized.height}px`,
      });

      return {
        url: publicUrl,
        size: optimized.size,
      };
    } catch (error) {
      console.error("❌ Error en uploadToSupabase:", error);
      throw error;
    }
  }

  /**
   * Elimina una imagen de Supabase Storage
   */
  static async deleteFromSupabase(
    url: string,
    bucket: string = "despachos-fotos"
  ): Promise<boolean> {
    try {
      // Extraer el path del archivo desde la URL
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split(
        `/storage/v1/object/public/${bucket}/`
      );

      if (pathParts.length < 2) {
        console.warn("⚠️ URL no válida para eliminar:", url);
        return false;
      }

      const filePath = pathParts[1];

      const { error } = await supabase.storage.from(bucket).remove([filePath]);

      if (error) {
        console.error("❌ Error al eliminar imagen:", error);
        return false;
      }

      console.log("✅ Imagen eliminada de Supabase:", filePath);
      return true;
    } catch (error) {
      console.error("❌ Error en deleteFromSupabase:", error);
      return false;
    }
  }
}
