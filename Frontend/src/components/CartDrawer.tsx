import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, ShieldCheck } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { formatPrice } from '../utils/format';
import Button from './Button';

const FREE_SHIPPING_THRESHOLD_CENTS = 250000; // ₱2,500.00

export default function CartDrawer() {
  const {
    cart,
    isOpen,
    closeCart,
    itemCount,
    subtotalCents,
    formattedSubtotal,
    updateQuantity,
    removeFromCart,
    loading,
  } = useCart();

  const navigate = useNavigate();

  // Close drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeCart]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const items = cart?.items || [];
  const progressPercent = Math.min(100, Math.round((subtotalCents / FREE_SHIPPING_THRESHOLD_CENTS) * 100));
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents);

  const handleCheckoutClick = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Shopping Cart">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-tide/50 transition-opacity"
        onClick={closeCart}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white flex flex-col">
          {/* Drawer Header */}
          <div className="p-5 flex items-center justify-between bg-mist/80">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-harbor" />
              <h2 className="text-base font-display font-semibold text-tide">
                Your Bag <span className="text-slate font-normal text-sm">({itemCount})</span>
              </h2>
            </div>
            <button
              type="button"
              onClick={closeCart}
              className="p-1.5 rounded-md text-slate hover:text-tide hover:bg-fog/50 transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Meter */}
          <div className="px-5 py-3.5 bg-mist/40">
            {remainingForFreeShipping === 0 ? (
              <p className="text-xs font-semibold text-sea flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sea shrink-0" />
                <span>You've unlocked <strong>FREE Coastal Shipping</strong>!</span>
              </p>
            ) : (
              <p className="text-xs text-slate">
                Add <strong className="text-tide">{formatPrice(remainingForFreeShipping)}</strong> more to get <strong>Free Shipping</strong>
              </p>
            )}
            <div className="mt-2 w-full h-1.5 bg-fog rounded-full overflow-hidden">
              <div
                className={`h-full transition-[width] duration-300 ${
                  remainingForFreeShipping === 0 ? 'bg-sea' : 'bg-harbor'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-mist flex items-center justify-center text-slate mb-4">
                  <ShoppingBag className="w-8 h-8 stroke-1 text-slate" />
                </div>
                <h3 className="text-base font-display font-semibold text-tide mb-1">Your bag is empty</h3>
                <p className="text-xs text-slate max-w-xs mb-6">
                  Explore our handcrafted marine provisions, jackets, and coastal equipment.
                </p>
                <Link to="/products" onClick={closeCart}>
                  <Button variant="primary" className="h-10 px-5 text-sm">
                    Browse Catalog
                  </Button>
                </Link>
              </div>
            ) : (
              items.map((item) => {
                const product = item.product;
                const imageUrl = product.image_url || product.image_path || '/placeholder-product.svg';

                return (
                  <div key={item.id} className="p-3.5 bg-mist/30 rounded-lg flex gap-4">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 bg-white rounded-lg p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/placeholder-product.svg';
                        }}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            to={`/products/${product.slug}`}
                            onClick={closeCart}
                            className="text-sm font-semibold text-tide hover:text-harbor truncate"
                          >
                            {product.name}
                          </Link>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="text-slate hover:text-red-500 p-1 transition-colors"
                            title="Remove item"
                            aria-label={`Remove ${product.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-slate mt-0.5">
                          {formatPrice(product.price_cents)} each
                        </p>
                      </div>

                      {/* Stepper & Line Total */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center rounded-md bg-white">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={loading}
                            className="p-1.5 text-slate hover:text-tide disabled:opacity-30"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-semibold font-display text-tide">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            disabled={loading || Boolean(product.stock && item.quantity >= product.stock)}
                            className="p-1.5 text-slate hover:text-tide disabled:opacity-30"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="text-sm font-semibold font-display text-tide tabular-nums">
                          {item.formatted_line_total || formatPrice(item.line_total_cents)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Drawer Footer */}
          {items.length > 0 && (
            <div className="p-5 bg-mist/70 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate">Subtotal</span>
                  <span className="font-semibold font-display text-tide tabular-nums text-base">
                    {formattedSubtotal}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate">
                  <span>Shipping</span>
                  <span>
                    {subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? (
                      <span className="font-semibold text-sea">FREE</span>
                    ) : (
                      'Calculated at checkout (Flat ₱150)'
                    )}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  variant="primary"
                  onClick={handleCheckoutClick}
                  className="w-full h-11 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <div className="text-center">
                  <Link
                    to="/cart"
                    onClick={closeCart}
                    className="text-xs text-slate hover:text-harbor font-medium underline"
                  >
                    View detailed bag
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
