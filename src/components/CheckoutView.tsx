import { ArrowLeft, Check, CheckCircle2, Copy, Lock, QrCode, Smartphone } from 'lucide-react';
import QRCode from 'qrcode';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { api } from '../services/api.ts';
import type { Order, PaymentMethod } from '../types.ts';
import { formatDate, formatIDR } from '../utils/format.ts';
import { SnackImage } from './SnackImage.tsx';

interface CheckoutViewProps {
  onBackToShop: () => void;
  onGoToAuth: () => void;
  onGoToOrders: () => void;
  onOrderSuccess: () => void;
}

const QRIS_MERCHANT_NUMBER = '089682821667';
const QRIS_MERCHANT_NAME = 'ChikiSel Store';

export function CheckoutView({
  onBackToShop,
  onGoToAuth,
  onGoToOrders,
  onOrderSuccess,
}: CheckoutViewProps) {
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCart();

  const [customerName, setCustomerName] = useState(user?.full_name || '');
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [shippingAddress, setShippingAddress] = useState(user?.address || '');
  const [shippingCity, setShippingCity] = useState(user?.city || '');
  const [postalCode, setPostalCode] = useState(user?.postal_code || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('QRIS');
  const [notes, setNotes] = useState('');

  const [showQrisStep, setShowQrisStep] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedNumber, setCopiedNumber] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (user) {
      setCustomerName((prev) => prev || user.full_name || '');
      setCustomerPhone((prev) => prev || user.phone || '');
      setShippingAddress((prev) => prev || user.address || '');
      setShippingCity((prev) => prev || user.city || '');
      setPostalCode((prev) => prev || user.postal_code || '');
    }
  }, [user]);

  useEffect(() => {
    if (!showQrisStep) return;
    const payload = `00020101021226580014ID.CO.CHIKISEL0115${QRIS_MERCHANT_NUMBER}52045499530336054${subtotal}5802ID5916${QRIS_MERCHANT_NAME}6304`;
    QRCode.toDataURL(payload, {
      width: 260,
      margin: 2,
      color: {
        dark: '#2B1D26',
        light: '#FFFFFF',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(''));
  }, [showQrisStep, subtotal]);

  const handleCopyNumber = async () => {
    try {
      await navigator.clipboard.writeText(QRIS_MERCHANT_NUMBER);
      setCopiedNumber(true);
      setTimeout(() => setCopiedNumber(false), 1800);
    } catch {
      // Clipboard not available
    }
  };

  const finalizeOrder = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const created = await api.createOrder({
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        shipping_address: shippingAddress.trim(),
        shipping_city: shippingCity.trim(),
        postal_code: postalCode.trim(),
        payment_method: paymentMethod,
        notes: notes.trim(),
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
        })),
      });
      clearCart();
      setShowQrisStep(false);
      setConfirmedOrder(created);
      onOrderSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    return (
      <section className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="rounded-2xl border border-[#EFE1EA] bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3 text-[#15803D] mb-4">
            <CheckCircle2 className="w-7 h-7 shrink-0" />
            <div>
              <p className="text-xs font-medium text-[#6E5A67]">
                Order {confirmedOrder.order_number} Confirmed
              </p>
              <h1 className="font-display text-2xl font-semibold text-[#2B1D26]">
                Thank you, {confirmedOrder.customer_name}
              </h1>
            </div>
          </div>

          <p className="text-sm text-[#5E4B56] mb-6">
            {confirmedOrder.payment_method === 'QRIS'
              ? 'Your QRIS payment has been verified and your snacks are queued for packing.'
              : 'Your Cash on Delivery order has been saved and queued for packing.'}{' '}
            You can track live status updates anytime in My Orders.
          </p>

          <div className="rounded-xl border border-[#F1E4EC] bg-[#FFF9FB] p-4 space-y-2 text-xs text-[#5E4B56] mb-6">
            <div className="flex justify-between">
              <span>Order Number</span>
              <span className="font-mono font-medium text-[#2B1D26]">
                {confirmedOrder.order_number}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Date</span>
              <span className="tabular-nums">{formatDate(confirmedOrder.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Method</span>
              <span className="font-medium text-[#2B1D26]">
                {confirmedOrder.payment_method === 'QRIS'
                  ? `QRIS (${QRIS_MERCHANT_NUMBER})`
                  : 'Cash on Delivery (COD)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Deliver To</span>
              <span className="text-right text-[#2B1D26] max-w-[60%]">
                {confirmedOrder.shipping_address}, {confirmedOrder.shipping_city}{' '}
                {confirmedOrder.postal_code}
              </span>
            </div>
            <div className="pt-2 border-t border-[#EFE1EA] flex justify-between text-sm font-semibold text-[#2B1D26]">
              <span>Total</span>
              <span className="font-mono tabular-nums">{formatIDR(confirmedOrder.total_amount)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onGoToOrders}
              className="flex-1 h-11 rounded-lg bg-[#BE3E6E] hover:bg-[#A4325D] text-white text-sm font-semibold cursor-pointer"
            >
              Track My Order
            </button>
            <button
              type="button"
              onClick={onBackToShop}
              className="flex-1 h-11 rounded-lg border border-[#E5C7D6] text-[#2B1D26] hover:bg-[#FDF2F7] text-sm font-semibold cursor-pointer"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="max-w-lg mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-2xl border border-[#EFE1EA] bg-white p-8 text-center">
          <Lock className="w-8 h-8 text-[#BE3E6E] mx-auto mb-3" />
          <h1 className="font-display text-2xl font-semibold text-[#2B1D26] mb-2">
            Sign in to complete checkout
          </h1>
          <p className="text-sm text-[#6E5A67] mb-6">
            Your snack bag is saved. Sign in or create a free customer account so we can attach your
            order history and shipping updates.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={onGoToAuth}
              className="px-6 py-3 rounded-lg bg-[#BE3E6E] hover:bg-[#A4325D] text-white text-sm font-semibold cursor-pointer"
            >
              Sign In or Register
            </button>
            <button
              type="button"
              onClick={onBackToShop}
              className="px-6 py-3 rounded-lg border border-[#E5C7D6] text-[#2B1D26] hover:bg-[#FDF2F7] text-sm font-semibold cursor-pointer"
            >
              Back to Catalog
            </button>
          </div>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="max-w-lg mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="rounded-2xl border border-[#EFE1EA] bg-white p-8">
          <h1 className="font-display text-2xl font-semibold text-[#2B1D26] mb-2">
            Your bag is currently empty
          </h1>
          <p className="text-sm text-[#6E5A67] mb-6">
            Add your favorite snacks before heading to checkout.
          </p>
          <button
            type="button"
            onClick={onBackToShop}
            className="px-6 py-3 rounded-lg bg-[#BE3E6E] hover:bg-[#A4325D] text-white text-sm font-semibold cursor-pointer"
          >
            Browse Snacks
          </button>
        </div>
      </section>
    );
  }

  // INTERACTIVE QRIS PAYMENT SIMULATION VIEW
  if (showQrisStep) {
    return (
      <section className="max-w-xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <button
          type="button"
          onClick={() => {
            setShowQrisStep(false);
            setError(null);
          }}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#6E5A67] hover:text-[#BE3E6E] mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Shipping Details</span>
        </button>

        <div className="rounded-2xl border border-[#EFE1EA] bg-white p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4 pb-4 mb-6 border-b border-[#F1E4EC]">
            <div>
              <p className="text-xs font-medium text-[#8B5E78] mb-1">
                QRIS Instant Payment
              </p>
              <h1 className="font-display text-2xl font-semibold text-[#2B1D26]">
                Scan QRIS to Pay
              </h1>
            </div>
            <QrCode className="w-7 h-7 text-[#BE3E6E] shrink-0" strokeWidth={1.6} />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-[#F3C6D4] bg-[#FFF2F6] px-4 py-3 text-xs sm:text-sm text-[#9D2954] mb-5"
            >
              {error}
            </div>
          )}

          {/* QR Code Card */}
          <div className="rounded-2xl border border-[#EFE1EA] bg-[#FFF9FB] p-6 text-center mb-6">
            <p className="text-xs font-semibold text-[#2B1D26] tracking-wide mb-0.5">
              {QRIS_MERCHANT_NAME}
            </p>
            <p className="font-mono text-[11px] text-[#7D6674] mb-4">
              NMID: ID10202608968282 · DANA / OVO / GoPay / ShopeePay
            </p>

            <div className="inline-flex items-center justify-center p-3 rounded-xl bg-white border border-[#EFE1EA] mb-4">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QRIS payment code for ${QRIS_MERCHANT_NUMBER}`}
                  className="w-52 h-52 sm:w-56 sm:h-56"
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center text-xs text-[#6E5A67]">
                  Generating QRIS code...
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs text-[#6E5A67]">Total Payment</p>
              <p className="font-mono text-2xl font-semibold text-[#2B1D26] tabular-nums">
                {formatIDR(subtotal)}
              </p>
            </div>
          </div>

          {/* Merchant E-Wallet / QRIS Phone Number Box */}
          <div className="rounded-xl border border-[#EFE1EA] bg-white p-4 flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-[#FDF2F7] text-[#BE3E6E] flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-[#7D6674]">QRIS / E-Wallet Number</p>
                <p className="font-mono text-sm font-semibold text-[#2B1D26] tabular-nums">
                  {QRIS_MERCHANT_NUMBER}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleCopyNumber()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#E8D7E2] hover:bg-[#FDF2F7] text-xs font-semibold text-[#2B1D26] shrink-0 cursor-pointer"
            >
              {copiedNumber ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#15803D]" />
                  <span className="text-[#15803D]">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Number</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => void finalizeOrder()}
              className="w-full h-12 rounded-lg bg-[#BE3E6E] hover:bg-[#A4325D] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              {submitting ? 'Confirming Payment...' : 'Confirm Payment'}
            </button>
            <p className="text-[11px] text-center text-[#7D6674]">
              Scan the QRIS code above or transfer to {QRIS_MERCHANT_NUMBER}, then click confirm to
              complete your order.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim() || !customerPhone.trim() || !shippingAddress.trim() || !shippingCity.trim()) {
      setError('Please fill in your name, phone number, street address, and city.');
      return;
    }

    if (paymentMethod === 'QRIS') {
      setShowQrisStep(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    await finalizeOrder();
  };

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <button
        type="button"
        onClick={onBackToShop}
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#6E5A67] hover:text-[#BE3E6E] mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Shop</span>
      </button>

      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#2B1D26] mb-8">
        Checkout &amp; Shipping Details
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-7 rounded-2xl border border-[#EFE1EA] bg-white p-6 sm:p-8 space-y-5"
        >
          {error && (
            <div
              role="alert"
              className="rounded-lg border border-[#F3C6D4] bg-[#FFF2F6] px-4 py-3 text-xs sm:text-sm text-[#9D2954]"
            >
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="checkout-name" className="block text-xs font-semibold text-[#2B1D26] mb-1.5">
                Recipient Full Name
              </label>
              <input
                id="checkout-name"
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nadia Maharani"
                className="w-full h-11 px-3.5 rounded-lg border border-[#E8D7E2] text-sm text-[#2B1D26] focus:border-[#BE3E6E] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="checkout-phone" className="block text-xs font-semibold text-[#2B1D26] mb-1.5">
                WhatsApp / Phone Number
              </label>
              <input
                id="checkout-phone"
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="0812-3456-7890"
                className="w-full h-11 px-3.5 rounded-lg border border-[#E8D7E2] text-sm text-[#2B1D26] focus:border-[#BE3E6E] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="checkout-address" className="block text-xs font-semibold text-[#2B1D26] mb-1.5">
              Street Address &amp; House / Dorm Number
            </label>
            <textarea
              id="checkout-address"
              required
              rows={2}
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              placeholder="Jl. Melati Indah No. 18, Kebayoran Baru"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8D7E2] text-sm text-[#2B1D26] focus:border-[#BE3E6E] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="checkout-city" className="block text-xs font-semibold text-[#2B1D26] mb-1.5">
                City / Regency
              </label>
              <input
                id="checkout-city"
                type="text"
                required
                value={shippingCity}
                onChange={(e) => setShippingCity(e.target.value)}
                placeholder="Bandung"
                className="w-full h-11 px-3.5 rounded-lg border border-[#E8D7E2] text-sm text-[#2B1D26] focus:border-[#BE3E6E] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="checkout-postal" className="block text-xs font-semibold text-[#2B1D26] mb-1.5">
                Postal Code
              </label>
              <input
                id="checkout-postal"
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="40198"
                className="w-full h-11 px-3.5 rounded-lg border border-[#E8D7E2] text-sm text-[#2B1D26] focus:border-[#BE3E6E] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <span className="block text-xs font-semibold text-[#2B1D26] mb-2">
              Payment Method
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(['QRIS', 'COD'] as PaymentMethod[]).map((method) => {
                const active = paymentMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`h-11 px-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                      active
                        ? 'border-[#BE3E6E] bg-[#FDF2F7] text-[#BE3E6E]'
                        : 'border-[#E8D7E2] bg-white text-[#5E4B56] hover:bg-[#FFF9FB]'
                    }`}
                  >
                    {method === 'QRIS' ? 'QRIS (DANA / OVO / GoPay)' : 'Cash on Delivery (COD)'}
                  </button>
                );
              })}
            </div>

            {paymentMethod === 'QRIS' && (
              <div className="mt-3 rounded-xl border border-[#F1E4EC] bg-[#FFF9FB] px-4 py-3 flex items-center justify-between gap-3 text-xs text-[#5E4B56]">
                <div>
                  <p className="font-medium text-[#2B1D26]">
                    QRIS / E-Wallet Destination: <span className="font-mono">{QRIS_MERCHANT_NUMBER}</span>
                  </p>
                  <p className="text-[11px] text-[#7D6674] mt-0.5">
                    A scannable QRIS code will appear after you click proceed.
                  </p>
                </div>
                <QrCode className="w-5 h-5 text-[#BE3E6E] shrink-0" />
              </div>
            )}
          </div>

          <div>
            <label htmlFor="checkout-notes" className="block text-xs font-semibold text-[#2B1D26] mb-1.5">
              Order or Gift Note (Optional)
            </label>
            <input
              id="checkout-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Extra bubble wrap please."
              className="w-full h-11 px-3.5 rounded-lg border border-[#E8D7E2] text-sm text-[#2B1D26] focus:border-[#BE3E6E] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-12 rounded-lg bg-[#BE3E6E] hover:bg-[#A4325D] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            {submitting
              ? 'Confirming Order...'
              : paymentMethod === 'QRIS'
                ? `Proceed to QRIS Payment · ${formatIDR(subtotal)}`
                : `Place Order (COD) · ${formatIDR(subtotal)}`}
          </button>
        </form>

        {/* Order Summary */}
        <aside className="lg:col-span-5 rounded-2xl border border-[#EFE1EA] bg-white p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-[#2B1D26]">
            Order Summary ({items.length})
          </h2>

          <div className="divide-y divide-[#F4EAF0]">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="py-3 flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-white border border-[#F4EAF0] p-1 shrink-0">
                  <SnackImage
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#2B1D26] truncate">{product.name}</p>
                  <p className="text-xs text-[#7D6674] tabular-nums">
                    {quantity} × {formatIDR(product.price)}
                  </p>
                </div>
                <span className="font-mono text-sm font-medium text-[#2B1D26] tabular-nums shrink-0">
                  {formatIDR(product.price * quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-[#EFE1EA] space-y-2 text-sm">
            <div className="flex justify-between text-[#6E5A67]">
              <span>Delivery</span>
              <span>{subtotal >= 100000 ? 'Complimentary' : 'Standard Rate'}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-[#2B1D26]">
              <span>Total</span>
              <span className="font-mono tabular-nums">{formatIDR(subtotal)}</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
