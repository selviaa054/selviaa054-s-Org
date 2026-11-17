import { Package, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import type { Order, OrderStatus } from '../types.ts';
import { formatDate, formatIDR, getStatusLabelStyle } from '../utils/format.ts';
import { SnackImage } from './SnackImage.tsx';

interface OrderHistoryViewProps {
  onGoToAuth: () => void;
  onGoToShop: () => void;
}

const PROGRESS_STEPS: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered'];

export function OrderHistoryView({ onGoToAuth, onGoToShop }: OrderHistoryViewProps) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMyOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load order history.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  if (!user) {
    return (
      <section className="max-w-lg mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-2xl border border-[#EFE1EA] bg-white p-8 text-center">
          <Package className="w-9 h-9 text-[#BE3E6E] mx-auto mb-3" strokeWidth={1.5} />
          <h1 className="font-display text-2xl font-semibold text-[#2B1D26] mb-2">
            Sign in to track your orders
          </h1>
          <p className="text-sm text-[#6E5A67] mb-6">
            View past snack purchases, payment details, and live packing status.
          </p>
          <button
            type="button"
            onClick={onGoToAuth}
            className="px-6 py-3 rounded-lg bg-[#BE3E6E] hover:bg-[#A4325D] text-white text-sm font-semibold cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-medium text-[#8B5E78] mb-1">
            Customer Account · {user.email}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#2B1D26]">
            My Snack Orders
          </h1>
        </div>

        <button
          type="button"
          onClick={() => void loadOrders()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E8D7E2] bg-white text-xs font-semibold text-[#2B1D26] hover:bg-[#FDF2F7] cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-[#F3C6D4] bg-[#FFF2F6] p-4 text-sm text-[#9D2954] mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl border border-[#EFE1EA] bg-white animate-pulse"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-[#EFE1EA] bg-white p-12 text-center">
          <p className="font-display text-lg font-medium text-[#2B1D26] mb-1">
            No orders placed yet
          </p>
          <p className="text-sm text-[#6E5A67] mb-5">
            Your snack order receipts and shipment status will appear here once you check out.
          </p>
          <button
            type="button"
            onClick={onGoToShop}
            className="px-5 py-2.5 rounded-lg bg-[#BE3E6E] text-white text-xs font-semibold hover:bg-[#A4325D] cursor-pointer"
          >
            Browse Snacks
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const statusInfo = getStatusLabelStyle(order.status);
            const activeStepIdx = PROGRESS_STEPS.indexOf(order.status);

            return (
              <article
                key={order.id}
                className="rounded-2xl border border-[#EFE1EA] bg-white p-5 sm:p-6 space-y-5"
              >
                {/* Top Metadata Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#F4EAF0]">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#6E5A67]">
                      <span className="font-mono font-semibold text-[#2B1D26]">
                        {order.order_number}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{formatDate(order.created_at)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{order.payment_method}</span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className={`text-xs font-semibold ${statusInfo.textColor}`}>
                      {order.status} · {statusInfo.description}
                    </span>
                  </div>
                </div>

                {/* Progress Stepper (when not cancelled) */}
                {order.status !== 'Cancelled' && (
                  <div className="grid grid-cols-4 gap-2">
                    {PROGRESS_STEPS.map((step, idx) => {
                      const reached = idx <= activeStepIdx;
                      return (
                        <div key={step} className="space-y-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-colors ${
                              reached ? 'bg-[#BE3E6E]' : 'bg-[#F1E4EC]'
                            }`}
                          />
                          <p
                            className={`text-[11px] font-medium ${
                              reached ? 'text-[#2B1D26]' : 'text-[#9D8593]'
                            }`}
                          >
                            {step}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Order Items */}
                <div className="divide-y divide-[#F7EEF3]">
                  {order.items.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-[#F4EAF0] p-1 shrink-0">
                        <SnackImage
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#2B1D26] truncate">
                          {item.product_name}
                        </p>
                        <p className="text-xs text-[#7D6674] tabular-nums">
                          {item.quantity} × {formatIDR(item.unit_price)}
                        </p>
                      </div>
                      <p className="font-mono text-sm font-medium text-[#2B1D26] tabular-nums">
                        {formatIDR(item.subtotal)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Shipping & Total Footer */}
                <div className="pt-3 border-t border-[#F4EAF0] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#6E5A67]">
                  <p>
                    Ship to: {order.shipping_address}, {order.shipping_city} {order.postal_code}
                  </p>
                  <p className="text-sm font-semibold text-[#2B1D26]">
                    Total:{' '}
                    <span className="font-mono tabular-nums">{formatIDR(order.total_amount)}</span>
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
