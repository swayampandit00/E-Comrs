import { useState } from "react";
import { ShoppingCart, User, Package, LogOut, Menu, X, Home } from "lucide-react";
import type { Page, UserType, Cart } from "../utils/types";

interface Props {
  user: UserType | null;
  cart: Cart | null;
  currentPage: Page;
  navigate: (p: Page) => void;
  onLogout: () => void;
  onOpenCart: () => void;
  onOpenAuth: () => void;
}

export default function UserNavbar({
  user, cart, currentPage, navigate, onLogout, onOpenCart, onOpenAuth
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const cartCount = cart?.cartItems?.reduce((a, i) => a + i.quantity, 0) || 0;

  return (
    <nav className="sticky top-0 z-30 bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => navigate("home")}
            className="text-xl font-bold tracking-tight shrink-0"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            SHOP<span className="text-accent">.</span>IN
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink active={currentPage === "home"} onClick={() => navigate("home")}>
              <Home size={14} /> Shop
            </NavLink>
            {user && (
              <>
                <NavLink active={currentPage === "orders"} onClick={() => navigate("orders")}>
                  <Package size={14} /> Orders
                </NavLink>
                <NavLink active={currentPage === "profile"} onClick={() => navigate("profile")}>
                  <User size={14} /> Profile
                </NavLink>
              </>
            )}
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  Hi, <strong>{user.name.split(" ")[0]}</strong>
                </span>
                {user.role === "ADMIN" && (
                  <button
                    onClick={() => navigate("admin-dashboard")}
                    className="text-xs font-semibold uppercase tracking-widest px-3 py-1.5 bg-foreground text-primary-foreground hover:bg-accent transition-colors"
                  >
                    Admin Panel
                  </button>
                )}
                <button
                  onClick={onLogout}
                  className="p-2 text-muted-foreground hover:text-accent transition-colors"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-widest px-4 py-2 border border-foreground hover:bg-foreground hover:text-primary-foreground transition-colors"
              >
                <User size={14} /> Login
              </button>
            )}

            <button
              onClick={user ? onOpenCart : onOpenAuth}
              className="relative flex items-center gap-2 bg-foreground text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-accent transition-colors"
            >
              <ShoppingCart size={16} />
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Mobile icons */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={user ? onOpenCart : onOpenAuth}
              className="relative p-2"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-accent-foreground text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2">
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border py-4 flex flex-col gap-3">
            <MobileNavLink onClick={() => { navigate("home"); setMobileOpen(false); }}>
              Shop
            </MobileNavLink>
            {user && (
              <>
                <MobileNavLink onClick={() => { navigate("orders"); setMobileOpen(false); }}>
                  My Orders
                </MobileNavLink>
                <MobileNavLink onClick={() => { navigate("profile"); setMobileOpen(false); }}>
                  Profile
                </MobileNavLink>
                {user.role === "ADMIN" && (
                  <MobileNavLink onClick={() => { navigate("admin-dashboard"); setMobileOpen(false); }}>
                    Admin Panel
                  </MobileNavLink>
                )}
                <button
                  onClick={() => { onLogout(); setMobileOpen(false); }}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent"
                >
                  <LogOut size={14} /> Logout
                </button>
              </>
            )}
            {!user && (
              <button
                onClick={() => { onOpenAuth(); setMobileOpen(false); }}
                className="text-sm font-semibold uppercase tracking-widest flex items-center gap-2"
              >
                <User size={14} /> Login / Register
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${active ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}
    >
      {children}
    </button>
  );
}

function MobileNavLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="text-sm font-medium text-left hover:text-accent transition-colors">
      {children}
    </button>
  );
}
