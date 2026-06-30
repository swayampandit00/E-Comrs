import { useState, useEffect } from "react";
import { ShoppingBag, Users, Package, TrendingUp, ArrowUp, Clock, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { apiFetch, fmt, STATUS_COLORS } from "../../utils/api";
import type { Order, UserType, Product, Page } from "../../utils/types";
import AdminLayout from "../../components/AdminLayout";

interface Props { token: string; user: UserType; navigate: (p: Page) => void; onLogout: () => void; }

export default function DashboardPage({ token, user, navigate, onLogout }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/admin/orders", {}, token).catch(() => []),
      apiFetch("/api/admin/users", {}, token).catch(() => []),
      apiFetch("/api/products").catch(() => []),
    ]).then(([o, u, p]) => {
      setOrders(Array.isArray(o) ? o : []);
      setUsers(Array.isArray(u) ? u : []);
      setProducts(Array.isArray(p) ? p : []);
    }).finally(() => setLoading(false));
  }, [token]);

  const revenue = orders.filter(o => o.status !== "CANCELLED").reduce((s, o) => s + o.totalAmount, 0);
  const pendingOrders = orders.filter(o => o.status === "PENDING").length;
  const deliveredOrders = orders.filter(o => o.status === "DELIVERED").length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;
  const outOfStock = products.filter(p => p.stock === 0).length;

  const stats = [
    { label: "Total Revenue", value: fmt(revenue), icon: <TrendingUp size={20} />, sub: `${orders.length} total orders`, color: "text-green-600" },
    { label: "Products", value: products.length, icon: <ShoppingBag size={20} />, sub: `${outOfStock} out of stock`, color: "text-blue-600" },
    { label: "Customers", value: users.length, icon: <Users size={20} />, sub: "registered accounts", color: "text-violet-600" },
    { label: "Pending Orders", value: pendingOrders, icon: <Clock size={20} />, sub: `${deliveredOrders} delivered`, color: "text-amber-600" },
  ];

  return (
    <AdminLayout user={user} currentPage="admin-dashboard" navigate={navigate} onLogout={onLogout}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Welcome back, {user.name.split(" ")[0]}</p>
        </div>
        <p className="text-xs text-muted-foreground hidden sm:block">
          {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border p-5">
            <div className={`${s.color} mb-3`}>{s.icon}</div>
            {loading ? (
              <div className="h-8 bg-secondary animate-pulse w-24 mb-1" />
            ) : (
              <p className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>{s.value}</p>
            )}
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground mt-0.5">{s.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent orders */}
        <div className="lg:col-span-2 bg-card border border-border">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>Recent Orders</h2>
            <button onClick={() => navigate("admin-orders")} className="text-xs text-accent hover:underline uppercase tracking-widest">View All</button>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4 flex gap-4 animate-pulse">
                  <div className="h-4 bg-secondary flex-1" />
                  <div className="h-4 bg-secondary w-20" />
                </div>
              ))
            ) : orders.slice(0, 6).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 text-sm hover:bg-secondary/50 transition-colors">
                <div>
                  <p className="font-semibold">Order #{order.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="text-right flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 ${STATUS_COLORS[order.status] || ""}`}>{order.status}</span>
                  <span className="font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>{fmt(order.totalAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts + quick stats */}
        <div className="flex flex-col gap-4">
          {/* Inventory alerts */}
          <div className="bg-card border border-border">
            <div className="p-5 border-b border-border">
              <h2 className="font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>Inventory Alerts</h2>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <AlertItem
                icon={<XCircle size={16} className="text-red-500" />}
                label="Out of stock"
                value={outOfStock}
                onClick={() => navigate("admin-products")}
              />
              <AlertItem
                icon={<AlertCircle size={16} className="text-amber-500" />}
                label="Low stock (≤5)"
                value={lowStock}
                onClick={() => navigate("admin-products")}
              />
              <AlertItem
                icon={<CheckCircle2 size={16} className="text-green-500" />}
                label="In stock"
                value={products.filter(p => p.stock > 5).length}
                onClick={() => navigate("admin-products")}
              />
            </div>
          </div>

          {/* Order status breakdown */}
          <div className="bg-card border border-border">
            <div className="p-5 border-b border-border">
              <h2 className="font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>Order Status</h2>
            </div>
            <div className="p-4 flex flex-col gap-2">
              {["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"].map((status) => {
                const count = orders.filter(o => o.status === status).length;
                const pct = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{status}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                    <div className="h-1 bg-secondary w-full">
                      <div
                        className={`h-1 transition-all ${status === "DELIVERED" ? "bg-green-500" : status === "CANCELLED" ? "bg-red-500" : status === "PENDING" ? "bg-amber-500" : status === "SHIPPED" ? "bg-violet-500" : "bg-blue-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* New users */}
          <div className="bg-card border border-border">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>Recent Users</h2>
              <button onClick={() => navigate("admin-users")} className="text-xs text-accent hover:underline uppercase tracking-widest">View All</button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              {users.slice(0, 4).map((u) => (
                <div key={u.id} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-foreground text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                    {u.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 font-semibold ${u.role === "ADMIN" ? "bg-foreground text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function AlertItem({ icon, label, value, onClick }: {
  icon: React.ReactNode; label: string; value: number; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex items-center justify-between text-sm hover:bg-secondary/60 -mx-2 px-2 py-1.5 transition-colors w-full text-left">
      <span className="flex items-center gap-2">
        {icon} {label}
      </span>
      <span className="font-bold">{value}</span>
    </button>
  );
}
