"use client";

import { XMarkIcon, HeartIcon, EyeIcon, ShareIcon } from "@heroicons/react/24/outline";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: {
    title: string;
    description?: string;
    video_url: string;
    instagram_url?: string;
    views: number;
    likes: number;
    category?: string;
  } | null;
}

export default function VideoModal({ isOpen, onClose, video }: VideoModalProps) {
  if (!isOpen || !video) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white rounded-full p-2 transition-colors"
        >
          <XMarkIcon className="h-6 w-6 text-gray-700" />
        </button>

        <div className="grid md:grid-cols-2 gap-6 p-6">
          {/* Video */}
          <div className="aspect-[9/16] bg-black rounded-xl overflow-hidden">
            <video
              src={video.video_url}
              controls
              autoPlay
              className="w-full h-full object-contain"
            >
              Tu navegador no soporta el elemento de vídeo.
            </video>
          </div>

          {/* Info */}
          <div className="flex flex-col">
            {/* Category */}
            {video.category && (
              <span className="inline-block bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full font-medium mb-4 w-fit">
                {video.category}
              </span>
            )}

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {video.title}
            </h2>

            {/* Description */}
            {video.description && (
              <p className="text-gray-700 mb-6 leading-relaxed">
                {video.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-6 mb-6">
              <div className="flex items-center gap-2">
                <EyeIcon className="h-5 w-5 text-gray-500" />
                <span className="text-gray-700 font-medium">
                  {video.views.toLocaleString()} vistas
                </span>
              </div>
              <div className="flex items-center gap-2">
                <HeartIcon className="h-5 w-5 text-red-500" />
                <span className="text-gray-700 font-medium">
                  {video.likes.toLocaleString()} me gusta
                </span>
              </div>
            </div>

            {/* Instagram link */}
            {video.instagram_url && (
              <a
                href={video.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all w-fit"
              >
                <ShareIcon className="h-5 w-5" />
                Ver en Instagram
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
