import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, X, Package } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../../utils/api";
import type { Category, UserType, Page } from "../../utils/types";
import AdminLayout from "../../components/AdminLayout";

interface Props { token: string; user: UserType; navigate: (p: Page) => void; onLogout: () => void; }

interface CategoryForm {
  name: string;
  description: string;
}

const EMPTY_FORM: CategoryForm = { name: "", description: "" };

export default function CategoriesPage({ token, user, navigate, onLogout }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    apiFetch("/api/categories")
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = categories.filter((c) => {
    return !search || 
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
  });

  function openAdd() {
    setForm(EMPTY_FORM); setEditCategory(null); setModal("add");
  }

  function openEdit(c: Category) {
    setForm({ name: c.name, description: c.description });
    setEditCategory(c); setModal("edit");
  }

  function setField(k: keyof CategoryForm, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function validate() {
    if (!form.name.trim()) return "Category name is required";
    if (form.name.trim().length < 2) return "Category name must be at least 2 characters";
    return null;
  }

  async function saveCategory() {
    const err = validate();
    if (err) { toast.error(err); return; }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim(),
      };

      if (modal === "edit" && editCategory) {
        const updated = await apiFetch(`/api/categories/${editCategory.id}`, {
          method: "PUT", body: JSON.stringify(body),
        }, token);
        setCategories((prev) => prev.map((c) => c.id === editCategory.id ? updated : c));
        toast.success("Category updated");
      } else {
        const created = await apiFetch("/api/categories", {
          method: "POST", body: JSON.stringify(body),
        }, token);
        setCategories((prev) => [created, ...prev]);
        toast.success("Category added");
      }
      setModal(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory(id: number) {
    if (!confirm("Delete this category? This may affect products in this category.")) return;
    setDeleting(id);
    try {
      await apiFetch(`/api/categories/${id}`, { method: "DELETE" }, token);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Category deleted");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <AdminLayout user={user} currentPage="admin-categories" navigate={navigate} onLogout={onLogout}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>Categories</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{categories.length} total categories</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 bg-foreground text-primary-foreground px-4 py-2 text-sm font-semibold uppercase tracking-widest hover:bg-accent transition-colors"
        >
          <Plus size={14} /> Add Category
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search categories..."
          className="w-full bg-input-background pl-9 pr-4 py-2 text-sm border border-border focus:outline-none focus:border-foreground"
        />
      </div>

      {/* Table */}
      <div className="bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                {["Category", "Description", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 3 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-secondary animate-pulse w-full max-w-[150px]" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-12 text-center text-muted-foreground">No categories found</td></tr>
              ) : filtered.map((c) => (
                <tr key={c.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-foreground text-primary-foreground rounded-lg flex items-center justify-center text-lg font-bold shrink-0" style={{ fontFamily: "Outfit, sans-serif" }}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold" style={{ fontFamily: "Outfit, sans-serif" }}>{c.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {c.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground line-clamp-2 max-w-[300px]">{c.description}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(c)} className="p-1.5 hover:text-accent transition-colors" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => deleteCategory(c.id)}
                        disabled={deleting === c.id}
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
            Showing {filtered.length} of {categories.length} categories
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>
                {modal === "add" ? "Add Category" : "Edit Category"}
              </h2>
              <button onClick={() => setModal(null)} className="p-1 hover:text-accent transition-colors"><X size={18} /></button>
            </div>

            <div className="p-6 flex flex-col gap-4">
              <FormField label="Category Name *">
                <input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="e.g. Electronics" className="admin-input" autoFocus />
              </FormField>
              <FormField label="Description">
                <textarea value={form.description} onChange={(e) => setField("description", e.target.value)} rows={3} placeholder="Category description..." className="admin-input resize-none" />
              </FormField>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(null)} className="flex-1 border border-border py-2.5 text-sm font-semibold uppercase tracking-widest hover:bg-secondary transition-colors">
                  Cancel
                </button>
                <button
                  onClick={saveCategory}
                  disabled={saving}
                  className="flex-1 bg-foreground text-primary-foreground py-2.5 text-sm font-semibold uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : modal === "add" ? "Add Category" : "Save Changes"}
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
