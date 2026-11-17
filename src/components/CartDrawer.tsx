import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { formatIDR } from '../utils/format.ts';
import { SnackImage } from './SnackImage.tsx';

interface CartDrawerProps {
  onCheckout: () => void;
}

const FREE_SHIPPING_THRESHOLD = 100000;

export function CartDrawer({ onCheckout }: CartDrawerProps) {
  const { items, isCartOpen, setIsCartOpen, updateQuantity, removeItem, subtotal, totalItems } =
    useCart();

  if (!isCartOpen) return null;

  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping bag"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#2B1D26]/35 backdrop-blur-[2px]"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer Panel */}
      <aside className="relative z-10 w-full max-w-md bg-[#FFF9FB] h-full flex flex-col border-l border-[#EFE1EA] shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#F1E4EC] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#BE3E6E]" />
            <h2 className="font-display text-lg font-semibold text-[#2B1D26]">
              Your Snack Bag ({totalItems})
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            aria-label="Close bag"
            className="w-9 h-9 rounded-lg inline-flex items-center justify-center text-[#6E5A67] hover:bg-[#FDF2F7] hover:text-[#2B1D26] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress */}
        {items.length > 0 && (
          <div className="px-6 py-3 bg-[#FDF2F7] border-b border-[#F1E4EC] text-xs text-[#6E364D]">
            {remainingForFreeShipping === 0
              ? 'You unlocked complimentary local shipping on this order.'
              : `Add ${formatIDR(remainingForFreeShipping)} more for complimentary local shipping.`}
          </div>
        )}

        {/* Item List */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <ShoppingBag className="w-10 h-10 text-[#C8AEC0] mb-3" strokeWidth={1.5} />
              <p className="font-display text-lg font-medium text-[#2B1D26] mb-1">
                Your snack bag is empty
              </p>
              <p className="text-xs text-[#6E5A67] max-w-[28ch] mb-5">
                Pick some crunchy chiki, savory chips, chocolate popcorn, or chilled milk drinks to
                get started.
              </p>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="px-5 py-2.5 rounded-lg bg-[#BE3E6E] text-white text-xs font-semibold hover:bg-[#A4325D] cursor-pointer"
              >
                Explore Snacks
              </button>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex gap-4 p-3 rounded-xl border border-[#EFE1EA] bg-white"
              >
                <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-white border border-[#F4EAF0] p-1.5">
                  <SnackImage
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[#2B1D26] truncate">
                      {product.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeItem(product.id)}
                      aria-label={`Remove ${product.name}`}
                      className="text-[#9D8593] hover:text-[#B91C1C] p-1 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-[#7D6674] mb-2">
                    {product.weight} · {formatIDR(product.price)}
                  </p>

                  <div className="mt-auto flex items-center justify-between">
                    <div className="inline-flex items-center border border-[#E8D7E2] rounded-lg bg-[#FFF9FB]">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${product.name}`}
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="w-7 h-7 inline-flex items-center justify-center text-[#2B1D26] hover:bg-white rounded-l-lg cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-mono text-xs font-medium text-[#2B1D26] tabular-nums">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${product.name}`}
                        disabled={quantity >= product.stock}
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="w-7 h-7 inline-flex items-center justify-center text-[#2B1D26] hover:bg-white rounded-r-lg disabled:opacity-40 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="font-mono text-sm font-medium text-[#2B1D26] tabular-nums">
                      {formatIDR(product.price * quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-[#F1E4EC] bg-white space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#6E5A67]">Subtotal</span>
              <span className="font-mono text-lg font-semibold text-[#2B1D26] tabular-nums">
                {formatIDR(subtotal)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsCartOpen(false);
                onCheckout();
              }}
              className="w-full h-12 rounded-lg bg-[#BE3E6E] hover:bg-[#A4325D] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
