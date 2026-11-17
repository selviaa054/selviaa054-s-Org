import { ArrowUpDown, Plus, Search, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCart } from '../context/CartContext.tsx';
import type { Product, ProductCategory } from '../types.ts';
import { formatIDR } from '../utils/format.ts';
import { SnackImage } from './SnackImage.tsx';

interface CatalogSectionProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  onSelectProduct: (product: Product) => void;
  onRetry: () => void;
}

type CategoryFilter = 'All' | ProductCategory;
type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'name-asc';

const CATEGORIES: Array<{ label: string; value: CategoryFilter }> = [
  { label: 'All Snacks', value: 'All' },
  { label: 'Chiki & Puffs', value: 'Chiki & Puffs' },
  { label: 'Chips & Savory', value: 'Chips & Savory' },
  { label: 'Sweet Snacks', value: 'Sweet Snacks' },
  { label: 'Drinks & Milk', value: 'Drinks & Milk' },
];

export function CatalogSection({
  products,
  loading,
  error,
  onSelectProduct,
  onRetry,
}: CatalogSectionProps) {
  const { addItem, setIsCartOpen } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const list = products.filter((product) => {
      const matchesCategory =
        selectedCategory === 'All' || product.category === selectedCategory;
      const matchesQuery =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.flavor_notes.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      // Featured first, then newest
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [products, searchQuery, selectedCategory, sortBy]);

  const handleQuickAdd = (product: Product) => {
    if (product.stock <= 0) return;
    addItem(product, 1);
    setJustAddedId(product.id);
    setTimeout(() => {
      setJustAddedId((curr) => (curr === product.id ? null : curr));
    }, 1200);
  };

  return (
    <section id="catalog" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs font-medium text-[#8B5E78] mb-1.5">
            Curated Snack Shelf · {products.length} Flavors
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#2B1D26] tracking-tight">
            Our Pastel Snack Collection
          </h2>
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search
              className="w-4 h-4 text-[#8A6D7E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search snacks or flavors..."
              aria-label="Search snacks or flavors"
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-[#E8D7E2] bg-white text-sm text-[#2B1D26] placeholder:text-[#9D8593] focus:border-[#BE3E6E] focus:outline-none"
            />
          </div>

          <div className="relative">
            <ArrowUpDown
              className="w-4 h-4 text-[#8A6D7E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort products"
              className="h-10 pl-9 pr-8 rounded-lg border border-[#E8D7E2] bg-white text-sm text-[#2B1D26] focus:border-[#BE3E6E] focus:outline-none cursor-pointer"
            >
              <option value="featured">Featured First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div
        role="tablist"
        aria-label="Snack categories"
        className="flex items-center gap-1.5 p-1 bg-[#F6ECF2] rounded-xl overflow-x-auto mb-8"
      >
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[38px] ${
                isActive
                  ? 'bg-white text-[#2B1D26] shadow-xs'
                  : 'text-[#6E5A67] hover:text-[#2B1D26]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-[#F3C6D4] bg-[#FFF2F6] p-6 text-center">
          <p className="text-sm text-[#9D2954] font-medium mb-3">{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="px-4 py-2 rounded-lg bg-[#BE3E6E] text-white text-xs font-semibold hover:bg-[#A4325D] cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[#EFE1EA] bg-white overflow-hidden animate-pulse"
            >
              <div className="aspect-[4/3] bg-[#F7EEF3]" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-28 bg-[#F4E7EE] rounded" />
                <div className="h-5 w-44 bg-[#EFE0E8] rounded" />
                <div className="h-4 w-24 bg-[#F4E7EE] rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty Filter State */}
      {!loading && !error && filteredProducts.length === 0 && (
        <div className="rounded-xl border border-[#EFE1EA] bg-white p-12 text-center">
          <p className="font-display text-lg font-medium text-[#2B1D26] mb-1">
            No matching snacks found
          </p>
          <p className="text-sm text-[#6E5A67] mb-5">
            Try clearing your search or switching to another snack category.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="px-4 py-2 rounded-lg border border-[#E5C7D6] text-xs font-semibold text-[#BE3E6E] hover:bg-[#FDF2F7] cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Product Grid */}
      {!loading && !error && filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.stock <= 0;
            const justAdded = justAddedId === product.id;

            return (
              <article
                key={product.id}
                className="group flex flex-col rounded-xl border border-[#EFE1EA] bg-white overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                {/* 4:3 Product Photo */}
                <button
                  type="button"
                  onClick={() => onSelectProduct(product)}
                  className="aspect-[4/3] w-full overflow-hidden bg-white border-b border-[#F4EAF0] p-4 text-left cursor-pointer"
                  aria-label={`View details for ${product.name}`}
                >
                  <SnackImage
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                </button>

                {/* Card Details */}
                <div className="flex flex-col flex-1 p-5">
                  {/* Quiet Unboxed Metadata */}
                  <div className="flex items-center justify-between gap-2 text-xs text-[#7D6674] mb-1.5">
                    <span className="truncate">
                      {product.category} · {product.weight}
                    </span>
                    {product.is_featured && (
                      <span className="inline-flex items-center gap-1 text-[#BE3E6E] font-medium shrink-0">
                        <Sparkles className="w-3 h-3" aria-hidden="true" />
                        Favorite
                      </span>
                    )}
                  </div>

                  {/* Product Title */}
                  <h3 className="text-base font-semibold text-[#2B1D26] leading-snug mb-1.5">
                    <button
                      type="button"
                      onClick={() => onSelectProduct(product)}
                      className="text-left hover:text-[#BE3E6E] transition-colors cursor-pointer"
                    >
                      {product.name}
                    </button>
                  </h3>

                  <p className="text-xs text-[#6E5A67] line-clamp-2 leading-relaxed mb-4">
                    {product.description}
                  </p>

                  {/* Price & Action Footer */}
                  <div className="mt-auto pt-3 border-t border-[#F4EAF0] flex items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-[15px] font-medium text-[#2B1D26] tabular-nums">
                        {formatIDR(product.price)}
                      </p>
                      <p className="text-[11px] text-[#7D6674] tabular-nums">
                        {isOutOfStock ? 'Out of stock' : `${product.stock} packs left`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {justAdded ? (
                        <button
                          type="button"
                          onClick={() => setIsCartOpen(true)}
                          className="px-3.5 py-2 rounded-lg bg-[#EAE2FA] text-[#53389E] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[38px]"
                        >
                          View Bag
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => handleQuickAdd(product)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#FDF2F7] hover:bg-[#BE3E6E] text-[#BE3E6E] hover:text-white disabled:opacity-45 disabled:hover:bg-[#FDF2F7] disabled:hover:text-[#BE3E6E] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[38px]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{isOutOfStock ? 'Sold Out' : 'Add to Bag'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
