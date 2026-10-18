import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, LogOut, Menu, X, User as UserIcon } from 'lucide-react';
import Logo from '../Logo';
import Button from '../Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';

export default function AdminNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Leave Quarterdeck?',
      message: 'Are you sure you want to log out of Maritime Operations?',
      confirmText: 'Log Out',
      cancelText: 'Stay Logged In',
    });
    if (!confirmed) return;
    await logout();
    toast.success('Signed out of Quarterdeck.');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white" data-ui="admin-navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand & Portal Badge */}
          <div className="flex items-center gap-4">
            <Link to="/admin" className="flex items-center gap-3">
              <Logo size="md" />
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-sand/40 text-harbor">
                <ShieldCheck className="w-3.5 h-3.5" />
                Harbormaster Hub
              </span>
            </Link>
          </div>

          {/* Right Action Icons & Admin Session */}
          <div className="flex items-center gap-3">
            {/* Live Storefront Link */}
            <Link
              to="/products"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-slate hover:text-harbor hover:bg-mist transition-colors"
              title="Navigate to customer-facing storefront"
            >
              <span>View Storefront</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {/* Admin User Badge & Logout */}
            <div className="hidden sm:flex items-center gap-3 pl-3">
              <div className="flex items-center gap-2 text-xs text-tide">
                <div className="w-7 h-7 rounded-full bg-sand/50 flex items-center justify-center text-harbor font-bold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold leading-tight max-w-[130px] truncate">{user?.name || 'Administrator'}</span>
                  <span className="text-[10px] text-slate font-medium">Operations Staff</span>
                </div>
              </div>

              <Button
                variant="ghost"
                onClick={handleLogout}
                className="h-8 px-2.5 text-xs text-slate hover:text-buoy flex items-center gap-1"
                title="Log out of Quarterdeck"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate hover:text-harbor sm:hidden"
              aria-label="Toggle admin navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="sm:hidden py-4 px-3 space-y-3 bg-mist rounded-xl mb-3">
            <div className="flex items-center gap-2 px-1">
              <ShieldCheck className="w-4 h-4 text-harbor" />
              <span className="text-xs font-semibold text-tide">Harbormaster Back Office</span>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                to="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 text-xs font-medium text-slate hover:text-harbor bg-white rounded-md"
              >
                <span>View Storefront</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Button
                variant="secondary"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-xs h-8"
              >
                Log out
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
