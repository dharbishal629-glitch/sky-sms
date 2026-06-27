import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ChevronDown, ChevronUp, Send } from "lucide-react";

const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ?? "";

interface IncidentUpdate { id: string; body: string; status: string; created_at: string }
interface Incident {
  id: string; title: string; body: string; status: string;
  components: string[]; created_at: string; resolved_at: string | null;
  updates: IncidentUpdate[];
}

const ALL_COMPONENTS = ["Website", "API", "Payments", "Notifications", "Server Web Pages"];
const STATUSES = ["investigating", "identified", "monitoring", "resolved"];
const STATUS_LABELS: Record<string, string> = {
  investigating: "Investigating",
  identified:    "Identified",
  monitoring:    "Monitoring",
  resolved:      "Resolved",
};
const STATUS_COLOR: Record<string, string> = {
  investigating: "text-amber-400",
  identified:    "text-red-400",
  monitoring:    "text-sky-400",
  resolved:      "text-emerald-400",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

async function api(path: string, method = "GET", body?: unknown) {
  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(j.error ?? "Request failed");
  }
  return res.json();
}

function IncidentCard({ incident, onDeleted }: { incident: Incident; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [updateBody, setUpdateBody] = useState("");
  const [updateStatus, setUpdateStatus] = useState("update");
  const { toast } = useToast();
  const qc = useQueryClient();

  const addUpdate = useMutation({
    mutationFn: () => api(`/admin/status/incidents/${incident.id}/updates`, "POST", {
      body: updateBody.trim(), status: updateStatus,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["status-incidents"] });
      setUpdateBody(""); setUpdateStatus("update");
      toast({ title: "Update posted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteInc = useMutation({
    mutationFn: () => api(`/admin/status/incidents/${incident.id}`, "DELETE"),
    onSuccess: () => { onDeleted(); qc.invalidateQueries({ queryKey: ["status-incidents"] }); },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const isResolved = incident.status === "resolved";

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${STATUS_COLOR[incident.status] ?? "text-slate-400"}`}>
                {STATUS_LABELS[incident.status] ?? incident.status}
              </span>
              {incident.components.length > 0 && (
                <span className="text-[10px] text-slate-600">· {incident.components.join(", ")}</span>
              )}
              <span className="text-[10px] text-slate-700">{fmt(incident.created_at)}</span>
              {incident.resolved_at && (
                <span className="text-[10px] text-emerald-600">Resolved {fmt(incident.resolved_at)}</span>
              )}
            </div>
            <div className="text-[14px] font-semibold text-white">{incident.title}</div>
            <div className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">{incident.body}</div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => deleteInc.mutate()}
              disabled={deleteInc.isPending}
              className="h-8 w-8 rounded-lg border border-red-500/20 bg-red-500/[0.06] flex items-center justify-center text-red-400 hover:bg-red-500/[0.12] transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
            {!isResolved && (
              <button
                onClick={() => setOpen(v => !v)}
                className="h-8 w-8 rounded-lg border border-white/[0.08] bg-white/[0.04] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Updates */}
        {incident.updates.length > 0 && (
          <div className="mt-3 pl-3 border-l border-white/[0.07] space-y-2">
            {incident.updates.map(u => (
              <div key={u.id}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${STATUS_COLOR[u.status] ?? "text-slate-400"}`}>
                    {STATUS_LABELS[u.status] ?? u.status}
                  </span>
                  <span className="text-[10px] text-slate-700">{fmt(u.created_at)}</span>
                </div>
                <p className="text-[12px] text-slate-400">{u.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post update panel */}
      {open && !isResolved && (
        <div className="border-t border-white/[0.06] px-5 py-4 bg-white/[0.015] space-y-3">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Post update</div>
          <textarea
            value={updateBody}
            onChange={e => setUpdateBody(e.target.value)}
            placeholder="Describe the update…"
            rows={2}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[12px] text-white placeholder:text-slate-700 outline-none focus:border-sky-500/40 resize-none"
          />
          <div className="flex items-center gap-3">
            <select
              value={updateStatus}
              onChange={e => setUpdateStatus(e.target.value)}
              className="h-8 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 text-[12px] text-white outline-none focus:border-sky-500/40"
            >
              {["update", ...STATUSES].map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s] ?? "Update"}</option>
              ))}
            </select>
            <button
              onClick={() => addUpdate.mutate()}
              disabled={!updateBody.trim() || addUpdate.isPending}
              className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-[12px] font-semibold text-white transition-colors"
            >
              <Send className="h-3 w-3" /> Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminStatusIncidents() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    title: "", body: "", status: "investigating", components: [] as string[],
  });

  const { data, isLoading } = useQuery({
    queryKey: ["status-incidents"],
    queryFn: async () => {
      const j = await api("/status/incidents") as { incidents: Incident[] };
      return j.incidents ?? [];
    },
    refetchInterval: 15_000,
  });

  const createInc = useMutation({
    mutationFn: () => api("/admin/status/incidents", "POST", form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["status-incidents"] });
      setForm({ title: "", body: "", status: "investigating", components: [] });
      setShowNew(false);
      toast({ title: "Incident created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleComp = (c: string) => {
    setForm(f => ({
      ...f,
      components: f.components.includes(c) ? f.components.filter(x => x !== c) : [...f.components, c],
    }));
  };

  const active   = (data ?? []).filter(i => i.status !== "resolved");
  const resolved = (data ?? []).filter(i => i.status === "resolved");

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-sky-500 mb-1">Admin</p>
          <h1 className="text-xl font-bold text-white">Status Incidents</h1>
          <p className="text-[13px] text-slate-500 mt-0.5">Manage incidents that appear on the public status page.</p>
        </div>
        <button
          onClick={() => setShowNew(v => !v)}
          className="shrink-0 flex items-center gap-2 h-9 px-4 rounded-xl text-[12px] font-bold text-white transition-all"
          style={{
            background: showNew ? "rgba(255,255,255,0.08)" : "linear-gradient(180deg,#38bdf8,#0ea5e9 55%,#0284c7)",
            border: showNew ? "1px solid rgba(255,255,255,0.12)" : "none",
            color: showNew ? "#94a3b8" : "#fff",
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          {showNew ? "Cancel" : "New Incident"}
        </button>
      </div>

      {/* New incident form */}
      {showNew && (
        <div className="rounded-xl border border-sky-500/15 bg-sky-500/[0.03] p-5 space-y-4">
          <div className="text-[12px] font-bold text-slate-300 uppercase tracking-wider">Create Incident</div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Title</label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Payments experiencing delays"
              maxLength={200}
              className="w-full h-10 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-[13px] text-white placeholder:text-slate-700 outline-none focus:border-sky-500/40"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Description</label>
            <textarea
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              placeholder="Describe what's happening…"
              rows={3}
              maxLength={2000}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-white placeholder:text-slate-700 outline-none focus:border-sky-500/40 resize-none"
            />
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-[13px] text-white outline-none focus:border-sky-500/40"
              >
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Affected Components</label>
            <div className="flex flex-wrap gap-2">
              {ALL_COMPONENTS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleComp(c)}
                  className={`h-7 px-3 rounded-full text-[11px] font-semibold border transition-all ${
                    form.components.includes(c)
                      ? "bg-sky-500/10 border-sky-500/30 text-sky-400"
                      : "bg-white/[0.03] border-white/[0.08] text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => createInc.mutate()}
            disabled={!form.title.trim() || !form.body.trim() || createInc.isPending}
            className="h-10 px-6 rounded-xl text-[13px] font-bold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-40 transition-colors"
          >
            {createInc.isPending ? "Creating…" : "Create Incident"}
          </button>
        </div>
      )}

      {/* Active incidents */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-24 rounded-xl bg-white/[0.02] border border-white/[0.05] animate-pulse" />)}
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Active ({active.length})
              </div>
              {active.map(inc => (
                <IncidentCard key={inc.id} incident={inc} onDeleted={() => qc.invalidateQueries({ queryKey: ["status-incidents"] })} />
              ))}
            </div>
          )}

          {resolved.length > 0 && (
            <div className="space-y-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Resolved ({resolved.length})
              </div>
              {resolved.map(inc => (
                <IncidentCard key={inc.id} incident={inc} onDeleted={() => qc.invalidateQueries({ queryKey: ["status-incidents"] })} />
              ))}
            </div>
          )}

          {active.length === 0 && resolved.length === 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] py-12 text-center">
              <p className="text-[14px] font-semibold text-white mb-1">No incidents</p>
              <p className="text-[12px] text-slate-600">All systems are operational. Create an incident if something goes wrong.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
