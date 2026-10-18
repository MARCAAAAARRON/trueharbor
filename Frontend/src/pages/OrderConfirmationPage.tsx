import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  Package,
  Truck,
  ArrowRight,
  Clock,
  Printer,
  ShoppingBag,
  CreditCard,
  Smartphone,
  Wallet,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import StatusChip from '../components/StatusChip';
import { checkoutApi } from '../api/checkout';
import { formatDate } from '../utils/format';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import type { Order } from '../types/api';

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const { confirm } = useConfirm();
  const toast = useToast();

  const handleCancel = async () => {
    if (!order) return;
    const confirmed = await confirm({
      title: `Cancel Order #${order.id}?`,
      message: 'Are you sure you want to cancel this order? Reserved provisions will be returned to warehouse inventory immediately.',
      confirmText: 'Yes, Cancel Order',
      cancelText: 'Keep Order',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      setCancelling(true);
      const updated = await checkoutApi.cancelOrder(order.id);
      setOrder(updated);
      toast.success(`Order #${order.id} has been cancelled and stock restored.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Unable to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    let active = true;
    if (!id) return;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      Promise.resolve().then(() => {
        if (active) {
          setError('Invalid order identifier.');
          setLoading(false);
        }
      });
      return;
    }

    checkoutApi
      .getOrder(orderId)
      .then((data) => {
        if (active) setOrder(data);
      })
      .catch(() => {
        if (active) setError('Unable to find this order or you do not have permission to view it.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-svh flex flex-col bg-mist">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-20 text-center flex-1">
          <div className="w-12 h-12 border-3 border-harbor border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-slate">Retrieving order details...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-svh flex flex-col bg-mist">
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-20 text-center flex-1">
          <Package className="w-16 h-16 text-slate mx-auto mb-4" />
          <h1 className="text-2xl font-display font-bold text-tide mb-2">Order Not Found</h1>
          <p className="text-sm text-slate mb-6">{error || 'This order does not exist.'}</p>
          <Link to="/products">
            <Button variant="primary" className="h-10 px-6">
              Return to Catalog
            </Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const isPaid = order.status === 'paid';

  return (
    <div className="min-h-svh flex flex-col bg-mist">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {/* Celebration Header Card */}
        <div className="bg-white rounded-xl p-6 sm:p-8 text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-sea/10 flex items-center justify-center text-sea mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-tide tracking-tight mb-2">
            {isPaid ? 'Thank You for Your Order!' : 'Order Placed (Awaiting Payment)'}
          </h1>
          <p className="text-sm text-slate max-w-lg mx-auto mb-4">
            {isPaid
              ? 'Your provisions order has been secured and dispatched for preparation in our coastal warehouse.'
              : 'Your order has been registered. Please complete payment before the reservation window expires.'}
          </p>

          <div className="inline-flex items-center gap-3 bg-mist px-4 py-2 rounded-lg text-xs sm:text-sm">
            <span className="text-slate">Order Reference:</span>
            <span className="font-display font-bold text-tide tabular-nums">#TH-{String(order.id).padStart(6, '0')}</span>
            <span className="text-slate">·</span>
            <StatusChip status={order.status} />
          </div>
        </div>

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Destination */}
          <div className="bg-white rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-harbor">
              <Truck className="w-4 h-4" />
              <span>Shipping Destination</span>
            </div>
            <p className="text-sm font-semibold text-tide pt-1">{order.shipping_address.name}</p>
            <p className="text-xs text-slate leading-relaxed">
              {order.shipping_address.line1}
              {order.shipping_address.line2 ? `, ${order.shipping_address.line2}` : ''}
              <br />
              {order.shipping_address.city}, {order.shipping_address.province} {order.shipping_address.postal_code}
            </p>
            <p className="text-xs text-slate tabular-nums pt-1">Tel: {order.shipping_address.phone}</p>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-harbor">
              <Clock className="w-4 h-4" />
              <span>Timeline</span>
            </div>
            <div className="text-xs text-slate space-y-1.5 pt-1">
              <div>
                <span className="block font-medium text-tide">Placed:</span>
                <span>{formatDate(order.created_at)}</span>
              </div>
              {order.paid_at && (
                <div>
                  <span className="block font-medium text-tide">Payment Confirmed:</span>
                  <span>{formatDate(order.paid_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Status */}
          <div className="bg-white rounded-xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-harbor">
              <Package className="w-4 h-4" />
              <span>Payment Details</span>
            </div>
            <div className="text-xs text-slate space-y-1.5 pt-1">
              <div>
                <span className="block font-medium text-tide mb-1">Method:</span>
                {order.payment_method === 'gcash' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <Smartphone size={13} className="text-blue-600" />
                    GCash e-Wallet {order.payment_details?.account_number ? `(${order.payment_details.account_number})` : ''}
                  </span>
                ) : order.payment_method === 'maya' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Wallet size={13} className="text-emerald-600" />
                    Maya Wallet {order.payment_details?.account_number ? `(${order.payment_details.account_number})` : ''}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                    <CreditCard size={13} className="text-slate-600" />
                    Credit / Debit Card
                  </span>
                )}
              </div>
              {order.payment_intent_id && (
                <div>
                  <span className="block font-medium text-tide">Transaction ID:</span>
                  <code className="text-[11px] truncate block text-slate">{order.payment_intent_id}</code>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ordered Items Table */}
        <div className="bg-white rounded-xl overflow-hidden mb-8 p-6 space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-sm font-display font-semibold text-tide">Provisions Breakdown</h2>
            <span className="text-xs text-slate">{order.items.length} unique line items</span>
          </div>

          <div className="space-y-2.5">
            {order.items.map((item) => (
              <div key={item.id} className="p-3.5 bg-mist/40 rounded-lg flex items-center justify-between gap-4 text-xs sm:text-sm">
                <div className="min-w-0">
                  <h3 className="font-semibold text-tide truncate">{item.product_name}</h3>
                  <p className="text-xs text-slate mt-0.5">
                    Quantity: {item.quantity} × {item.formatted_unit_price}
                  </p>
                </div>
                <span className="font-semibold font-display text-tide tabular-nums">
                  {item.formatted_line_total}
                </span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="pt-3 space-y-2 text-xs sm:text-sm">
            <div className="flex items-center justify-between text-slate">
              <span>Provisions Subtotal</span>
              <span className="font-semibold font-display text-tide tabular-nums">
                {order.formatted_subtotal}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate">
              <span>Shipping Fee</span>
              <span className="font-semibold font-display text-tide tabular-nums">
                {order.shipping_cents === 0 ? (
                  <span className="text-sea font-bold">FREE</span>
                ) : (
                  order.formatted_shipping
                )}
              </span>
            </div>

            <div className="p-3.5 bg-mist/60 rounded-lg flex items-center justify-between">
              <span className="text-base font-display font-bold text-tide">Total Paid</span>
              <span className="text-xl font-display font-bold text-harbor tabular-nums">
                {order.formatted_total}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 text-xs font-semibold text-slate hover:text-tide"
            >
              <Printer className="w-4 h-4" />
              Print Order Receipt
            </button>

            {(order.status === 'pending' || order.status === 'paid') && (
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancel}
                className="text-xs font-semibold text-buoy hover:text-red-700 disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link to="/products" className="w-full sm:w-auto">
              <Button variant="secondary" className="h-10 px-5 text-sm w-full">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Continue Shopping
              </Button>
            </Link>
            <Link to="/account" className="w-full sm:w-auto">
              <Button variant="primary" className="h-10 px-5 text-sm w-full">
                View All Orders
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
