import {
  Edit3,
  Package,
  Plus,
  Search,
  ShieldAlert,
  ShoppingBag,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import type {
  AdminStats,
  Order,
  OrderStatus,
  Product,
  ProductCategory,
  ProductInput,
  UserProfile,
  UserRole,
} from '../types.ts';
import { formatDate, formatIDR, getStatusLabelStyle } from '../utils/format.ts';
import { SnackImage } from './SnackImage.tsx';

interface AdminDashboardProps {
  onReturnToShop: () => void;
  onProductsChanged: () => void;
}

type AdminTab = 'products' | 'orders' | 'users';

const CATEGORIES: ProductCategory[] = [
  'Chiki & Puffs',
  'Chips & Savory',
  'Sweet Snacks',
  'Drinks & Milk',
];

const ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
];

const IMAGE_PRESETS = [
  {
    label: "Garuda O'Corn",
    url: '/assets/aistudio/WhatsApp_Imag_2026-11-17_at_13.09.59_64a9d300.jpeg',
  },
  {
    label: 'Taro Net BBQ',
    url: '/assets/aistudio/WhatsAp_Image_2026-11-17_at_13.10.00_3fc2fd98.jpeg',
  },
  {
    label: 'Chitato Lite',
    url: '/assets/aistudio/WhatsApp_Image_2026-11-17_at_13.09.58_651d355d.jpeg',
  },
  {
    label: 'Oishi Popcorn',
    url: '/assets/aistudio/WhatsApp_Ige_2026-11-17_at_13.10.00_26e0537c.jpeg',
  },
  {
    label: 'Oatside Choco',
    url: '/assets/aistudio/WhatsApp_Image_2026-11-17_at_13.11.09_4dde3e8e.jpeg',
  },
  {
    label: 'Nutriboost',
    url: '/assets/aistudio/WhatsApp_Image_2026-11-17_at_13.11.10__1__1546fcd8.jpeg',
  },
];

const EMPTY_FORM: ProductInput = {
  name: '',
  category: 'Chiki & Puffs',
  description: '',
  price: 12000,
  weight: '75g',
  stock: 25,
  image_url: IMAGE_PRESETS[0].url,
  flavor_notes: '',
  is_featured: false,
};

