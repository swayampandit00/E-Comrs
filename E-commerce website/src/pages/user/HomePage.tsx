import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Filter, SortAsc, Eye, Plus } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, fmt, FALLBACK_IMAGES } from "../../utils/api";
import type { Product, Category, Page, UserType, Cart } from "../../utils/types";
import UserNavbar from "../../components/UserNavbar";
import CartDrawer from "../../components/CartDrawer";

interface Props {
  token: string | null;
  user: UserType | null;
  cart: Cart | null;
  navigate: (p: Page) => void;
  onLogout: () => void;
  onOpenAuth: () => void;
  onCartChange: () => void;
}

export default function HomePage({ token, user, cart, navigate, onLogout, onOpenAuth, onCartChange }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [sort, setSort] = useState<"" | "asc" | "desc">("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<{ product: Product; index: number } | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/api/products";
      if (search) url = `/api/products/search?keyword=${encodeURIComponent(search)}`;
      else if (selectedCat) url = `/api/products/filter/category?categoryId=${selectedCat}`;
      else if (priceMin || priceMax) url = `/api/products/filter/price?minPrice=${priceMin || 0}&maxPrice=${priceMax || 999999}`;
      else if (sort) url = `/api/products/sort/${sort}`;
      const data = await apiFetch(url);
      setProducts(Array.isArray(data) ? data : []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCat, sort, priceMin, priceMax]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    apiFetch("/api/categories")
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => setCategories([]));
  }, []);

  function handleSearchChange(val: string) {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(val), 350);
  }

  async function addToCart(product: Product, qty = 1) {
    if (!token) { onOpenAuth(); return; }
    try {
      await apiFetch("/api/cart/add", {
        method: "POST",
        body: JSON.stringify({ productId: product.id, quantity: qty }),
      }, token);
      toast.success(`${product.name.substring(0, 30)}... added`);
      onCartChange();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function buyNow(product: Product, qty = 1) {
    if (!token) { onOpenAuth(); return; }
    try {
      await apiFetch("/api/cart/add", {
        method: "POST",
        body: JSON.stringify({ productId: product.id, quantity: qty }),
      }, token);
      onCartChange();
      navigate("cart");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  function clearFilters() {
    setSearch(""); setSelectedCat(null); setSort(""); setPriceMin(""); setPriceMax("");
  }

  return (
    <>
      <UserNavbar
        user={user} cart={cart} currentPage="home"
        navigate={navigate} onLogout={onLogout}
        onOpenCart={() => setCartOpen(true)}
        onOpenAuth={onOpenAuth}
      />

      {/* Hero */}
      <div className="relative overflow-hidden bg-foreground text-primary-foreground">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&h=600&fit=crop&auto=format")`,
            backgroundSize: "cover", backgroundPosition: "center",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent mb-4">New Season Arrivals</p>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-none tracking-tight mb-6" style={{ fontFamily: "Outfit, sans-serif" }}>
            Shop<br />Smarter.
          </h1>
          <p className="text-base md:text-lg text-white/70 max-w-md mb-8">
            Thousands of products across electronics, fashion, sports & more — delivered fast across India.
          </p>
          <button
            onClick={() => document.getElementById("products-grid")?.scrollIntoView({ behavior: "smooth" })}
            className="bg-accent text-accent-foreground px-8 py-3 text-sm font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity"
          >
            Browse Products
          </button>
        </div>
      </div>

      {/* Category quick-links */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-none">
            <button
              onClick={clearFilters}
              className={`shrink-0 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest border transition-colors ${!selectedCat ? "bg-foreground text-primary-foreground border-foreground" : "border-border hover:border-foreground"}`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelectedCat(selectedCat === c.id ? null : c.id); setSort(""); }}
                className={`shrink-0 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest border transition-colors ${selectedCat === c.id ? "bg-foreground text-primary-foreground border-foreground" : "border-border hover:border-foreground"}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div id="products-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search products..."
              className="w-full bg-input-background pl-9 pr-4 py-2 text-sm border border-border focus:outline-none focus:border-foreground transition-colors"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-widest border transition-colors ${showFilters ? "bg-foreground text-primary-foreground border-foreground" : "border-border hover:border-foreground"}`}
          >
            <Filter size={12} /> Price Filter
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <SortAsc size={14} className="text-muted-foreground" />
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value as any); setSelectedCat(null); }}
              className="bg-input-background text-sm border border-border px-3 py-2 focus:outline-none focus:border-foreground"
            >
              <option value="">Default</option>
              <option value="asc">Price ↑</option>
              <option value="desc">Price ↓</option>
            </select>
          </div>
        </div>

        {/* Price range filter */}
        {showFilters && (
          <div className="flex flex-wrap gap-4 mb-6 p-5 bg-card border border-border">
            {[["Min (₹)", priceMin, setPriceMin], ["Max (₹)", priceMax, setPriceMax]].map(([lbl, val, setter]) => (
              <div key={lbl as string}>
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">{lbl as string}</label>
                <input
                  type="number"
                  value={val as string}
                  onChange={(e) => (setter as any)(e.target.value)}
                  placeholder={lbl === "Min (₹)" ? "0" : "99999"}
                  className="bg-input-background border border-border px-3 py-2 text-sm w-28 focus:outline-none focus:border-foreground"
                />
              </div>
            ))}
            <div className="flex items-end gap-2">
              <button
                onClick={() => { setSelectedCat(null); setSort(""); fetchProducts(); }}
                className="bg-foreground text-primary-foreground px-4 py-2 text-xs font-semibold uppercase tracking-widest hover:bg-accent transition-colors"
              >
                Apply
              </button>
              <button
                onClick={() => { setPriceMin(""); setPriceMax(""); setShowFilters(false); }}
                className="border border-border px-4 py-2 text-xs font-semibold uppercase tracking-widest hover:bg-secondary transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* Count */}
        <p className="text-sm text-muted-foreground mb-6">
          {loading ? "Loading..." : `${products.length} product${products.length !== 1 ? "s" : ""}`}
          {selectedCat && categories.find(c => c.id === selectedCat) && (
            <> in <strong>{categories.find(c => c.id === selectedCat)?.name}</strong></>
          )}
          {search && <> matching &ldquo;<strong>{search}</strong>&rdquo;</>}
        </p>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-card border border-border animate-pulse">
                <div className="aspect-square bg-secondary" />
                <div className="p-4 flex flex-col gap-2">
                  <div className="h-3 bg-secondary w-1/2" />
                  <div className="h-4 bg-secondary w-3/4" />
                  <div className="h-4 bg-secondary w-1/3 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
            <Search size={48} strokeWidth={1} />
            <p className="text-lg">No products found</p>
            <button onClick={clearFilters} className="text-sm text-accent hover:underline">Clear filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                index={i}
                onView={() => setSelectedProduct({ product: p, index: i })}
                onAdd={() => addToCart(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <p className="text-xl font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
              SHOP<span className="text-accent">.</span>IN
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your one-stop destination for quality products delivered across India.
            </p>
          </div>
          {[
            { title: "Shop", links: ["All Products", "New Arrivals", "Best Sellers", "Sale"] },
            { title: "Help", links: ["Track Order", "Returns", "Shipping Info", "FAQ"] },
            { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
          ].map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3">{col.title}</p>
              <ul className="flex flex-col gap-2">
                {col.links.map((l) => (
                  <li key={l} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors">{l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
          © 2024 Shop.IN · All rights reserved
        </div>
      </footer>

      {/* Product detail modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct.product}
          index={selectedProduct.index}
          token={token}
          onClose={() => setSelectedProduct(null)}
          onAdd={async (qty) => {
            await addToCart(selectedProduct.product, qty);
            setSelectedProduct(null);
          }}
          onBuyNow={async (qty) => {
            await buyNow(selectedProduct.product, qty);
            setSelectedProduct(null);
          }}
        />
      )}

      {/* Cart drawer */}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          token={token}
          onClose={() => setCartOpen(false)}
          onCartChange={onCartChange}
          onCheckout={() => { setCartOpen(false); navigate("cart"); }}
        />
      )}
    </>
  );
}

// ── Product Card ──────────────────────────────────────────────────────────────

function ProductCard({ product, index, onView, onAdd }: {
  product: Product; index: number;
  onView: () => void; onAdd: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const [adding, setAdding] = useState(false);

  async function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    setAdding(true);
    try { await onAdd(); } finally { setAdding(false); }
  }

  const imgSrc = imgErr || !product.imageUrl?.startsWith("http")
    ? FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
    : product.imageUrl;

  return (
    <div
      className="bg-card border border-border group cursor-pointer flex flex-col overflow-hidden transition-shadow duration-200 hover:shadow-lg"
      onClick={onView}
    >
      <div className="relative overflow-hidden bg-secondary aspect-square">
        <img
          src={imgSrc}
          alt={product.name}
          onError={() => setImgErr(true)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-xs font-semibold tracking-widest uppercase">Out of Stock</span>
          </div>
        )}
        {product.stock > 0 && product.stock <= 5 && (
          <div className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs font-semibold px-2 py-0.5">
            Only {product.stock} left
          </div>
        )}
        <button
          className="absolute top-2 right-2 bg-white/90 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => { e.stopPropagation(); onView(); }}
        >
          <Eye size={13} />
        </button>
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{product.category?.name}</p>
          <h3 className="font-semibold text-sm leading-snug line-clamp-2" style={{ fontFamily: "Outfit, sans-serif" }}>
            {product.name}
          </h3>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-lg font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>{fmt(product.price)}</span>
          <button
            onClick={handleAdd}
            disabled={product.stock === 0 || adding}
            className="bg-foreground text-primary-foreground px-3 py-1.5 text-xs font-semibold uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          >
            {adding ? "..." : <><Plus size={10} />Add</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Product Detail Modal ──────────────────────────────────────────────────────

function ProductModal({ product, index, token, onClose, onAdd, onBuyNow }: {
  product: Product; index: number; token: string | null;
  onClose: () => void; onAdd: (qty: number) => Promise<void>; onBuyNow: (qty: number) => Promise<void>;
}) {
  const [qty, setQty] = useState(1);
  const [imgErr, setImgErr] = useState(false);
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);

  const imgSrc = imgErr || !product.imageUrl?.startsWith("http")
    ? FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
    : product.imageUrl;

  async function handleAdd() {
    setAdding(true);
    try { await onAdd(qty); } finally { setAdding(false); }
  }

  async function handleBuyNow() {
    setBuying(true);
    try { await onBuyNow(qty); } finally { setBuying(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-end p-4 border-b border-border">
          <button onClick={onClose} className="p-1 hover:text-accent transition-colors"><X size={20} /></button>
        </div>
        <div className="grid md:grid-cols-2">
          <div className="bg-secondary aspect-square">
            <img src={imgSrc} alt={product.name} onError={() => setImgErr(true)} className="w-full h-full object-cover" />
          </div>
          <div className="p-8 flex flex-col gap-5">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-widest">{product.category?.name}</span>
              <h2 className="text-2xl font-bold mt-1 leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
                {product.name}
              </h2>
            </div>
            <p className="text-3xl font-bold text-accent" style={{ fontFamily: "Outfit, sans-serif" }}>{fmt(product.price)}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
            <div className="flex items-center gap-2 text-sm">
              <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? "bg-green-500" : "bg-red-500"}`} />
              <span className={product.stock > 0 ? "text-green-700" : "text-red-600"}>
                {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
              </span>
            </div>
            {product.stock > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Qty:</span>
                <div className="flex items-center border border-border">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-secondary transition-colors">
                    <Minus size={12} />
                  </button>
                  <span className="px-4 py-2 text-sm font-semibold min-w-[3rem] text-center">{qty}</span>
                  <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="px-3 py-2 hover:bg-secondary transition-colors">
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            )}
            {product.stock > 0 && (
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleBuyNow}
                  disabled={buying}
                  className="w-full bg-accent text-accent-foreground py-3.5 text-sm font-semibold uppercase tracking-widest hover:opacity-90 transition-colors disabled:opacity-40"
                >
                  {buying ? "Processing..." : "Buy Now"}
                </button>
                <button
                  onClick={handleAdd}
                  disabled={adding}
                  className="w-full border border-border py-3.5 text-sm font-semibold uppercase tracking-widest hover:bg-secondary transition-colors disabled:opacity-40"
                >
                  {adding ? "Adding..." : "Add to Cart"}
                </button>
              </div>
            )}
            {product.stock === 0 && (
              <button disabled className="w-full bg-foreground text-primary-foreground py-3.5 text-sm font-semibold uppercase tracking-widest opacity-40 cursor-not-allowed">
                Out of Stock
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Local icon import needed
import { X, Minus } from "lucide-react";
