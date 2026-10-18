import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, ArrowRight, Trash2, Plus, Minus, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import { useCart } from '../hooks/useCart';
import { formatPrice } from '../utils/format';

const FREE_SHIPPING_THRESHOLD_CENTS = 250000; // ₱2,500.00
const FLAT_SHIPPING_CENTS = 15000; // ₱150.00

const FEATURED_EMPTY_PROVISIONS = [
  {
    title: 'Harbor Weatherproof Windbreaker',
    category: 'Coastal Apparel',
    price: '₱1,290.00',
    image: '/assets/paphos-cyprus-panoramio-119.jpg',
    slug: 'harbor-windbreaker',
  },
  {
    title: 'Heavyweight Canvas Marine Tote',
    category: 'Provisions Gear',
    price: '₱450.00',
    image: '/assets/a-coastal-view-with-a-lighthouse.jpg',
    slug: 'canvas-tote-bag',
  },
  {
    title: 'Brass Coastal Navigational Compass',
    category: 'Navigation',
    price: '₱890.00',
    image: '/assets/rocks-at-the-lighthouse-biarritz.jpg',
    slug: 'coastal-compass',
  },
  {
    title: 'Kjeungskjær Coastal Signal Lamp',
    category: 'Marine Fixture',
    price: '₱2,100.00',
    image: '/assets/2016-11-13-01-kjeungskj-r-lighthouse.jpg',
    slug: 'signal-lamp',
  },
];

