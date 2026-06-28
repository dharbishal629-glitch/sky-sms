import { useState, useMemo } from "react";
import { useListServices, useGetAvailability, useCreateRental, getGetDashboardQueryKey } from "@workspace/api-client-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Globe, Server, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useLocation } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchableSelect } from "@/components/SearchableSelect";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";

interface LiveCountry {
  code: string;
  name: string;
  flag: string;
  available: number;
  heroPrice: number;
  price: number;
}

function useCountriesForService(serviceCode: string) {
  return useQuery<{ countries: LiveCountry[] }>({
    queryKey: ["/api/catalog/countries-for-service", serviceCode],
    queryFn: async () => {
      const res = await fetch(`/api/catalog/countries-for-service?serviceCode=${serviceCode}`);
      if (!res.ok) throw new Error("Failed to load countries");
      return res.json();
    },
    enabled: !!serviceCode,
    refetchInterval: 20_000,
    staleTime: 20_000,
  });
}

const serviceIconDomains: Record<string, string> = {
  aol: "aol.com", aliexpress: "aliexpress.com", telegram: "telegram.org",
  whatsapp: "whatsapp.com", google: "google.com", instagram: "instagram.com",
  facebook: "facebook.com", twitter: "x.com", "x / twitter": "x.com",
  discord: "discord.com", amazon: "amazon.com", tiktok: "tiktok.com",
  snapchat: "snapchat.com", linkedin: "linkedin.com", netflix: "netflix.com",
  spotify: "spotify.com", uber: "uber.com", airbnb: "airbnb.com",
  paypal: "paypal.com", apple: "apple.com", yandex: "yandex.com",
  yahoo: "yahoo.com", proton: "proton.me", "ok.ru": "ok.ru", qq: "qq.com",
  wechat: "wechat.com", viber: "viber.com", vk: "vk.com",
  tinder: "tinder.com", bumble: "bumble.com", "pof.com": "pof.com",
  coinbase: "coinbase.com", steam: "steampowered.com", naver: "naver.com",
  bolt: "bolt.eu", wise: "wise.com", nike: "nike.com", microsoft: "microsoft.com",
};

