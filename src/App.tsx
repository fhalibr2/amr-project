import React, { useState, useEffect, useRef } from 'react';
import { Product, Category, CartItem, Order, User, StoreSettings } from './types';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, DEFAULT_STORE_SETTINGS } from './data/initialData';
import { searchProducts } from './utils/fuzzySearch';
import { soundManager } from './utils/soundEffects';
import { SplashScreen } from './components/SplashScreen';
import { SearchBar } from './components/SearchBar';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { AdminPanel } from './components/AdminPanel';
import { AdminLoginModal } from './components/AdminLoginModal';
import { UserAccountModal } from './components/UserAccountModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { MedicineBoxSvg } from './components/MedicineBoxSvg';
import {
  Pill,
  ShoppingBag,
  User as UserIcon,
  ShieldCheck,
  Sparkles,
  Layers,
  Search,
  ChevronRight,
  Plus,
  Lock,
  PhoneCall,
  Heart,
  Store,
  Clock,
  CheckCircle,
  Eye,
  ZoomIn,
} from 'lucide-react';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  // Store Settings (Editable in Admin Panel)
  const [settings, setSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem('pharma_settings');
    return saved ? JSON.parse(saved) : DEFAULT_STORE_SETTINGS;
  });

  // Core Application State
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('pharma_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('pharma_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('pharma_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('pharma_cart');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item) => item && item.product)
          .map((item) => ({
            product: item.product,
            quantity: typeof item.quantity === 'number' && !isNaN(item.quantity) && item.quantity > 0 ? item.quantity : 1,
            selectedDosage: item.selectedDosage,
          }));
      }
      return [];
    } catch {
      localStorage.removeItem('pharma_cart');
      return [];
    }
  });

  // User & Admin Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('pharma_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);

  // 15x Click counter on PharmaOnline logo/name to unlock hidden admin modal
  const [brandClickCount, setBrandClickCount] = useState(0);

  // UI State Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userModalTab, setUserModalTab] = useState<'profile' | 'orders' | 'login' | 'register' | 'recover'>('login');
  const [userModalNotice, setUserModalNotice] = useState<string | null>(null);
  const [isDesktopView, setIsDesktopView] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Cart Button Ref & Flying Particle Animation States
  const cartButtonRef = useRef<HTMLButtonElement | null>(null);
  const [isCartBouncing, setIsCartBouncing] = useState(false);
  const [flyingParticles, setFlyingParticles] = useState<
    {
      id: number;
      startX: number;
      startY: number;
      endX: number;
      endY: number;
      image?: string;
      prescriptionType?: string;
      isGeneric?: boolean;
      name?: string;
    }[]
  >([]);

  const categoryRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});

  useEffect(() => {
    const key = selectedCategory === null ? 'all' : selectedCategory;
    const btn = categoryRefs.current[key];
    if (btn) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedCategory]);

  // Persistence Effects
  useEffect(() => {
    try {
      localStorage.setItem('pharma_settings', JSON.stringify(settings));
    } catch (err) {
      console.error('Error saving settings', err);
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem('pharma_products', JSON.stringify(products));
    } catch (err) {
      console.error('Error saving products', err);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('pharma_categories', JSON.stringify(categories));
    } catch (err) {
      console.error('Error saving categories', err);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem('pharma_orders', JSON.stringify(orders));
    } catch (err) {
      console.error('Error saving orders', err);
    }
  }, [orders]);

  useEffect(() => {
    try {
      const cleanCart = cart.map((item) => ({
        product: item.product,
        quantity: typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 1,
        selectedDosage: item.selectedDosage,
      }));
      localStorage.setItem('pharma_cart', JSON.stringify(cleanCart));
    } catch (err) {
      console.error('Error saving cart', err);
    }
  }, [cart]);

  useEffect(() => {
    if (currentUser) {
      try {
        localStorage.setItem('pharma_user', JSON.stringify(currentUser));
      } catch (err) {
        console.error('Error saving user', err);
      }
    } else {
      localStorage.removeItem('pharma_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('pharma_admin_logged', isAdminLoggedIn ? 'true' : 'false');
  }, [isAdminLoggedIn]);

  // Auto-Refresh orders simulation (60s) with Sound Notifications
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      // Simulate order status update check or new order notification
      const pendingCount = orders.filter((o) => o.status === 'pending').length;
      if (pendingCount > 0 && settings.soundEnabled) {
        soundManager.playNewOrderNotification();
      }
    }, settings.autoRefreshInterval * 1000);

    return () => clearInterval(refreshInterval);
  }, [orders, settings]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Hidden 15x Click Handler on Brand Logo / Name (PharmaOnline)
  const handleBrandClick = () => {
    const nextCount = brandClickCount + 1;
    setBrandClickCount(nextCount);

    if (nextCount >= 15) {
      setBrandClickCount(0);
      setIsAdminUnlocked(true);
      localStorage.setItem('pharma_admin_unlocked', 'true');
      setIsAdminLoginOpen(true);
      showToast('🔓 Painel Admin Desbloqueado! (15 cliques na logo)');
    } else if (nextCount >= 5) {
      showToast(`Clique mais ${15 - nextCount}x na logo/nome para o Painel Admin`);
    }
  };

  // Cart Operations
  const handleAddToCart = (
    product: Product,
    quantityOrEvent: number | React.MouseEvent = 1,
    eventObj?: React.MouseEvent
  ) => {
    if (!product) return;

    let quantityToAdd = 1;
    let e: React.MouseEvent | undefined = undefined;

    if (typeof quantityOrEvent === 'number' && !isNaN(quantityOrEvent)) {
      quantityToAdd = quantityOrEvent;
      e = eventObj;
    } else if (quantityOrEvent && typeof quantityOrEvent === 'object') {
      e = quantityOrEvent as React.MouseEvent;
    }

    if (e && typeof e.stopPropagation === 'function') {
      try {
        e.stopPropagation();
      } catch {
        // ignore
      }
    }

    const safeStock = typeof product.stock === 'number' ? product.stock : 0;
    if (safeStock <= 0) {
      showToast('Produto indisponível no estoque');
      return;
    }

    const safeQtyToAdd =
      typeof quantityToAdd === 'number' && !isNaN(quantityToAdd) && quantityToAdd > 0
        ? quantityToAdd
        : 1;

    // Check stock BEFORE setCart
    const existingItem = cart.find(item => item?.product?.id === product.id);
    const currentQty = existingItem 
      ? (typeof existingItem.quantity === 'number' && !isNaN(existingItem.quantity) ? existingItem.quantity : 1) 
      : 0;
    const newQty = currentQty + safeQtyToAdd;

    if (newQty > safeStock) {
      showToast(`Limite em estoque: ${safeStock} unidades`);
      return;
    }

    // Play Sound Effect
    if (settings.soundEnabled) {
      try {
        soundManager.playBeepSuccess();
      } catch {
        // ignore
      }
    }

    // Flying Particle Animation Effect
    let startX = typeof window !== 'undefined' ? window.innerWidth / 2 : 200;
    let startY = typeof window !== 'undefined' ? window.innerHeight / 2 : 200;

    if (e && typeof e.clientX === 'number' && typeof e.clientY === 'number' && e.clientX > 0) {
      startX = e.clientX - 20;
      startY = e.clientY - 20;
    }

    let endX = typeof window !== 'undefined' ? window.innerWidth - 60 : 300;
    let endY = 30;

    if (cartButtonRef.current) {
      try {
        const rect = cartButtonRef.current.getBoundingClientRect();
        if (rect && rect.width > 0) {
          endX = rect.left + rect.width / 2 - 20;
          endY = rect.top + rect.height / 2 - 20;
        }
      } catch {
        // fallback
      }
    }

    const particleId = Date.now() + Math.random();
    setFlyingParticles((prev) => [
      ...prev,
      {
        id: particleId,
        startX,
        startY,
        endX,
        endY,
        image: product.image,
        prescriptionType: product.prescriptionType,
        isGeneric: product.isGeneric,
        name: product.name,
      },
    ]);

    // When particle lands (~600ms)
    setTimeout(() => {
      setFlyingParticles((prev) => prev.filter((p) => p.id !== particleId));
      setIsCartBouncing(true);
      setTimeout(() => setIsCartBouncing(false), 450);
    }, 600);

    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item?.product?.id === product.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        const currentQty =
          typeof updated[existingIdx]?.quantity === 'number' && !isNaN(updated[existingIdx].quantity)
            ? updated[existingIdx].quantity
            : 1;
        const nextQty = Math.min(currentQty + safeQtyToAdd, safeStock);
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: nextQty,
        };
        return updated;
      } else {
        const nextQty = Math.min(safeQtyToAdd, safeStock);
        return [...prev, { product, quantity: nextQty }];
      }
    });

    showToast(`🛒 ${product.name} adicionado ao carrinho!`);
  };

  const handleUpdateCartQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((_, i) => i !== index));
      return;
    }
    
    // Check stock BEFORE setCart
    const item = cart[index];
    if (!item) return;
    const stock = typeof item.product?.stock === 'number' ? item.product.stock : 0;
    
    if (newQty > stock) {
      showToast(`Limite em estoque: ${stock} unidades`);
      return;
    }
    
    setCart((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        const itemStock = typeof updated[index].product?.stock === 'number' ? updated[index].product.stock : 0;
        updated[index] = {
          ...updated[index],
          quantity: Math.min(newQty, itemStock),
        };
      }
      return updated;
    });
  };

  const handleClearCart = () => {
    setCart([]);
    showToast('Carrinho limpo');
  };

  // Search Results using Fuzzy Typos & Intelligent Matching
  const searchResult = searchProducts(products, searchQuery);
  let displayedProducts = searchResult.products;

  if (selectedCategory) {
    if (selectedCategory === 'ofertas') {
      displayedProducts = displayedProducts.filter((p) => p.isOffer);
    } else {
      displayedProducts = displayedProducts.filter((p) => p.category === selectedCategory);
    }
  }

  // Always sort displayed products: IN STOCK first (alphabetically), OUT OF STOCK second (alphabetically)
  displayedProducts = [...displayedProducts].sort((a, b) => {
    const aInStock = a.stock > 0 ? 1 : 0;
    const bInStock = b.stock > 0 ? 1 : 0;
    if (aInStock !== bInStock) {
      return bInStock - aInStock; // In-stock (1) comes before out-of-stock (0)
    }
    return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
  });

  // Admin Product CRUD Actions
  const handleAddProduct = (newProduct: Omit<Product, 'id'>) => {
    const created: Product = {
      ...newProduct,
      id: Date.now(),
    };
    setProducts((prev) => [created, ...prev]);
    showToast('✅ Produto adicionado com sucesso!');
  };

  const handleUpdateProduct = (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    showToast('✅ Produto atualizado no catálogo!');
  };

  const handleDeleteProduct = (id: number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('🗑️ Produto removido do catálogo!');
  };

  // Admin Category CRUD Actions
  const handleAddCategory = (newCat: Category) => {
    setCategories((prev) => [...prev, newCat]);
    showToast('✅ Nova seção criada!');
  };

  const handleDeleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    showToast('🗑️ Seção removida!');
  };

  const handleUpdateOrderStatus = (
    orderId: string,
    status: Order['status'],
    confirmedBy?: 'customer' | 'driver' | 'staff'
  ) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              deliveryConfirmedBy: confirmedBy || o.deliveryConfirmedBy,
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );
    showToast(`Status do pedido #${orderId.slice(-4)} atualizado!`);
  };

  const handleVerifyOrderEan = (orderId: string, itemId: number) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          const updatedVerified = { ...(o.verifiedEanItems || {}), [itemId]: true };
          return {
            ...o,
            verifiedEanItems: updatedVerified,
            updatedAt: new Date().toISOString(),
          };
        }
        return o;
      })
    );
    showToast('✅ EAN verificado para o item!');
  };

  const handleCompleteOrder = (orderData: Partial<Order>) => {
    const newOrder: Order = {
      id: 'PED-' + Math.floor(100000 + Math.random() * 900000),
      userId: currentUser?.id || 'anon',
      userName: currentUser?.name || 'Cliente',
      userEmail: currentUser?.email || 'cliente@drogaria.com.br',
      items: cart,
      subtotal: orderData.subtotal || 0,
      deliveryFee: orderData.deliveryFee || 0,
      total: orderData.total || 0,
      deliveryType: orderData.deliveryType || 'delivery',
      paymentMethod: orderData.paymentMethod || 'pix',
      changeAmount: orderData.changeAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);
    setCart([]);
    if (settings.soundEnabled) {
      soundManager.playNewOrderNotification();
    }
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-900 antialiased flex flex-col items-center justify-start selection:bg-rose-500 selection:text-white">
      {/* Splash Entrance Screen */}
      {showSplash && <SplashScreen settings={settings} onFinish={() => setShowSplash(false)} />}

      {/* Floating Toast Notice */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-full shadow-2xl border border-slate-700 animate-fadeIn flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-rose-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* APPLICATION CONTAINER (Fully responsive: 100% width on mobile, expands smoothly up to 5xl/7xl on tablets/desktop) */}
      <div
        className={`w-full transition-all duration-300 ${
          isDesktopView && isAdminLoggedIn
            ? 'max-w-7xl my-0 sm:my-4 rounded-none sm:rounded-3xl shadow-2xl bg-white min-h-screen border border-slate-200'
            : 'max-w-5xl my-0 sm:my-6 rounded-none sm:rounded-3xl shadow-2xl bg-white min-h-[92vh] border border-slate-200 overflow-hidden relative'
        }`}
      >
        {/* HEADER */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 p-3.5 sm:p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            {/* Brand Logo with 10x Secret Admin Click Trigger */}
            <div
              onClick={handleBrandClick}
              className="flex items-center gap-2.5 cursor-pointer group select-none"
              title={settings.appName}
            >
              <div className="bg-gradient-to-tr from-rose-700 to-red-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-rose-600/20 group-active:scale-95 transition p-1.5">
                <img
                  src={settings.appLogo}
                  alt={settings.appName}
                  style={{ height: `${settings.logoSize}px` }}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="font-extrabold text-lg leading-none tracking-tight text-gray-900">
                  {settings.appName}
                </h1>
                <span className="text-[10px] text-rose-600 font-bold block mt-0.5">
                  {settings.appSubtitle}
                </span>
              </div>
            </div>

            {/* Header User Controls */}
            <div className="flex items-center gap-2">
              {/* User Account / Login Button */}
              <button
                onClick={() => setIsUserModalOpen(true)}
                className="p-2 rounded-full bg-gray-100 hover:bg-rose-50 text-gray-700 hover:text-rose-600 transition relative"
                title="Minha Conta / Cadastro"
              >
                <UserIcon className="w-5 h-5" />
                {currentUser && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                )}
              </button>

              {/* Secret Unlocked Admin Panel Button */}
              {(isAdminLoggedIn || isAdminUnlocked) && (
                <button
                  onClick={() => setIsAdminPanelOpen(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-1.5 transition animate-fadeIn"
                  title="Abrir Painel Admin"
                >
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Painel Admin</span>
                </button>
              )}

              {/* Cart Button */}
              <button
                ref={cartButtonRef}
                onClick={() => setIsCartOpen(true)}
                className={`relative p-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 transition ${
                  isCartBouncing ? 'animate-cartBump ring-4 ring-rose-400/50 bg-rose-200' : ''
                }`}
                aria-label="Ver carrinho"
              >
                <ShoppingBag className="w-5 h-5 text-rose-600" />
                {totalCartItems > 0 && (
                  <span
                    className={`absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md transition-all ${
                      isCartBouncing ? 'scale-125 bg-red-600 ring-2 ring-white' : 'animate-bounce'
                    }`}
                  >
                    {totalCartItems}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* SEARCH BAR */}
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            didYouMean={searchResult.didYouMean}
            onApplySuggestion={(sug) => setSearchQuery(sug)}
          />

          {/* QUICK CATEGORY SHELVES BAR */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold scroll-smooth">
            <button
              ref={(el) => { categoryRefs.current['all'] = el; }}
              onClick={() => setSelectedCategory(null)}
              className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition border ${
                selectedCategory === null
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm font-bold'
                  : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
              }`}
            >
              Todos os Produtos
            </button>

            {categories
              .filter((c) => c.isActive)
              .sort((a, b) => a.displayOrder - b.displayOrder)
              .map((cat) => (
                <button
                  key={cat.id}
                  ref={(el) => { categoryRefs.current[cat.id] = el; }}
                  onClick={() =>
                    setSelectedCategory(selectedCategory === cat.id ? null : cat.id)
                  }
                  className={`px-3.5 py-1.5 rounded-full whitespace-nowrap transition border flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm font-bold'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  <span>{cat.name}</span>
                </button>
              ))}
          </div>
        </header>

        {/* MAIN BODY AREA */}
        <main className="p-4 sm:p-5 space-y-6 pb-20">
          {/* TOP EXCLUSIVE APP OFFERS BANNER & EDITABLE ANNOUNCEMENT TICKER */}
          {!searchQuery && selectedCategory === null && (
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-rose-800 via-rose-700 to-red-900 text-white p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="bg-amber-400 text-rose-950 font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Ofertas Exclusivas do App
                </span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black font-display leading-tight">
                  {settings.heroTitle}
                </h2>
                <p className="text-xs text-rose-100/90 mt-1">
                  {settings.heroSubtitle}
                </p>
              </div>

              {/* Dynamic Announcement Ticker (Editable by Admin) */}
              {settings.offerAnnouncements && settings.offerAnnouncements.length > 0 && (
                <div className="pt-2 border-t border-rose-600/60 space-y-1.5">
                  {settings.offerAnnouncements.map((ann, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-semibold text-rose-100 bg-black/20 px-3 py-1.5 rounded-xl border border-white/10">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>{ann}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DYNAMIC CATEGORY SECTIONS */}
          {!searchQuery && selectedCategory === null ? (
            <div className="space-y-8">
              {categories
                .filter((c) => c.isActive)
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((cat) => {
                  const categoryProducts = products.filter(
                    (p) => p.isActive && (cat.id === 'ofertas' ? p.isOffer : p.category === cat.id)
                  );

                  if (categoryProducts.length === 0) return null;

                  return (
                    <section key={cat.id} className="space-y-3">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color || '#dc2626' }}
                          />
                          <h2 className="font-bold text-base sm:text-lg text-gray-900">
                            {cat.name}
                          </h2>
                          <span className="text-xs text-gray-400 font-normal">
                            ({categoryProducts.length})
                          </span>
                        </div>

                        <button
                          onClick={() => setSelectedCategory(cat.id)}
                          className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-0.5"
                        >
                          <span>Ver tudo</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Products Grid for Category */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                        {categoryProducts.slice(0, 6).map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            onSelect={(p) => setSelectedProduct(p)}
                            onAddToCart={(p, e) => handleAddToCart(p, 1, e)}
                            showStockToCustomer={settings.showStockToCustomer}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
            </div>
          ) : (
            /* FILTERED OR SEARCH RESULTS GRID */
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h2 className="font-bold text-base text-gray-900">
                  {searchQuery
                    ? `Resultados para "${searchQuery}"`
                    : categories.find((c) => c.id === selectedCategory)?.name || 'Produtos'}
                </h2>
                <span className="text-xs text-gray-500 font-medium">
                  {displayedProducts.length} itens encontrados
                </span>
              </div>

              {displayedProducts.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200 p-6 space-y-2">
                  <Search className="w-10 h-10 text-gray-400 mx-auto" />
                  <h3 className="font-bold text-gray-800 text-sm">
                    Nenhum produto encontrado
                  </h3>
                  <p className="text-xs text-gray-500">
                    Tente buscar por palavras como "dipirona", "shampoo" ou "paracetamol".
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory(null);
                    }}
                    className="mt-2 bg-rose-600 text-white font-bold text-xs px-4 py-2 rounded-xl"
                  >
                    Limpar Filtros
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {displayedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onSelect={(p) => setSelectedProduct(p)}
                      onAddToCart={(p, e) => handleAddToCart(p, 1, e)}
                      showStockToCustomer={settings.showStockToCustomer}
                    />
                  ))}
                </div>
              )}
            </section>
          )}
        </main>

        {/* BOTTOM NAVIGATION BAR FOR MOBILE VIEW */}
        <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-t border-gray-200 max-w-5xl mx-auto h-16 flex items-center justify-around px-2 text-[10px] font-bold text-gray-500">
          <button
            onClick={() => {
              setSelectedCategory(null);
              setSearchQuery('');
            }}
            className={`flex flex-col items-center gap-1 ${
              selectedCategory === null && !searchQuery ? 'text-rose-600' : 'hover:text-gray-800'
            }`}
          >
            <Pill className="w-5 h-5" />
            <span>Início</span>
          </button>

          <button
            onClick={() => setSelectedCategory('ofertas')}
            className={`flex flex-col items-center gap-1 ${
              selectedCategory === 'ofertas' ? 'text-rose-600' : 'hover:text-gray-800'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span>Ofertas</span>
          </button>

          <button
            onClick={() => setIsCartOpen(true)}
            className="flex flex-col items-center gap-1 relative text-gray-700 hover:text-rose-600"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Carrinho</span>
            {totalCartItems > 0 && (
              <span className="absolute -top-1 right-2 bg-rose-600 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {totalCartItems}
              </span>
            )}
          </button>

          <button
            onClick={() => setIsUserModalOpen(true)}
            className="flex flex-col items-center gap-1 text-gray-700 hover:text-rose-600"
          >
            <UserIcon className="w-5 h-5" />
            <span>Perfil</span>
          </button>
        </nav>
      </div>

      {/* PRODUCT DETAIL MODAL (ZERO SCROLL FRICTION MODAL) */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(p, qty) => handleAddToCart(p, qty)}
      />

      {/* CART DRAWER MODAL */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md h-full bg-white animate-slideLeft flex flex-col">
            <CartDrawer
              items={cart}
              settings={settings}
              onUpdateQuantity={handleUpdateCartQuantity}
              onRemoveItem={(idx) => setCart((prev) => prev.filter((_, i) => i !== idx))}
              onClearCart={handleClearCart}
              onProceedToCheckout={() => {
                if (!currentUser) {
                  setIsCartOpen(false);
                  setUserModalNotice('Para concluir seu pedido, faça login ou crie sua conta.');
                  setUserModalTab('login');
                  setIsUserModalOpen(true);
                  showToast('Identifique-se para finalizar o pedido');
                } else {
                  setIsCartOpen(false);
                  setIsCheckoutOpen(true);
                }
              }}
              onClose={() => setIsCartOpen(false)}
            />
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <CheckoutModal
          items={cart}
          settings={settings}
          currentUser={currentUser}
          onCompleteOrder={handleCompleteOrder}
          onClose={() => setIsCheckoutOpen(false)}
        />
      )}

      {/* USER ACCOUNT MODAL */}
      {isUserModalOpen && (
        <UserAccountModal
          isOpen={isUserModalOpen}
          onClose={() => {
            setIsUserModalOpen(false);
            setUserModalNotice(null);
          }}
          currentUser={currentUser}
          orders={orders}
          initialTab={userModalTab}
          noticeMessage={userModalNotice}
          storePhone={settings.storePhone}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onLogin={(user) => {
            setCurrentUser(user);
            setIsUserModalOpen(false);
            setUserModalNotice(null);
            showToast(`Bem-vindo, ${user.name}!`);
            if (cart.length > 0) {
              setIsCheckoutOpen(true);
            }
          }}
          onLogout={() => {
            setCurrentUser(null);
            showToast('Você saiu da conta');
          }}
        />
      )}

      {/* HIDDEN ADMIN LOGIN MODAL */}
      {isAdminLoginOpen && (
        <AdminLoginModal
          isOpen={isAdminLoginOpen}
          adminUsername={settings.adminUsername || 'admin'}
          adminPassword={settings.adminPassword || 'admin123'}
          onClose={() => setIsAdminLoginOpen(false)}
          onLoginSuccess={() => {
            setIsAdminLoggedIn(true);
            setIsAdminPanelOpen(true);
            showToast('🔓 Login de Administrador com Sucesso!');
          }}
        />
      )}

      {/* ADMIN PANEL (DESKTOP OR MOBILE VIEW) */}
      {isAdminPanelOpen && isAdminLoggedIn && (
        <AdminPanel
          products={products}
          categories={categories}
          orders={orders}
          settings={settings}
          onUpdateSettings={(newSettings) => {
            setSettings(newSettings);
            showToast('✅ Configurações salvas!');
          }}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onVerifyOrderEan={handleVerifyOrderEan}
          onImportDatabase={(dbData) => {
            if (dbData.products) setProducts(dbData.products);
            if (dbData.categories) setCategories(dbData.categories);
            if (dbData.settings) setSettings(dbData.settings);
            showToast('Banco de dados restaurado com sucesso!');
          }}
          isDesktopView={isDesktopView}
          onToggleDesktopView={() => setIsDesktopView(!isDesktopView)}
          onClose={() => setIsAdminPanelOpen(false)}
        />
      )}
      {/* Flying Particle Animations when adding to Cart */}
      {flyingParticles.map((particle) => (
        <div
          key={particle.id}
          style={{
            '--start-x': `${particle.startX}px`,
            '--start-y': `${particle.startY}px`,
            '--end-x': `${particle.endX}px`,
            '--end-y': `${particle.endY}px`,
          } as React.CSSProperties}
          className="fixed z-50 pointer-events-none w-11 h-11 rounded-2xl bg-white border-2 border-rose-500 shadow-2xl flex items-center justify-center p-1 animate-flyToCart"
        >
          {particle.image ? (
            <img src={particle.image} alt="" className="w-full h-full object-contain" />
          ) : (
            <MedicineBoxSvg
              prescriptionType={particle.prescriptionType as any}
              isGeneric={particle.isGeneric}
              name={particle.name || 'Remédio'}
            />
          )}
        </div>
      ))}
    </div>
  );
}
