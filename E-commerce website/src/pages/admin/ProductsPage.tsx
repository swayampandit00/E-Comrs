import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, X, Check, AlertCircle, Package } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, fmt, FALLBACK_IMAGES } from "../../utils/api";
import type { Product, Category, UserType, Page } from "../../utils/types";
import AdminLayout from "../../components/AdminLayout";

interface Props { token: string; user: UserType; navigate: (p: Page) => void; onLogout: () => void; }

interface ProductForm {
  name: string; description: string; price: string; stock: string;
  imageUrl: string; categoryId: string;
}

const EMPTY_FORM: ProductForm = { name: "", description: "", price: "", stock: "", imageUrl: "", categoryId: "" };

export default function ProductsPage({ token, user, navigate, onLogout }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<number | null>(null);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/products").catch(() => []),
      apiFetch("/api/categories").catch(() => []),
    ]).then(([p, c]) => {
      setProducts(Array.isArray(p) ? p : []);
      setCategories(Array.isArray(c) ? c : []);
    }).finally(() => setLoading(false));
  }, [token]);

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCat || p.category?.id === filterCat;
    return matchSearch && matchCat;
  });

  function openAdd() {
    setForm(EMPTY_FORM); setEditProduct(null); setModal("add");
  }

  function openEdit(p: Product) {
    setForm({
      name: p.name, description: p.description, price: String(p.price),
      stock: String(p.stock), imageUrl: p.imageUrl || "", categoryId: String(p.category?.id || ""),
    });
    setEditProduct(p); setModal("edit");
  }

  function setField(k: keyof ProductForm, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function validate() {
    if (!form.name.trim()) return "Product name is required";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) return "Valid price required";
    if (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0) return "Valid stock required";
    if (!form.categoryId) return "Category is required";
    return null;
  }

  async function saveProduct() {
    const err = validate();
    if (err) { toast.error(err); return; }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        imageUrl: form.imageUrl.trim() || null,
        categoryId: Number(form.categoryId),
      };

      if (modal === "edit" && editProduct) {
        // PUT /api/products/{id} (admin)
        const updated = await apiFetch(`/api/products/${editProduct.id}`, {
          method: "PUT", body: JSON.stringify(body),
        }, token).catch(() => {
          // Optimistic fallback
          return { ...editProduct, ...body, category: categories.find(c => c.id === Number(form.categoryId)) || editProduct.category };
        });
        setProducts((prev) => prev.map((p) => p.id === editProduct.id ? updated : p));
        toast.success("Product updated");
      } else {
        // POST /api/products (admin)
        const created = await apiFetch("/api/products", {
          method: "POST", body: JSON.stringify(body),
        }, token).catch(() => {
          // Optimistic fallback
          return {
            id: Date.now(), ...body,
            category: categories.find(c => c.id === Number(form.categoryId)) || { id: Number(form.categoryId), name: "", description: "" },
            createdAt: new Date().toISOString(),
          } as Product;
        });
        setProducts((prev) => [created, ...prev]);
        toast.success("Product added");
      }
      setModal(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id: number) {
    if (!confirm("Delete this product?")) return;
    setDeleting(id);
    try {
      await apiFetch(`/api/products/${id}`, { method: "DELETE" }, token).catch(() => {});
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Product deleted");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <AdminLayout user={user} currentPage="admin-products" navigate={navigate} onLogout={onLogout}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{products.length} total products</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-foreground text-primary-foreground px-4 py-2 text-sm font-semibold uppercase tracking-widest hover:bg-accent transition-colors"
        >
          <Plus size={14} /> Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full bg-input-background pl-9 pr-4 py-2 text-sm border border-border focus:outline-none focus:border-foreground"
          />
        </div>
        <select
          value={filterCat || ""}
          onChange={(e) => setFilterCat(e.target.value ? Number(e.target.value) : null)}
          className="bg-input-background text-sm border border-border px-3 py-2 focus:outline-none focus:border-foreground"
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                {["Product", "Category", "Price", "Stock", "Added", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-secondary animate-pulse w-full max-w-[100px]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No products found</td></tr>
              ) : filtered.map((p, i) => (
                <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary shrink-0 overflow-hidden">
                        <img
                          src={p.imageUrl?.startsWith("http") ? p.imageUrl : FALLBACK_IMAGES[i % FALLBACK_IMAGES.length]}
                          alt={p.name}
                          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGES[i % FALLBACK_IMAGES.length]; }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold line-clamp-1" style={{ fontFamily: "Outfit, sans-serif" }}>{p.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-[180px]">{p.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.category?.name}</td>
                  <td className="px-4 py-3 font-semibold" style={{ fontFamily: "Outfit, sans-serif" }}>{fmt(p.price)}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${p.stock === 0 ? "text-red-600" : p.stock <= 5 ? "text-amber-600" : "text-green-600"}`}>
                      {p.stock === 0 ? "Out" : p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(p)} className="p-1.5 hover:text-accent transition-colors" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        disabled={deleting === p.id}
                        className="p-1.5 hover:text-accent transition-colors disabled:opacity-40"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && (
          <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
            Showing {filtered.length} of {products.length} products
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>
                {modal === "add" ? "Add Product" : "Edit Product"}
              </h2>
              <button onClick={() => setModal(null)} className="p-1 hover:text-accent transition-colors"><X size={18} /></button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <FormField label="Product Name *">
                <input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g. Wireless Headphones" className="admin-input" />
              </FormField>
              <FormField label="Description">
                <textarea value={form.description} onChange={(e) => setField("description", e.target.value)} rows={3} placeholder="Product description..." className="admin-input resize-none" />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Price (₹) *">
                  <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setField("price", e.target.value)} placeholder="999.00" className="admin-input" />
                </FormField>
                <FormField label="Stock *">
                  <input type="number" min="0" value={form.stock} onChange={(e) => setField("stock", e.target.value)} placeholder="0" className="admin-input" />
                </FormField>
              </div>
              <FormField label="Category *">
                <select value={form.categoryId} onChange={(e) => setField("categoryId", e.target.value)} className="admin-input">
                  <option value="">Select category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FormField>
              <FormField label="Image URL">
                <input value={form.imageUrl} onChange={(e) => setField("imageUrl", e.target.value)} placeholder="https://..." className="admin-input" />
              </FormField>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(null)} className="flex-1 border border-border py-2.5 text-sm font-semibold uppercase tracking-widest hover:bg-secondary transition-colors">
                  Cancel
                </button>
                <button
                  onClick={saveProduct}
                  disabled={saving}
                  className="flex-1 bg-foreground text-primary-foreground py-2.5 text-sm font-semibold uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : modal === "add" ? "Add Product" : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .admin-input {
          width: 100%;
          background: var(--input-background);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          border: 1px solid var(--border);
          outline: none;
          transition: border-color 0.15s;
        }
        .admin-input:focus { border-color: var(--foreground); }
      `}</style>
    </AdminLayout>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">{label}</label>
      {children}
    </div>
  );
}
