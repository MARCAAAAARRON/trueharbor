import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { Product } from '../types/api';
import { formatPrice } from '../utils/format';
import StockChip from './StockChip';

interface ProductCardProps {
  product: Product;
  className?: string;
}

const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  outdoor: '/assets/2016-11-13-01-kjeungskj-r-lighthouse.jpg',
  apparel: '/assets/paphos-cyprus-panoramio-119.jpg',
  home: '/assets/a-coastal-view-with-a-lighthouse.jpg',
  accessories: '/assets/rocks-at-the-lighthouse-biarritz.jpg',
};

export default function ProductCard({ product, className = '' }: ProductCardProps) {
  const catSlug = product.category?.slug || 'outdoor';
  const fallbackAsset = DEFAULT_CATEGORY_IMAGES[catSlug] || '/assets/a-coastal-view-with-a-lighthouse.jpg';
  const imageUrl = product.image_url || product.image_path || fallbackAsset;

  return (
    <Link
      to={`/products/${product.slug}`}
      className={`group flex flex-col bg-white rounded-lg overflow-hidden transition-colors ${className}`}
    >
      {/* 1:1 Image Container */}
      <div className="relative aspect-square w-full bg-mist flex items-center justify-center overflow-hidden">
        <img
          src={imageUrl}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-200"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = fallbackAsset;
          }}
        />
      </div>

      {/* Info Footer */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-3">
        <div>
          {product.category && (
            <span className="text-sm text-slate block mb-1">
              {product.category.name}
            </span>
          )}
          <h3 className="font-display font-medium text-base text-tide group-hover:text-harbor transition-colors line-clamp-2 leading-snug">
            {product.name}
          </h3>

          {product.reviews_count && product.reviews_count > 0 ? (
            <div className="flex items-center gap-1 mt-1.5 text-xs text-slate">
              <Star size={13} className="text-amber-400 fill-amber-400" />
              <span className="font-semibold text-deep">
                {(product.average_rating ?? 0).toFixed(1)}
              </span>
              <span className="text-[11px] text-slate/75">({product.reviews_count})</span>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="font-display font-semibold text-base text-tide tabular-nums">
            {product.formatted_price ?? formatPrice(product.price_cents)}
          </span>
          <StockChip stock={product.stock} inStock={product.in_stock} />
        </div>
      </div>
    </Link>
  );
}
