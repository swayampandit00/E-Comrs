import { useState, useEffect } from "react";
import { Package, ChevronDown, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, fmt, STATUS_COLORS, PAY_STATUS_COLORS } from "../../utils/api";
import type { Order, Page, UserType, Cart } from "../../utils/types";
import UserNavbar from "../../components/UserNavbar";

interface Props {
  token: string | null;
  user: UserType | null;
  cart: Cart | null;
  navigate: (p: Page) => void;
  onLogout: () => void;
  onOpenAuth: () => void;
  onOpenCart: () => void;
}

export default function OrdersPage({ token, user, cart, navigate, onLogout, onOpenAuth, onOpenCart }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);

  useEffect(() => {
    if (!token) { navigate("auth"); return; }
    apiFetch("/api/orders/history", {}, token)
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [token]);

  async function cancelOrder(id: number) {
    if (!token) return;
    setCancelling(id);
    try {
      await apiFetch(`/api/orders/cancel/${id}`, { method: "PUT" }, token);
      setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: "CANCELLED" as any } : o));
      toast.success("Order cancelled");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCancelling(null);
    }
  }

  return (
    <>
      <UserNavbar user={user} cart={cart} currentPage="orders" navigate={navigate} onLogout={onLogout} onOpenCart={onOpenCart} onOpenAuth={onOpenAuth} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button
          onClick={() => navigate("home")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft size={14} /> Back to Shop
        </button>

        <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: "Outfit, sans-serif" }}>My Orders</h1>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border p-5 animate-pulse">
                <div className="flex justify-between">
                  <div className="h-5 bg-secondary w-32" />
                  <div className="h-5 bg-secondary w-20" />
                </div>
                <div className="h-4 bg-secondary w-24 mt-2" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
            <Package size={56} strokeWidth={1} />
            <p className="text-lg font-medium">No orders yet</p>
            <p className="text-sm">Your order history will appear here</p>
            <button
              onClick={() => navigate("home")}
              className="bg-foreground text-primary-foreground px-6 py-2.5 text-sm font-semibold uppercase tracking-widest hover:bg-accent transition-colors"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-card border border-border overflow-hidden">
                {/* Order header */}
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-secondary/50 transition-colors"
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold" style={{ fontFamily: "Outfit, sans-serif" }}>
                          Order #{order.id}
                        </p>
                        <span className={`text-xs font-semibold px-2 py-0.5 shrink-0 ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-bold text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>
                      {fmt(order.totalAmount)}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-muted-foreground transition-transform duration-200 ${expanded === order.id ? "rotate-180" : ""}`}
                    />
                  </div>
                </div>

                {/* Expanded details */}
                {expanded === order.id && (
                  <div className="border-t border-border p-5 bg-secondary/30">
                    {/* Items */}
                    <div className="flex flex-col gap-3 mb-5">
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Items</p>
                      {order.orderItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <span className="flex-1 line-clamp-1">{item.productName}</span>
                          <span className="text-muted-foreground mx-4">×{item.quantity}</span>
                          <span className="font-semibold">{fmt(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-border font-bold">
                        <span>Total</span>
                        <span className="text-accent">{fmt(order.totalAmount)}</span>
                      </div>
                    </div>

                    {/* Payment */}
                    {order.payment ? (
                      <div className="bg-card border border-border p-3 mb-4">
                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Payment</p>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-3">
                            <span>{order.payment.paymentMethod}</span>
                            {order.payment.transactionId && (
                              <span className="text-xs text-muted-foreground font-mono">{order.payment.transactionId}</span>
                            )}
                          </div>
                          <span className={`text-xs font-semibold px-2 py-0.5 ${PAY_STATUS_COLORS[order.payment.paymentStatus] || ""}`}>
                            {order.payment.paymentStatus}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 p-3 mb-4">
                        <p className="text-xs text-amber-700">Payment not yet processed</p>
                      </div>
                    )}

                    {/* Cancel */}
                    {order.status === "PENDING" && (
                      <button
                        onClick={() => cancelOrder(order.id)}
                        disabled={cancelling === order.id}
                        className="text-xs font-semibold uppercase tracking-widest text-accent hover:underline disabled:opacity-50"
                      >
                        {cancelling === order.id ? "Cancelling..." : "Cancel Order"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
