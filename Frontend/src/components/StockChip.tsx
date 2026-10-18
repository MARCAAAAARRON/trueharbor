interface StockChipProps {
  stock?: number;
  inStock?: boolean;
  className?: string;
}

export default function StockChip({ stock, inStock, className = '' }: StockChipProps) {
  // If numeric stock is provided
  if (typeof stock === 'number') {
    if (stock <= 0) {
      return (
        <span className={`inline-flex items-center text-slate text-sm font-medium ${className}`}>
          Out of stock
        </span>
      );
    }

    if (stock <= 5) {
      return (
        <span
          className={`inline-flex items-center bg-lantern text-tide px-2 py-0.5 rounded-sm text-xs font-semibold ${className}`}
        >
          Only {stock} left
        </span>
      );
    }

    return (
      <span className={`inline-flex items-center gap-1.5 text-sea text-sm font-medium ${className}`}>
        <span className="w-2 h-2 rounded-full bg-sea flex-shrink-0" aria-hidden="true" />
        In stock
      </span>
    );
  }

  // Fallback to inStock boolean
  if (inStock === false) {
    return (
      <span className={`inline-flex items-center text-slate text-sm font-medium ${className}`}>
        Out of stock
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-sea text-sm font-medium ${className}`}>
      <span className="w-2 h-2 rounded-full bg-sea flex-shrink-0" aria-hidden="true" />
      In stock
    </span>
  );
}
