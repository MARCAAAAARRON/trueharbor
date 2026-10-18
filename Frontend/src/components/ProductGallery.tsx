import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import type { Product } from '../types/api';

interface ProductGalleryProps {
  product: Product;
  className?: string;
}

const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  outdoor: '/assets/2016-11-13-01-kjeungskj-r-lighthouse.jpg',
  apparel: '/assets/paphos-cyprus-panoramio-119.jpg',
  home: '/assets/a-coastal-view-with-a-lighthouse.jpg',
  accessories: '/assets/rocks-at-the-lighthouse-biarritz.jpg',
};

export default function ProductGallery({ product, className = '' }: ProductGalleryProps) {
  const catSlug = product.category?.slug || 'outdoor';
  const fallbackAsset = DEFAULT_CATEGORY_IMAGES[catSlug] || '/assets/a-coastal-view-with-a-lighthouse.jpg';

  // Aggregate all gallery images
  const galleryUrls: string[] = [];
  if (product.images && product.images.length > 0) {
    product.images.forEach((img) => {
      if (img.url && !galleryUrls.includes(img.url)) {
        galleryUrls.push(img.url);
      }
    });
  }
  if (product.image_path && !galleryUrls.includes(product.image_path)) {
    galleryUrls.unshift(product.image_path);
  } else if (product.image_url && !galleryUrls.includes(product.image_url)) {
    galleryUrls.unshift(product.image_url);
  }

  // If completely empty, use fallback
  const images = galleryUrls.length > 0 ? galleryUrls : [fallbackAsset];

  const [activeIndex, setActiveIndex] = useState(0);
  const [prevProductId, setPrevProductId] = useState(product.id);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset index when product changes
  if (product.id !== prevProductId) {
    setPrevProductId(product.id);
    setActiveIndex(0);
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const activeImage = images[activeIndex] || images[0];

  return (
    <div className={`flex flex-col gap-4 w-full max-w-lg mx-auto ${className}`} data-ui="product-gallery">
      {/* Main Viewport Stage */}
      <div
        ref={containerRef}
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
        className="relative aspect-square w-full bg-white border border-fog rounded-2xl overflow-hidden cursor-crosshair select-none group shadow-sm flex items-center justify-center p-4 sm:p-6"
      >
        <img
          src={activeImage}
          alt={`${product.name} - Angle ${activeIndex + 1}`}
          className={`w-full h-full object-contain object-center transition-transform ${
            isZoomed ? 'scale-225 ease-out' : 'scale-100 duration-200 ease-in-out'
          }`}
          style={
            isZoomed
              ? {
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                }
              : undefined
          }
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = fallbackAsset;
          }}
        />

        {/* Counter Badge */}
        {images.length > 1 && (
          <div className="absolute top-3 right-3 bg-tide/75 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-full tabular-nums pointer-events-none">
            {activeIndex + 1} / {images.length}
          </div>
        )}

        {/* Zoom Hint Indicator */}
        <div
          className={`absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs text-tide text-[11px] font-medium px-2.5 py-1 rounded-md flex items-center gap-1.5 pointer-events-none transition-opacity duration-200 ${
            isZoomed ? 'opacity-0' : 'opacity-80 group-hover:opacity-100'
          }`}
        >
          <ZoomIn className="w-3.5 h-3.5 text-harbor" />
          <span>Hover to magnify</span>
        </div>

        {/* Previous / Next Arrow Controls */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-tide shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-harbor"
              aria-label="Previous photo angle"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-tide shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-harbor"
              aria-label="Next photo angle"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div
          className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none"
          role="tablist"
          aria-label="Product perspective angles"
        >
          {images.map((url, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={`${url}-${idx}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveIndex(idx)}
                onMouseEnter={() => setActiveIndex(idx)}
                className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-150 bg-white p-1 ${
                  isActive
                    ? 'border-harbor ring-2 ring-harbor/25 shadow-sm scale-[1.02]'
                    : 'border-fog hover:border-edge opacity-70 hover:opacity-100'
                }`}
              >
                <img
                  src={url}
                  alt={`Thumbnail ${idx + 1}`}
                  className="w-full h-full object-contain object-center"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = fallbackAsset;
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