export default function CartPage() {
  const {
    cart,
    loading,
    itemCount,
    subtotalCents,
    formattedSubtotal,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const navigate = useNavigate();

  const items = cart?.items || [];
  const shippingCents = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : (items.length > 0 ? FLAT_SHIPPING_CENTS : 0);
  const totalCents = subtotalCents + shippingCents;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents);
  const progressPercent = Math.min(100, Math.round((subtotalCents / FREE_SHIPPING_THRESHOLD_CENTS) * 100));

  return (
    <div className="min-h-svh flex flex-col bg-mist">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-tide tracking-tight">
              Shopping Bag
            </h1>
            <p className="text-base text-tide/80 mt-1">
              {itemCount > 0
                ? `${itemCount} item${itemCount > 1 ? 's' : ''} in your marine provisions order`
                : 'Your coastal bag is currently empty'}
            </p>
          </div>
          <Link
            to="/products"
            className="hidden sm:flex items-center gap-1.5 text-base font-medium text-harbor hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>

        {items.length === 0 ? (
          /* Empty State */
          <div className="space-y-10 my-4">
            <div className="bg-white rounded-xl p-10 sm:p-12 text-center max-w-xl mx-auto">
              <div className="w-20 h-20 rounded-full bg-mist flex items-center justify-center text-slate mx-auto mb-5">
                <ShoppingBag className="w-10 h-10 stroke-1 text-slate" />
              </div>
              <h2 className="text-xl font-display font-semibold text-tide mb-2">
                Your bag is currently empty
              </h2>
              <p className="text-base text-tide/80 mb-6 max-w-md mx-auto">
                Before you set sail, stock up on weather-resistant coastal apparel, durable gear, and handcrafted provisions.
              </p>
              <Link to="/products">
                <Button variant="primary" className="h-11 px-8 text-sm font-medium">
                  Explore Provisions Catalog
                </Button>
              </Link>
            </div>

            {/* Recommended Provisions */}
            <div>
              <h3 className="text-lg font-display font-semibold text-tide mb-4 text-center">
                Popular Maritime Essentials
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 max-w-5xl mx-auto">
                {FEATURED_EMPTY_PROVISIONS.map((item) => (
                  <Link
                    key={item.slug}
                    to="/products"
                    className="group bg-white rounded-xl overflow-hidden p-3 transition-colors block"
                  >
                    <div className="aspect-square bg-mist rounded-lg overflow-hidden mb-3">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <span className="text-[13px] text-slate">{item.category}</span>
                    <h4 className="text-sm font-semibold text-tide group-hover:text-harbor truncate">
                      {item.title}
                    </h4>
                    <span className="text-sm font-display font-bold text-harbor mt-1 block">
                      {item.price}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Active Cart Grid */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Items Table */}
            <div className="lg:col-span-8 space-y-4">
              {/* Free Shipping Progress Card */}
              <div className="bg-white rounded-xl p-4 sm:p-5">
                <div className="flex items-center justify-between text-xs sm:text-sm font-medium">
                  {remainingForFreeShipping === 0 ? (
                    <span className="text-sea flex items-center gap-1.5 font-semibold">
                      <Truck className="w-4 h-4 text-sea" />
                      Free Coastal Shipping Unlocked!
                    </span>
                  ) : (
                    <span className="text-tide/80">
                      Add <strong className="text-tide">{formatPrice(remainingForFreeShipping)}</strong> more to get <strong>Free Shipping</strong>
                    </span>
                  )}
                  <span className="text-slate text-xs font-semibold">{progressPercent}%</span>
                </div>
                <div className="mt-2.5 w-full h-2 bg-mist rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-[width] duration-300 ${
                      remainingForFreeShipping === 0 ? 'bg-sea' : 'bg-harbor'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Items Card */}
              <div className="bg-white rounded-xl p-4 sm:p-6 space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate pb-2">
                  <span>Product Details</span>
                  <div className="hidden sm:flex items-center gap-16 mr-10">
                    <span>Quantity</span>
                    <span>Line Total</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {items.map((item) => {
                    const product = item.product;
                    const imageUrl = product.image_url || product.image_path || '/placeholder-product.svg';

                    return (
                      <div key={item.id} className="p-4 bg-mist/40 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Product image + title */}
                        <div className="flex items-center gap-4 min-w-0">
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
                          <div className="min-w-0">
                            <Link
                              to={`/products/${product.slug}`}
                              className="text-base font-semibold text-tide hover:text-harbor truncate block"
                            >
                              {product.name}
                            </Link>
                            <p className="text-xs text-slate mt-0.5">
                              Unit Price: {formatPrice(product.price_cents)}
                            </p>
                            {product.category && (
                              <span className="inline-block text-[11px] font-medium bg-white text-slate px-2 py-0.5 rounded mt-1.5">
                                {product.category.name}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quantity Stepper & Price */}
                        <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-12 pt-2 sm:pt-0">
                          <div className="flex items-center rounded-md bg-white">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={loading}
                              className="p-2 text-slate hover:text-tide disabled:opacity-30 transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-9 text-center text-sm font-semibold font-display text-tide">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={loading || Boolean(product.stock && item.quantity >= product.stock)}
                              className="p-2 text-slate hover:text-tide disabled:opacity-30 transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="text-right min-w-[90px]">
                            <span className="text-base font-semibold font-display text-tide tabular-nums block">
                              {item.formatted_line_total || formatPrice(item.line_total_cents)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="text-slate hover:text-red-500 p-1.5 transition-colors"
                            title="Remove item"
                            aria-label={`Remove ${product.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Cart Action Buttons */}
                <div className="pt-2 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    onClick={clearCart}
                    className="text-xs text-slate hover:text-red-500 h-8 px-2"
                  >
                    Clear Entire Bag
                  </Button>
                  <Link to="/products" className="text-xs font-semibold text-harbor hover:underline sm:hidden">
                    Continue Shopping →
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-white rounded-xl p-6 space-y-5">
                <h2 className="text-base font-display font-semibold text-tide pb-2">
                  Order Summary
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate">Subtotal</span>
                    <span className="font-semibold font-display text-tide tabular-nums">
                      {formattedSubtotal}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate">Estimated Shipping</span>
                    <span className="font-semibold font-display text-tide tabular-nums">
                      {shippingCents === 0 ? (
                        <span className="text-sea font-bold">FREE</span>
                      ) : (
                        formatPrice(shippingCents)
                      )}
                    </span>
                  </div>

                  <div className="p-3 bg-mist/60 rounded-lg flex items-center justify-between">
                    <span className="text-base font-display font-bold text-tide">Estimated Total</span>
                    <span className="text-xl font-display font-bold text-harbor tabular-nums">
                      {formatPrice(totalCents)}
                    </span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  onClick={() => navigate('/checkout')}
                  className="w-full h-12 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>

                {/* Trust Badges */}
                <div className="pt-2 space-y-2.5 text-xs text-slate">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-harbor shrink-0" />
                    <span>256-Bit SSL Encrypted Checkout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-harbor shrink-0" />
                    <span>Dispatch within 24 hours from coastal depot</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-harbor shrink-0" />
                    <span>30-Day TrueHarbor Guarantee</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
