import { useState, useEffect } from "react";
import { Search, Trash2, Shield, User, Calendar } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../../utils/api";
import type { UserType, Page } from "../../utils/types";
import AdminLayout from "../../components/AdminLayout";

interface Props { token: string; user: UserType; navigate: (p: Page) => void; onLogout: () => void; }

export default function UsersPage({ token, user, navigate, onLogout }: Props) {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"ALL" | "USER" | "ADMIN">("ALL");
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<UserType | null>(null);

  useEffect(() => {
    apiFetch("/api/admin/users", {}, token)
      .then((d) => setUsers(Array.isArray(d) ? d : []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = users.filter((u) => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "ALL" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  async function deleteUser(u: UserType) {
    setDeleting(u.id);
    try {
      await apiFetch(`/api/admin/user/${u.id}`, { method: "DELETE" }, token).catch(() => {});
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      toast.success(`${u.name} removed`);
      setConfirmDelete(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(null);
    }
  }

  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const userCount = users.filter((u) => u.role === "USER").length;

  return (
    <AdminLayout user={user} currentPage="admin-users" navigate={navigate} onLogout={onLogout}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>Users</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {users.length} total · {adminCount} admin{adminCount !== 1 ? "s" : ""} · {userCount} customer{userCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Users", value: users.length, icon: <User size={18} />, color: "text-blue-600" },
          { label: "Admins", value: adminCount, icon: <Shield size={18} />, color: "text-violet-600" },
          { label: "Customers", value: userCount, icon: <User size={18} />, color: "text-green-600" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border p-4">
            <div className={`${s.color} mb-2`}>{s.icon}</div>
            <p className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>{s.value}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full bg-input-background pl-9 pr-4 py-2 text-sm border border-border focus:outline-none focus:border-foreground"
          />
        </div>
        <div className="flex gap-2">
          {(["ALL", "USER", "ADMIN"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setFilterRole(r)}
              className={`px-3 py-2 text-xs font-semibold uppercase tracking-widest border transition-colors ${filterRole === r ? "bg-foreground text-primary-foreground border-foreground" : "border-border hover:border-foreground"}`}
            >
              {r === "ALL" ? "All" : r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                {["User", "Email", "Role", "Joined", "Actions"].map((h) => (
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
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-secondary animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No users found</td></tr>
              ) : filtered.map((u) => (
                <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-foreground text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold" style={{ fontFamily: "Outfit, sans-serif" }}>{u.name}</p>
                        <p className="text-xs text-muted-foreground">ID: {u.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 ${u.role === "ADMIN" ? "bg-foreground text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {u.role !== "ADMIN" && (
                      <button
                        onClick={() => setConfirmDelete(u)}
                        disabled={deleting === u.id}
                        className="p-1.5 text-muted-foreground hover:text-accent transition-colors disabled:opacity-40"
                        title="Delete user"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && (
          <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
            Showing {filtered.length} of {users.length} users
          </div>
        )}
      </div>

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-sm shadow-2xl p-6">
            <h3 className="text-lg font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Delete User?</h3>
            <p className="text-sm text-muted-foreground mb-1">
              You are about to permanently delete:
            </p>
            <div className="bg-secondary p-3 mb-5">
              <p className="font-semibold text-sm">{confirmDelete.name}</p>
              <p className="text-xs text-muted-foreground">{confirmDelete.email}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 border border-border py-2.5 text-sm font-semibold uppercase tracking-widest hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteUser(confirmDelete)}
                disabled={deleting === confirmDelete.id}
                className="flex-1 bg-accent text-accent-foreground py-2.5 text-sm font-semibold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {deleting === confirmDelete.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
