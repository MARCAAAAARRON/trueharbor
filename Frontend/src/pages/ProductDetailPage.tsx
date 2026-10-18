import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Package,
  ShieldCheck,
  Truck,
  Minus,
  Plus,
  ShoppingBag,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import StockChip from '../components/StockChip';
import { getProduct } from '../api/catalog';
import type { Product } from '../types/api';
import { formatPrice } from '../utils/format';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useToast } from '../context/ToastContext';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const toast = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fetchingSlug, setFetchingSlug] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);
  const [adding, setAdding] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    let mounted = true;

    getProduct(slug)
      .then((data) => {
        if (mounted) {
          setProduct(data);
          setFetchingSlug(slug);
          setQuantity(1);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.response?.status === 404 ? 'Product not found' : 'Failed to load product details');
          setFetchingSlug(slug);
        }
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  const isLoading = !error && (!product || fetchingSlug !== slug);
  const maxQuantity = product?.stock ?? 10;
  const isOutOfStock = product?.stock === 0 || product?.in_stock === false;

  const handleDecrease = () => {
    setQuantity((q) => Math.max(1, q - 1));
  };

  const handleIncrease = () => {
    setQuantity((q) => (maxQuantity ? Math.min(maxQuantity, q + 1) : q + 1));
  };

  const handleAddToCart = async () => {
    if (!product || isOutOfStock) return;
    if (!user) {
      navigate(`/login?redirect=/products/${slug}`);
      return;
    }
    try {
      setAdding(true);
      setCartError(null);
      await addToCart(product.id, quantity);
      setAddedNotice(true);
      toast.success(`Added ${quantity > 1 ? `${quantity}x ` : ''}${product.name} to your gear bag.`);
      setTimeout(() => {
        setAddedNotice(false);
      }, 3500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to add to cart';
      setCartError(msg);
      toast.error(msg);
    } finally {
      setAdding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-svh flex flex-col bg-mist">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse">
            <div className="aspect-square bg-fog/60 rounded-xl" />
            <div className="space-y-6">
              <div className="h-4 bg-fog/60 rounded w-1/4" />
              <div className="h-8 bg-fog/60 rounded w-3/4" />
              <div className="h-6 bg-fog/60 rounded w-1/3" />
              <div className="h-24 bg-fog/60 rounded w-full" />
              <div className="h-12 bg-fog/60 rounded w-1/2" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-svh flex flex-col bg-mist">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-20 text-center flex-1">
          <Package className="w-16 h-16 text-slate mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-tide mb-2">
            {error || 'Product Not Found'}
          </h1>
          <p className="text-slate text-base mb-6">
            The item you are looking for may have been retired or does not exist.
          </p>
          <Link to="/products">
            <Button variant="primary" className="h-10 px-5">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Catalog
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const imageUrl = product.image_url || product.image_path || '/placeholder-product.svg';

  return (
    <div className="min-h-svh flex flex-col bg-mist">
      <Navbar />

      {/* Breadcrumb Bar */}
      <div className="bg-white py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs text-slate">
          <Link to="/" className="hover:text-harbor">
            Home
          </Link>
          <span>/</span>
          <Link to="/products" className="hover:text-harbor">
            Catalog
          </Link>
          {product.category && (
            <>
              <span>/</span>
              <Link to={`/products?category=${product.category.slug}`} className="hover:text-harbor">
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-tide font-medium truncate max-w-xs">{product.name}</span>
        </div>
      </div>

      {/* Main Detail Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          {/* Left Column: Image Stage */}
          <div className="flex flex-col items-center">
            <div className="relative aspect-square w-full max-w-lg bg-white border border-fog rounded-xl overflow-hidden flex items-center justify-center p-6">
              <img
                src={imageUrl}
                alt={product.name}
                className="w-full h-full object-contain object-center"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="%23EEF2F6"><rect width="400" height="400" fill="%23EEF2F6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%23718096">TrueHarbor Visual</text></svg>';
                }}
              />
            </div>
          </div>

          {/* Right Column: Information & Actions */}
          <div className="flex flex-col justify-start space-y-6">
            <div>
              {product.category && (
                <Link
                  to={`/products?category=${product.category.slug}`}
                  className="text-sm font-medium text-harbor hover:underline block mb-2"
                >
                  {product.category.name}
                </Link>
              )}
              <h1 className="text-3xl sm:text-4xl font-display font-bold text-tide leading-tight mb-3">
                {product.name}
              </h1>

              {/* Price & Stock Meter */}
              <div className="flex items-center gap-4 py-3">
                <span className="text-2xl sm:text-3xl font-display font-bold text-tide tabular-nums">
                  {product.formatted_price ?? formatPrice(product.price_cents)}
                </span>
                <StockChip stock={product.stock} inStock={product.in_stock} />
              </div>
            </div>

            {/* Low stock alert callout */}
            {typeof product.stock === 'number' && product.stock > 0 && product.stock <= 5 && (
              <div className="bg-lantern/20 border border-lantern/40 rounded-md p-3 text-sm text-tide flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-lantern flex-shrink-0" />
                <span>
                  <strong>Limited stock:</strong> Only {product.stock} unit{product.stock > 1 ? 's' : ''} left in warehouse.
                </span>
              </div>
            )}

            {/* Description */}
            <div className="prose prose-sm text-slate leading-relaxed">
              <p>{product.description || 'Authentic coastal grade piece, precision-crafted for long-term utility.'}</p>
            </div>

            {/* Purchase Controls */}
            {!isOutOfStock ? (
              <div className="space-y-4 pt-6">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-tide">Quantity:</span>
                  <div className="flex items-center border border-fog rounded-md bg-white">
                    <button
                      type="button"
                      onClick={handleDecrease}
                      disabled={quantity <= 1}
                      className="p-2.5 text-slate hover:text-tide disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center text-sm font-semibold font-display tabular-nums text-tide">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={handleIncrease}
                      disabled={Boolean(product.stock && quantity >= product.stock)}
                      className="p-2.5 text-slate hover:text-tide disabled:opacity-30 disabled:cursor-not-allowed"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {typeof product.stock === 'number' && product.stock > 0 && (
                    <span className="text-xs text-slate">
                      ({product.stock} available)
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    variant="primary"
                    onClick={handleAddToCart}
                    disabled={adding}
                    className="flex-1 h-12 text-base font-medium flex items-center justify-center gap-2"
                  >
                    {adding ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Updating Bag...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-5 h-5" />
                        <span>Add to Cart • {formatPrice(product.price_cents * quantity)}</span>
                      </>
                    )}
                  </Button>
                </div>

                {cartError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{cartError}</span>
                  </div>
                )}

                {addedNotice && (
                  <div className="bg-sea/10 border border-sea/30 text-sea rounded-md p-3 text-sm flex items-center justify-between animate-fade-in">
                    <span className="flex items-center gap-2 font-medium">
                      <Check className="w-4 h-4 text-sea" />
                      Added {quantity} unit{quantity > 1 ? 's' : ''} to your cart.
                    </span>
                    <Link to="/cart" className="underline font-semibold text-xs text-sea">
                      View Cart →
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="pt-6">
                <Button variant="secondary" disabled className="w-full h-12 text-base cursor-not-allowed opacity-60">
                  Currently Out of Stock
                </Button>
                <p className="text-xs text-slate text-center mt-2">
                  Restocking runs on atomic supplier updates. Check back shortly.
                </p>
              </div>
            )}

            {/* Harbor Commitments Rail */}
            <div className="bg-white border border-fog rounded-lg p-4 space-y-3 pt-4 text-xs text-slate">
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-harbor flex-shrink-0" />
                <span>Flat rate nationwide shipping (₱150.00). Free on orders ₱2,500+.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-sea flex-shrink-0" />
                <span>Concurrency-safe reservation: Stock is held at checkout.</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
