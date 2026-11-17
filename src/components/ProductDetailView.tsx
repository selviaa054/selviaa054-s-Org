import { ArrowLeft, CheckCircle2, Minus, Plus, ShoppingBag, XCircle } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../context/CartContext.tsx';
import type { Product } from '../types.ts';
import { formatIDR } from '../utils/format.ts';
import { SnackImage } from './SnackImage.tsx';

interface ProductDetailViewProps {
  product: Product;
  onBack: () => void;
}

export function ProductDetailView({ product, onBack }: ProductDetailViewProps) {
  const { addItem, setIsCartOpen } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const isOutOfStock = product.stock <= 0;
  const maxQty = Math.max(1, product.stock);

  const handleAddToBag = () => {
    if (isOutOfStock) return;
    addItem(product, quantity);
    setAddedFeedback(true);
    setIsCartOpen(true);
    setTimeout(() => setAddedFeedback(false), 1600);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-[#6E5A67] hover:text-[#BE3E6E] transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Snack Catalog</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Sticky Left Gallery */}
        <div className="lg:col-span-6 lg:sticky lg:top-24">
          <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-[#EFE1EA] bg-white p-6">
            <SnackImage
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Contiguous Right Purchase Module */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-[#EFE1EA] p-6 sm:p-8">
          <p className="text-xs font-medium text-[#8B5E78] mb-2">
            {product.category} · Net Weight {product.weight}
          </p>

          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-[#2B1D26] tracking-tight mb-3">
            {product.name}
          </h1>

          <div className="flex items-center justify-between gap-4 pb-5 mb-5 border-b border-[#F4EAF0]">
            <p className="font-mono text-2xl font-medium text-[#2B1D26] tabular-nums">
              {formatIDR(product.price)}
            </p>

            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B91C1C]">
                <XCircle className="w-4 h-4" />
                Out of Stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#15803D] tabular-nums">
                <CheckCircle2 className="w-4 h-4" />
                In Stock ({product.stock} packs)
              </span>
            )}
          </div>

          <div className="space-y-4 mb-7">
            <div>
              <h2 className="text-xs font-semibold text-[#2B1D26] mb-1.5">
                About this snack
              </h2>
              <p className="text-sm text-[#5E4B56] leading-relaxed">{product.description}</p>
            </div>

            {product.flavor_notes && (
              <div className="pt-3 border-t border-[#F7EEF3]">
                <h2 className="text-xs font-semibold text-[#2B1D26] mb-1">
                  Tasting &amp; Crunch Notes
                </h2>
                <p className="text-sm text-[#6E5A67]">{product.flavor_notes}</p>
              </div>
            )}
          </div>

          {/* Quantity + Primary Buy CTA */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="inline-flex items-center justify-between border border-[#E8D7E2] rounded-lg bg-[#FFF9FB] h-12 px-2">
              <button
                type="button"
                aria-label="Decrease quantity"
                disabled={isOutOfStock || quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 inline-flex items-center justify-center rounded-md text-[#2B1D26] hover:bg-white disabled:opacity-40 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-mono text-sm font-medium text-[#2B1D26] tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                disabled={isOutOfStock || quantity >= maxQty}
                onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                className="w-9 h-9 inline-flex items-center justify-center rounded-md text-[#2B1D26] hover:bg-white disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleAddToBag}
              className="flex-1 h-12 px-6 rounded-lg bg-[#BE3E6E] hover:bg-[#A4325D] disabled:opacity-45 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer tabular-nums"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {isOutOfStock
                  ? 'Currently Sold Out'
                  : addedFeedback
                    ? 'Added to Bag'
                    : `Add to Bag · ${formatIDR(product.price * quantity)}`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
