import { useState, useEffect } from "react";
import { User, Mail, Shield, Calendar, Package, ShoppingCart, Edit2, Check, X, LogOut } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, fmt } from "../../utils/api";
import type { Page, UserType, Cart, Order } from "../../utils/types";
import UserNavbar from "../../components/UserNavbar";

interface Props {
  token: string | null;
  user: UserType | null;
  cart: Cart | null;
  navigate: (p: Page) => void;
  onLogout: () => void;
  onOpenAuth: () => void;
  onOpenCart: () => void;
  onUserUpdate: (u: UserType) => void;
}

export default function ProfilePage({ token, user, cart, navigate, onLogout, onOpenAuth, onOpenCart, onUserUpdate }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [editName, setEditName] = useState(false);
  const [nameVal, setNameVal] = useState(user?.name || "");

  useEffect(() => {
    if (!token) { navigate("auth"); return; }
    apiFetch("/api/orders/history", {}, token)
      .then((d) => setOrders(Array.isArray(d) ? d : []))
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false));
  }, [token]);

  if (!user) return null;

  const totalSpent = orders.filter(o => o.status !== "CANCELLED").reduce((s, o) => s + o.totalAmount, 0);
  const cartItemCount = cart?.cartItems?.reduce((s, i) => s + i.quantity, 0) || 0;

  function saveName() {
    if (nameVal.trim().length < 2) { toast.error("Name must be at least 2 characters"); return; }
    // Optimistic update — in a real app this would call PATCH /api/auth/profile
    const updated: UserType = { ...user!, name: nameVal.trim() };
    localStorage.setItem("user", JSON.stringify(updated));
    onUserUpdate(updated);
    setEditName(false);
    toast.success("Name updated");
  }

  const STATUS_DOT: Record<string, string> = {
    DELIVERED: "bg-green-500", SHIPPED: "bg-violet-500",
    CONFIRMED: "bg-blue-500", PENDING: "bg-amber-500", CANCELLED: "bg-red-500",
  };

  return (
    <>
      <UserNavbar user={user} cart={cart} currentPage="profile" navigate={navigate} onLogout={onLogout} onOpenCart={onOpenCart} onOpenAuth={onOpenAuth} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: "Outfit, sans-serif" }}>My Profile</h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left — user card */}
          <div className="md:col-span-1 flex flex-col gap-5">
            {/* Avatar + name */}
            <div className="bg-card border border-border p-6 flex flex-col items-center text-center gap-4">
              <div className="w-20 h-20 bg-foreground text-primary-foreground rounded-full flex items-center justify-center text-3xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              {editName ? (
                <div className="flex items-center gap-2 w-full">
                  <input
                    value={nameVal}
                    onChange={(e) => setNameVal(e.target.value)}
                    className="flex-1 bg-input-background border border-border px-2 py-1.5 text-sm focus:outline-none focus:border-foreground"
                    autoFocus
                  />
                  <button onClick={saveName} className="p-1.5 text-green-600 hover:bg-green-50 transition-colors"><Check size={14} /></button>
                  <button onClick={() => { setEditName(false); setNameVal(user.name); }} className="p-1.5 text-red-500 hover:bg-red-50 transition-colors"><X size={14} /></button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="font-bold text-lg" style={{ fontFamily: "Outfit, sans-serif" }}>{user.name}</p>
                  <button onClick={() => setEditName(true)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <Edit2 size={13} />
                  </button>
                </div>
              )}
              <span className={`text-xs font-semibold uppercase tracking-widest px-3 py-1 ${user.role === "ADMIN" ? "bg-foreground text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                {user.role}
              </span>
            </div>

            {/* Details */}
            <div className="bg-card border border-border p-5 flex flex-col gap-4">
              <InfoRow icon={<Mail size={14} />} label="Email" value={user.email} />
              <InfoRow icon={<Shield size={14} />} label="Role" value={user.role} />
              {user.createdAt && (
                <InfoRow icon={<Calendar size={14} />} label="Member since"
                  value={new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                />
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Orders" value={orders.length} icon={<Package size={18} />} />
              <StatCard label="Cart items" value={cartItemCount} icon={<ShoppingCart size={18} />} />
              <div className="col-span-2 bg-card border border-border p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-accent" style={{ fontFamily: "Outfit, sans-serif" }}>{fmt(totalSpent)}</p>
              </div>
            </div>

            {/* Actions */}
            {user.role === "ADMIN" && (
              <button
                onClick={() => navigate("admin-dashboard")}
                className="w-full bg-foreground text-primary-foreground py-3 text-sm font-semibold uppercase tracking-widest hover:bg-accent transition-colors"
              >
                Open Admin Panel
              </button>
            )}
            <button
              onClick={onLogout}
              className="w-full border border-border py-3 text-sm font-semibold uppercase tracking-widest hover:bg-secondary transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>

          {/* Right — recent orders */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>Recent Orders</h2>
              {orders.length > 3 && (
                <button onClick={() => navigate("orders")} className="text-xs text-accent hover:underline uppercase tracking-widest">View All</button>
              )}
            </div>

            {loadingOrders ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-card border border-border p-4 animate-pulse h-16" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-card border border-border p-10 flex flex-col items-center gap-3 text-muted-foreground">
                <Package size={40} strokeWidth={1} />
                <p className="text-sm">No orders yet</p>
                <button onClick={() => navigate("home")} className="text-xs text-accent hover:underline">Browse products</button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {orders.slice(0, 5).map((order) => (
                  <div key={order.id} className="bg-card border border-border p-4 flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[order.status] || "bg-gray-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Order #{order.id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.orderItems.length} item{order.orderItems.length !== 1 ? "s" : ""} ·{" "}
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>{fmt(order.totalAmount)}</p>
                      <p className="text-xs text-muted-foreground">{order.status}</p>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => navigate("orders")}
                  className="w-full border border-border py-3 text-xs font-semibold uppercase tracking-widest hover:bg-secondary transition-colors text-muted-foreground"
                >
                  View All Orders
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="text-muted-foreground mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest">{label}</p>
        <p className="text-sm font-medium mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-card border border-border p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <p className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>{value}</p>
      <p className="text-xs text-muted-foreground uppercase tracking-widest">{label}</p>
    </div>
  );
}
