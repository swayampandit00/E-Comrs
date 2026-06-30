import { useState, useEffect, useCallback } from "react";
import { Toaster } from "sonner";
import { apiFetch } from "../utils/api";
import type { Page, UserType, Cart } from "../utils/types";

// Pages
import AuthPage from "../pages/auth/AuthPage";
import HomePage from "../pages/user/HomePage";
import CartPage from "../pages/user/CartPage";
import OrdersPage from "../pages/user/OrdersPage";
import ProfilePage from "../pages/user/ProfilePage";
import DashboardPage from "../pages/admin/DashboardPage";
import ProductsPage from "../pages/admin/ProductsPage";
import AdminOrdersPage from "../pages/admin/OrdersPage";
import UsersPage from "../pages/admin/UsersPage";
import CategoriesPage from "../pages/admin/CategoriesPage";

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<UserType | null>(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  });
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartLoading, setCartLoading] = useState(false);

  // Verify token on load
  useEffect(() => {
    if (!token) return;
    apiFetch("/api/auth/profile", {}, token)
      .then((u: UserType) => {
        setUser(u);
        localStorage.setItem("user", JSON.stringify(u));
      })
      .catch(() => {
        // Token invalid — clear it
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setToken(null);
        setUser(null);
      });
  }, []);

  const fetchCart = useCallback(async () => {
    if (!token) { setCart(null); return; }
    setCartLoading(true);
    try {
      const data = await apiFetch("/api/cart", {}, token);
      setCart(data);
    } catch {
      setCart(null);
    } finally {
      setCartLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  function navigate(p: Page) {
    // Guard admin pages
    if (p.startsWith("admin-") && user?.role !== "ADMIN") {
      setPage("auth");
      return;
    }
    // Guard protected user pages
    if ((p === "cart" || p === "orders" || p === "profile") && !token) {
      setPage("auth");
      return;
    }
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleAuthSuccess(t: string, u: UserType) {
    setToken(t);
    setUser(u);
    // Redirect admins to admin panel
    setPage(u.role === "ADMIN" ? "admin-dashboard" : "home");
    fetchCart();
  }

  function handleLogout() {
    if (token) apiFetch("/api/auth/logout", { method: "POST" }, token).catch(() => {});
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    setCart(null);
    setPage("home");
  }

  function handleUserUpdate(u: UserType) {
    setUser(u);
    localStorage.setItem("user", JSON.stringify(u));
  }

  const userProps = { token, user, cart, navigate, onLogout: handleLogout };
  const adminProps = {
    token: token || "",
    user: user as UserType,
    navigate,
    onLogout: handleLogout,
  };

  // ── Admin pages ──────────────────────────────────────────────────────────────
  if (page === "admin-dashboard") {
    return (
      <>
        <Toaster position="top-right" richColors />
        <DashboardPage {...adminProps} />
      </>
    );
  }
  if (page === "admin-products") {
    return (
      <>
        <Toaster position="top-right" richColors />
        <ProductsPage {...adminProps} />
      </>
    );
  }
  if (page === "admin-orders") {
    return (
      <>
        <Toaster position="top-right" richColors />
        <AdminOrdersPage {...adminProps} />
      </>
    );
  }
  if (page === "admin-users") {
    return (
      <>
        <Toaster position="top-right" richColors />
        <UsersPage {...adminProps} />
      </>
    );
  }
  if (page === "admin-categories") {
    return (
      <>
        <Toaster position="top-right" richColors />
        <CategoriesPage {...adminProps} />
      </>
    );
  }

  // ── Auth page ────────────────────────────────────────────────────────────────
  if (page === "auth") {
    return (
      <>
        <Toaster position="top-right" richColors />
        <AuthPage navigate={navigate} onSuccess={handleAuthSuccess} />
      </>
    );
  }

  // ── User pages ───────────────────────────────────────────────────────────────
  const openCart = () => navigate("cart");
  const openAuth = () => navigate("auth");

  return (
    <>
      <Toaster position="top-right" richColors />

      {page === "cart" ? (
        <CartPage
          {...userProps}
          onOpenAuth={openAuth}
          onCartChange={fetchCart}
        />
      ) : page === "orders" ? (
        <OrdersPage
          {...userProps}
          onOpenAuth={openAuth}
          onOpenCart={openCart}
        />
      ) : page === "profile" ? (
        <ProfilePage
          {...userProps}
          onOpenAuth={openAuth}
          onOpenCart={openCart}
          onUserUpdate={handleUserUpdate}
        />
      ) : (
        // Default: home
        <HomePage
          {...userProps}
          onOpenAuth={openAuth}
          onCartChange={fetchCart}
        />
      )}
    </>
  );
}
