import { Layout } from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Rent from "@/pages/Rent";
import Rentals from "@/pages/Rentals";
import Payments from "@/pages/Payments";
import Checkout from "@/pages/Checkout";
import Settings from "@/pages/Settings";
import AdminOverview from "@/pages/admin/Overview";
import AdminUsers from "@/pages/admin/Users";
import AdminUserDetail from "@/pages/admin/UserDetail";
import AdminTransactions from "@/pages/admin/Transactions";
import AdminServices from "@/pages/admin/Services";
import AdminSupport from "@/pages/admin/Support";
import AdminSupportConversation from "@/pages/admin/AdminSupportConversation";
import AdminCoupons from "@/pages/admin/Coupons";
import AdminNotifications from "@/pages/admin/Notifications";
import AdminPaymentGateways from "@/pages/admin/PaymentGateways";
import AdminStatusIncidents from "@/pages/admin/StatusIncidents";
import Support from "@/pages/Support";
import SupportConversation from "@/pages/SupportConversation";
import ApiDocs from "@/pages/ApiDocs";
import Referral from "@/pages/Referral";
import { useAuth } from "@/hooks/useAuth";
import { useGetMe } from "@workspace/api-client-react";
import { Switch, Route, Redirect } from "wouter";
import { Ban, AlertTriangle, LogOut } from "lucide-react";

function LoadingScreen() {
  return (
    <div className="min-h-screen premium-shell flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-11 w-11 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        <div className="text-[12px] text-slate-600 font-medium">Loading…</div>
      </div>
    </div>
  );
}

function SuspensionScreen({ reason, isIpBan }: { reason?: string | null; isIpBan?: boolean }) {
  const handleLogout = () => { window.location.href = "/api/auth/logout"; };
  return (
    <div className="min-h-screen premium-shell flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="relative mx-auto mb-8">
          <div className="h-24 w-24 rounded-3xl mx-auto flex items-center justify-center border border-red-500/20 bg-red-500/[0.06]" style={{ boxShadow: "0 0 60px rgba(239,68,68,0.15)" }}>
            {isIpBan ? <AlertTriangle className="h-10 w-10 text-red-400" /> : <Ban className="h-10 w-10 text-red-400" />}
          </div>
        </div>
        <h1 className="text-2xl font-black text-white mb-3">{isIpBan ? "Access Denied" : "Account Suspended"}</h1>
        <p className="text-[13px] text-slate-400 leading-relaxed mb-6 max-w-sm mx-auto">
          {reason || (isIpBan ? "Your IP address has been blocked from accessing this platform." : "Your account has been suspended. Contact our support team for assistance.")}
        </p>
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 mb-6 text-left space-y-3">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">What you can do</div>
          {["Contact support via email at support@skysms.io", "Open a support ticket from another account", "Wait for your appeal to be reviewed"].map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="h-5 w-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[9px] font-black text-amber-400">{i + 1}</span>
              </div>
              <span className="text-[12px] text-slate-400 leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 mx-auto h-11 px-6 rounded-xl border border-white/[0.1] bg-white/[0.04] text-[13px] font-semibold text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </div>
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isLoading, isAuthenticated, login } = useAuth();
  const { data: user, isLoading: userLoading } = useGetMe();

  if (isLoading || (isAuthenticated && userLoading)) return <LoadingScreen />;
  if (!isAuthenticated) { login(); return null; }

  const status = (user as any)?.status;
  const suspensionReason = (user as any)?.suspensionReason;

  if (status === "suspended" || status === "banned") return <SuspensionScreen reason={suspensionReason} />;

  return <Layout><Component /></Layout>;
}

function AdminRoute({ component: Component }: { component: React.ComponentType }) {
  const { isLoading: authLoading, isAuthenticated, login } = useAuth();
  const { data: user, isLoading: userLoading } = useGetMe();

  if (authLoading || (isAuthenticated && userLoading)) return <LoadingScreen />;
  if (!isAuthenticated) { login(); return null; }
  if (user && user.role !== "admin") return <Redirect to="/dashboard" />;

  return <Layout><Component /></Layout>;
}

export function AppRoutes() {
  return (
    <Switch>
      <Route path="/dashboard"><ProtectedRoute component={Dashboard} /></Route>
      <Route path="/rent"><ProtectedRoute component={Rent} /></Route>
      <Route path="/rentals"><ProtectedRoute component={Rentals} /></Route>
      <Route path="/payments"><ProtectedRoute component={Payments} /></Route>
      <Route path="/checkout/:id"><ProtectedRoute component={Checkout} /></Route>
      <Route path="/settings"><ProtectedRoute component={Settings} /></Route>
      <Route path="/support"><ProtectedRoute component={Support} /></Route>
      <Route path="/support/conversation/:id"><ProtectedRoute component={SupportConversation} /></Route>
      <Route path="/api-docs"><ProtectedRoute component={ApiDocs} /></Route>
      <Route path="/referral"><ProtectedRoute component={Referral} /></Route>

      <Route path="/admin"><AdminRoute component={AdminOverview} /></Route>
      <Route path="/admin/users/:id"><AdminRoute component={AdminUserDetail} /></Route>
      <Route path="/admin/users"><AdminRoute component={AdminUsers} /></Route>
      <Route path="/admin/services"><AdminRoute component={AdminServices} /></Route>
      <Route path="/admin/transactions"><AdminRoute component={AdminTransactions} /></Route>
      <Route path="/admin/support/conversation/:id"><AdminRoute component={AdminSupportConversation} /></Route>
      <Route path="/admin/support"><AdminRoute component={AdminSupport} /></Route>
      <Route path="/admin/coupons"><AdminRoute component={AdminCoupons} /></Route>
      <Route path="/admin/notifications"><AdminRoute component={AdminNotifications} /></Route>
      <Route path="/admin/gateways"><AdminRoute component={AdminPaymentGateways} /></Route>
      <Route path="/admin/status"><AdminRoute component={AdminStatusIncidents} /></Route>
    </Switch>
  );
}
