import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Filter, X, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProductCard from '../components/ProductCard';
import Button from '../components/Button';
import { getCategories, getProducts, type ProductQueryParams } from '../api/catalog';
import type { Category, PaginatedResponse, Product } from '../types/api';

interface PriceFilterFormProps {
  initialMin: string;
  initialMax: string;
  onApply: (min: string, max: string) => void;
  isMobile?: boolean;
}

function PriceFilterForm({ initialMin, initialMax, onApply, isMobile = false }: PriceFilterFormProps) {
  const [min, setMin] = useState(initialMin);
  const [max, setMax] = useState(initialMax);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(min, max);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          step="any"
          placeholder={isMobile ? 'Min ₱' : 'Min'}
          value={min}
          onChange={(e) => setMin(e.target.value)}
          className={
            isMobile
              ? 'w-1/2 h-10 px-3 text-sm bg-mist rounded focus:ring-2 focus:ring-harbor focus:outline-none'
              : 'w-full h-9 px-3 text-sm bg-mist rounded focus:ring-2 focus:ring-harbor focus:outline-none'
          }
        />
        <span className="text-slate text-sm">-</span>
        <input
          type="number"
          min="0"
          step="any"
          placeholder={isMobile ? 'Max ₱' : 'Max'}
          value={max}
          onChange={(e) => setMax(e.target.value)}
          className={
            isMobile
              ? 'w-1/2 h-10 px-3 text-sm bg-mist rounded focus:ring-2 focus:ring-harbor focus:outline-none'
              : 'w-full h-9 px-3 text-sm bg-mist rounded focus:ring-2 focus:ring-harbor focus:outline-none'
          }
        />
      </div>
      <Button
        type="submit"
        variant={isMobile ? 'primary' : 'secondary'}
        className={isMobile ? 'w-full h-10 text-sm' : 'w-full h-8 text-sm'}
      >
        {isMobile ? 'Apply' : 'Apply Filter'}
      </Button>
    </form>
  );
}

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Search parameters
  const currentCategory = searchParams.get('category') || '';
  const currentQuery = searchParams.get('q') || '';
  const currentSort = (searchParams.get('sort') || 'newest') as 'newest' | 'price_asc' | 'price_desc';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const minPrice = searchParams.get('min_price') || '';
  const maxPrice = searchParams.get('max_price') || '';

  // Local state
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsData, setProductsData] = useState<PaginatedResponse<Product> | null>(null);
  const [fetchedKey, setFetchedKey] = useState<string | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const queryKey = `${currentPage}-${currentSort}-${currentCategory}-${currentQuery}-${minPrice}-${maxPrice}`;
  const loading = fetchedKey !== queryKey;

  const currentMinDisplay = minPrice ? (parseInt(minPrice, 10) / 100).toString() : '';
  const currentMaxDisplay = maxPrice ? (parseInt(maxPrice, 10) / 100).toString() : '';

  // Load categories once
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  // Fetch products whenever params change
  useEffect(() => {
    let mounted = true;

    const queryParams: ProductQueryParams = {
      page: currentPage,
      per_page: 12,
      sort: currentSort,
    };
    if (currentCategory) queryParams.category = currentCategory;
    if (currentQuery) queryParams.q = currentQuery;
    if (minPrice) queryParams.min_price = parseInt(minPrice, 10);
    if (maxPrice) queryParams.max_price = parseInt(maxPrice, 10);

    getProducts(queryParams)
      .then((res) => {
        if (mounted) {
          setProductsData(res);
          setFetchedKey(queryKey);
        }
      })
      .catch(() => {
        if (mounted) {
          setProductsData(null);
          setFetchedKey(queryKey);
        }
      });

    return () => {
      mounted = false;
    };
  }, [currentCategory, currentQuery, currentSort, currentPage, minPrice, maxPrice, queryKey]);

  // Parameter helpers
  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    // Reset to page 1 whenever filters change
    if (key !== 'page') {
      next.delete('page');
    }
    setSearchParams(next);
  };

  const handlePriceApply = (minVal: string, maxVal: string) => {
    const next = new URLSearchParams(searchParams);
    next.delete('page');

    const minNum = parseFloat(minVal);
    const maxNum = parseFloat(maxVal);

    if (!isNaN(minNum) && minNum >= 0) {
      next.set('min_price', Math.round(minNum * 100).toString());
    } else {
      next.delete('min_price');
    }

    if (!isNaN(maxNum) && maxNum >= 0) {
      next.set('max_price', Math.round(maxNum * 100).toString());
    } else {
      next.delete('max_price');
    }

    setSearchParams(next);
    setMobileFilterOpen(false);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (currentCategory) count++;
    if (currentQuery) count++;
    if (minPrice) count++;
    if (maxPrice) count++;
    return count;
  }, [currentCategory, currentQuery, minPrice, maxPrice]);

  const activeCategoryName = useMemo(() => {
    if (!currentCategory) return 'All Products';
    const found = categories.find((c) => c.slug === currentCategory);
    return found ? found.name : currentCategory;
  }, [currentCategory, categories]);

  return (
    <div className="min-h-svh flex flex-col bg-mist">
      <Navbar />

      {/* Catalog Editorial Header */}
      <div className="relative bg-[#002459] dark:bg-[#070e1b] text-white overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img
            src="/assets/2016-11-13-01-kjeungskj-r-lighthouse.jpg"
            alt="TrueHarbor Coastline"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <nav className="flex items-center gap-2 text-sm text-mist/80 mb-2">
              <Link to="/" className="hover:text-white">
                Home
              </Link>
              <span>/</span>
              <span className="text-white font-medium">Catalog</span>
              {currentCategory && (
                <>
                  <span>/</span>
                  <span className="text-white font-medium">{activeCategoryName}</span>
                </>
              )}
            </nav>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-white">
              {currentQuery ? `Search results for "${currentQuery}"` : activeCategoryName}
            </h1>
            <p className="text-base text-mist/90 mt-2 max-w-xl">
              Authentic coastal gear and utility essentials with verified stock and integer-cents pricing.
            </p>

            <div className="mt-4 sm:hidden">
              <Button
                variant="on-blue"
                onClick={() => setMobileFilterOpen(true)}
                className="w-full h-11 text-base flex items-center justify-center gap-2"
              >
                <Filter className="w-4 h-4 text-lantern" />
                <span>Filter Catalog {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
              </Button>
            </div>
          </div>

          {/* Sort & Desktop Filter Controls */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="hidden sm:flex lg:hidden items-center gap-2 px-3 py-2 bg-white/10 rounded-md text-sm font-medium text-white"
            >
              <Filter className="w-4 h-4 text-lantern" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-lantern text-tide text-xs font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-sm text-mist/90 font-medium hidden sm:inline">
                Sort:
              </label>
              <select
                id="sort-select"
                value={currentSort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="h-10 px-3 py-1 bg-white text-tide rounded-md text-sm focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Catalog Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Department Visual Lane */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <Link
            to="/products?category=outdoor"
            className="group relative h-28 rounded-lg overflow-hidden bg-white transition-transform hover:-translate-y-0.5"
          >
            <img
              src="/assets/2016-11-13-01-kjeungskj-r-lighthouse.jpg"
              alt="Outdoor gear"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors flex items-center justify-center p-2 text-center">
              <span className="text-white font-display font-semibold text-base">Outdoor Gear</span>
            </div>
          </Link>

          <Link
            to="/products?category=apparel"
            className="group relative h-28 rounded-lg overflow-hidden bg-white transition-transform hover:-translate-y-0.5"
          >
            <img
              src="/assets/paphos-cyprus-panoramio-119.jpg"
              alt="Coastal Apparel"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors flex items-center justify-center p-2 text-center">
              <span className="text-white font-display font-semibold text-base">Coastal Apparel</span>
            </div>
          </Link>

          <Link
            to="/products?category=home"
            className="group relative h-28 rounded-lg overflow-hidden bg-white transition-transform hover:-translate-y-0.5"
          >
            <img
              src="/assets/a-coastal-view-with-a-lighthouse.jpg"
              alt="Home Goods"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors flex items-center justify-center p-2 text-center">
              <span className="text-white font-display font-semibold text-base">Home Goods</span>
            </div>
          </Link>

          <Link
            to="/products?category=accessories"
            className="group relative h-28 rounded-lg overflow-hidden bg-white transition-transform hover:-translate-y-0.5"
          >
            <img
              src="/assets/rocks-at-the-lighthouse-biarritz.jpg"
              alt="Accessories"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors flex items-center justify-center p-2 text-center">
              <span className="text-white font-display font-semibold text-base">Accessories</span>
            </div>
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Left Filter Rail */}
          <aside className="w-64 flex-shrink-0 hidden lg:block" data-ui="filter-rail">
            <div className="bg-white rounded-lg p-5 sticky top-24 space-y-6">
              <div className="flex items-center justify-between pb-3">
                <span className="font-display font-semibold text-base text-tide flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-harbor" />
                  Filter Catalog
                </span>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="text-sm text-harbor hover:underline font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Department Categories */}
              <div>
                <h3 className="font-display font-semibold text-sm text-tide mb-3">
                  Department
                </h3>
                <div className="space-y-1.5 text-sm">
                  <button
                    type="button"
                    onClick={() => updateParam('category', null)}
                    className={`w-full text-left px-3 py-2 rounded transition-colors ${
                      !currentCategory
                        ? 'bg-harbor text-white font-medium'
                        : 'text-tide hover:bg-mist'
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => updateParam('category', cat.slug)}
                      className={`w-full text-left px-3 py-2 rounded transition-colors ${
                        currentCategory === cat.slug
                          ? 'bg-harbor text-white font-medium'
                          : 'text-tide hover:bg-mist'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="pt-6">
                <h3 className="font-display font-semibold text-sm text-tide mb-3">
                  Price (₱)
                </h3>
                <PriceFilterForm
                  key={`desktop-${currentMinDisplay}-${currentMaxDisplay}`}
                  initialMin={currentMinDisplay}
                  initialMax={currentMaxDisplay}
                  onApply={handlePriceApply}
                />
              </div>
            </div>
          </aside>

          {/* Mobile Filter Modal */}
          {mobileFilterOpen && (
            <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-2xs flex justify-end lg:hidden">
              <div className="w-full max-w-xs bg-white h-full p-6 overflow-y-auto space-y-6">
                <div className="flex items-center justify-between pb-3">
                  <h3 className="font-display font-bold text-lg text-tide">Filters</h3>
                  <button
                    type="button"
                    onClick={() => setMobileFilterOpen(false)}
                    className="p-1 text-slate hover:text-tide"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Categories */}
                <div>
                  <h4 className="font-medium text-sm text-tide mb-2">
                    Department
                  </h4>
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        updateParam('category', null);
                        setMobileFilterOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded text-sm ${
                        !currentCategory ? 'bg-harbor text-white font-medium' : 'text-tide'
                      }`}
                    >
                      All Categories
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          updateParam('category', cat.slug);
                          setMobileFilterOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded text-sm ${
                          currentCategory === cat.slug ? 'bg-harbor text-white font-medium' : 'text-tide'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div className="pt-6">
                  <h4 className="font-medium text-sm text-tide mb-2">
                    Price Range (₱)
                  </h4>
                  <PriceFilterForm
                    key={`mobile-${currentMinDisplay}-${currentMaxDisplay}`}
                    initialMin={currentMinDisplay}
                    initialMax={currentMaxDisplay}
                    onApply={handlePriceApply}
                    isMobile
                  />
                </div>

                {activeFilterCount > 0 && (
                  <div className="pt-6">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        clearAllFilters();
                        setMobileFilterOpen(false);
                      }}
                      className="w-full text-sm text-buoy"
                    >
                      Reset All Filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Product Grid & Active Filter Pills */}
          <div className="flex-1 min-w-0">
            {/* Active Filters Row */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <span className="text-sm text-slate font-medium">Active:</span>

                {currentQuery && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded text-sm text-tide">
                    Query: "{currentQuery}"
                    <button
                      type="button"
                      onClick={() => updateParam('q', null)}
                      className="hover:text-buoy"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}

                {currentCategory && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded text-sm text-tide">
                    Department: {activeCategoryName}
                    <button
                      type="button"
                      onClick={() => updateParam('category', null)}
                      className="hover:text-buoy"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}

                {(minPrice || maxPrice) && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded text-sm text-tide">
                    Price: ₱{minPrice ? parseInt(minPrice, 10) / 100 : '0'} -{' '}
                    {maxPrice ? `₱${parseInt(maxPrice, 10) / 100}` : 'Any'}
                    <button
                      type="button"
                      onClick={() => {
                        const next = new URLSearchParams(searchParams);
                        next.delete('min_price');
                        next.delete('max_price');
                        next.delete('page');
                        setSearchParams(next);
                      }}
                      className="hover:text-buoy"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-sm text-harbor hover:underline font-medium ml-2"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Results count */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-tide font-medium">
                {productsData?.meta?.total !== undefined
                  ? `Showing ${productsData.data.length} of ${productsData.meta.total} products`
                  : 'Browsing products'}
              </span>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                    <div className="aspect-square bg-fog/60 rounded mb-4" />
                    <div className="h-4 bg-fog/60 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-fog/60 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : productsData && productsData.data.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
                {productsData.data.map((product, idx) => (
                  <div key={product.id} className={`animate-enter-${(idx % 4) + 1}`}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-12 text-center">
                <h3 className="font-display font-semibold text-lg text-tide mb-2">
                  No products matched your criteria
                </h3>
                <p className="text-tide/80 text-base mb-6 max-w-md mx-auto">
                  Try adjusting or clearing your filters, price range, or search keywords.
                </p>
                <Button variant="secondary" onClick={clearAllFilters} className="h-10 px-4 text-sm">
                  Reset All Filters
                </Button>
              </div>
            )}

            {/* Pagination Controls */}
            {productsData && productsData.meta && productsData.meta.last_page > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2 pt-6">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => updateParam('page', (currentPage - 1).toString())}
                  className="flex items-center gap-1 px-3 py-2 rounded bg-white text-sm text-tide disabled:opacity-40 disabled:cursor-not-allowed hover:bg-wash transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: productsData.meta.last_page }).map((_, index) => {
                    const pageNum = index + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === productsData.meta.last_page ||
                      Math.abs(pageNum - currentPage) <= 1
                    ) {
                      return (
                        <button
                          key={pageNum}
                          type="button"
                          onClick={() => updateParam('page', pageNum.toString())}
                          className={`w-9 h-9 rounded text-sm font-medium transition-colors ${
                            pageNum === currentPage
                              ? 'bg-harbor text-white'
                              : 'bg-white text-tide hover:bg-wash'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (
                      (pageNum === 2 && currentPage > 3) ||
                      (pageNum === productsData.meta.last_page - 1 &&
                        currentPage < productsData.meta.last_page - 2)
                    ) {
                      return (
                        <span key={pageNum} className="px-1 text-slate text-sm">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  type="button"
                  disabled={currentPage >= productsData.meta.last_page}
                  onClick={() => updateParam('page', (currentPage + 1).toString())}
                  className="flex items-center gap-1 px-3 py-2 rounded bg-white text-sm text-tide disabled:opacity-40 disabled:cursor-not-allowed hover:bg-wash transition-colors"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
