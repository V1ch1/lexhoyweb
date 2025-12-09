import { useState } from "react";
import { PlayIcon, HeartIcon, EyeIcon, ShareIcon } from "@heroicons/react/24/outline";

interface VideoCardProps {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  video_url: string;
  instagram_url?: string;
  views: number;
  likes: number;
  category?: string;
  onClick: () => void;
}

export default function VideoCard({
  title,
  description,
  thumbnail_url,
  instagram_url,
  views,
  likes,
  category,
  onClick,
}: VideoCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div
      onClick={onClick}
      className="group relative bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative aspect-[9/16] bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
        {thumbnail_url && !imageError ? (
          <img
            src={thumbnail_url}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PlayIcon className="h-20 w-20 text-purple-400" />
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-white/90 rounded-full p-4">
            <PlayIcon className="h-12 w-12 text-purple-600" />
          </div>
        </div>

        {/* Category badge */}
        {category && (
          <div className="absolute top-3 left-3">
            <span className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full font-medium">
              {category}
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
          {title}
        </h3>

        {description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <EyeIcon className="h-4 w-4" />
              <span>{views.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <HeartIcon className="h-4 w-4 text-red-500" />
              <span>{likes.toLocaleString()}</span>
            </div>
          </div>

          {instagram_url && (
            <a
              href={instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-purple-600 hover:text-purple-700"
            >
              <ShareIcon className="h-5 w-5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
