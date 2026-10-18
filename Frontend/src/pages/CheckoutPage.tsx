import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  Smartphone,
  Wallet,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShoppingBag,
  X,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { checkoutApi } from '../api/checkout';
import { formatPrice } from '../utils/format';
import { extractValidationErrors, getErrorMessage } from '../utils/errors';
import type { ShippingAddress, Order } from '../types/api';

const FREE_SHIPPING_THRESHOLD_CENTS = 250000; // ₱2,500.00
const FLAT_SHIPPING_CENTS = 15000; // ₱150.00

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cart, subtotalCents, refreshCart } = useCart();
  const navigate = useNavigate();
  const toast = useToast();

  const items = cart?.items || [];
  const shippingCents = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : (items.length > 0 ? FLAT_SHIPPING_CENTS : 0);
  const totalCents = subtotalCents + shippingCents;

  // Form State
  const [formData, setFormData] = useState<ShippingAddress>({
    name: user?.name || '',
    line1: '',
    line2: '',
    city: '',
    province: 'Metro Manila',
    postal_code: '',
    phone: '',
  });

  // Payment method selection & wallet modal state
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'gcash' | 'maya'>('card');
  const [walletPhone, setWalletPhone] = useState('0917 123 4567');
  const [walletOtp, setWalletOtp] = useState('123456');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<Order | null>(null);
  const [walletVerifying, setWalletVerifying] = useState(false);

  // Card mock state for realistic test mode
  const [cardHolder, setCardHolder] = useState(user?.name || '');
  const [cardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry] = useState('12/28');
  const [cardCvc] = useState('•••');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStepText, setPaymentStepText] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name] || fieldErrors[`shipping_address.${name}`]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        delete next[`shipping_address.${name}`];
        return next;
      });
    }
  };

  const handleConfirmWalletPayment = async () => {
    if (!pendingOrder || !pendingOrder.payment_intent_id) return;

    try {
      setWalletVerifying(true);
      await checkoutApi.confirmTestPayment(pendingOrder.payment_intent_id);
      toast.success(
        `${paymentMethod === 'gcash' ? 'GCash' : 'Maya'} payment authorized & verified!`
      );
      setShowWalletModal(false);
      navigate(`/orders/${pendingOrder.id}`);
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Failed to complete e-wallet payment authorization.');
      toast.error(msg);
      setWalletVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }

    if (items.length === 0) {
      setFormError('Your cart is empty. Please add items before checking out.');
      return;
    }

    try {
      setIsSubmitting(true);
      setPaymentStepText('Securing stock and creating order...');

      // 1. Create order with row-locks in database
      const order = await checkoutApi.createOrder({
        shipping_address: formData,
        payment_method: paymentMethod,
        payment_details:
          paymentMethod !== 'card'
            ? {
                account_number: walletPhone || formData.phone,
                account_name: formData.name,
              }
            : undefined,
      });

      // 2. Refresh cart state (it's now cleared in database)
      await refreshCart();

      if (paymentMethod === 'card') {
        // 3. Process card payment
        setPaymentStepText('Processing payment with Stripe...');

        const paymentIntentId = order.payment_intent_id;
        if (paymentIntentId) {
          await checkoutApi.confirmTestPayment(paymentIntentId);
        }

        setPaymentStepText('Payment verified! Redirecting to receipt...');
        toast.success(`Order #${order.id} placed and payment verified!`);
        setTimeout(() => {
          navigate(`/orders/${order.id}`);
        }, 600);
      } else {
        // GCash or Maya: Open interactive authorization modal
        setPendingOrder(order);
        setShowWalletModal(true);
        setIsSubmitting(false);
        setPaymentStepText('');
      }
    } catch (err: unknown) {
      const fieldValidationErrors = extractValidationErrors(err);
      if (fieldValidationErrors) {
        setFieldErrors(fieldValidationErrors);
        setFormError('Please review the highlighted shipping fields below.');
        toast.error('Please complete all required shipping fields.');
      } else {
        const msg = getErrorMessage(err, 'Unable to complete checkout. Please try again.');
        setFormError(msg);
        toast.error(msg);
      }
      setIsSubmitting(false);
      setPaymentStepText('');
    }
  };

  if (!user) {
    return (
      <div className="min-h-svh flex flex-col bg-mist">
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-16 text-center flex-1">
          <div className="w-16 h-16 rounded-full bg-sand/30 flex items-center justify-center mx-auto mb-4 text-harbor">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-display font-bold text-tide mb-2">Sign in to Checkout</h1>
          <p className="text-sm text-slate mb-6">
            Please log in or register an account to complete your marine order and track shipments.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/login?redirect=/checkout">
              <Button variant="primary" className="h-10 px-6 w-full">
                Log In
              </Button>
            </Link>
            <Link to="/register?redirect=/checkout">
              <Button variant="secondary" className="h-10 px-6 w-full">
                Create Account
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-svh flex flex-col bg-mist">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate mb-6">
          <Link to="/cart" className="hover:text-harbor flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Bag
          </Link>
          <span>/</span>
          <span className="text-tide font-medium">Checkout</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-display font-bold text-tide tracking-tight mb-8">
          Secure Maritime Checkout
        </h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-xl p-10 text-center max-w-lg mx-auto">
            <ShoppingBag className="w-12 h-12 text-slate mx-auto mb-4" />
            <h2 className="text-lg font-display font-semibold text-tide mb-2">Your Bag is Empty</h2>
            <p className="text-xs text-slate mb-6">
              You must have at least one active item in your cart to proceed with checkout.
            </p>
            <Link to="/products">
              <Button variant="primary" className="h-10 px-6 text-sm">
                Return to Provisions Catalog
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Shipping & Payment details */}
            <div className="lg:col-span-7 space-y-6">
              {formError && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
                  <div>
                    <h3 className="font-semibold">Checkout Error</h3>
                    <p className="text-xs mt-0.5">{formError}</p>
                  </div>
                </div>
              )}

              {/* 1. Shipping Address Section */}
              <div className="bg-white rounded-xl p-6 space-y-5">
                <div className="flex items-center gap-2 pb-2">
                  <Truck className="w-5 h-5 text-harbor" />
                  <h2 className="text-base font-display font-semibold text-tide">
                    1. Shipping Destination
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-tide mb-1">
                      Recipient Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Captain Juan Dela Cruz"
                      className="w-full h-10 px-3 text-sm bg-mist rounded-md focus:outline-none focus:ring-1 focus:ring-harbor text-tide"
                    />
                    {(fieldErrors['name'] || fieldErrors['shipping_address.name']) && (
                      <p className="text-xs text-red-500 mt-1">
                        {fieldErrors['name']?.[0] || fieldErrors['shipping_address.name']?.[0]}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-tide mb-1">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="line1"
                      required
                      value={formData.line1}
                      onChange={handleChange}
                      placeholder="House number, street, barangay"
                      className="w-full h-10 px-3 text-sm bg-mist rounded-md focus:outline-none focus:ring-1 focus:ring-harbor text-tide"
                    />
                    {(fieldErrors['line1'] || fieldErrors['shipping_address.line1']) && (
                      <p className="text-xs text-red-500 mt-1">
                        {fieldErrors['line1']?.[0] || fieldErrors['shipping_address.line1']?.[0]}
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-tide mb-1">
                      Apartment, Suite, Unit (Optional)
                    </label>
                    <input
                      type="text"
                      name="line2"
                      value={formData.line2}
                      onChange={handleChange}
                      placeholder="Unit 401, Tower 2, Pier Gate"
                      className="w-full h-10 px-3 text-sm bg-mist rounded-md focus:outline-none focus:ring-1 focus:ring-harbor text-tide"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-tide mb-1">
                      City / Municipality <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="e.g. Pasay, Cebu City"
                      className="w-full h-10 px-3 text-sm bg-mist rounded-md focus:outline-none focus:ring-1 focus:ring-harbor text-tide"
                    />
                    {(fieldErrors['city'] || fieldErrors['shipping_address.city']) && (
                      <p className="text-xs text-red-500 mt-1">
                        {fieldErrors['city']?.[0] || fieldErrors['shipping_address.city']?.[0]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-tide mb-1">
                      Province / Region <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="province"
                      required
                      value={formData.province}
                      onChange={handleChange}
                      placeholder="e.g. Metro Manila, Cebu, Palawan"
                      className="w-full h-10 px-3 text-sm bg-mist rounded-md focus:outline-none focus:ring-1 focus:ring-harbor text-tide"
                    />
                    {(fieldErrors['province'] || fieldErrors['shipping_address.province']) && (
                      <p className="text-xs text-red-500 mt-1">
                        {fieldErrors['province']?.[0] || fieldErrors['shipping_address.province']?.[0]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-tide mb-1">
                      Postal Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="postal_code"
                      required
                      value={formData.postal_code}
                      onChange={handleChange}
                      placeholder="1300"
                      className="w-full h-10 px-3 text-sm bg-mist rounded-md focus:outline-none focus:ring-1 focus:ring-harbor text-tide"
                    />
                    {(fieldErrors['postal_code'] || fieldErrors['shipping_address.postal_code']) && (
                      <p className="text-xs text-red-500 mt-1">
                        {fieldErrors['postal_code']?.[0] || fieldErrors['shipping_address.postal_code']?.[0]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-tide mb-1">
                      Contact Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+63 917 123 4567"
                      className="w-full h-10 px-3 text-sm bg-mist rounded-md focus:outline-none focus:ring-1 focus:ring-harbor text-tide"
                    />
                    {(fieldErrors['phone'] || fieldErrors['shipping_address.phone']) && (
                      <p className="text-xs text-red-500 mt-1">
                        {fieldErrors['phone']?.[0] || fieldErrors['shipping_address.phone']?.[0]}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Payment Method Section */}
              <div className="bg-white rounded-xl p-6 space-y-5">
                <div className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-harbor" />
                    <h2 className="text-base font-display font-semibold text-tide">
                      2. Payment Method
                    </h2>
                  </div>
                  <span className="text-[11px] font-semibold bg-sand/40 text-harbor px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-harbor" />
                    Regional Philippine Rails
                  </span>
                </div>

                {/* Method Selector Tabs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Card Option */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      paymentMethod === 'card'
                        ? 'border-harbor bg-harbor/5 ring-1 ring-harbor'
                        : 'border-sand hover:border-slate/40 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <CreditCard
                        className={`w-5 h-5 ${
                          paymentMethod === 'card' ? 'text-harbor' : 'text-slate'
                        }`}
                      />
                      <span className="text-[10px] font-semibold text-slate uppercase tracking-wider">
                        Stripe
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="font-semibold text-sm text-tide block">Card</span>
                      <span className="text-[11px] text-slate block">Visa, Mastercard</span>
                    </div>
                  </button>

                  {/* GCash Option */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('gcash')}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      paymentMethod === 'gcash'
                        ? 'border-blue-600 bg-blue-50/50 ring-1 ring-blue-600'
                        : 'border-sand hover:border-slate/40 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Smartphone
                        className={`w-5 h-5 ${
                          paymentMethod === 'gcash' ? 'text-blue-600' : 'text-slate'
                        }`}
                      />
                      <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded">
                        GCash
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="font-semibold text-sm text-tide block">GCash e-Wallet</span>
                      <span className="text-[11px] text-slate block">Scan QR / Mobile</span>
                    </div>
                  </button>

                  {/* Maya Option */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('maya')}
                    className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      paymentMethod === 'maya'
                        ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                        : 'border-sand hover:border-slate/40 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Wallet
                        className={`w-5 h-5 ${
                          paymentMethod === 'maya' ? 'text-emerald-600' : 'text-slate'
                        }`}
                      />
                      <span className="text-[10px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                        Maya
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="font-semibold text-sm text-tide block">Maya Wallet</span>
                      <span className="text-[11px] text-slate block">Balance & Credit</span>
                    </div>
                  </button>
                </div>

                {/* Card input mockup */}
                {paymentMethod === 'card' && (
                  <div className="p-4 bg-mist/60 rounded-lg space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-xs text-slate">
                      <span className="font-medium text-tide">Credit or Debit Card</span>
                      <span className="tabular-nums tracking-widest text-[11px]">4242 Test Visa</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate mb-1">Card Number</label>
                      <div className="w-full h-10 px-3 bg-white rounded-md flex items-center justify-between tabular-nums tracking-widest text-sm text-tide">
                        <span>{cardNumber}</span>
                        <CreditCard className="w-4 h-4 text-slate" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate mb-1">Expires</label>
                        <div className="w-full h-10 px-3 bg-white rounded-md flex items-center tabular-nums text-sm text-tide">
                          {cardExpiry}
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate mb-1">CVC</label>
                        <div className="w-full h-10 px-3 bg-white rounded-md flex items-center tabular-nums tracking-widest text-sm text-tide">
                          {cardCvc}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate mb-1">Name on Card</label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full h-10 px-3 bg-white rounded-md text-sm text-tide focus:outline-none focus:ring-1 focus:ring-harbor"
                      />
                    </div>
                  </div>
                )}

                {/* GCash input panel */}
                {paymentMethod === 'gcash' && (
                  <div className="p-4 bg-blue-50/50 border border-blue-200/60 rounded-lg space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-blue-900">GCash Mobile Account</span>
                      <span className="text-[11px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full font-medium">
                        Instant Authorization
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate mb-1">
                        GCash Mobile Number
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={walletPhone}
                          onChange={(e) => setWalletPhone(e.target.value)}
                          placeholder="0917 123 4567"
                          className="w-full h-10 px-3 pl-9 bg-white border border-blue-200 rounded-md text-sm text-tide focus:outline-none focus:ring-1 focus:ring-blue-600 tabular-nums"
                        />
                        <Smartphone className="w-4 h-4 text-blue-600 absolute left-3 top-3 pointer-events-none" />
                      </div>
                      <p className="text-[11px] text-slate mt-1.5">
                        Upon placing your order, an authorization dialog will appear to confirm payment via your GCash mobile number.
                      </p>
                    </div>
                  </div>
                )}

                {/* Maya input panel */}
                {paymentMethod === 'maya' && (
                  <div className="p-4 bg-emerald-50/50 border border-emerald-200/60 rounded-lg space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-emerald-900">Maya Digital Wallet</span>
                      <span className="text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-medium">
                        Pay with Maya
                      </span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate mb-1">
                        Maya Mobile Number
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={walletPhone}
                          onChange={(e) => setWalletPhone(e.target.value)}
                          placeholder="0918 765 4321"
                          className="w-full h-10 px-3 pl-9 bg-white border border-emerald-200 rounded-md text-sm text-tide focus:outline-none focus:ring-1 focus:ring-emerald-600 tabular-nums"
                        />
                        <Wallet className="w-4 h-4 text-emerald-600 absolute left-3 top-3 pointer-events-none" />
                      </div>
                      <p className="text-[11px] text-slate mt-1.5">
                        You can approve the charge directly through the test authorization portal with your Maya account.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2 text-xs text-slate">
                  <Lock className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate" />
                  <span>
                    Your payment details are cryptographically secured. Concurrency locks reserve your provision inventory until payment completion.
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Order Summary & Place Order */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-white rounded-xl p-6 space-y-5 sticky top-24">
                <div className="pb-2 flex items-center justify-between">
                  <h2 className="text-base font-display font-semibold text-tide">Order Summary</h2>
                  <span className="text-xs font-normal text-slate">{items.length} items</span>
                </div>

                {/* Items List Snapshot */}
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.id} className="p-2.5 bg-mist/40 rounded-lg flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-tide truncate">{item.product.name}</p>
                        <p className="text-slate text-[11px]">Qty: {item.quantity} × {formatPrice(item.product.price_cents)}</p>
                      </div>
                      <span className="font-display font-semibold text-tide tabular-nums">
                        {item.formatted_line_total || formatPrice(item.line_total_cents)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Cost breakdown */}
                <div className="pt-2 space-y-2 text-xs sm:text-sm">
                  <div className="flex items-center justify-between text-slate">
                    <span>Provisions Subtotal</span>
                    <span className="font-semibold font-display text-tide tabular-nums">
                      {formatPrice(subtotalCents)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate">
                    <span>Coastal Shipping</span>
                    <span className="font-semibold font-display text-tide tabular-nums">
                      {shippingCents === 0 ? (
                        <span className="text-sea font-bold">FREE</span>
                      ) : (
                        formatPrice(shippingCents)
                      )}
                    </span>
                  </div>

                  <div className="p-3 bg-mist/60 rounded-lg flex items-center justify-between">
                    <span className="text-base font-display font-bold text-tide">Total Due</span>
                    <span className="text-2xl font-display font-bold text-harbor tabular-nums">
                      {formatPrice(totalCents)}
                    </span>
                  </div>
                </div>

                {/* Action button */}
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className="w-full h-12 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{paymentStepText || 'Processing...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete Order • {formatPrice(totalCents)}</span>
                    </>
                  )}
                </Button>

                <p className="text-[11px] text-center text-slate">
                  By clicking complete, you agree to TrueHarbor Terms of Maritime Sale. Stock reservation is valid for 30 minutes.
                </p>
              </div>
            </div>
          </form>
        )}
      </main>

      {/* GCash / Maya Interactive E-Wallet Modal */}
      {showWalletModal && pendingOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-sand animate-in fade-in zoom-in-95 duration-150">
            {/* Branded Header */}
            <div
              className={`p-6 text-white text-center relative ${
                paymentMethod === 'gcash' ? 'bg-[#007DFE]' : 'bg-[#00A859]'
              }`}
            >
              <button
                type="button"
                onClick={() => setShowWalletModal(false)}
                className="absolute right-4 top-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
              >
                <X size={20} />
              </button>

              <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-xs shadow-inner">
                {paymentMethod === 'gcash' ? (
                  <Smartphone size={24} className="text-white" />
                ) : (
                  <Wallet size={24} className="text-white" />
                )}
              </div>

              <h3 className="text-lg font-bold tracking-tight">
                {paymentMethod === 'gcash' ? 'GCash Express Pay' : 'Pay with Maya'}
              </h3>
              <p className="text-xs text-white/80 mt-0.5">TrueHarbor Coastal Provisions</p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              <div className="text-center p-4 bg-mist/60 rounded-xl border border-sand">
                <span className="text-xs text-slate uppercase tracking-wider block font-medium">
                  Amount to Pay
                </span>
                <span className="text-3xl font-display font-extrabold text-tide tabular-nums block mt-1">
                  {pendingOrder.formatted_total}
                </span>
                <span className="text-[11px] text-slate mt-0.5 block">
                  Order #{pendingOrder.id} • Ref: {pendingOrder.payment_intent_id?.slice(0, 16)}...
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-deep uppercase tracking-wider mb-1">
                  Connected Mobile Wallet
                </label>
                <div className="w-full h-10 px-3.5 bg-mist rounded-lg text-sm text-tide flex items-center justify-between font-mono">
                  <span>{walletPhone}</span>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Verified
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-deep uppercase tracking-wider">
                    {paymentMethod === 'gcash' ? '6-Digit MPIN / OTP' : '6-Digit OTP Code'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setWalletOtp('123456')}
                    className="text-[11px] text-harbor hover:underline font-medium"
                  >
                    Auto-fill Test Code
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={walletOtp}
                  onChange={(e) => setWalletOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-11 px-3 text-center text-xl tracking-[0.5em] font-mono rounded-lg border border-sand focus:ring-2 focus:ring-harbor outline-none"
                  placeholder="••••••"
                />
                <p className="text-[11px] text-slate mt-1 text-center">
                  Sandbox test environment: enter <strong className="text-deep font-mono">123456</strong> to simulate successful authorization.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmWalletPayment}
                  disabled={walletVerifying || walletOtp.length < 6}
                  className={`w-full h-12 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 ${
                    paymentMethod === 'gcash'
                      ? 'bg-[#007DFE] hover:bg-[#006ee0]'
                      : 'bg-[#00A859] hover:bg-[#00964f]'
                  }`}
                >
                  {walletVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying with {paymentMethod === 'gcash' ? 'GCash' : 'Maya'}...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Authorize Payment of {pendingOrder.formatted_total}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowWalletModal(false)}
                  disabled={walletVerifying}
                  className="w-full py-2 text-xs font-medium text-slate hover:text-tide transition text-center"
                >
                  Cancel and Return to Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
