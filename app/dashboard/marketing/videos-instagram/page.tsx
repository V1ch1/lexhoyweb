"use client";

import { useEffect, useState } from "react";
import VideoCard from "@/components/marketing/VideoCard";
import VideoModal from "@/components/marketing/VideoModal";
import { FunnelIcon } from "@heroicons/react/24/outline";

interface InstagramVideo {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  instagram_url?: string;
  views: number;
  likes: number;
  category?: string;
  is_featured: boolean;
}

export default function VideosInstagramPage() {
  const [videos, setVideos] = useState<InstagramVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<InstagramVideo | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { value: "all", label: "Todos" },
    { value: "civil", label: "Derecho Civil" },
    { value: "penal", label: "Derecho Penal" },
    { value: "laboral", label: "Derecho Laboral" },
    { value: "mercantil", label: "Derecho Mercantil" },
    { value: "familia", label: "Derecho de Familia" },
    { value: "general", label: "General" },
  ];

  useEffect(() => {
    loadVideos();
  }, [selectedCategory]);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const url =
        selectedCategory === "all"
          ? "/api/marketing/instagram-videos"
          : `/api/marketing/instagram-videos?category=${selectedCategory}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setVideos(data);
      }
    } catch (error) {
      console.error("Error loading videos:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          🎬 Vídeos de Instagram
        </h1>
        <p className="text-lg text-gray-600">
          Descubre nuestro contenido legal en formato vídeo
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <div className="flex items-center gap-3 flex-wrap">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtrar por:</span>
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat.value
                  ? "bg-purple-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-gray-200 rounded-xl aspect-[9/16] animate-pulse"
            ></div>
          ))}
        </div>
      )}

      {/* Videos Grid */}
      {!loading && videos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              {...video}
              onClick={() => setSelectedVideo(video)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && videos.length === 0 && (
        <div className="text-center py-16">
          <div className="bg-gray-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🎬</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No hay vídeos disponibles
          </h3>
          <p className="text-gray-600">
            {selectedCategory === "all"
              ? "Aún no se han publicado vídeos"
              : "No hay vídeos en esta categoría"}
          </p>
        </div>
      )}

      {/* Video Modal */}
      <VideoModal
        isOpen={!!selectedVideo}
        onClose={() => setSelectedVideo(null)}
        video={selectedVideo}
      />
    </div>
  );
}
