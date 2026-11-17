import type { AppView } from '../types.ts';

interface FooterProps {
  onNavigate: (view: AppView, sectionId?: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-[#FFF9FB] border-t border-[#F1E4EC]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <p className="font-display text-lg font-semibold text-[#2B1D26]">ChikiSel</p>
          <p className="text-xs text-[#6E5A67] mt-1">
            Pastel Chiki &amp; Local Snack Boutique · Jakarta &amp; Bandung Delivery
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-[#6E5A67]">
          <button
            type="button"
            onClick={() => onNavigate('home', 'catalog')}
            className="hover:text-[#BE3E6E] transition-colors cursor-pointer"
          >
            Snack Catalog
          </button>
          <button
            type="button"
            onClick={() => onNavigate('orders')}
            className="hover:text-[#BE3E6E] transition-colors cursor-pointer"
          >
            Track Orders
          </button>
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            className="hover:text-[#BE3E6E] transition-colors cursor-pointer"
          >
            My Account
          </button>
        </div>

        <p className="text-xs text-[#8A6D7E]">
          © {new Date().getFullYear()} ChikiSel Snacks
        </p>
      </div>
    </footer>
  );
}
