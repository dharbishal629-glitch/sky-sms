import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Plus, Trash2, ToggleLeft, ToggleRight, Loader2, Tag, Percent, DollarSign,
  Users, Calendar, Hash, AlertCircle, CheckCircle2, Copy, Check,
} from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

type Coupon = {
  id: string;
  code: string;
  type: "fixed" | "percentage";
  value: number;
  maxUses: number | null;
  usesCount: number;
  targetUserEmail: string | null;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
};

const EMPTY_FORM = {
  code: "",
  type: "percentage" as "fixed" | "percentage",
  value: "",
  maxUses: "",
  targetUserEmail: "",
  expiresAt: "",
};

export default function AdminCoupons() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchCoupons() {
    try {
      const res = await fetch(`${API_URL}/api/admin/coupons`, { credentials: "include" });
      const data = await res.json();
      setCoupons(data.coupons ?? []);
    } catch {
      toast({ title: "Failed to load coupons", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCoupons(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim() || !form.value) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/coupons`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.trim().toUpperCase(),
          type: form.type,
          value: parseFloat(form.value),
          maxUses: form.maxUses ? parseInt(form.maxUses) : null,
          targetUserEmail: form.targetUserEmail.trim() || null,
          expiresAt: form.expiresAt || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create coupon");
      setCoupons((prev) => [data, ...prev]);
      setForm(EMPTY_FORM);
      toast({ title: `Coupon "${data.code}" created` });
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(coupon: Coupon) {
    setTogglingId(coupon.id);
    try {
      const res = await fetch(`${API_URL}/api/admin/coupons/${coupon.code}/toggle`, {
        method: "PATCH",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to toggle");
      setCoupons((prev) => prev.map((c) => c.id === coupon.id ? { ...c, active: data.active } : c));
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(coupon: Coupon) {
    if (!confirm(`Delete coupon "${coupon.code}"? This cannot be undone.`)) return;
    setDeletingId(coupon.id);
    try {
      const res = await fetch(`${API_URL}/api/admin/coupons/${coupon.code}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
      toast({ title: `Coupon "${coupon.code}" deleted` });
    } catch (err: any) {
      toast({ title: err.message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function couponStatus(c: Coupon): { label: string; variant: "default" | "secondary" | "outline" | "destructive" } {
    if (!c.active) return { label: "Disabled", variant: "outline" };
    if (c.expiresAt && new Date(c.expiresAt) < new Date()) return { label: "Expired", variant: "destructive" };
    if (c.maxUses !== null && c.usesCount >= c.maxUses) return { label: "Used up", variant: "destructive" };
    return { label: "Active", variant: "default" };
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-white">Coupons</h1>
        <p className="text-muted-foreground mt-1 text-sm">Create discount codes for your users.</p>
      </div>

      {/* Create form */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-white">Create New Coupon</CardTitle>
          <CardDescription>Code, Type, and Value are required. All other fields are optional.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Coupon Code *</label>
                <Input
                  placeholder="e.g. SAVE20"
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className="uppercase font-mono tracking-widest"
                  required
                />
              </div>

              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Discount Type *</label>
                <div className="flex rounded-xl border border-white/10 overflow-hidden h-10">
                  {(["percentage", "fixed"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type: t }))}
                      className={`flex-1 flex items-center justify-center text-[13px] font-medium transition-colors ${
                        form.type === t
                          ? "bg-white/[0.08] text-white"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {t === "percentage" ? "Percentage" : "Fixed Amount"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Value */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Discount *</label>
                <Input
                  type="number"
                  min="0.01"
                  max={form.type === "percentage" ? "100" : undefined}
                  step="0.01"
                  placeholder={form.type === "percentage" ? "e.g. 20 (percent)" : "e.g. 5.00 (dollars)"}
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  required
                />
              </div>

              {/* Max Uses */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Max Uses <span className="normal-case font-normal text-slate-600">(blank = unlimited)</span></label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Leave blank for unlimited"
                  value={form.maxUses}
                  onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                />
              </div>

              {/* Target email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User Email <span className="normal-case font-normal text-slate-600">(blank = anyone)</span></label>
                <Input
                  type="email"
                  placeholder="user@email.com or blank"
                  value={form.targetUserEmail}
                  onChange={(e) => setForm((f) => ({ ...f, targetUserEmail: e.target.value }))}
                />
              </div>

              {/* Expires at */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expires On <span className="normal-case font-normal text-slate-600">(blank = never)</span></label>
                <Input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                />
              </div>
            </div>

            {/* Preview */}
            {form.code && form.value && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-400/[0.06] border border-amber-400/20">
                <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="text-sm text-amber-200">
                  Code <span className="font-mono font-semibold">{form.code}</span> gives{" "}
                  <span className="font-bold">
                    {form.type === "percentage" ? `${form.value}% off` : `$${parseFloat(form.value || "0").toFixed(2)} bonus credits`}
                  </span>
                  {form.maxUses ? `, usable ${form.maxUses} time${parseInt(form.maxUses) > 1 ? "s" : ""}` : ", unlimited uses"}
                  {form.targetUserEmail ? `, for ${form.targetUserEmail} only` : ", for anyone"}
                </span>
              </div>
            )}

            <Button type="submit" disabled={creating || !form.code || !form.value} className="rounded-full">
              {creating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</> : <><Plus className="h-4 w-4 mr-2" /> Create Coupon</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Coupon list */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-white">All Coupons <span className="text-muted-foreground font-normal text-sm">({coupons.length})</span></h2>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading coupons...
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-2xl border-dashed">
            <Tag className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground text-sm">No coupons yet. Create one above.</p>
          </div>
        ) : (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {["Code", "Discount", "Uses", "Restrictions", "Status", "Actions"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {coupons.map((c) => {
                    const status = couponStatus(c);
                    return (
                      <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                        {/* Code */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => copyCode(c.code)}
                            className="flex items-center gap-2 font-mono font-medium text-amber-300 hover:text-amber-200 transition-colors"
                          >
                            {c.code}
                            {copiedCode === c.code ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3 w-3 opacity-40" />}
                          </button>
                          <div className="text-[10px] text-slate-600 mt-0.5">{format(new Date(c.createdAt), "MMM d, yyyy")}</div>
                        </td>

                        {/* Discount */}
                        <td className="px-4 py-3">
                          <span className={`font-medium text-sm ${c.type === "percentage" ? "text-amber-300" : "text-emerald-300"}`}>
                            {c.type === "percentage" ? `${c.value}% off` : `$${c.value.toFixed(2)}`}
                          </span>
                          <div className="text-[10px] text-slate-500 mt-0.5">{c.type === "percentage" ? "off payment" : "bonus credits"}</div>
                        </td>

                        {/* Uses */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-bold text-white">{c.usesCount}</span>
                          <span className="text-muted-foreground"> / </span>
                          <span className="text-muted-foreground">{c.maxUses ?? "∞"}</span>
                        </td>

                        {/* Restrictions */}
                        <td className="px-4 py-3 max-w-[200px]">
                          <div className="space-y-0.5">
                            {c.targetUserEmail ? (
                              <div className="text-xs text-slate-400 truncate flex items-center gap-1">
                                <Users className="h-3 w-3 shrink-0" /> {c.targetUserEmail}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-600">Anyone</div>
                            )}
                            {c.expiresAt ? (
                              <div className={`text-xs flex items-center gap-1 ${new Date(c.expiresAt) < new Date() ? "text-red-400" : "text-slate-400"}`}>
                                <Calendar className="h-3 w-3 shrink-0" /> Expires {format(new Date(c.expiresAt), "MMM d, yyyy")}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-600">No expiry</div>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggle(c)}
                              disabled={togglingId === c.id}
                              title={c.active ? "Disable coupon" : "Enable coupon"}
                              className="text-muted-foreground hover:text-white transition-colors"
                            >
                              {togglingId === c.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : c.active ? (
                                <ToggleRight className="h-5 w-5 text-emerald-400" />
                              ) : (
                                <ToggleLeft className="h-5 w-5" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(c)}
                              disabled={deletingId === c.id}
                              title="Delete coupon"
                              className="text-muted-foreground hover:text-red-400 transition-colors"
                            >
                              {deletingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Legend */}
        <p className="pt-1 text-xs text-slate-500">
          Percentage coupons discount the payment amount. Fixed coupons add a set credit amount to the user's balance.
        </p>
      </div>
    </div>
  );
}
