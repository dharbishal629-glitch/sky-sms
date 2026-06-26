import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { SearchableSelect } from "@/components/SearchableSelect";
import { CheckCircle2, Globe, Loader2, RotateCcw, Save, ShieldCheck, TrendingUp } from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

type AdminCountry = {
  code: string;
  name: string;
  flag: string;
  available: number;
  startingPrice: number;
  customBasePrice: number | null;
};

type AdminService = {
  code: string;
  name: string;
  category: string;
  available: number;
  basePrice: number;
  price: number;
  customPrice: boolean;
  countryPrice: number | null;
  globalPrice: number | null;
  globalMargin: number | null;
  countryMargin: number | null;
  effectiveMargin: number;
};

export default function AdminServices() {
  const [services, setServices] = useState<AdminService[]>([]);
  const [countries, setCountries] = useState<AdminCountry[]>([]);
  const [enabledDraft, setEnabledDraft] = useState<Set<string>>(new Set());
  const [defaultMarginPercent, setDefaultMarginPercent] = useState(55);

  const [selectedServiceCode, setSelectedServiceCode] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("global");
  const [priceDraft, setPriceDraft] = useState<string>("");

  const [marginServiceCode, setMarginServiceCode] = useState<string>("");
  const [marginCountry, setMarginCountry] = useState<string>("global");
  const [marginDraft, setMarginDraft] = useState<string>("");

  const [enabledSearch, setEnabledSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingPrice, setSavingPrice] = useState(false);
  const [resettingPrice, setResettingPrice] = useState(false);
  const [savingMargin, setSavingMargin] = useState(false);
  const [resettingMargin, setResettingMargin] = useState(false);
  const [savingEnabled, setSavingEnabled] = useState(false);
  const [error, setError] = useState(false);

  const [basePriceCountry, setBasePriceCountry] = useState<string>("");
  const [basePriceDraft, setBasePriceDraft] = useState<string>("");
  const [savingBasePrice, setSavingBasePrice] = useState(false);

  const { toast } = useToast();

  const loadServices = async (country = selectedCountry) => {
    setLoading(true);
    setError(false);
    try {
      const params = country !== "global" ? `?countryCode=${encodeURIComponent(country)}` : "";
      const response = await fetch(`${API_URL}/api/admin/services${params}`, { credentials: "include" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json() as {
        services: AdminService[];
        countries: AdminCountry[];
        enabledServiceCodes: string[];
        defaultMarginPercent: number;
      };
      setServices(data.services);
      setCountries(data.countries ?? []);
      setEnabledDraft(new Set(data.enabledServiceCodes ?? []));
      setDefaultMarginPercent(data.defaultMarginPercent ?? 55);
      if (data.services[0] && (!selectedServiceCode || !data.services.some((s) => s.code === selectedServiceCode))) {
        setSelectedServiceCode(data.services[0].code);
      }
      if (data.services[0] && (!marginServiceCode || !data.services.some((s) => s.code === marginServiceCode))) {
        setMarginServiceCode(data.services[0].code);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadServices("global"); }, []);

  const selectedService = services.find((s) => s.code === selectedServiceCode);
  const marginService = services.find((s) => s.code === marginServiceCode);
  const scopeLabel = selectedCountry === "global" ? "Global default" : countries.find((c) => c.code === selectedCountry)?.name ?? selectedCountry;
  const marginScopeLabel = marginCountry === "global" ? "Global default" : countries.find((c) => c.code === marginCountry)?.name ?? marginCountry;

  useEffect(() => {
    if (!selectedService) return;
    setPriceDraft(String(selectedService.price));
  }, [selectedServiceCode, selectedCountry, selectedService?.price]);

  useEffect(() => {
    if (!marginService) return;
    const currentMargin = marginCountry !== "global"
      ? (marginService.countryMargin ?? marginService.globalMargin ?? defaultMarginPercent)
      : (marginService.globalMargin ?? defaultMarginPercent);
    setMarginDraft(String(currentMargin));
  }, [marginServiceCode, marginCountry, marginService?.globalMargin, marginService?.countryMargin, defaultMarginPercent]);

  const selectedBasePriceCountry = countries.find((c) => c.code === basePriceCountry);
  useEffect(() => {
    if (!selectedBasePriceCountry) return;
    setBasePriceDraft(selectedBasePriceCountry.customBasePrice != null ? String(selectedBasePriceCountry.customBasePrice) : String(selectedBasePriceCountry.startingPrice));
  }, [basePriceCountry, selectedBasePriceCountry?.customBasePrice, selectedBasePriceCountry?.startingPrice]);

  const serviceOptions = useMemo(() => services.map((s) => ({
    value: s.code,
    label: s.name,
    searchText: `${s.name} ${s.code} ${s.category}`,
    meta: `${s.available.toLocaleString()} live`,
  })), [services]);

  const countryOptions = useMemo(() => [
    { value: "global", label: "Global default", searchText: "global all countries default", meta: "All countries", icon: "🌐" },
    ...countries.map((c) => ({
      value: c.code,
      label: c.name,
      searchText: `${c.name} ${c.code}`,
      meta: `${c.available.toLocaleString()} live`,
      icon: c.flag || "🌍",
    })),
  ], [countries]);

  const basePriceCountryOptions = useMemo(() => countries.map((c) => ({
    value: c.code,
    label: c.name,
    searchText: `${c.name} ${c.code}`,
    meta: c.customBasePrice != null ? `Custom: $${c.customBasePrice.toFixed(2)}` : `API: $${c.startingPrice.toFixed(2)}`,
    icon: c.flag || "🌍",
  })), [countries]);

  const enabledCount = enabledDraft.size;
  const filteredServices = useMemo(() => {
    const query = enabledSearch.trim().toLowerCase();
    if (!query) return services;
    return services.filter((s) => `${s.name} ${s.code} ${s.category}`.toLowerCase().includes(query));
  }, [enabledSearch, services]);

  const handleCountryChange = (value: string) => {
    setSelectedCountry(value);
    loadServices(value);
  };

  const toggleEnabled = (code: string) => {
    setEnabledDraft((current) => {
      const next = new Set(current);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const saveEnabledServices = async () => {
    setSavingEnabled(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/services/enabled`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceCodes: Array.from(enabledDraft) }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);
      toast({ title: "Enabled services updated", description: `${enabledDraft.size} services are now visible to users.` });
    } catch (err) {
      toast({ title: "Failed to save enabled services", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setSavingEnabled(false);
    }
  };

  const savePrice = async () => {
    if (!selectedService) return;
    const price = Number(priceDraft);
    if (!Number.isFinite(price) || price < 0) {
      toast({ title: "Invalid price", description: "Use 0 for free or any positive number.", variant: "destructive" });
      return;
    }
    setSavingPrice(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/services/${selectedService.code}/price`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price, countryCode: selectedCountry === "global" ? undefined : selectedCountry }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);
      setServices((current) => current.map((s) => s.code === selectedService.code ? {
        ...s,
        price,
        customPrice: true,
        countryPrice: selectedCountry === "global" ? s.countryPrice : price,
        globalPrice: selectedCountry === "global" ? price : s.globalPrice,
      } : s));
      toast({ title: "Service price updated", description: `${selectedService.name} set to ${price === 0 ? "free" : `$${price.toFixed(2)}`} for ${scopeLabel}.` });
    } catch (err) {
      toast({ title: "Failed to update price", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setSavingPrice(false);
    }
  };

  const resetPrice = async () => {
    if (!selectedService) return;
    setResettingPrice(true);
    try {
      const params = selectedCountry !== "global" ? `?countryCode=${encodeURIComponent(selectedCountry)}` : "";
      const response = await fetch(`${API_URL}/api/admin/services/${selectedService.code}/price${params}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);
      setServices((current) => current.map((s) => s.code === selectedService.code ? {
        ...s,
        customPrice: selectedCountry !== "global" ? Boolean(s.globalPrice) : false,
        countryPrice: selectedCountry !== "global" ? null : s.countryPrice,
        globalPrice: selectedCountry === "global" ? null : s.globalPrice,
      } : s));
      toast({ title: "Fixed price removed", description: `${selectedService.name} will now use margin-based pricing for ${scopeLabel}.` });
    } catch (err) {
      toast({ title: "Failed to reset price", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setResettingPrice(false);
    }
  };

  const saveMargin = async () => {
    if (!marginService) return;
    const margin = Number(marginDraft);
    if (!Number.isFinite(margin) || margin < 0 || margin > 10000) {
      toast({ title: "Invalid margin", description: "Enter a value between 0 and 10000.", variant: "destructive" });
      return;
    }
    setSavingMargin(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/services/${marginService.code}/margin`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ margin, countryCode: marginCountry === "global" ? undefined : marginCountry }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);
      setServices((current) => current.map((s) => s.code === marginService.code ? {
        ...s,
        globalMargin: marginCountry === "global" ? margin : s.globalMargin,
        countryMargin: marginCountry !== "global" ? margin : s.countryMargin,
        effectiveMargin: margin,
      } : s));
      toast({ title: "Profit margin saved", description: `${marginService.name} set to ${margin}% margin for ${marginScopeLabel}. Provider cost + ${margin}% = user price.` });
    } catch (err) {
      toast({ title: "Failed to save margin", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setSavingMargin(false);
    }
  };

  const resetMargin = async () => {
    if (!marginService) return;
    setResettingMargin(true);
    try {
      const params = marginCountry !== "global" ? `?countryCode=${encodeURIComponent(marginCountry)}` : "";
      const response = await fetch(`${API_URL}/api/admin/services/${marginService.code}/margin${params}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);
      setServices((current) => current.map((s) => s.code === marginService.code ? {
        ...s,
        globalMargin: marginCountry === "global" ? null : s.globalMargin,
        countryMargin: marginCountry !== "global" ? null : s.countryMargin,
        effectiveMargin: defaultMarginPercent,
      } : s));
      toast({ title: "Margin reset", description: `${marginService.name} will use the default ${defaultMarginPercent}% margin for ${marginScopeLabel}.` });
    } catch (err) {
      toast({ title: "Failed to reset margin", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setResettingMargin(false);
    }
  };

  const saveBasePrice = async () => {
    if (!basePriceCountry) return;
    const price = Number(basePriceDraft);
    if (!Number.isFinite(price) || price < 0) {
      toast({ title: "Invalid base price", description: "Enter 0 to reset to API price or a positive number.", variant: "destructive" });
      return;
    }
    setSavingBasePrice(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/countries/${encodeURIComponent(basePriceCountry)}/base-price`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ price }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || `HTTP ${response.status}`);
      setCountries((current) => current.map((c) => c.code === basePriceCountry ? {
        ...c,
        customBasePrice: price === 0 ? null : price,
      } : c));
      toast({
        title: price === 0 ? "Base price reset" : "Country base price saved",
        description: price === 0
          ? `${selectedBasePriceCountry?.name ?? basePriceCountry} will now use the live API price.`
          : `${selectedBasePriceCountry?.name ?? basePriceCountry} base price set to $${price.toFixed(2)}.`,
      });
    } catch (err) {
      toast({ title: "Failed to save base price", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
    } finally {
      setSavingBasePrice(false);
    }
  };

  if (loading && services.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error && services.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-destructive">Failed to load services</h2>
        <p className="text-muted-foreground mt-2">Please refresh the page and try again.</p>
        <button onClick={() => loadServices()} className="mt-4 text-sm text-amber-400 hover:underline">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Service Control</h1>
        <p className="text-muted-foreground mt-1 text-sm">Search services, set prices, margins, and choose exactly which services users can see.</p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-amber-300" /> Enabled Services Portal</CardTitle>
              <CardDescription>Only checked services appear on the user Rent page, country dropdowns, and rental flow.</CardDescription>
            </div>
            <Badge className="bg-amber-400/10 text-amber-200 border border-amber-300/20">{enabledCount} enabled</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            value={enabledSearch}
            onChange={(event) => setEnabledSearch(event.target.value)}
            placeholder="Search service to enable..."
            className="h-12 rounded-xl"
          />
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="max-h-80 overflow-y-auto pr-1 space-y-1">
              {filteredServices.map((service) => (
                <label key={service.code} className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/[0.05]">
                  <Checkbox checked={enabledDraft.has(service.code)} onCheckedChange={() => toggleEnabled(service.code)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white">{service.name}</span>
                      <Badge variant="outline" className="border-white/10 bg-white/[0.04] text-slate-300">{service.category}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">{service.code} · {service.available.toLocaleString()} live</div>
                  </div>
                  {enabledDraft.has(service.code) ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300" /> : null}
                </label>
              ))}
              {filteredServices.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">No services found.</div>
              ) : null}
            </div>
          </div>
          <Button onClick={saveEnabledServices} disabled={savingEnabled} className="w-full sm:w-auto rounded-full">
            {savingEnabled ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Enabled Services
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Fixed Price Override</CardTitle>
          <CardDescription>Set a hard fixed price for a service. This overrides margin-based pricing entirely. Use Reset to go back to margin-based pricing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Service</label>
              <SearchableSelect
                value={selectedServiceCode}
                options={serviceOptions}
                placeholder="Search and select service"
                searchPlaceholder="Type service name..."
                emptyText="No service found."
                onChange={setSelectedServiceCode}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Country</label>
              <SearchableSelect
                value={selectedCountry}
                options={countryOptions}
                placeholder="Search and select country"
                searchPlaceholder="Type country name..."
                emptyText="No country found."
                onChange={handleCountryChange}
              />
            </div>
          </div>

          {selectedService ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-white">{selectedService.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{selectedService.code} · {scopeLabel}</div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="border-white/10 bg-white/[0.05] text-slate-300">Provider ${selectedService.basePrice.toFixed(2)}</Badge>
                  <Badge className="bg-amber-400/10 text-amber-200 border border-amber-300/20">Current ${selectedService.price.toFixed(2)}</Badge>
                  {selectedService.customPrice && (
                    <Badge className="bg-amber-400/10 text-amber-200 border border-amber-300/20">Fixed override active</Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input type="number" min="0" step="0.01" value={priceDraft} onChange={(e) => setPriceDraft(e.target.value)} className="h-12 text-lg font-bold" placeholder="0.00" />
                <Button onClick={savePrice} disabled={savingPrice} className="h-12 rounded-full px-8">
                  {savingPrice ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Price
                </Button>
                <Button onClick={resetPrice} disabled={resettingPrice} variant="outline" className="h-12 rounded-full px-6 border-white/10 text-slate-300 hover:text-white">
                  {resettingPrice ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                  Reset
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Use <strong>Reset</strong> to remove the fixed price and fall back to margin-based pricing.</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-emerald-300" /> Margin &amp; Profit</CardTitle>
          <CardDescription>
            Set a profit margin per service. The final user price is: <strong>Provider cost × (1 + margin%)</strong>.
            Example: $0.10 provider cost + 100% margin = $0.20 user price. Default margin: {defaultMarginPercent}%.
            Fixed price overrides (above) take priority over margin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Service</label>
              <SearchableSelect
                value={marginServiceCode}
                options={serviceOptions}
                placeholder="Search and select service"
                searchPlaceholder="Type service name..."
                emptyText="No service found."
                onChange={setMarginServiceCode}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Scope</label>
              <SearchableSelect
                value={marginCountry}
                options={countryOptions}
                placeholder="Select scope"
                searchPlaceholder="Type country name..."
                emptyText="No country found."
                onChange={setMarginCountry}
              />
            </div>
          </div>

          {marginService ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-white">{marginService.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{marginService.code} · {marginScopeLabel}</div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="border-white/10 bg-white/[0.05] text-slate-300">Provider ${marginService.basePrice.toFixed(2)}</Badge>
                  {marginService.globalMargin !== null && (
                    <Badge className="bg-emerald-400/10 text-emerald-200 border border-emerald-300/20">Global: {marginService.globalMargin}%</Badge>
                  )}
                  {marginService.countryMargin !== null && (
                    <Badge className="bg-purple-400/10 text-purple-200 border border-purple-300/20">Country: {marginService.countryMargin}%</Badge>
                  )}
                  <Badge className="bg-amber-400/10 text-amber-200 border border-amber-300/20">
                    Effective: {marginService.effectiveMargin}% → ${(marginService.basePrice * (1 + marginService.effectiveMargin / 100)).toFixed(2)}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row items-center">
                <div className="relative flex-1 w-full">
                  <Input
                    type="number"
                    min="0"
                    max="10000"
                    step="1"
                    value={marginDraft}
                    onChange={(e) => setMarginDraft(e.target.value)}
                    className="h-12 text-lg font-bold pr-10"
                    placeholder="55"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">%</span>
                </div>
                <Button onClick={saveMargin} disabled={savingMargin} className="h-12 rounded-full px-8 w-full sm:w-auto">
                  {savingMargin ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Margin
                </Button>
                <Button onClick={resetMargin} disabled={resettingMargin} variant="outline" className="h-12 rounded-full px-6 border-white/10 text-slate-300 hover:text-white w-full sm:w-auto">
                  {resettingMargin ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
                  Reset
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                <strong>Reset</strong> reverts to the default {defaultMarginPercent}% margin for the selected scope.
                Country-specific margin overrides the global service margin.
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-emerald-300" /> Country Base Prices</CardTitle>
          <CardDescription>
            Set a custom starting price per country. This base price is used in the auto-calculation formula when no fixed service price is set.
            Set to 0 to reset a country back to using the live API price.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Country</label>
            <SearchableSelect
              value={basePriceCountry}
              options={basePriceCountryOptions}
              placeholder="Select a country to set base price"
              searchPlaceholder="Type country name..."
              emptyText="No country found."
              onChange={setBasePriceCountry}
            />
          </div>

          {selectedBasePriceCountry ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-white">{selectedBasePriceCountry.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{selectedBasePriceCountry.code}</div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="border-white/10 bg-white/[0.05] text-slate-300">
                    API price: ${selectedBasePriceCountry.startingPrice.toFixed(2)}
                  </Badge>
                  {selectedBasePriceCountry.customBasePrice != null ? (
                    <Badge className="bg-emerald-400/10 text-emerald-200 border border-emerald-300/20">
                      Custom: ${selectedBasePriceCountry.customBasePrice.toFixed(2)}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-white/10 bg-white/[0.04] text-slate-400">
                      Using API price
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={basePriceDraft}
                  onChange={(e) => setBasePriceDraft(e.target.value)}
                  className="h-12 text-lg font-bold"
                  placeholder="0.00"
                />
                <Button onClick={saveBasePrice} disabled={savingBasePrice} className="h-12 rounded-full px-8">
                  {savingBasePrice ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Base Price
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Set to <strong>0</strong> to remove custom price and use the live API price for this country.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-muted-foreground">
              Select a country above to view and edit its base price.
            </div>
          )}

          {countries.filter((c) => c.customBasePrice != null).length > 0 ? (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Custom Base Prices Set</div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] divide-y divide-white/[0.06]">
                {countries.filter((c) => c.customBasePrice != null).map((c) => (
                  <div key={c.code} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{c.flag}</span>
                      <span className="font-medium text-white text-sm">{c.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{c.code}</span>
                    </div>
                    <Badge className="bg-emerald-400/10 text-emerald-200 border border-emerald-300/20">
                      ${c.customBasePrice!.toFixed(2)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
