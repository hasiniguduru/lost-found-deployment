import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  category?: string;
  className?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  category = 'Campus Item',
  className = 'w-full h-full object-cover',
}) => {
  const [failed, setFailed] = useState(false);

  if (failed || !src || !src.trim()) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-slate-100 text-slate-500 p-4 text-center select-none ${className}`}
      >
        <ImageOff className="w-6 h-6 text-slate-400 mb-1.5 stroke-[1.5]" />
        <span className="text-[11px] font-semibold text-slate-600">No Photo Uploaded</span>
        <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{alt}</span>
        <span className="text-[10px] text-slate-400 mt-0.5">{category}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

