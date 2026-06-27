import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Terms from "@/pages/Terms";
import RefundPolicy from "@/pages/RefundPolicy";
import StatusPage from "@/pages/Status";
import { AppRoutes } from "./Routes";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Mail, Lock, Eye, EyeOff, User, ChevronLeft, Loader2, X } from "lucide-react";
import { SkySmsLogo, SkySmsLogoMark } from "@/components/SkySmsLogo";
import { CookieBanner } from "@/components/CookieBanner";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

const queryClient = new QueryClient();

function LoadingSpinner() {
  return (
    <div className="min-h-screen premium-shell flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="h-12 w-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_24px_rgba(56,189,248,0.18)]">
          <SkySmsLogoMark className="h-7 w-7" />
        </div>
        <div className="h-0.5 w-32 rounded-full bg-white/[0.06] overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full" style={{ width: "60%", animation: "loading-bar 1.4s ease-in-out infinite" }} />
        </div>
      </div>
    </div>
  );
}

type AuthMode = "choose" | "email-login" | "email-register";

function AuthPage() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { isLoading, isAuthenticated } = useAuth();
  const [mode, setMode] = useState<AuthMode>("choose");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });

  if (isLoading) return <LoadingSpinner />;
  if (isAuthenticated) {
    setLocation("/dashboard", { replace: true });
    return null;
  }

  const setField = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [k]: e.target.value }));
    setError("");
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "email-register") {
      if (!form.name.trim()) { setError("Please enter your full name."); return; }
      if (!form.email) { setError("Please enter your email."); return; }
      if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
      if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    } else {
      if (!form.email) { setError("Please enter your email."); return; }
      if (!form.password) { setError("Please enter your password."); return; }
    }

    setSubmitting(true);
    try {
      const endpoint = mode === "email-register" ? "/api/auth/register" : "/api/auth/login-email";
      const payload = mode === "email-register"
        ? { email: form.email.trim().toLowerCase(), password: form.password, name: form.name.trim() }
        : { email: form.email.trim().toLowerCase(), password: form.password };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({})) as { error?: string; success?: boolean };
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      queryClient.invalidateQueries();
      setLocation("/dashboard", { replace: true });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen premium-shell flex items-center justify-center px-5 py-10">
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(ellipse at center, rgba(212,168,67,0.09) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(ellipse at center, rgba(180,100,40,0.06) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute inset-0 grid-pattern opacity-30" />
      </div>

      <div className="relative z-10 w-full max-w-md modal-content-enter">
        {/* Top shimmer accent */}
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent rounded-t-3xl" />

        <div className="rounded-3xl border border-amber-900/15 bg-gradient-to-br from-white/[0.04] to-white/[0.01] shadow-[0_0_0_1px_rgba(212,168,67,0.08),0_8px_60px_rgba(0,0,0,0.6)] p-8 backdrop-blur-xl">

          {/* Logo */}
          <div className="text-center mb-8">
            <a href={`${basePath}/`} className="mx-auto inline-flex items-center gap-2.5 rounded-full border border-blue-500/20 bg-blue-500/[0.05] px-5 py-2.5 hover:bg-blue-500/[0.08] transition-colors">
              <SkySmsLogo size="sm" />
            </a>
          </div>

          {/* Mode: Choose (default) */}
          {mode === "choose" && (
            <>
              <div className="text-center mb-7">
                <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-amber-400 mb-2">Welcome</p>
                <h1 className="text-[1.75rem] font-black tracking-tight text-white leading-tight">Sign in to SKY SMS</h1>
                <p className="mt-2.5 text-[13.5px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Rent real phone numbers and receive SMS codes instantly.
                </p>
              </div>

              <div className="space-y-3">
                {/* Google */}
                <button
                  onClick={login}
                  className="group h-12 w-full rounded-xl bg-white px-6 text-[14px] font-bold text-slate-900 shadow-[0_2px_12px_rgba(0,0,0,0.25)] transition-all hover:bg-slate-50 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex items-center justify-center gap-3 active:scale-[0.98]"
                >
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-[11px] text-slate-600 font-medium">or</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>

                {/* Email login */}
                <button
                  onClick={() => setMode("email-login")}
                  className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 text-[14px] font-semibold text-white hover:bg-white/[0.06] hover:border-white/[0.12] flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                >
                  <Mail className="h-4.5 w-4.5 text-amber-400 shrink-0" />
                  Sign in with Email
                </button>

                {/* Create account */}
                <p className="text-center text-[12px] text-slate-500 pt-1">
                  Don't have an account?{" "}
                  <button onClick={() => setMode("email-register")} className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">
                    Create one
                  </button>
                </p>
              </div>
            </>
          )}

          {/* Mode: Email login */}
          {mode === "email-login" && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => { setMode("choose"); setError(""); setForm({ name: "", email: "", password: "", confirmPassword: "" }); }} className="h-8 w-8 flex items-center justify-center rounded-xl border border-white/[0.08] text-slate-500 hover:text-white hover:bg-white/[0.05] transition-all">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div>
                  <h1 className="text-[17px] font-bold text-white leading-none">Sign in with email</h1>
                  <p className="text-[12px] text-slate-500 mt-0.5">Enter your credentials to continue</p>
                </div>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-400 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={setField("email")}
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-white/[0.08] bg-white/[0.03] text-[14px] text-white placeholder:text-slate-600 outline-none focus:border-amber-500/40 focus:bg-amber-500/[0.03] focus:ring-2 focus:ring-amber-500/[0.08] transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-400 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      placeholder="Your password"
                      value={form.password}
                      onChange={setField("password")}
                      className="w-full h-11 pl-10 pr-11 rounded-xl border border-white/[0.08] bg-white/[0.03] text-[14px] text-white placeholder:text-slate-600 outline-none focus:border-amber-500/40 focus:bg-amber-500/[0.03] focus:ring-2 focus:ring-amber-500/[0.08] transition-all"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-3 py-2.5">
                    <X className="h-3.5 w-3.5 text-red-400 shrink-0" />
                    <span className="text-[12.5px] text-red-300">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-[14px] font-bold text-slate-900 hover:from-amber-400 hover:to-amber-500 transition-all active:scale-[0.98] shadow-[0_2px_16px_rgba(212,168,67,0.3)] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? "Signing in…" : "Sign in"}
                </button>

                <p className="text-center text-[12px] text-slate-500">
                  No account yet?{" "}
                  <button type="button" onClick={() => { setMode("email-register"); setError(""); }} className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">
                    Create one
                  </button>
                </p>
              </form>
            </>
          )}

          {/* Mode: Email register */}
          {mode === "email-register" && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <button onClick={() => { setMode("choose"); setError(""); setForm({ name: "", email: "", password: "", confirmPassword: "" }); }} className="h-8 w-8 flex items-center justify-center rounded-xl border border-white/[0.08] text-slate-500 hover:text-white hover:bg-white/[0.05] transition-all">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div>
                  <h1 className="text-[17px] font-bold text-white leading-none">Create an account</h1>
                  <p className="text-[12px] text-slate-500 mt-0.5">Join SKY SMS in under a minute</p>
                </div>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-3">
                <div>
                  <label className="block text-[12px] font-semibold text-slate-400 mb-1.5">Full name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <input
                      type="text"
                      required
                      placeholder="Your name"
                      value={form.name}
                      onChange={setField("name")}
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-white/[0.08] bg-white/[0.03] text-[14px] text-white placeholder:text-slate-600 outline-none focus:border-amber-500/40 focus:bg-amber-500/[0.03] focus:ring-2 focus:ring-amber-500/[0.08] transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-400 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={setField("email")}
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-white/[0.08] bg-white/[0.03] text-[14px] text-white placeholder:text-slate-600 outline-none focus:border-amber-500/40 focus:bg-amber-500/[0.03] focus:ring-2 focus:ring-amber-500/[0.08] transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-400 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <input
                      type={showPass ? "text" : "password"}
                      required
                      minLength={8}
                      placeholder="Min. 8 characters"
                      value={form.password}
                      onChange={setField("password")}
                      className="w-full h-11 pl-10 pr-11 rounded-xl border border-white/[0.08] bg-white/[0.03] text-[14px] text-white placeholder:text-slate-600 outline-none focus:border-amber-500/40 focus:bg-amber-500/[0.03] focus:ring-2 focus:ring-amber-500/[0.08] transition-all"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-400 mb-1.5">Confirm password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      required
                      placeholder="Repeat password"
                      value={form.confirmPassword}
                      onChange={setField("confirmPassword")}
                      className="w-full h-11 pl-10 pr-11 rounded-xl border border-white/[0.08] bg-white/[0.03] text-[14px] text-white placeholder:text-slate-600 outline-none focus:border-amber-500/40 focus:bg-amber-500/[0.03] focus:ring-2 focus:ring-amber-500/[0.08] transition-all"
                    />
                    <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors">
                      {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.07] px-3 py-2.5">
                    <X className="h-3.5 w-3.5 text-red-400 shrink-0" />
                    <span className="text-[12.5px] text-red-300">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-[14px] font-bold text-slate-900 hover:from-amber-400 hover:to-amber-500 transition-all active:scale-[0.98] shadow-[0_2px_16px_rgba(212,168,67,0.3)] flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mt-1"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting ? "Creating account…" : "Create account"}
                </button>

                <p className="text-center text-[11.5px] text-slate-600 leading-relaxed">
                  By creating an account you agree to our{" "}
                  <a href={`${basePath}/terms`} className="text-amber-400/80 hover:text-amber-300 transition-colors">Terms</a>{" "}
                  and{" "}
                  <a href={`${basePath}/refund-policy`} className="text-amber-400/80 hover:text-amber-300 transition-colors">Refund Policy</a>.
                </p>

                <p className="text-center text-[12px] text-slate-500">
                  Already have an account?{" "}
                  <button type="button" onClick={() => { setMode("email-login"); setError(""); }} className="text-amber-400 hover:text-amber-300 font-semibold transition-colors">
                    Sign in
                  </button>
                </p>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

function HomeRedirect() {
  const { isLoading, isAuthenticated, login } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (isAuthenticated) return <Redirect to="/dashboard" />;
  return <Landing onLogin={login} />;
}

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "auto" }); }, [location]);
  return null;
}

