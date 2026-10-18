import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Truck,
  AlertTriangle,
  Search,
  Plus,
  Minus,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  Edit2,
} from 'lucide-react';
import AdminNavbar from '../../components/admin/AdminNavbar';
import Button from '../../components/Button';
import StatusChip from '../../components/StatusChip';
import ImageUploader from '../../components/admin/ImageUploader';
import ProductGalleryManager from '../../components/admin/ProductGalleryManager';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { adminApi, type CreateProductInput } from '../../api/admin';
import { getCategories } from '../../api/catalog';
import { formatPrice, formatDate } from '../../utils/format';
import type { Order, Product, Category, OrderStatus } from '../../types/api';

type Tab = 'orders' | 'inventory' | 'alerts';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('orders');
  const toast = useToast();
  const { confirm } = useConfirm();

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orderSearch, setOrderSearch] = useState<string>('');
  const [updatingOrderId, setUpdatingOrderId] = useState<number | null>(null);

  // Products & Stock State
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productSearch, setProductSearch] = useState<string>('');
  const [updatingStockId, setUpdatingStockId] = useState<number | null>(null);

  // Low-Stock Alerts State
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  // Create Product Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateProductInput>({
    name: '',
    category_id: 1,
    description: '',
    price_cents: 100000,
    stock: 10,
    is_active: true,
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState<Partial<CreateProductInput>>({});
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      setEditSubmitting(true);
      setEditError(null);
      const updated = await adminApi.updateProduct(editingProduct.id, editForm);
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.success(`Provision "${updated.name}" updated successfully.`);
      setEditingProduct(null);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : 'Failed to update provision.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Fetch Orders
  const fetchOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      const res = await adminApi.getOrders(statusFilter, orderSearch);
      setOrders(res.data);
    } catch {
      // ignore
    } finally {
      setOrdersLoading(false);
    }
  }, [statusFilter, orderSearch]);

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      const res = await adminApi.getProducts(1, undefined, productSearch);
      setProducts(res.data);
    } catch {
      // ignore
    } finally {
      setProductsLoading(false);
    }
  }, [productSearch]);

  // Fetch Alerts
  const fetchAlerts = useCallback(async () => {
    try {
      setAlertsLoading(true);
      const data = await adminApi.getLowStockProducts();
      setLowStockProducts(data);
    } catch {
      // ignore
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'orders') void fetchOrders();
      if (activeTab === 'inventory') void fetchProducts();
      if (activeTab === 'alerts') void fetchAlerts();
    }, 0);

    return () => clearTimeout(timer);
  }, [activeTab, fetchOrders, fetchProducts, fetchAlerts]);

  // Order Status Transition Handler
  const handleStatusTransition = async (orderId: number, nextStatus: OrderStatus) => {
    if (nextStatus === 'cancelled') {
      const confirmed = await confirm({
        title: `Cancel Order #${orderId}?`,
        message: 'Are you sure you want to cancel this order? Reserved items will be restored to warehouse stock immediately.',
        confirmText: 'Yes, Cancel Order',
        cancelText: 'Keep Order',
        variant: 'danger',
      });
      if (!confirmed) return;
    }

    try {
      setUpdatingOrderId(orderId);
      const updated = await adminApi.updateOrderStatus(orderId, nextStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      toast.success(`Order #${orderId} transitioned to ${nextStatus.toUpperCase()}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Stock Quick Adjust Handler
  const handleStockAdjust = async (productId: number, newStock: number) => {
    if (newStock < 0) return;
    try {
      setUpdatingStockId(productId);
      const updated = await adminApi.updateProductStock(productId, newStock);
      setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
      setLowStockProducts((prev) => {
        if (newStock <= 5) {
          const exists = prev.some((p) => p.id === productId);
          return exists ? prev.map((p) => (p.id === productId ? updated : p)) : [...prev, updated];
        } else {
          return prev.filter((p) => p.id !== productId);
        }
      });
      toast.success(`Inventory updated: ${updated.name} (${newStock} in stock)`);
    } catch {
      toast.error('Unable to update warehouse stock quantity');
    } finally {
      setUpdatingStockId(null);
    }
  };

  // Create Product Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreateSubmitting(true);
      setCreateError(null);
      const newProduct = await adminApi.createProduct(createForm);
      setProducts((prev) => [newProduct, ...prev]);
      setIsCreateModalOpen(false);
      setCreateForm({
        name: '',
        category_id: categories[0]?.id || 1,
        description: '',
        price_cents: 100000,
        stock: 10,
        is_active: true,
      });
      toast.success(`Provision registered: ${newProduct.name}`);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <div className="min-h-svh flex flex-col bg-mist">
      <AdminNavbar />

      {/* Quarterdeck Editorial Command Banner */}
      <div className="relative bg-tide text-white overflow-hidden py-10 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img
            src="/assets/2016-11-13-01-kjeungskj-r-lighthouse.jpg"
            alt="TrueHarbor Maritime Operations"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6">
            <div>
              <nav className="flex items-center gap-2 text-xs text-mist/80 mb-2">
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
                <span>/</span>
                <span className="text-mist/80">Back Office</span>
                <span>/</span>
                <span className="text-white font-medium">Maritime Operations</span>
              </nav>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
                  Maritime Operations
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sand/30 text-sand flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sea" />
                  Quarterdeck Active
                </span>
              </div>
              <p className="text-sm text-mist/90 mt-2 max-w-xl">
                Port fulfillment queue, real-time provision inventory, and reserve replenishment.
              </p>
            </div>

            {/* Quick Telemetry Indicators */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/10 rounded-lg px-4 py-3 text-left">
                <span className="text-[11px] text-mist/80 uppercase font-semibold tracking-wider block">Queue</span>
                <span className="text-xl sm:text-2xl font-bold font-display text-white tabular-nums">
                  {orders.length}
                </span>
              </div>
              <div className="bg-white/10 rounded-lg px-4 py-3 text-left">
                <span className="text-[11px] text-mist/80 uppercase font-semibold tracking-wider block">Provisions</span>
                <span className="text-xl sm:text-2xl font-bold font-display text-white tabular-nums">
                  {products.length}
                </span>
              </div>
              <div className="bg-white/10 rounded-lg px-4 py-3 text-left">
                <span className="text-[11px] text-lantern uppercase font-semibold tracking-wider block">Alerts</span>
                <span className="text-xl sm:text-2xl font-bold font-display text-lantern tabular-nums">
                  {lowStockProducts.length}
                </span>
              </div>
            </div>
          </div>

          {/* Unified Quarterdeck Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'bg-harbor text-white'
                  : 'bg-white/10 text-mist hover:text-white hover:bg-white/15'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Fulfillment & Orders</span>
              {orders.length > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-white/20 text-mist'
                  }`}
                >
                  {orders.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                activeTab === 'inventory'
                  ? 'bg-harbor text-white'
                  : 'bg-white/10 text-mist hover:text-white hover:bg-white/15'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Provisions & Stock</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('alerts')}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
                activeTab === 'alerts'
                  ? 'bg-harbor text-white'
                  : 'bg-white/10 text-mist hover:text-white hover:bg-white/15'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-lantern" />
              <span>Stock Alerts</span>
              {lowStockProducts.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-lantern text-tide font-bold">
                  {lowStockProducts.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">

        {/* TAB 1: ORDERS FULFILLMENT */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="bg-white rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Status Chips Filter */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {['all', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-md font-semibold capitalize transition-colors ${
                      statusFilter === st
                        ? 'bg-tide text-white'
                        : 'bg-mist text-slate hover:text-tide'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  fetchOrders();
                }}
                className="relative min-w-[240px]"
              >
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Order ID or customer..."
                  className="w-full h-9 pl-9 pr-4 text-xs bg-mist rounded-md focus:outline-none focus:ring-1 focus:ring-harbor text-tide"
                />
                <Search className="w-4 h-4 text-slate absolute left-3 top-1/2 -translate-y-1/2" />
              </form>
            </div>

            {/* Orders List */}
            {ordersLoading ? (
              <div className="bg-white rounded-xl p-12 text-center text-slate text-sm">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-harbor" />
                Loading maritime fulfillment queue...
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center text-slate">
                <Truck className="w-12 h-12 mx-auto mb-3 text-slate stroke-1" />
                <h3 className="text-base font-semibold text-tide">No orders matching criteria</h3>
                <p className="text-xs text-slate mt-1">
                  Adjust status filters or search query to view customer receipts.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl p-5 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="font-display font-bold text-base text-tide tabular-nums">
                          #TH-{String(order.id).padStart(6, '0')}
                        </span>
                        <StatusChip status={order.status} />
                        <span className="text-xs text-slate">{formatDate(order.created_at)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate">Total Due:</span>
                        <span className="font-display font-bold text-base text-harbor tabular-nums">
                          {order.formatted_total}
                        </span>
                      </div>
                    </div>

                    {/* Customer & Address Details */}
                    <div className="p-4 bg-mist/50 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="block font-semibold text-tide mb-0.5">Recipient:</span>
                        <p className="text-slate">{order.shipping_address.name}</p>
                        <p className="text-slate">
                          {order.shipping_address.line1}
                          {order.shipping_address.line2 ? `, ${order.shipping_address.line2}` : ''}
                        </p>
                        <p className="text-slate">
                          {order.shipping_address.city}, {order.shipping_address.province}{' '}
                          {order.shipping_address.postal_code}
                        </p>
                        <p className="text-slate tabular-nums mt-0.5">Tel: {order.shipping_address.phone}</p>
                      </div>

                      <div>
                        <span className="block font-semibold text-tide mb-0.5">
                          Provisions ({order.items.length}):
                        </span>
                        <div className="space-y-1">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-slate">
                              <span className="truncate pr-2">
                                {item.quantity}× {item.product_name}
                              </span>
                              <span className="font-display font-medium tabular-nums shrink-0">
                                {item.formatted_line_total}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Fulfillment Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-xs text-harbor hover:underline font-semibold"
                      >
                        View Full Receipt →
                      </Link>

                      <div className="flex flex-wrap items-center gap-2">
                        {order.status === 'pending' && (
                          <>
                            <Button
                              variant="secondary"
                              disabled={updatingOrderId === order.id}
                              onClick={() => handleStatusTransition(order.id, 'paid')}
                              className="h-8 px-3 text-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-sea" />
                              <span>Mark as Paid</span>
                            </Button>
                            <Button
                              variant="destructive"
                              disabled={updatingOrderId === order.id}
                              onClick={() => handleStatusTransition(order.id, 'cancelled')}
                              className="h-8 px-3 text-xs"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancel Order</span>
                            </Button>
                          </>
                        )}

                        {order.status === 'paid' && (
                          <>
                            <Button
                              variant="primary"
                              disabled={updatingOrderId === order.id}
                              onClick={() => handleStatusTransition(order.id, 'shipped')}
                              className="h-8 px-3 text-xs"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Mark as Shipped</span>
                            </Button>
                            <Button
                              variant="destructive"
                              disabled={updatingOrderId === order.id}
                              onClick={() => handleStatusTransition(order.id, 'cancelled')}
                              className="h-8 px-3 text-xs"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancel & Refund</span>
                            </Button>
                          </>
                        )}

                        {order.status === 'shipped' && (
                          <Button
                            variant="primary"
                            disabled={updatingOrderId === order.id}
                            onClick={() => handleStatusTransition(order.id, 'delivered')}
                            className="h-8 px-3 text-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark as Delivered</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INVENTORY & STOCK */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Top Toolbar */}
            <div className="bg-white rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Filter provisions by title..."
                  className="w-full h-10 pl-9 pr-4 text-xs bg-mist rounded-md focus:outline-none focus:ring-1 focus:ring-harbor text-tide"
                />
                <Search className="w-4 h-4 text-slate absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              <Button
                variant="primary"
                onClick={() => setIsCreateModalOpen(true)}
                className="h-10 px-4 text-xs font-semibold"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Provision
              </Button>
            </div>

            {/* Products Inventory Grid/List */}
            {productsLoading ? (
              <div className="bg-white rounded-xl p-12 text-center text-slate text-sm">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-harbor" />
                Loading stock catalog...
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center text-slate">
                <Package className="w-12 h-12 mx-auto mb-3 text-slate stroke-1" />
                <h3 className="text-base font-semibold text-tide">No provisions found</h3>
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((product) => {
                  const isLow = (product.stock ?? 0) <= 5;
                  const imageUrl = product.image_url || product.image_path || '/placeholder-product.svg';

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      {/* Product details */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-16 h-16 bg-mist rounded-lg p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
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
                          <h3 className="text-sm font-semibold text-tide truncate">{product.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate">
                              {product.category?.name || 'Uncategorized'}
                            </span>
                            <span className="text-slate">·</span>
                            <span className="text-xs font-display font-semibold text-tide tabular-nums">
                              {product.formatted_price ?? formatPrice(product.price_cents)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stock Stepper & Status */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate">Live Stock:</span>
                          <div className="flex items-center bg-mist rounded-md">
                            <button
                              type="button"
                              onClick={() => handleStockAdjust(product.id, (product.stock ?? 0) - 1)}
                              disabled={updatingStockId === product.id || (product.stock ?? 0) <= 0}
                              className="p-1.5 text-slate hover:text-tide disabled:opacity-30"
                              aria-label="Decrement stock"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span
                              className={`w-10 text-center text-xs font-display font-bold tabular-nums ${
                                isLow ? 'text-lantern' : 'text-tide'
                              }`}
                            >
                              {product.stock ?? 0}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleStockAdjust(product.id, (product.stock ?? 0) + 1)}
                              disabled={updatingStockId === product.id}
                              className="p-1.5 text-slate hover:text-tide disabled:opacity-30"
                              aria-label="Increment stock"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {isLow ? (
                          <span className="text-[11px] font-bold bg-lantern text-tide px-2.5 py-1 rounded-full whitespace-nowrap">
                            Only {product.stock ?? 0} left
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-sea bg-sea/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                            Healthy Stock
                          </span>
                        )}

                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setEditingProduct(product);
                            setEditForm({
                              name: product.name,
                              category_id: product.category?.id || 1,
                              description: product.description || '',
                              price_cents: product.price_cents,
                              stock: product.stock ?? 0,
                              image_path: product.image_path || '',
                            });
                          }}
                          className="h-8 px-2.5 text-xs text-slate hover:text-harbor"
                          title="Edit provision and photo"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LOW-STOCK ALERTS */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-display font-semibold text-tide">
                  Inventory Depletion Watch
                </h2>
                <p className="text-xs text-slate mt-0.5">
                  Provisions with 5 or fewer units available. Replenish early to prevent catalog shortages.
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={fetchAlerts}
                className="h-9 px-3 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Refresh Alerts
              </Button>
            </div>

            {alertsLoading ? (
              <div className="bg-white rounded-xl p-12 text-center text-slate text-sm">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-harbor" />
                Scanning inventory levels...
              </div>
            ) : lowStockProducts.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center text-sea">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-sea stroke-1" />
                <h3 className="text-base font-semibold text-tide">All provisions adequately stocked!</h3>
                <p className="text-xs text-slate mt-1">No items currently at or below 5 units.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-lantern/20 flex items-center justify-center text-lantern shrink-0">
                        <AlertTriangle className="w-5 h-5 text-lantern" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-tide">{product.name}</h4>
                        <p className="text-xs text-slate">
                          {product.category?.name || 'Category'} ·{' '}
                          {product.formatted_price ?? formatPrice(product.price_cents)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="block text-[11px] text-slate">Current Stock:</span>
                        <span className="font-display font-bold text-sm text-lantern tabular-nums">
                          {product.stock ?? 0} unit(s)
                        </span>
                      </div>

                      <Button
                        variant="secondary"
                        disabled={updatingStockId === product.id}
                        onClick={() => handleStockAdjust(product.id, (product.stock ?? 0) + 20)}
                        className="h-9 px-3 text-xs font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Restock +20
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* CREATE PRODUCT MODAL */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-tide/50 transition-opacity"
            onClick={() => setIsCreateModalOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-white rounded-xl p-6 sm:p-8 space-y-5 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-bold text-tide">Add New Maritime Provision</h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-md text-slate hover:text-tide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs">{createError}</div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-tide mb-1">Provision Name</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Stormproof Maritime Coat"
                  className="w-full h-10 px-3 text-xs bg-mist rounded-md focus:outline-none focus:ring-1 focus:ring-harbor text-tide"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-tide mb-1">Category</label>
                  <select
                    value={createForm.category_id}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, category_id: parseInt(e.target.value, 10) })
                    }
                    className="w-full h-10 px-3 text-xs bg-mist rounded-md focus:outline-none focus:ring-1 focus:ring-harbor text-tide"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-tide mb-1">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={createForm.stock}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, stock: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full h-10 px-3 text-xs bg-mist rounded-md focus:outline-none focus:ring-1 focus:ring-harbor text-tide"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-tide mb-1">Price (in Centavos)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={createForm.price_cents}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, price_cents: parseInt(e.target.value, 10) || 0 })
                  }
                  placeholder="129000 = ₱1,290.00"
                  className="w-full h-10 px-3 text-xs bg-mist rounded-md focus:outline-none focus:ring-1 focus:ring-harbor text-tide"
                />
                <span className="text-[11px] text-slate mt-1 block">
                  Preview: {formatPrice(createForm.price_cents)}
                </span>
              </div>

              {/* Cloudinary Image Uploader */}
              <ImageUploader
                value={createForm.image_path}
                onChange={(url) => setCreateForm({ ...createForm, image_path: url })}
              />

              <div>
                <label className="block text-xs font-medium text-tide mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="Handcrafted coastal utility..."
                  className="w-full p-3 text-xs bg-mist rounded-md focus:outline-none focus:ring-1 focus:ring-harbor text-tide"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="h-9 px-4 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={createSubmitting}
                  className="h-9 px-5 text-xs font-semibold"
                >
                  {createSubmitting ? 'Registering...' : 'Register Provision'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-tide/50 transition-opacity"
            onClick={() => setEditingProduct(null)}
          />

          <div className="relative w-full max-w-lg bg-white rounded-xl p-6 sm:p-8 space-y-5 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-display font-bold text-tide">Edit Maritime Provision</h2>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1 rounded-md text-slate hover:text-tide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs">{editError}</div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-tide mb-1">Provision Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full h-10 px-3 text-xs bg-mist rounded-md focus:outline-none focus:ring-1 focus:ring-harbor text-tide"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-tide mb-1">Category</label>
                  <select
                    value={editForm.category_id ?? 1}
                    onChange={(e) =>
                      setEditForm({ ...editForm, category_id: parseInt(e.target.value, 10) })
                    }
                    className="w-full h-10 px-3 text-xs bg-mist rounded-md focus:outline-none focus:ring-1 focus:ring-harbor text-tide"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-tide mb-1">Live Stock</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editForm.stock ?? 0}
                    onChange={(e) =>
                      setEditForm({ ...editForm, stock: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full h-10 px-3 text-xs bg-mist rounded-md focus:outline-none focus:ring-1 focus:ring-harbor text-tide"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-tide mb-1">Price (in Centavos)</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editForm.price_cents ?? 0}
                  onChange={(e) =>
                    setEditForm({ ...editForm, price_cents: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full h-10 px-3 text-xs bg-mist rounded-md focus:outline-none focus:ring-1 focus:ring-harbor text-tide"
                />
                <span className="text-[11px] text-slate mt-1 block">
                  Preview: {formatPrice(editForm.price_cents ?? 0)}
                </span>
              </div>

              {/* Multi-Angle Product Gallery Manager */}
              <ProductGalleryManager
                product={editingProduct}
                onUpdate={(updated) => {
                  setEditingProduct(updated);
                  setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                  setEditForm((f) => ({ ...f, image_path: updated.image_path ?? null }));
                }}
              />

              <div>
                <label className="block text-xs font-medium text-tide mb-1">Description</label>
                <textarea
                  required
                  rows={3}
                  value={editForm.description ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full p-3 text-xs bg-mist rounded-md focus:outline-none focus:ring-1 focus:ring-harbor text-tide"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingProduct(null)}
                  className="h-9 px-4 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={editSubmitting}
                  className="h-9 px-5 text-xs font-semibold"
                >
                  {editSubmitting ? 'Saving Changes...' : 'Save Provision Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quarterdeck Operations Footer */}
      <footer className="bg-tide text-mist py-8 px-4 sm:px-6 lg:px-8 mt-auto" data-ui="admin-footer">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-white">TrueHarbor Quarterdeck</span>
            <span className="text-slate">•</span>
            <span>Port Fulfillment Hub</span>
            <span className="text-slate">•</span>
            <span>Atomic Stock Lock Protected</span>
          </div>
          <div className="flex items-center gap-4 text-slate">
            <span>PostgreSQL & Stripe Verified</span>
            <Link to="/products" className="text-mist hover:text-white transition-colors">
              Storefront Preview ↗
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
