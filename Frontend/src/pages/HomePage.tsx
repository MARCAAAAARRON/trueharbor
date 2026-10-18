import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Compass, ShieldCheck, Zap } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import StripeDivider from '../components/StripeDivider';
import ProductCard from '../components/ProductCard';
import { getCategories, getProducts } from '../api/catalog';
import type { Category, Product } from '../types/api';

const DEPARTMENT_ASSETS: Record<string, { image: string; alt: string }> = {
  accessories: {
    image: '/images/categories/accessories.png',
    alt: 'TrueHarbor Coastal Accessories and Caps',
  },
  apparel: {
    image: '/images/categories/apparel.png',
    alt: 'TrueHarbor Marine Apparel and Outerwear',
  },
  home: {
    image: '/images/categories/home.png',
    alt: 'TrueHarbor Coastal Home Utility and Lamps',
  },
  outdoor: {
    image: '/images/categories/outdoor.png',
    alt: 'TrueHarbor Marine Outdoor and Boating Gear',
  },
};

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [cats, prods] = await Promise.all([
          getCategories().catch(() => []),
          getProducts({ per_page: 8, sort: 'newest' }).catch(() => null),
        ]);
        if (mounted) {
          setCategories(cats);
          setFeaturedProducts(prods ? prods.data : []);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-svh flex flex-col bg-mist overflow-x-clip">
      <Navbar />

      {/* Hero Banner with authentic Lighthouse Photography & Coastal Atmospheric Overlay */}
      <section className="relative text-white px-6 py-16 sm:py-24 lg:py-28 overflow-hidden bg-harbor dark:bg-[#070e1b]">
        {/* Photographic Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/lighthouse.jpeg"
            alt="TrueHarbor Coastal Lighthouse"
            className="w-full h-full object-cover object-[75%_center] sm:object-right select-none opacity-90"
          />
          {/* Gradient Scrim: Deep harbor blue fading from solid/high-opacity on left to translucent on right */}
          <div className="absolute inset-0 bg-gradient-to-r from-harbor/95 via-harbor/85 to-harbor/30 sm:to-transparent dark:from-[#070e1b]/95 dark:via-[#070e1b]/85 dark:to-[#070e1b]/35" />
          {/* Subtle bottom vignette to blend into next section */}
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-harbor/40 dark:from-[#070e1b]/60 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="w-full lg:max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/15 dark:bg-white/10 backdrop-blur-md rounded-full text-xs sm:text-sm font-semibold text-white mb-6 animate-enter-1 shadow-xs border border-white/20">
              <span className="w-2 h-2 rounded-full bg-lantern animate-pulse" />
              <span>Coastal-Grade Essentials • Real-Time Inventory</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-6 leading-tight tracking-tight max-w-lg animate-enter-2 drop-shadow-sm">
              Everyday things,<br className="hidden sm:inline" /> found easily.
            </h1>

            <p className="text-mist/95 dark:text-slate-200 text-base sm:text-lg mb-8 max-w-lg leading-relaxed animate-enter-3 drop-shadow-2xs">
              Curated essentials with honest stock counts, precision pricing, and instant checkout dispatch.
            </p>

            <div className="flex flex-wrap items-center gap-4 animate-enter-4">
              <Link to="/products">
                <Button variant="on-blue" className="h-12 px-6 text-base font-semibold shadow-md">
                  Explore Catalog
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/products?category=outdoor">
                <span className="text-base font-medium text-white/95 hover:text-white underline underline-offset-4 decoration-lantern decoration-2">
                  View Outdoor Gear →
                </span>
              </Link>
            </div>
          </div>

          {/* Right Stage: Visual breathing room letting the photographic lighthouse shine */}
          <div className="hidden lg:block w-72 h-48 pointer-events-none" aria-hidden="true" />
        </div>
      </section>

      <StripeDivider />

      {/* Category Fast Lanes with Authentic Photography */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-tide">
              Shop by Department
            </h2>
            <p className="text-base text-tide/80 mt-1">
              Archival coastal gear, apparel, and home utility.
            </p>
          </div>
          <Link
            to="/products"
            className="text-base font-medium text-harbor hover:underline flex items-center gap-1"
          >
            All departments <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {(categories.length > 0
            ? categories
            : [
                { id: 4, name: 'Accessories', slug: 'accessories' },
                { id: 2, name: 'Apparel', slug: 'apparel' },
                { id: 3, name: 'Home', slug: 'home' },
                { id: 1, name: 'Outdoor', slug: 'outdoor' },
              ]
          ).map((cat, idx) => {
            const asset = DEPARTMENT_ASSETS[cat.slug] || DEPARTMENT_ASSETS.accessories;
            return (
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                className={`group flex flex-col bg-white rounded-xl border border-fog/70 dark:border-white/10 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-1 animate-enter-${(idx % 4) + 1}`}
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-gradient-to-b from-mist/70 to-mist/30 dark:from-white/5 dark:to-transparent relative flex items-center justify-center p-6">
                  <img
                    src={asset.image}
                    alt={asset.alt}
                    className="w-full h-full max-h-36 object-contain group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300 drop-shadow-md select-none"
                    loading="lazy"
                  />
                </div>
                <div className="p-5 flex items-center justify-between border-t border-fog/40 dark:border-white/5">
                  <div>
                    <h3 className="font-display font-semibold text-lg text-tide group-hover:text-harbor transition-colors">
                      {cat.name}
                    </h3>
                    <span className="text-sm text-slate mt-0.5 block">Explore collection</span>
                  </div>
                  <span className="text-sm font-semibold text-harbor group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured / New Arrivals Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-tide">
              Recent Arrivals
            </h2>
            <p className="text-base text-tide/80 mt-1">
              Fresh additions inspected and verified in warehouse stock.
            </p>
          </div>
          <Link
            to="/products"
            className="text-base font-medium text-harbor hover:underline flex items-center gap-1"
          >
            View all products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                <div className="aspect-square bg-fog/60 rounded mb-4" />
                <div className="h-4 bg-fog/60 rounded w-3/4 mb-2" />
                <div className="h-4 bg-fog/60 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : featuredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product, idx) => (
              <div key={product.id} className={`animate-enter-${(idx % 4) + 1}`}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-12 text-center">
            <p className="text-base text-tide">No products available at the moment.</p>
          </div>
        )}
      </section>

      {/* Brand Guarantees / Quality Promise */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="bg-white rounded-xl p-8 sm:p-12">
          <div className="max-w-2xl mb-8">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-tide mb-3">
              Built on Honest Commerce Standards
            </h2>
            <p className="text-base text-tide leading-relaxed">
              No phantom stock, no unexpected checkout fees, and zero price rounding surprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-harbor">
                <ShieldCheck className="w-5 h-5 text-harbor" />
                <h3 className="font-display font-semibold text-lg text-tide">
                  Atomic Stock Locking
                </h3>
              </div>
              <p className="text-base text-tide/85 leading-relaxed">
                When you initiate checkout, your items are reserved via row-level database locks. No double selling.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-harbor">
                <Zap className="w-5 h-5 text-lantern" />
                <h3 className="font-display font-semibold text-lg text-tide">
                  Integer-Cents Precision
                </h3>
              </div>
              <p className="text-base text-tide/85 leading-relaxed">
                Every calculation is backed by integer cent values to eliminate floating-point discrepancy.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-harbor">
                <Compass className="w-5 h-5 text-sea" />
                <h3 className="font-display font-semibold text-lg text-tide">
                  Transparent Logistics
                </h3>
              </div>
              <p className="text-base text-tide/85 leading-relaxed">
                Clear flat shipping rate (₱150.00) nationwide with instant tracking and status chips.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
