import { Menu, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import type { AppView } from '../types.ts';

interface NavbarProps {
  activeView: AppView;
  onNavigate: (view: AppView, sectionId?: string) => void;
}

export function Navbar({ activeView, onNavigate }: NavbarProps) {
  const { user } = useAuth();
  const { totalItems, setIsCartOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: Array<{ label: string; view: AppView; sectionId?: string }> = user
    ? user.role === 'admin'
      ? [
          { label: 'Shop', view: 'home', sectionId: 'catalog' },
          { label: 'Orders', view: 'orders' },
          { label: 'Profile', view: 'profile' },
          { label: 'Admin', view: 'admin' },
        ]
      : [
          { label: 'Shop', view: 'home', sectionId: 'catalog' },
          { label: 'Our Story', view: 'home', sectionId: 'story' },
          { label: 'Orders', view: 'orders' },
          { label: 'Profile', view: 'profile' },
        ]
    : [
        { label: 'Shop', view: 'home', sectionId: 'catalog' },
        { label: 'Our Story', view: 'home', sectionId: 'story' },
        { label: 'Orders', view: 'orders' },
        { label: 'Sign In', view: 'auth' },
      ];

  const handleLinkClick = (view: AppView, sectionId?: string) => {
    setMobileOpen(false);
    onNavigate(view, sectionId);
  };

  return (
    <header className="sticky top-0 z-40 h-16 bg-[#FFF9FB]/95 backdrop-blur-md border-b border-[#F1E4EC]">
      <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick('home');
          }}
          className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-[#2B1D26] whitespace-nowrap shrink-0"
        >
          ChikiSel
        </a>

        {/* Zone 2: 4 concise single-line nav links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#6E5A67]"
        >
          {navItems.map((item) => {
            const isCurrent =
              activeView === item.view && (!item.sectionId || activeView !== 'home');
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handleLinkClick(item.view, item.sectionId)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                  isCurrent
                    ? 'text-[#BE3E6E] border-[#BE3E6E]'
                    : 'border-transparent hover:text-[#2B1D26] hover:border-[#E5C7D6]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action + mobile menu toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            aria-label={`Open shopping bag with ${totalItems} items`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#BE3E6E] hover:bg-[#A4325D] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums min-h-[40px]"
          >
            <ShoppingBag className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            <span>Bag ({totalItems})</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#EADAE3] bg-white text-[#2B1D26] hover:bg-[#FDF2F7] transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-[#FFF9FB] border-b border-[#F1E4EC] px-4 py-3 shadow-sm">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleLinkClick(item.view, item.sectionId)}
                className="w-full text-left px-3 py-3 rounded-lg text-sm font-medium text-[#2B1D26] hover:bg-[#FDF2F7] hover:text-[#BE3E6E] transition-colors cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