function getServiceIcon(name: string): string | null {
  const key = name.toLowerCase();
  const domain = serviceIconDomains[key] ?? Object.entries(serviceIconDomains).find(([label]) => key.includes(label))?.[1];
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

function maskProviderName(name: string): string {
  return name === "Hero SMS" ? "SKY SMS" : name;
}

type SortMode = "stock" | "price-asc" | "price-desc";

function SortButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11.5px] font-semibold transition-all duration-150 ${
        active
          ? "bg-blue-500/15 border border-blue-500/25 text-blue-300"
          : "border border-white/[0.07] text-slate-600 hover:text-slate-400 hover:border-white/[0.12]"
      }`}
    >
      {children}
    </button>
  );
}

export default function Rent() {
  const { t } = useLanguage();
  const [serviceCode, setServiceCode] = useState<string>(
    () => new URLSearchParams(window.location.search).get("service") ?? ""
  );
  const [countryCode, setCountryCode] = useState<string>(
    () => new URLSearchParams(window.location.search).get("country") ?? ""
  );
  const [sort, setSort] = useState<SortMode>("stock");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: servicesData, isLoading: loadingServices, isError: servicesError, refetch: refetchServices } = useListServices({}, {
    query: { queryKey: ["/api/catalog/services"], refetchInterval: 20_000, staleTime: 20_000 }
  });

  const { data: countriesData, isLoading: loadingCountries } = useCountriesForService(serviceCode);

  const { data: availability, isLoading: loadingAvailability, isFetching: fetchingAvailability } = useGetAvailability(
    { countryCode, serviceCode },
    {
      query: {
        enabled: !!countryCode && !!serviceCode,
        queryKey: ["/api/catalog/availability", { countryCode, serviceCode }],
        refetchInterval: 15000,
      }
    }
  );

  const createRental = useCreateRental();

  const handleRent = () => {
    if (!countryCode || !serviceCode) return;
    createRental.mutate({ data: { countryCode, serviceCode } }, {
      onSuccess: (rental) => {
        const mins = availability?.activationMinutes ?? 20;
        toast({
          title: "Number rented!",
          description: `${mins} minutes to receive SMS for ${rental.serviceName}.`,
        });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        queryClient.invalidateQueries({ queryKey: ["/api/rentals"] });
        setLocation("/rentals");
      },
      onError: (error: unknown) => {
        const apiErr = error as { data?: { error?: string }; message?: string } | null;
        const description = apiErr?.data?.error || apiErr?.message || "Check your balance and try again.";
        toast({ title: "Failed to rent", description, variant: "destructive" });
      }
    });
  };

  const liveCountries = countriesData?.countries ?? [];

  const sortedCountries = useMemo(() => {
    const arr = [...liveCountries];
    if (sort === "price-asc") return arr.sort((a, b) => (a.price || 999) - (b.price || 999));
    if (sort === "price-desc") return arr.sort((a, b) => (b.price || 0) - (a.price || 0));
    return arr.sort((a, b) => b.available - a.available);
  }, [liveCountries, sort]);

  const serviceOptions = (servicesData?.services ?? []).map((service) => ({
    value: service.code,
    label: service.name,
    searchText: `${service.name} ${service.code} ${service.category}`,
    meta: `$${service.price.toFixed(2)}`,
    icon: getServiceIcon(service.name),
  }));

  const countryOptions = sortedCountries.map((country) => ({
    value: country.code,
    label: country.name,
    searchText: `${country.name} ${country.code}`,
    meta: `${country.price > 0 ? `$${country.price.toFixed(2)}` : ""} · ${country.available.toLocaleString()}`,
    icon: country.flag || "🌍",
  }));

  const isAvailable = availability && availability.available > 0 && availability.provider.mode === "live";
  const canRent = isAvailable && !createRental.isPending;

  return (
    <div className="max-w-lg mx-auto space-y-4">

      {/* Header */}
      <div>
        <h1 className="text-[17px] font-bold text-white">{t("rentANumber")}</h1>
        <p className="text-slate-500 mt-0.5 text-[13px]">Pick a service and country. Prices refresh in real time.</p>
      </div>

      {/* Selection card */}
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] overflow-hidden">
        <div className="px-4 py-3.5 border-b border-white/[0.05]">
          <div className="font-semibold text-white text-[14px]">Configure Rental</div>
          <div className="text-[12px] text-slate-500 mt-0.5">Select service first, then choose a country.</div>
        </div>

        <div className="p-4 space-y-4">
          {/* Service */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[12px] font-semibold text-slate-400">
              <Server className="h-3.5 w-3.5 text-slate-600" />
              {t("service")}
            </label>
            <SearchableSelect
              value={serviceCode}
              options={serviceOptions}
              placeholder={loadingServices ? "Loading services…" : servicesError ? "Error loading" : "Search a service…"}
              searchPlaceholder="Telegram, WhatsApp, Google…"
              emptyText="No service found."
              disabled={loadingServices || servicesError}
              onChange={(val) => { setServiceCode(val); setCountryCode(""); }}
            />
            {servicesError && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-3 py-2.5 text-[12px] text-red-200">
                <span>Services failed to load.</span>
                <button type="button" onClick={() => refetchServices()} className="font-bold text-red-100 flex items-center gap-1 hover:text-white transition-colors">
                  <RefreshCw className="h-3 w-3" /> {t("retry")}
                </button>
              </div>
            )}
          </div>

          {/* Country */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-[12px] font-semibold text-slate-400">
                <div className="h-4.5 w-4.5 rounded-md bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                  <Globe className="h-2.5 w-2.5 text-indigo-400" />
                </div>
                {t("country")}
                {serviceCode && loadingCountries && (
                  <Loader2 className="h-3 w-3 animate-spin text-slate-600" />
                )}
              </label>

              {/* Sort controls */}
              {serviceCode && !loadingCountries && liveCountries.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <SortButton active={sort === "stock"} onClick={() => setSort("stock")}>
                    <ArrowUpDown className="h-3 w-3" /> Stock
                  </SortButton>
                  <SortButton active={sort === "price-asc"} onClick={() => setSort("price-asc")}>
                    <ArrowUp className="h-3 w-3" /> Price
                  </SortButton>
                  <SortButton active={sort === "price-desc"} onClick={() => setSort("price-desc")}>
                    <ArrowDown className="h-3 w-3" /> Price
                  </SortButton>
                </div>
              )}
            </div>

            <SearchableSelect
              value={countryCode}
              options={countryOptions}
              placeholder={
                !serviceCode ? "Select a service first" :
                loadingCountries ? "Loading countries…" :
                liveCountries.length === 0 ? "No countries available" :
                "Search a country…"
              }
              searchPlaceholder="Type country name…"
              emptyText="No country found."
              disabled={!serviceCode || loadingCountries || liveCountries.length === 0}
              onChange={setCountryCode}
            />

            {serviceCode && !loadingCountries && liveCountries.length === 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[12px] text-slate-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                No countries available for this service. Try a different one.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Availability card */}
      {countryCode && serviceCode && (
        <div className={`rounded-2xl border overflow-hidden transition-all duration-300 ${isAvailable ? "border-emerald-500/20" : "border-white/[0.07]"} bg-white/[0.025]`}>
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.05]">
            <div className="font-semibold text-white text-[14px]">Availability</div>
            {(loadingAvailability || fetchingAvailability) && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-600" />
            )}
          </div>

          <div className="p-4">
            {!availability && !loadingAvailability ? (
              <div className="flex items-center gap-3 text-rose-300 bg-rose-400/[0.06] border border-rose-400/15 rounded-xl p-3.5">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span className="text-[13px] font-medium">Failed to check availability.</span>
              </div>
            ) : availability ? (
              <div className="space-y-4">
                {availability.available === 0 && (
                  <div className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.08] rounded-xl p-3.5">
                    <AlertCircle className="h-4 w-4 text-slate-500 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-300 text-[13.5px]">No numbers available</div>
                      <div className="text-[12px] mt-0.5 text-slate-600">Try a different country.</div>
                    </div>
                  </div>
                )}

                {/* Info rows */}
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] divide-y divide-white/[0.04]">
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-[12.5px] text-slate-500">Price per SMS</span>
                    <span className="text-[18px] font-bold text-white" data-testid="text-price-quote">${availability.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-[12.5px] text-slate-500">Numbers in stock</span>
                    <span className="text-[13px] font-semibold text-slate-300">{availability.available.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-[12.5px] text-slate-500">Network</span>
                    <span className="text-[13px] font-semibold text-slate-300">{maskProviderName(availability.provider.name)}</span>
                  </div>
                </div>

                <button
                  className={`w-full h-12 rounded-xl text-[14.5px] font-bold transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] ${
                    canRent
                      ? "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_2px_16px_rgba(59,130,246,0.3)]"
                      : "bg-white/[0.04] border border-white/[0.07] text-slate-600 cursor-not-allowed"
                  }`}
                  disabled={!canRent}
                  onClick={handleRent}
                  data-testid="button-confirm-rent"
                >
                  {createRental.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Allocating…</>
                  ) : availability?.provider.mode !== "live" ? (
                    "Provider Unavailable"
                  ) : availability?.available === 0 ? (
                    "No Numbers Available"
                  ) : (
                    `Rent — $${availability.price.toFixed(2)}`
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full rounded-xl bg-white/[0.04]" />
                <Skeleton className="h-24 w-full rounded-xl bg-white/[0.04]" />
                <Skeleton className="h-12 w-full rounded-xl bg-white/[0.04]" />
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
