import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="bg-[#002459] dark:bg-[#070e1b] text-white mt-auto border-t border-fog/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <Logo variant="white" size="md" />
            <p className="text-base text-slate-300 max-w-xs leading-relaxed">
              Coastal-grade essentials with honest stock counts, precision pricing, and reliable service.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold text-base text-white mb-3">
              Shop Harbor
            </h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <Link to="/products" className="hover:text-lantern transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/products?category=outdoor" className="hover:text-lantern transition-colors">
                  Outdoor Gear
                </Link>
              </li>
              <li>
                <Link to="/products?category=apparel" className="hover:text-lantern transition-colors">
                  Apparel
                </Link>
              </li>
              <li>
                <Link to="/products?category=accessories" className="hover:text-lantern transition-colors">
                  Accessories
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-base text-white mb-3">
              Account & Help
            </h4>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>
                <Link to="/account" className="hover:text-lantern transition-colors">
                  My Orders
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-lantern transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-lantern transition-colors">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold text-base text-white mb-3">
              Standards
            </h4>
            <div className="space-y-2 text-sm text-slate-300">
              <p>Atomic inventory reservations with real-time stock meter.</p>
              <div className="flex items-center gap-2 pt-1">
                <span className="w-2 h-2 rounded-full bg-sea" />
                <span className="text-sm text-slate-200">System Operational</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <p>© {new Date().getFullYear()} TrueHarbor. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>PHP (₱) Integer-Cents Engine</span>
            <span>•</span>
            <span>Laravel 13 + Tailwind CSS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
