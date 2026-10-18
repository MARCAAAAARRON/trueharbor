import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X, User as UserIcon, ShieldCheck, LogOut } from 'lucide-react';
import Logo from './Logo';
import Button from './Button';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

interface NavbarProps {
  cartItemCount?: number;
}

export default function Navbar({ cartItemCount: propCartItemCount }: NavbarProps) {
  const { user, loading, logout } = useAuth();
  const { itemCount: cartItemCountFromHook, openCart } = useCart();
  const cartItemCount = propCartItemCount ?? cartItemCountFromHook;
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Sign Out?',
      message: 'Are you sure you want to end your session at TrueHarbor?',
      confirmText: 'Sign Out',
      cancelText: 'Stay Logged In',
    });
    if (!confirmed) return;
    await logout();
    toast.success('Logged out successfully.');
    navigate('/');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    } else {
      navigate('/products');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-fog" data-ui="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <Logo size="md" />
            <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-slate">
              <Link to="/products" className="hover:text-harbor transition-colors">
                Catalog
              </Link>
              <Link to="/products?category=outdoor" className="hover:text-harbor transition-colors">
                Outdoor
              </Link>
              <Link to="/products?category=apparel" className="hover:text-harbor transition-colors">
                Apparel
              </Link>
              <Link to="/products?category=home" className="hover:text-harbor transition-colors">
                Home
              </Link>
              <Link to="/products?category=accessories" className="hover:text-harbor transition-colors">
                Accessories
              </Link>
            </nav>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md hidden sm:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, gear, essentials..."
                className="w-full h-10 pl-10 pr-4 text-sm bg-mist border border-fog rounded-md focus:outline-none focus:border-harbor focus:bg-white text-tide placeholder:text-slate transition-colors"
              />
              <Search className="w-4 h-4 text-slate absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </form>
          </div>

          {/* Right Action Icons & Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle size="md" />

            {/* Cart Button */}
            <button
              type="button"
              onClick={openCart}
              className="relative p-2 text-slate hover:text-harbor transition-colors rounded-md"
              aria-label={`View Cart, ${cartItemCount} items`}
            >
              <ShoppingBag className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-lantern text-tide text-[11px] font-bold rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* User Session */}
            {loading ? (
              <div className="hidden sm:flex items-center gap-2 h-9 w-24 bg-mist rounded-md" />
            ) : user ? (
              <div className="hidden sm:flex items-center gap-3">
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-sand/40 text-harbor hover:bg-sand/60 transition-colors"
                    title="Maritime Operations Hub"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Operations</span>
                  </Link>
                )}
                <Link to="/account" className="flex items-center gap-2 text-xs text-tide hover:text-harbor">
                  <div className="w-7 h-7 rounded-full bg-sand/50 flex items-center justify-center text-harbor font-bold">
                    {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold leading-tight max-w-[140px] truncate">{user.name}</span>
                    <span className="text-[10px] text-slate font-medium">
                      {user.role === 'admin' ? 'Operations Staff' : 'Member Account'}
                    </span>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="h-8 px-2.5 text-xs text-slate hover:text-buoy flex items-center gap-1"
                  title="Log out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </Button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" className="h-9 px-3 text-sm">
                    Log in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" className="h-9 px-3 text-sm">
                    Register
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate hover:text-harbor md:hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search & Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-4" data-ui="mobile-menu">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full h-10 pl-10 pr-4 text-sm bg-mist border border-fog rounded-md focus:outline-none focus:border-harbor text-tide"
              />
              <Search className="w-4 h-4 text-slate absolute left-3 top-1/2 -translate-y-1/2" />
            </form>

            <nav className="flex flex-col space-y-2 pt-2 text-sm font-medium text-tide">
              <Link
                to="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1.5 hover:bg-mist rounded"
              >
                All Products
              </Link>
              <Link
                to="/products?category=outdoor"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1.5 hover:bg-mist rounded"
              >
                Outdoor
              </Link>
              <Link
                to="/products?category=apparel"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1.5 hover:bg-mist rounded"
              >
                Apparel
              </Link>
              <Link
                to="/products?category=home"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1.5 hover:bg-mist rounded"
              >
                Home
              </Link>
              <Link
                to="/products?category=accessories"
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1.5 hover:bg-mist rounded"
              >
                Accessories
              </Link>
            </nav>

            <div className="pt-3 border-t border-fog flex items-center justify-between px-3 py-1.5 mb-1 bg-mist/60 dark:bg-white/5 rounded-lg border border-fog/60">
              <span className="text-xs font-semibold text-slate dark:text-slate-300">Interface Theme</span>
              <ThemeToggle size="sm" />
            </div>

            <div className="pt-2 flex flex-col gap-2">
              {loading ? (
                <div className="h-9 bg-mist rounded-md" />
              ) : user ? (
                <>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-sm font-semibold text-harbor px-2 py-1"
                    >
                      Operations Hub
                    </Link>
                  )}
                  <Link
                    to="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-medium text-tide px-2 py-1"
                  >
                    Account ({user.name})
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="h-9 justify-start px-2 text-sm"
                  >
                    Log out
                  </Button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="secondary" className="w-full h-9 text-sm">
                      Log in
                    </Button>
                  </Link>
                  <Link to="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" className="w-full h-9 text-sm">
                      Register
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