export function AdminDashboard({ onReturnToShop, onProductsChanged }: AdminDashboardProps) {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('products');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [productSearch, setProductSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'All' | OrderStatus>('All');

  // Product modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formState, setFormState] = useState<ProductInput>(EMPTY_FORM);
  const [savingProduct, setSavingProduct] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadAdminData = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    setLoading(true);
    setError(null);
    try {
      const [statsRes, productsRes, ordersRes, usersRes] = await Promise.all([
        api.getAdminStats(),
        api.getProducts(),
        api.getAllOrders(),
        api.getAllUsers(),
      ]);
      setStats(statsRes);
      setProducts(productsRes);
      setOrders(ordersRes);
      setUsers(usersRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load admin workspace.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin') {
      void loadAdminData();
    }
  }, [user, loadAdminData]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }, [products, productSearch]);

  const filteredOrders = useMemo(() => {
    if (orderStatusFilter === 'All') return orders;
    return orders.filter((o) => o.status === orderStatusFilter);
  }, [orders, orderStatusFilter]);

  // STRICT ROLE-BASED ACCESS CONTROL GUARD
  if (authLoading) {
    return (
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="h-48 rounded-2xl border border-[#EFE1EA] bg-white animate-pulse" />
      </section>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <section className="max-w-lg mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-2xl border border-[#F3C6D4] bg-white p-8 text-center">
          <ShieldAlert className="w-10 h-10 text-[#BE3E6E] mx-auto mb-3" strokeWidth={1.6} />
          <p className="font-mono text-xs font-medium text-[#9D2954] mb-1">
            403 · Access Restricted
          </p>
          <h1 className="font-display text-2xl font-semibold text-[#2B1D26] mb-2">
            Administrator Privileges Required
          </h1>
          <p className="text-sm text-[#6E5A67] mb-6">
            This store management dashboard is strictly protected and only accessible to verified
            administrator accounts.
          </p>
          <button
            type="button"
            onClick={onReturnToShop}
            className="px-6 py-3 rounded-lg bg-[#BE3E6E] hover:bg-[#A4325D] text-white text-sm font-semibold cursor-pointer"
          >
            Return to Storefront
          </button>
        </div>
      </section>
    );
  }

  const openAddModal = () => {
    setEditingProduct(null);
    setFormState(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormState({
      name: product.name,
      category: product.category,
      description: product.description,
      price: product.price,
      weight: product.weight,
      stock: product.stock,
      image_url: product.image_url,
      flavor_notes: product.flavor_notes,
      is_featured: product.is_featured,
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);
    setError(null);
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, formState);
      } else {
        await api.createProduct(formState);
      }
      setIsModalOpen(false);
      await loadAdminData();
      onProductsChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save snack.');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setError(null);
    try {
      await api.deleteProduct(productId);
      setConfirmDeleteId(null);
      await loadAdminData();
      onProductsChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete product.');
    }
  };

  const handleOrderStatusChange = async (orderId: string, status: OrderStatus) => {
    setError(null);
    try {
      const updated = await api.updateOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      const newStats = await api.getAdminStats();
      setStats(newStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update order status.');
    }
  };

  const handleRoleToggle = async (targetUser: UserProfile) => {
    const nextRole: UserRole = targetUser.role === 'admin' ? 'user' : 'admin';
    setError(null);
    try {
      const updated = await api.updateUserRole(targetUser.id, nextRole);
      setUsers((prev) => prev.map((u) => (u.id === targetUser.id ? updated : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update user role.');
    }
  };

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-medium text-[#8B5E78] mb-1">
            Store Administration · Signed in as {user.full_name}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#2B1D26]">
            ChikiSel Admin Console
          </h1>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#BE3E6E] hover:bg-[#A4325D] text-white text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Snack</span>
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-[#F3C6D4] bg-[#FFF2F6] px-4 py-3 text-xs sm:text-sm text-[#9D2954] mb-6"
        >
          {error}
        </div>
      )}

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-[#EFE1EA] bg-white p-5">
          <p className="text-xs text-[#6E5A67] mb-1">Total Revenue</p>
          <p className="font-mono text-xl sm:text-2xl font-semibold text-[#2B1D26] tabular-nums">
            {stats ? formatIDR(stats.totalRevenue) : '—'}
          </p>
          <p className="text-[11px] text-[#7D6674] mt-1">Excludes cancelled orders</p>
        </div>

        <div className="rounded-xl border border-[#EFE1EA] bg-white p-5">
          <p className="text-xs text-[#6E5A67] mb-1">Total Orders</p>
          <p className="font-mono text-xl sm:text-2xl font-semibold text-[#2B1D26] tabular-nums">
            {stats ? stats.totalOrders : '—'}
          </p>
          <p className="text-[11px] text-[#7D6674] mt-1 tabular-nums">
            {stats ? `${stats.pendingOrders} awaiting action` : ''}
          </p>
        </div>

        <div className="rounded-xl border border-[#EFE1EA] bg-white p-5">
          <p className="text-xs text-[#6E5A67] mb-1">Catalog Snacks</p>
          <p className="font-mono text-xl sm:text-2xl font-semibold text-[#2B1D26] tabular-nums">
            {stats ? stats.totalProducts : '—'}
          </p>
          <p className="text-[11px] text-[#7D6674] mt-1 tabular-nums">
            {stats ? `${stats.lowStockProducts} low stock` : ''}
          </p>
        </div>

        <div className="rounded-xl border border-[#EFE1EA] bg-white p-5">
          <p className="text-xs text-[#6E5A67] mb-1">Registered Users</p>
          <p className="font-mono text-xl sm:text-2xl font-semibold text-[#2B1D26] tabular-nums">
            {stats ? stats.totalUsers : '—'}
          </p>
          <p className="text-[11px] text-[#7D6674] mt-1">Customers &amp; admins</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#F6ECF2] rounded-xl overflow-x-auto mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'products' ? 'bg-white text-[#2B1D26] shadow-xs' : 'text-[#6E5A67]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Products ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'orders' ? 'bg-white text-[#2B1D26] shadow-xs' : 'text-[#6E5A67]'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Orders ({orders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'users' ? 'bg-white text-[#2B1D26] shadow-xs' : 'text-[#6E5A67]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users ({users.length})</span>
        </button>
      </div>

      {/* TAB 1: PRODUCTS CRUD */}
      {activeTab === 'products' && (
        <div className="rounded-2xl border border-[#EFE1EA] bg-white overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#F1E4EC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-[#2B1D26]">
              Snack Inventory
            </h2>
            <div className="relative sm:w-64">
              <Search className="w-4 h-4 text-[#8A6D7E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Filter inventory..."
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#E8D7E2] text-xs text-[#2B1D26] focus:border-[#BE3E6E] focus:outline-none"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-[#6E5A67]">Loading inventory...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#F1E4EC] bg-[#FFF9FB] text-[11px] font-semibold text-[#6E5A67]">
                    <th className="py-3 px-4">Snack</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Price</th>
                    <th className="py-3 px-4 text-right">Stock</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F7EEF3] text-sm">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-[#FFF9FB]">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-lg overflow-hidden bg-white border border-[#F4EAF0] p-1 shrink-0">
                            <SnackImage
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-[#2B1D26]">{product.name}</p>
                            <p className="text-xs text-[#7D6674]">{product.weight}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#5E4B56]">{product.category}</td>
                      <td className="py-3 px-4 text-right font-mono text-xs font-medium text-[#2B1D26] tabular-nums">
                        {formatIDR(product.price)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs tabular-nums">
                        <span
                          className={
                            product.stock <= 10 ? 'text-[#B45309] font-semibold' : 'text-[#2B1D26]'
                          }
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {confirmDeleteId === product.id ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => void handleDeleteProduct(product.id)}
                              className="px-2.5 py-1 rounded bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2.5 py-1 rounded border border-[#E8D7E2] text-xs text-[#6E5A67] cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(product)}
                              aria-label={`Edit ${product.name}`}
                              className="p-2 rounded-lg text-[#5E4B56] hover:bg-[#FDF2F7] hover:text-[#BE3E6E] cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(product.id)}
                              aria-label={`Delete ${product.name}`}
                              className="p-2 rounded-lg text-[#5E4B56] hover:bg-[#FFF2F6] hover:text-[#B91C1C] cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INCOMING ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 p-1 bg-white border border-[#EFE1EA] rounded-xl overflow-x-auto">
            {(['All', ...ORDER_STATUSES] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setOrderStatusFilter(status)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                  orderStatusFilter === status
                    ? 'bg-[#FDF2F7] text-[#BE3E6E]'
                    : 'text-[#6E5A67] hover:text-[#2B1D26]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="rounded-2xl border border-[#EFE1EA] bg-white p-10 text-center text-sm text-[#6E5A67]">
              No orders in this status.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const statusStyle = getStatusLabelStyle(order.status);
              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-[#EFE1EA] bg-white p-5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F4EAF0]">
                    <div>
                      <p className="text-xs text-[#6E5A67]">
                        <span className="font-mono font-semibold text-[#2B1D26]">
                          {order.order_number}
                        </span>{' '}
                        · {formatDate(order.created_at)} · {order.payment_method}
                      </p>
                      <p className="text-sm font-semibold text-[#2B1D26] mt-0.5">
                        {order.customer_name} · {order.customer_phone}
                      </p>
                      <p className="text-xs text-[#6E5A67]">
                        {order.shipping_address}, {order.shipping_city} {order.postal_code}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-semibold ${statusStyle.textColor}`}>
                        {order.status}
                      </span>
                      <select
                        aria-label={`Update status for ${order.order_number}`}
                        value={order.status}
                        onChange={(e) =>
                          void handleOrderStatusChange(order.id, e.target.value as OrderStatus)
                        }
                        className="h-9 px-3 rounded-lg border border-[#E8D7E2] bg-[#FFF9FB] text-xs font-medium text-[#2B1D26] cursor-pointer"
                      >
                        {ORDER_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#5E4B56]">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between">
                        <span>
                          {item.quantity}× {item.product_name}
                        </span>
                        <span className="font-mono tabular-nums">{formatIDR(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-[#F7EEF3] flex items-center justify-between text-xs">
                    <span className="text-[#7D6674] italic">
                      {order.notes ? `Note: "${order.notes}"` : 'No order note'}
                    </span>
                    <span className="font-mono text-sm font-semibold text-[#2B1D26] tabular-nums">
                      {formatIDR(order.total_amount)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="rounded-2xl border border-[#EFE1EA] bg-white overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#F1E4EC]">
            <h2 className="font-display text-lg font-semibold text-[#2B1D26]">
              Registered Accounts &amp; Roles
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#F1E4EC] bg-[#FFF9FB] text-[11px] font-semibold text-[#6E5A67]">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-right">Access Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7EEF3] text-sm">
                {users.map((u) => {
                  const isSelf = u.id === user.id;
                  return (
                    <tr key={u.id} className="hover:bg-[#FFF9FB]">
                      <td className="py-3 px-4 font-medium text-[#2B1D26]">{u.full_name}</td>
                      <td className="py-3 px-4 text-xs text-[#5E4B56]">{u.email}</td>
                      <td className="py-3 px-4 text-xs text-[#6E5A67]">{u.city || '—'}</td>
                      <td className="py-3 px-4 text-xs font-semibold">
                        <span className={u.role === 'admin' ? 'text-[#53389E]' : 'text-[#5E4B56]'}>
                          {u.role === 'admin' ? 'Admin' : 'Customer'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          disabled={isSelf}
                          onClick={() => void handleRoleToggle(u)}
                          className="px-3 py-1.5 rounded-lg border border-[#E8D7E2] text-xs font-semibold text-[#2B1D26] hover:bg-[#FDF2F7] disabled:opacity-40 cursor-pointer"
                        >
                          {isSelf
                            ? 'Active Admin'
                            : u.role === 'admin'
                              ? 'Set as Customer'
                              : 'Promote to Admin'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT SNACK MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={editingProduct ? 'Edit Snack Product' : 'Add New Snack Product'}
        >
          <div
            className="fixed inset-0 bg-[#2B1D26]/40 backdrop-blur-[2px]"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[#EFE1EA] bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#F1E4EC]">
              <h2 className="font-display text-xl font-semibold text-[#2B1D26]">
                {editingProduct ? 'Edit Snack Details' : 'Add New Snack'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-[#6E5A67] hover:bg-[#FDF2F7] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#2B1D26] mb-1">
                  Snack Name
                </label>
                <input
                  type="text"
                  required
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  placeholder="Peach Yogurt Puffs"
                  className="w-full h-10 px-3 rounded-lg border border-[#E8D7E2] text-sm text-[#2B1D26] focus:border-[#BE3E6E] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2B1D26] mb-1">
                    Category
                  </label>
                  <select
                    value={formState.category}
                    onChange={(e) =>
                      setFormState({ ...formState, category: e.target.value as ProductCategory })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-[#E8D7E2] text-sm text-[#2B1D26] bg-white focus:border-[#BE3E6E] focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2B1D26] mb-1">
                    Net Weight
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.weight}
                    onChange={(e) => setFormState({ ...formState, weight: e.target.value })}
                    placeholder="85g"
                    className="w-full h-10 px-3 rounded-lg border border-[#E8D7E2] text-sm text-[#2B1D26] focus:border-[#BE3E6E] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2B1D26] mb-1">
                    Price (IDR)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={500}
                    value={formState.price}
                    onChange={(e) =>
                      setFormState({ ...formState, price: Number(e.target.value) })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-[#E8D7E2] font-mono text-sm text-[#2B1D26] focus:border-[#BE3E6E] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2B1D26] mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formState.stock}
                    onChange={(e) =>
                      setFormState({ ...formState, stock: Number(e.target.value) })
                    }
                    className="w-full h-10 px-3 rounded-lg border border-[#E8D7E2] font-mono text-sm text-[#2B1D26] focus:border-[#BE3E6E] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B1D26] mb-1">
                  Photo URL (or pick a studio preset below)
                </label>
                <input
                  type="text"
                  required
                  value={formState.image_url}
                  onChange={(e) => setFormState({ ...formState, image_url: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-[#E8D7E2] text-xs text-[#2B1D26] focus:border-[#BE3E6E] focus:outline-none mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  {IMAGE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setFormState({ ...formState, image_url: preset.url })}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium border cursor-pointer ${
                        formState.image_url === preset.url
                          ? 'border-[#BE3E6E] bg-[#FDF2F7] text-[#BE3E6E]'
                          : 'border-[#E8D7E2] text-[#6E5A67]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B1D26] mb-1">
                  Flavor Notes
                </label>
                <input
                  type="text"
                  value={formState.flavor_notes}
                  onChange={(e) => setFormState({ ...formState, flavor_notes: e.target.value })}
                  placeholder="Creamy berry glaze, light baked crunch"
                  className="w-full h-10 px-3 rounded-lg border border-[#E8D7E2] text-sm text-[#2B1D26] focus:border-[#BE3E6E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B1D26] mb-1">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  placeholder="Describe ingredients, texture, and pairing notes..."
                  className="w-full p-3 rounded-lg border border-[#E8D7E2] text-sm text-[#2B1D26] focus:border-[#BE3E6E] focus:outline-none"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-[#2B1D26] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formState.is_featured}
                  onChange={(e) => setFormState({ ...formState, is_featured: e.target.checked })}
                  className="w-4 h-4 accent-[#BE3E6E]"
                />
                <span>Mark as Featured Favorite</span>
              </label>

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 h-10 rounded-lg border border-[#E8D7E2] text-xs font-semibold text-[#6E5A67] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-5 h-10 rounded-lg bg-[#BE3E6E] hover:bg-[#A4325D] text-white text-xs font-semibold cursor-pointer"
                >
                  {savingProduct ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Snack'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
