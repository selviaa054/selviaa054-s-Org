import { useCallback, useEffect, useState } from 'react';
import { AboutStorySection } from './components/AboutStorySection.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { AuthView } from './components/AuthView.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CatalogSection } from './components/CatalogSection.tsx';
import { CheckoutView } from './components/CheckoutView.tsx';
import { Footer } from './components/Footer.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { Navbar } from './components/Navbar.tsx';
import { OrderHistoryView } from './components/OrderHistoryView.tsx';
import { ProductDetailView } from './components/ProductDetailView.tsx';
import { ProfileView } from './components/ProfileView.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { api } from './services/api.ts';
import type { AppView, Product } from './types.ts';

function resolveRouteFromLocation(): { view: AppView; slug?: string } {
  const pathname = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  if (pathname.startsWith('/admin') || hash === '#admin') {
    return { view: 'admin' };
  }
  if (pathname.startsWith('/checkout') || hash === '#checkout') {
    return { view: 'checkout' };
  }
  if (pathname.startsWith('/orders') || hash === '#orders') {
    return { view: 'orders' };
  }
  if (pathname.startsWith('/profile') || hash === '#profile') {
    return { view: 'profile' };
  }
  if (pathname.startsWith('/auth') || pathname.startsWith('/login') || hash === '#auth') {
    return { view: 'auth' };
  }
  if (pathname.startsWith('/product/')) {
    const slug = pathname.replace('/product/', '').trim();
    if (slug) return { view: 'product', slug };
  }
  return { view: 'home' };
}

function ChikiSelApp() {
  const initialRoute = resolveRouteFromLocation();
  const [activeView, setActiveView] = useState<AppView>(initialRoute.view);
  const [pendingSlug, setPendingSlug] = useState<string | undefined>(initialRoute.slug);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    setProductsError(null);
    try {
      const list = await api.getProducts();
      setProducts(list);
    } catch (err) {
      setProductsError(
        err instanceof Error ? err.message : 'Unable to load snack catalog right now.',
      );
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    void fetchProducts();
  }, [fetchProducts]);

  // Match slug route once products load
  useEffect(() => {
    if (pendingSlug && products.length > 0) {
      const match = products.find((p) => p.slug === pendingSlug);
      if (match) {
        setSelectedProduct(match);
        setActiveView('product');
      } else {
        setActiveView('home');
      }
      setPendingSlug(undefined);
    }
  }, [pendingSlug, products]);

  // Sync browser history navigation (back/forward or manual URL entry)
  useEffect(() => {
    const onPopState = () => {
      const route = resolveRouteFromLocation();
      setActiveView(route.view);
      if (route.slug) {
        const match = products.find((p) => p.slug === route.slug);
        if (match) setSelectedProduct(match);
        else setPendingSlug(route.slug);
      }
    };
    window.addEventListener('popstate', onPopState);
    window.addEventListener('hashchange', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('hashchange', onPopState);
    };
  }, [products]);

  const navigate = useCallback((view: AppView, sectionId?: string, product?: Product) => {
    setActiveView(view);

    let nextPath = '/';
    if (view === 'product' && product) {
      nextPath = `/product/${product.slug}`;
      setSelectedProduct(product);
    } else if (view !== 'home') {
      nextPath = `/${view}`;
    }

    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }

    if (view === 'home' && sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF9FB] text-[#2B1D26]">
      <Navbar activeView={activeView} onNavigate={(view, section) => navigate(view, section)} />

      <main className="flex-1">
        {activeView === 'home' && (
          <>
            <HeroSection onExploreClick={() => navigate('home', 'catalog')} />
            <CatalogSection
              products={products}
              loading={loadingProducts}
              error={productsError}
              onSelectProduct={(product) => navigate('product', undefined, product)}
              onRetry={() => void fetchProducts()}
            />
            <AboutStorySection />
          </>
        )}

        {activeView === 'product' && selectedProduct && (
          <ProductDetailView
            product={selectedProduct}
            onBack={() => navigate('home', 'catalog')}
          />
        )}

        {activeView === 'product' && !selectedProduct && (
          <CatalogSection
            products={products}
            loading={loadingProducts}
            error={productsError}
            onSelectProduct={(product) => navigate('product', undefined, product)}
            onRetry={() => void fetchProducts()}
          />
        )}

        {activeView === 'checkout' && (
          <CheckoutView
            onBackToShop={() => navigate('home', 'catalog')}
            onGoToAuth={() => navigate('auth')}
            onGoToOrders={() => navigate('orders')}
            onOrderSuccess={() => void fetchProducts()}
          />
        )}

        {activeView === 'orders' && (
          <OrderHistoryView
            onGoToAuth={() => navigate('auth')}
            onGoToShop={() => navigate('home', 'catalog')}
          />
        )}

        {activeView === 'profile' && (
          <ProfileView
            onGoToAuth={() => navigate('auth')}
            onGoToAdmin={() => navigate('admin')}
            onLoggedOut={() => navigate('home')}
          />
        )}

        {activeView === 'auth' && (
          <AuthView
            onSuccess={(profile) => {
              if (profile.role === 'admin') {
                navigate('admin');
              } else {
                navigate('home');
              }
            }}
          />
        )}

        {activeView === 'admin' && (
          <AdminDashboard
            onReturnToShop={() => navigate('home')}
            onProductsChanged={() => void fetchProducts()}
          />
        )}
      </main>

      <Footer onNavigate={(view, section) => navigate(view, section)} />

      <CartDrawer onCheckout={() => navigate('checkout')} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ChikiSelApp />
      </CartProvider>
    </AuthProvider>
  );
}
