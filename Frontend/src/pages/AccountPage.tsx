import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ArrowRight, ShoppingBag, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import StatusChip from '../components/StatusChip';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { checkoutApi } from '../api/checkout';
import { formatDate } from '../utils/format';
import type { Order } from '../types/api';

export default function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { confirm } = useConfirm();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: 'Sign Out?',
      message: 'Are you sure you want to end your current session?',
      confirmText: 'Sign Out',
      cancelText: 'Stay',
    });
    if (!confirmed) return;
    await logout();
    toast.success('Logged out safely. Have safe travels on the water.');
    navigate('/');
  };

  const handleCancelOrder = async (orderId: number) => {
    const confirmed = await confirm({
      title: `Cancel Order #${orderId}?`,
      message: 'Are you sure you want to cancel this order? Reserved items will be restored to warehouse stock immediately.',
      confirmText: 'Yes, Cancel Order',
      cancelText: 'Keep Order',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      setCancellingId(orderId);
      const cancelled = await checkoutApi.cancelOrder(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? cancelled : o)));
      toast.success(`Order #${orderId} was successfully cancelled.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Unable to cancel order.');
    } finally {
      setCancellingId(null);
    }
  };

  useEffect(() => {
    let active = true;
    checkoutApi
      .getUserOrders()
      .then((res) => {
        if (active) setOrders(res.data);
      })
      .catch(() => {
        // user may not have orders
      })
      .finally(() => {
        if (active) setLoadingOrders(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-svh flex flex-col bg-mist">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {/* Profile Header */}
        <div className="bg-white rounded-xl p-6 sm:p-8 mb-8" data-ui="account-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold font-display text-tide">My Account</h1>
                <span className="capitalize px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sand/30 text-harbor">
                  {user?.role}
                </span>
              </div>
              <p className="text-slate text-sm mt-1">Manage profile information and tracked maritime orders</p>
            </div>

            <div className="flex items-center gap-2">
              {user?.role === 'admin' && (
                <Link to="/admin">
                  <Button variant="primary" className="h-9 px-4 text-xs font-semibold">
                    Admin Operations
                  </Button>
                </Link>
              )}
              <Button variant="secondary" onClick={handleLogout} className="h-9 px-4 text-xs">
                Log out
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-mist p-5 rounded-lg">
            <div>
              <span className="block text-xs font-medium text-slate mb-0.5">Full Name</span>
              <p className="text-sm font-semibold text-tide">{user?.name}</p>
            </div>
            <div>
              <span className="block text-xs font-medium text-slate mb-0.5">Email Address</span>
              <p className="text-sm font-semibold text-tide">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="bg-white rounded-xl overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-harbor" />
              <h2 className="text-base font-display font-semibold text-tide">Order History</h2>
            </div>
            <span className="text-xs text-slate">{orders.length} past order{orders.length !== 1 ? 's' : ''}</span>
          </div>

          {loadingOrders ? (
            <div className="py-12 text-center text-slate text-xs">
              <div className="w-6 h-6 border-2 border-harbor border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading order history...
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 px-6 text-center">
              <ShoppingBag className="w-10 h-10 text-slate mx-auto mb-3 stroke-1" />
              <h3 className="text-sm font-semibold text-tide mb-1">No orders placed yet</h3>
              <p className="text-xs text-slate mb-5 max-w-sm mx-auto">
                When you purchase coastal equipment or apparel, your receipts and tracking will appear here.
              </p>
              <Link to="/products">
                <Button variant="primary" className="h-9 px-4 text-xs font-medium">
                  Browse Provisions
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="p-4 sm:p-5 bg-mist/40 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-display font-bold text-sm text-tide tabular-nums">
                        #TH-{String(order.id).padStart(6, '0')}
                      </span>
                      <StatusChip status={order.status} />
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDate(order.created_at)}</span>
                      <span>•</span>
                      <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    <div className="text-right">
                      <span className="block text-xs text-slate">Total</span>
                      <span className="font-display font-bold text-sm sm:text-base text-tide tabular-nums">
                        {order.formatted_total}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {(order.status === 'pending' || order.status === 'paid') && (
                        <Button
                          variant="ghost"
                          disabled={cancellingId === order.id}
                          onClick={() => handleCancelOrder(order.id)}
                          className="h-9 px-3 text-xs text-buoy hover:text-red-700"
                        >
                          Cancel
                        </Button>
                      )}
                      <Link to={`/orders/${order.id}`}>
                        <Button variant="secondary" className="h-9 px-3 text-xs flex items-center gap-1">
                          <span>Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}