import { useState } from "react";
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, ChevronRight, CheckCircle2, CreditCard, Smartphone, Truck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, fmt, FALLBACK_IMAGES } from "../../utils/api";
import type { Cart, Page, UserType } from "../../utils/types";
import UserNavbar from "../../components/UserNavbar";

interface Props {
  token: string | null;
  user: UserType | null;
  cart: Cart | null;
  navigate: (p: Page) => void;
  onLogout: () => void;
  onOpenAuth: () => void;
  onCartChange: () => void;
}

type Step = "cart" | "checkout" | "confirm";

interface ConfirmData { orderId: number; paymentMethod: string; transactionId: string; totalAmount: number; }

export default function CartPage({ token, user, cart, navigate, onLogout, onOpenAuth, onCartChange }: Props) {
  const [step, setStep] = useState<Step>("cart");
  const [payMethod, setPayMethod] = useState<"UPI" | "CARD" | "COD">("COD");
  const [placing, setPlacing] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmData | null>(null);

  async function updateQty(productId: number, quantity: number) {
    if (!token) return;
    try {
      await apiFetch(`/api/cart/update?productId=${productId}&quantity=${quantity}`, { method: "PUT" }, token);
      onCartChange();
    } catch (err: any) { toast.error(err.message); }
  }

  async function removeItem(productId: number) {
    if (!token) return;
    try {
      await apiFetch(`/api/cart/remove?productId=${productId}`, { method: "DELETE" }, token);
      toast.success("Item removed");
      onCartChange();
    } catch (err: any) { toast.error(err.message); }
  }

  async function clearCart() {
    if (!token) return;
    try {
      await apiFetch("/api/cart/clear", { method: "DELETE" }, token);
      toast.success("Cart cleared");
      onCartChange();
    } catch (err: any) { toast.error(err.message); }
  }

  async function placeOrder() {
    if (!token) return;
    setPlacing(true);
    try {
      const order = await apiFetch("/api/orders/place", { 
        method: "POST",
        body: JSON.stringify({ shippingAddress: "Default Address" })
      }, token);
      
      const payment = await apiFetch("/api/payment/process", {
        method: "POST",
        body: JSON.stringify({ orderId: order.id, paymentMethod: payMethod }),
      }, token);
      
      setConfirm({ orderId: order.id, paymentMethod: payMethod, transactionId: payment.transactionId || "COD-" + order.id, totalAmount: order.totalAmount });
      setStep("confirm");
      onCartChange();
      toast.success("Order placed successfully!");
    } catch (err: any) { 
      console.error("Order placement error:", err);
      toast.error(err.message || "Failed to place order"); 
    } finally { setPlacing(false); }
  }

  const items = cart?.items || [];

  return (
    <>
      <UserNavbar user={user} cart={cart} currentPage="cart" navigate={navigate} onLogout={onLogout} onOpenCart={() => {}} onOpenAuth={onOpenAuth} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Breadcrumb steps */}
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest mb-10">
          {["cart", "checkout", "confirm"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <ChevronRight size={12} className="text-muted-foreground" />}
              <span className={step === s ? "text-foreground font-bold" : "text-muted-foreground"}>
                {s === "cart" ? "01 Cart" : s === "checkout" ? "02 Checkout" : "03 Confirm"}
              </span>
            </div>
          ))}
        </div>

        {/* ── Step: Cart ── */}
        {step === "cart" && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>Shopping Cart</h1>
              {items.length > 0 && (
                <button onClick={clearCart} className="text-xs text-muted-foreground hover:text-accent uppercase tracking-widest transition-colors">
                  Clear All
                </button>
              )}
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground">
                <ShoppingCart size={56} strokeWidth={1} />
                <p className="text-lg">Your cart is empty</p>
                <button onClick={() => navigate("home")} className="bg-foreground text-primary-foreground px-6 py-2.5 text-sm font-semibold uppercase tracking-widest hover:bg-accent transition-colors">
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Items */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  {items.map((item) => (
                    <div key={item.cartItemId} className="bg-card border border-border p-4 flex gap-4">
                      <div className="w-20 h-20 bg-secondary shrink-0 overflow-hidden">
                        <img
                          src={item.product.imageUrl || FALLBACK_IMAGES[0]}
                          alt={item.product.name}
                          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGES[0]; }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold leading-snug" style={{ fontFamily: "Outfit, sans-serif" }}>{item.product.name}</p>
                        <p className="text-accent font-bold text-lg mt-1">{fmt(item.product.price)}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <div className="flex items-center border border-border">
                            <button
                              onClick={() => item.quantity > 1 ? updateQty(item.product.id, item.quantity - 1) : removeItem(item.product.id)}
                              className="px-2.5 py-1.5 hover:bg-secondary transition-colors"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="px-4 py-1.5 text-sm font-semibold">{item.quantity}</span>
                            <button onClick={() => updateQty(item.product.id, item.quantity + 1)} className="px-2.5 py-1.5 hover:bg-secondary transition-colors">
                              <Plus size={12} />
                            </button>
                          </div>
                          <span className="text-sm font-semibold text-muted-foreground">= {fmt(item.product.price * item.quantity)}</span>
                          <button onClick={() => removeItem(item.product.id)} className="ml-auto text-muted-foreground hover:text-accent transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order summary */}
                <div className="bg-card border border-border p-6 h-fit">
                  <h3 className="font-bold text-lg mb-5" style={{ fontFamily: "Outfit, sans-serif" }}>Order Summary</h3>
                  <div className="flex flex-col gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                      <span className="font-semibold">{fmt(cart?.totalAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-green-600 font-semibold">Free</span>
                    </div>
                    <div className="border-t border-border pt-3 flex justify-between text-base font-bold">
                      <span>Total</span>
                      <span className="text-accent text-xl" style={{ fontFamily: "Outfit, sans-serif" }}>{fmt(cart?.totalAmount || 0)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setStep("checkout")}
                    className="w-full bg-foreground text-primary-foreground py-3 mt-5 text-sm font-semibold uppercase tracking-widest hover:bg-accent transition-colors flex items-center justify-center gap-2"
                  >
                    Checkout <ChevronRight size={14} />
                  </button>
                  <button onClick={() => navigate("home")} className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1">
                    <ArrowLeft size={11} /> Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Step: Checkout ── */}
        {step === "checkout" && (
          <div className="max-w-lg">
            <button onClick={() => setStep("cart")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
              <ArrowLeft size={14} /> Back to Cart
            </button>
            <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: "Outfit, sans-serif" }}>Payment Method</h1>

            <div className="bg-card border border-border p-5 mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Order Total</p>
              <p className="text-3xl font-bold text-accent" style={{ fontFamily: "Outfit, sans-serif" }}>{fmt(cart?.totalAmount || 0)}</p>
              <p className="text-sm text-muted-foreground mt-1">{items.length} item{items.length !== 1 ? "s" : ""}</p>
            </div>

            <div className="flex flex-col gap-3 mb-8">
              {[
                { value: "COD", label: "Cash on Delivery", sub: "Pay when your order arrives", icon: <Truck size={20} /> },
                { value: "UPI", label: "UPI Payment", sub: "PhonePe, GPay, Paytm & more", icon: <Smartphone size={20} /> },
                { value: "CARD", label: "Credit / Debit Card", sub: "Visa, Mastercard, RuPay", icon: <CreditCard size={20} /> },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPayMethod(opt.value as any)}
                  className={`flex items-center gap-4 p-4 border-2 text-left transition-colors ${payMethod === opt.value ? "border-foreground bg-secondary" : "border-border hover:border-muted-foreground"}`}
                >
                  <div className={payMethod === opt.value ? "text-foreground" : "text-muted-foreground"}>
                    {opt.icon}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.sub}</p>
                  </div>
                  {payMethod === opt.value && <CheckCircle2 size={18} className="text-foreground" />}
                </button>
              ))}
            </div>

            <button
              onClick={placeOrder}
              disabled={placing}
              className="w-full bg-foreground text-primary-foreground py-4 text-sm font-semibold uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-50"
            >
              {placing ? "Placing Order..." : `Place Order — ${fmt(cart?.totalAmount || 0)}`}
            </button>
          </div>
        )}

        {/* ── Step: Confirm ── */}
        {step === "confirm" && confirm && (
          <div className="max-w-md mx-auto text-center py-16">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Order Placed!</h1>
            <p className="text-muted-foreground mb-8">
              Order #{confirm.orderId} confirmed.{" "}
              {confirm.paymentMethod === "COD"
                ? "Pay on delivery."
                : `Paid via ${confirm.paymentMethod} — TXN ${confirm.transactionId}`}
            </p>
            <div className="bg-card border border-border p-5 mb-8 text-left">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-semibold">#{confirm.orderId}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Payment</span>
                <span className="font-semibold">{confirm.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-accent">{fmt(confirm.totalAmount)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate("orders")}
                className="flex-1 border border-foreground py-3 text-sm font-semibold uppercase tracking-widest hover:bg-secondary transition-colors"
              >
                View Orders
              </button>
              <button
                onClick={() => navigate("home")}
                className="flex-1 bg-foreground text-primary-foreground py-3 text-sm font-semibold uppercase tracking-widest hover:bg-accent transition-colors"
              >
                Shop More
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