function AppWithRoutes() {
  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in/*?" component={AuthPage} />
      <Route path="/sign-up/*?" component={AuthPage} />
      <Route path="/terms" component={Terms} />
      <Route path="/refund-policy" component={RefundPolicy} />
      <Route path="/status" component={StatusPage} />

      <Route path="/dashboard" component={AppRoutes} />
      <Route path="/rent" component={AppRoutes} />
      <Route path="/rentals" component={AppRoutes} />
      <Route path="/payments" component={AppRoutes} />
      <Route path="/checkout/:id" component={AppRoutes} />
      <Route path="/settings" component={AppRoutes} />
      <Route path="/support" component={AppRoutes} />
      <Route path="/support/conversation/:id" component={AppRoutes} />
      <Route path="/api-docs" component={AppRoutes} />
      <Route path="/referral" component={AppRoutes} />
      <Route path="/admin" component={AppRoutes} />
      <Route path="/admin/users/:id" component={AppRoutes} />
      <Route path="/admin/users" component={AppRoutes} />
      <Route path="/admin/services" component={AppRoutes} />
      <Route path="/admin/transactions" component={AppRoutes} />
      <Route path="/admin/support/conversation/:id" component={AppRoutes} />
      <Route path="/admin/support" component={AppRoutes} />
      <Route path="/admin/coupons" component={AppRoutes} />
      <Route path="/admin/notifications" component={AppRoutes} />
      <Route path="/admin/gateways" component={AppRoutes} />
      <Route path="/admin/status" component={AppRoutes} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <QueryClientProvider client={queryClient}>
          <ScrollToTop />
          <AppWithRoutes />
          <CookieBanner />
        </QueryClientProvider>
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
