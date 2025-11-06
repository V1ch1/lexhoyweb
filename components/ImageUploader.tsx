"use client";

import { useState, useRef } from "react";
import { PhotoIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabase";

interface ImageUploaderProps {
  onImageUploaded: (url: string) => void;
  currentImageUrl?: string;
  bucketName?: string;
}

export function ImageUploader({
  onImageUploaded,
  currentImageUrl,
  bucketName = "entradas-proyecto",
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(currentImageUrl || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertToWebP = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("No se pudo obtener el contexto del canvas"));
            return;
          }
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error("Error al convertir la imagen"));
              }
            },
            "image/webp",
            0.9 // Calidad 90%
          );
        };
        img.onerror = () => reject(new Error("Error al cargar la imagen"));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Error al leer el archivo"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      setError("Por favor selecciona una imagen válida");
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("La imagen no debe superar los 5MB");
      return;
    }

    setError("");
    setUploading(true);

    try {
      // Convertir a WebP
      const webpBlob = await convertToWebP(file);

      // Generar nombre único
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const fileName = `${timestamp}-${randomString}.webp`;

      // Subir a Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, webpBlob, {
          contentType: "image/webp",
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obtener URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(data.path);

      setPreviewUrl(publicUrl);
      onImageUploaded(publicUrl);
    } catch (err) {
      console.error("Error al subir imagen:", err);
      setError(
        err instanceof Error ? err.message : "Error al subir la imagen"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl("");
    onImageUploaded("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {/* Área de upload */}
      {!previewUrl ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
          {uploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-3"></div>
              <p className="text-sm text-gray-600">
                Convirtiendo a WebP y subiendo...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <PhotoIcon className="h-12 w-12 text-gray-400 mb-3" />
              <p className="text-sm font-medium text-gray-700 mb-1">
                Click para subir una imagen
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF hasta 5MB (se convertirá a WebP)
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Preview de la imagen */
        <div className="relative rounded-lg overflow-hidden border border-gray-300">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-64 object-cover"
          />
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
            <p className="text-white text-sm font-medium">
              Imagen en formato WebP
            </p>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-gray-500">
        La imagen se convertirá automáticamente a formato WebP para optimizar el rendimiento
      </p>
    </div>
  );
}
