import { useState } from "react";
import {
  LayoutDashboard, Package, ShoppingBag, Users, LogOut,
  ChevronRight, Menu, X, Store, ArrowLeft, FolderTree
} from "lucide-react";
import type { Page, UserType } from "../utils/types";

interface Props {
  user: UserType;
  currentPage: Page;
  navigate: (p: Page) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: { page: Page; label: string; icon: React.ReactNode }[] = [
  { page: "admin-dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { page: "admin-products", label: "Products", icon: <ShoppingBag size={16} /> },
  { page: "admin-categories", label: "Categories", icon: <FolderTree size={16} /> },
  { page: "admin-orders", label: "Orders", icon: <Package size={16} /> },
  { page: "admin-users", label: "Users", icon: <Users size={16} /> },
];

export default function AdminLayout({ user, currentPage, navigate, onLogout, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static z-30 flex flex-col w-64 h-full bg-foreground text-primary-foreground transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <p className="text-xl font-bold tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
              SHOP<span className="text-accent">.</span>IN
            </p>
            <p className="text-xs text-white/50 uppercase tracking-widest mt-0.5">Admin Panel</p>
          </div>
          <button className="md:hidden p-1 text-white/60 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* User info */}
        <div className="px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-white/50">Administrator</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.page}
              onClick={() => { navigate(item.page); setSidebarOpen(false); }}
              className={`flex items-center justify-between px-3 py-2.5 text-sm font-medium transition-colors group ${currentPage === item.page ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
            >
              <span className="flex items-center gap-2.5">{item.icon}{item.label}</span>
              <ChevronRight size={12} className={`opacity-0 group-hover:opacity-100 transition-opacity ${currentPage === item.page ? "opacity-100" : ""}`} />
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex flex-col gap-2">
          <button
            onClick={() => navigate("home")}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors px-3 py-2"
          >
            <Store size={15} /> View Store
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-sm text-white/60 hover:text-accent transition-colors px-3 py-2"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1 hover:text-accent transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-1 text-sm text-muted-foreground">
              <span>Admin</span>
              <ChevronRight size={12} />
              <span className="text-foreground font-medium capitalize">
                {NAV_ITEMS.find((n) => n.page === currentPage)?.label || ""}
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate("home")}
            className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={12} /> Back to Store
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
