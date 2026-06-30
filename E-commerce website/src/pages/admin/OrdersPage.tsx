import { useState, useEffect } from "react";
import { Search, ChevronDown, X } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, fmt, STATUS_COLORS, PAY_STATUS_COLORS } from "../../utils/api";
import type { Order, UserType, Page } from "../../utils/types";
import AdminLayout from "../../components/AdminLayout";

interface Props { token: string; user: UserType; navigate: (p: Page) => void; onLogout: () => void; }

const ALL_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

export default function AdminOrdersPage({ token, user, navigate, onLogout }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [updating, setUpdating] = useState<number | null>(null);
  const [statusModal, setStatusModal] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    apiFetch("/api/admin/orders", {}, token)
      .then((d) => setOrders(Array.isArray(d) ? d : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = orders.filter((o) => {
    const matchSearch = !search ||
      String(o.id).includes(search) ||
      String(o.userId).includes(search);
    const matchStatus = filterStatus === "ALL" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  async function updateStatus(order: Order, status: string) {
    setUpdating(order.id);
    try {
      await apiFetch(`/api/admin/order/status/${order.id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }, token).catch(() => {});
      setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: status as any } : o));
      toast.success(`Order #${order.id} → ${status}`);
      setStatusModal(null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdating(null);
    }
  }

  const counts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AdminLayout user={user} currentPage="admin-orders" navigate={navigate} onLogout={onLogout}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{orders.length} total orders</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterStatus("ALL")}
          className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-widest border transition-colors ${filterStatus === "ALL" ? "bg-foreground text-primary-foreground border-foreground" : "border-border hover:border-foreground"}`}
        >
          All ({orders.length})
        </button>
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-widest border transition-colors ${filterStatus === s ? "bg-foreground text-primary-foreground border-foreground" : "border-border hover:border-foreground"}`}
          >
            {s} ({counts[s] || 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by order or user ID..."
          className="w-full bg-input-background pl-9 pr-4 py-2 text-sm border border-border focus:outline-none focus:border-foreground"
        />
      </div>

      {/* Orders list */}
      <div className="bg-card border border-border overflow-hidden">
        {loading ? (
          <div className="flex flex-col divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-4 flex gap-4 animate-pulse">
                <div className="h-5 bg-secondary flex-1 max-w-[120px]" />
                <div className="h-5 bg-secondary w-20 ml-auto" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No orders found</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((order) => (
              <div key={order.id}>
                {/* Row */}
                <div
                  className="flex items-center gap-4 p-4 hover:bg-secondary/30 cursor-pointer transition-colors"
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Order #{order.id}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 ${STATUS_COLORS[order.status] || ""}`}>
                        {order.status}
                      </span>
                      {order.payment && (
                        <span className={`text-xs font-semibold px-2 py-0.5 ${PAY_STATUS_COLORS[order.payment.paymentStatus] || ""}`}>
                          {order.payment.paymentMethod} · {order.payment.paymentStatus}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      User #{order.userId} ·{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>
                      {fmt(order.totalAmount)}
                    </span>
                    <ChevronDown size={15} className={`text-muted-foreground transition-transform ${expanded === order.id ? "rotate-180" : ""}`} />
                  </div>
                </div>

                {/* Expanded */}
                {expanded === order.id && (
                  <div className="bg-secondary/20 border-t border-border p-5">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Items */}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Order Items</p>
                        <div className="flex flex-col gap-2">
                          {order.orderItems.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="line-clamp-1 flex-1">{item.productName}</span>
                              <span className="text-muted-foreground mx-3">×{item.quantity}</span>
                              <span className="font-semibold">{fmt(item.price * item.quantity)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-sm font-bold pt-2 border-t border-border">
                            <span>Total</span>
                            <span className="text-accent">{fmt(order.totalAmount)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Update status */}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Update Status</p>
                        <div className="flex flex-col gap-2">
                          {ALL_STATUSES.map((s) => (
                            <button
                              key={s}
                              onClick={() => updateStatus(order, s)}
                              disabled={order.status === s || updating === order.id}
                              className={`flex items-center justify-between px-3 py-2 text-xs font-semibold border transition-colors ${order.status === s ? "bg-foreground text-primary-foreground border-foreground" : "border-border hover:border-foreground hover:bg-secondary"} disabled:cursor-default`}
                            >
                              <span>{s}</span>
                              {order.status === s && <span className="text-accent">Current</span>}
                              {updating === order.id && <span className="animate-spin">⟳</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {!loading && (
          <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
            Showing {filtered.length} of {orders.length} orders
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
