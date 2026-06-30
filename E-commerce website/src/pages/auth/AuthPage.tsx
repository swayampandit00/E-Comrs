import { useState } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../../utils/api";
import type { UserType, Page } from "../../utils/types";

interface Props {
  navigate: (p: Page) => void;
  onSuccess: (token: string, user: UserType) => void;
  defaultTab?: "login" | "register";
}

export default function AuthPage({ navigate, onSuccess, defaultTab = "login" }: Props) {
  const [tab, setTab] = useState<"login" | "register">(defaultTab);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPw, setShowPw] = useState(false);

  function setField(key: keyof typeof form, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (tab === "register" && form.name.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const path = tab === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = tab === "login"
        ? { email: form.email, password: form.password }
        : { name: form.name.trim(), email: form.email, password: form.password };
      const data = await apiFetch(path, { method: "POST", body: JSON.stringify(body) });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast.success(tab === "login" ? `Welcome back, ${data.user.name.split(" ")[0]}!` : "Account created successfully!");
      onSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — decorative */}
      <div
        className="hidden lg:flex flex-col justify-end w-1/2 p-12 relative overflow-hidden"
        style={{ background: "#0C0C0C" }}
      >
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=900&h=1200&fit=crop&auto=format")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="relative z-10">
          <p className="text-white/40 text-xs uppercase tracking-[0.4em] mb-6">Shop.IN</p>
          <h1 className="text-5xl font-extrabold text-white leading-tight mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>
            India&apos;s favourite<br />online store.
          </h1>
          <p className="text-white/50 text-base max-w-xs leading-relaxed">
            Thousands of products. Fast delivery. Trusted by millions across India.
          </p>
          <div className="flex gap-8 mt-10">
            {[["50K+", "Products"], ["2M+", "Customers"], ["4.8★", "Rating"]].map(([num, label]) => (
              <div key={label}>
                <p className="text-2xl font-bold text-white" style={{ fontFamily: "Outfit, sans-serif" }}>{num}</p>
                <p className="text-xs text-white/40 uppercase tracking-widest">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <p className="text-2xl font-bold" style={{ fontFamily: "Outfit, sans-serif" }}>
            SHOP<span className="text-accent">.</span>IN
          </p>
        </div>

        <div className="w-full max-w-md">
          {/* Tabs */}
          <div className="flex border-b border-border mb-8">
            {(["login", "register"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); setForm({ name: "", email: "", password: "" }); }}
                className={`flex-1 pb-3 text-sm font-semibold uppercase tracking-widest transition-colors border-b-2 -mb-px ${tab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              >
                {t === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
            {tab === "login" ? "Welcome back" : "Get started"}
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            {tab === "login"
              ? "Sign in to your Shop.IN account"
              : "Create your free Shop.IN account"}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {tab === "register" && (
              <Field label="Full Name">
                <input
                  type="text"
                  required
                  minLength={2}
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Priya Sharma"
                  className="input-field"
                />
              </Field>
            )}

            <Field label="Email Address">
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="you@example.com"
                className="input-field"
              />
            </Field>

            <Field label="Password">
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder="••••••••"
                  className="input-field pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </Field>

            {error && (
              <div className="flex items-start gap-2 text-accent text-sm bg-red-50 border border-red-200 p-3">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-primary-foreground py-3.5 text-sm font-semibold uppercase tracking-widest hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              {loading
                ? "Please wait..."
                : tab === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {tab === "login" ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => { setTab(tab === "login" ? "register" : "login"); setError(""); }}
              className="text-foreground font-semibold hover:text-accent transition-colors"
            >
              {tab === "login" ? "Sign up free" : "Sign in"}
            </button>
          </p>

          <button
            onClick={() => navigate("home")}
            className="block text-center text-xs text-muted-foreground hover:text-foreground transition-colors mt-4 mx-auto"
          >
            Continue as guest →
          </button>
        </div>
      </div>

      <style>{`
        .input-field {
          width: 100%;
          background: var(--input-background);
          padding: 0.625rem 1rem;
          font-size: 0.875rem;
          border: 1px solid var(--border);
          outline: none;
          transition: border-color 0.15s;
        }
        .input-field:focus { border-color: var(--foreground); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
