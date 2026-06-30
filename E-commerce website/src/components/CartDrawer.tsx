import { useState, useEffect } from "react";
import { X, Plus, Minus, Trash2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { apiFetch, fmt, FALLBACK_IMAGES } from "../utils/api";
import type { Cart } from "../utils/types";

interface Props {
  cart: Cart | null;
  token: string | null;
  onClose: () => void;
  onCartChange: () => void;
  onCheckout: () => void;
}

export default function CartDrawer({ cart, token, onClose, onCartChange, onCheckout }: Props) {
  const [loading, setLoading] = useState(false);

  async function update(productId: number, quantity: number) {
    if (!token) return;
    try {
      await apiFetch("/api/cart/update", {
        method: "PUT",
        body: JSON.stringify({ productId, quantity }),
      }, token);
      onCartChange();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function remove(productId: number) {
    if (!token) return;
    try {
      await apiFetch(`/api/cart/remove?productId=${productId}`, { method: "DELETE" }, token);
      toast.success("Item removed");
      onCartChange();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function clear() {
    if (!token) return;
    setLoading(true);
    try {
      await apiFetch("/api/cart/clear", { method: "DELETE" }, token);
      toast.success("Cart cleared");
      onCartChange();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-sm bg-card flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>
            Your Cart
            {cart && cart.cartItems?.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({cart.cartItems.length} items)
              </span>
            )}
          </h2>
          <button onClick={onClose} className="p-1 hover:text-accent transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!cart || !cart.cartItems || cart.cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
              <ShoppingCart size={40} strokeWidth={1} />
              <p className="text-sm">Your cart is empty</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {cart.cartItems?.map((item) => (
                <div key={item.id} className="flex gap-3 pb-4 border-b border-border last:border-0">
                  <div className="w-16 h-16 bg-secondary flex-shrink-0 overflow-hidden">
                    <img
                      src={item.imageUrl || FALLBACK_IMAGES[0]}
                      alt={item.productName}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGES[0]; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-snug line-clamp-2" style={{ fontFamily: "Outfit, sans-serif" }}>
                      {item.productName}
                    </p>
                    <p className="text-sm text-accent font-bold mt-0.5">{fmt(item.price)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => item.quantity > 1 ? update(item.productId, item.quantity - 1) : remove(item.productId)}
                        className="w-6 h-6 border border-border flex items-center justify-center hover:border-foreground transition-colors"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => update(item.productId, item.quantity + 1)}
                        className="w-6 h-6 border border-border flex items-center justify-center hover:border-foreground transition-colors"
                      >
                        <Plus size={10} />
                      </button>
                      <button onClick={() => remove(item.productId)} className="ml-auto p-1 text-muted-foreground hover:text-accent transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart && cart.cartItems?.length > 0 && (
          <div className="p-6 border-t border-border flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="text-xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>
                {fmt(cart.totalPrice)}
              </span>
            </div>
            <button
              onClick={onCheckout}
              className="w-full bg-foreground text-primary-foreground py-3 text-sm font-semibold uppercase tracking-widest hover:bg-accent transition-colors"
            >
              Proceed to Checkout
            </button>
            <button
              onClick={clear}
              disabled={loading}
              className="w-full text-muted-foreground text-xs uppercase tracking-widest py-2 hover:text-accent transition-colors"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
