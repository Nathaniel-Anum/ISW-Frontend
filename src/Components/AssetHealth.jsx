import { useQuery } from "@tanstack/react-query";
import { Button, Drawer, Input, Select, Table, Tag } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useDeferredValue, useMemo, useState } from "react";
import { LuShieldAlert, LuShieldCheck, LuShieldOff } from "react-icons/lu";
import PageShell from "./ui/page-shell";
import api from "../utils/config";
import { useUser } from "../utils/userContext";
import { formatCapitalizedLabel } from "../utils/formatText";

// ── Utility functions ─────────────────────────────────────────────
const computeWarranty = (purchaseDate, monthsInt) => {
  if (!purchaseDate || monthsInt == null) return null;
  const expiry = new Date(purchaseDate);
  expiry.setMonth(expiry.getMonth() + Number(monthsInt));
  const daysRemaining = Math.round((expiry - new Date()) / 86_400_000);
  return { expiry, daysRemaining };
};

const ACTIVE_SD = ["NEW", "TRIAGED", "ASSIGNED", "IN_PROGRESS", "WAITING_FOR_USER", "ESCALATED", "REOPENED"];

const computeAssetHealth = (record) => {
  if (!record) return null;
  let score = 100;
  const statusPenalty = { NON_FUNCTIONAL: 40, DISPOSED: 50, OBSOLETE: 30, UNDER_REPAIR: 20, INACTIVE: 15 };
  score -= statusPenalty[record.status] || 0;
  const openTickets = (record.serviceDeskTickets || []).filter((t) => ACTIVE_SD.includes(t.status)).length;
  score -= Math.min(openTickets * 10, 25);
  const warranty = computeWarranty(record.purchaseDate, record.warrantyPeriod);
  if (warranty && warranty.daysRemaining < 0) score -= 30;
  else if (warranty && warranty.daysRemaining < 30) score -= 10;
  score = Math.max(0, score);
  if (score >= 75) return { score, label: "Healthy", color: "#166534", bg: "#ECFDF3", barColor: "#16A34A" };
  if (score >= 40) return { score, label: "At Risk", color: "#B45309", bg: "#FEF3C7", barColor: "#D97706" };
  return { score, label: "Critical", color: "#B71C1C", bg: "#FFEBEE", barColor: "#DC2626" };
};

const getProtection = (record) => {
  const deviceType = record?.itItem?.deviceType;
  const endpointSecurity =
    deviceType === "DESKTOP" ? record.desktopDetails?.desktopEndpointSecurity
    : deviceType === "LAPTOP" ? record.laptopDetails?.laptopEndpointSecurity
    : undefined;
  const spiceworks =
    deviceType === "DESKTOP" ? record.desktopDetails?.desktopSpiceworksMonitoring
    : deviceType === "LAPTOP" ? record.laptopDetails?.laptopSpiceworksMonitoring
    : undefined;
  return { endpointSecurity, spiceworks };
};

const formatDate = (val) =>
  val ? new Date(val).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "N/A";

const formatDateTime = (val) =>
  val ? new Date(val).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "N/A";

// ── Allowed roles ─────────────────────────────────────────────────
const ALLOWED_ROLES = ["inventory_officer", "service_desk_manager", "supervisor", "admin"];

// ── Component ─────────────────────────────────────────────────────
const AssetHealth = () => {
  const { user } = useUser();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [healthFilter, setHealthFilter] = useState(null);
  const [warrantyFilter, setWarrantyFilter] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const deferredSearch = useDeferredValue(search.trim());

  const canAccess = user?.roles?.some((r) => ALLOWED_ROLES.includes(r));

  const { data: inventoryResponse, isLoading } = useQuery({
    queryKey: ["assetHealthInventory"],
    queryFn: () => api.get("/inventory/all"),
    enabled: canAccess,
  });

  const allAssets = inventoryResponse?.data || [];

  // Enrich each asset with computed fields
  const enriched = useMemo(
    () =>
      allAssets.map((a) => ({
        ...a,
        _health: computeAssetHealth(a),
        _warranty: computeWarranty(a.purchaseDate, a.warrantyPeriod),
        _openTickets: (a.serviceDeskTickets || []).filter((t) => ACTIVE_SD.includes(t.status)).length,
        _protection: getProtection(a),
      })),
    [allAssets]
  );

  // Stats
  const stats = useMemo(() => {
    const healthy = enriched.filter((a) => a._health?.label === "Healthy").length;
    const atRisk = enriched.filter((a) => a._health?.label === "At Risk").length;
    const critical = enriched.filter((a) => a._health?.label === "Critical").length;
    const expiredWarranty = enriched.filter((a) => a._warranty && a._warranty.daysRemaining < 0).length;
    const withOpenIncidents = enriched.filter((a) => a._openTickets > 0).length;
    return [
      { label: "Total Assets", value: enriched.length, caption: "All registered inventory" },
      { label: "Healthy", value: healthy, caption: "Score ≥ 75" },
      { label: "At Risk", value: atRisk, caption: "Score 40–74" },
      { label: "Critical", value: critical, caption: "Score < 40" },
      { label: "Warranty Expired", value: expiredWarranty, caption: "Past warranty end date" },
      { label: "Open Incidents", value: withOpenIncidents, caption: "Assets with active SD tickets" },
    ];
  }, [enriched]);

  // Filtering
  const filtered = useMemo(() => {
    let data = enriched;
    if (deferredSearch) {
      const q = deferredSearch.toLowerCase();
      data = data.filter(
        (a) =>
          a.assetId?.toLowerCase().includes(q) ||
          a.itItem?.brand?.toLowerCase().includes(q) ||
          a.itItem?.model?.toLowerCase().includes(q) ||
          a.user?.name?.toLowerCase().includes(q) ||
          a.department?.name?.toLowerCase().includes(q)
      );
    }
    if (statusFilter) data = data.filter((a) => a.status === statusFilter);
    if (healthFilter) data = data.filter((a) => a._health?.label === healthFilter);
    if (warrantyFilter === "expired") data = data.filter((a) => a._warranty && a._warranty.daysRemaining < 0);
    if (warrantyFilter === "expiring30") data = data.filter((a) => a._warranty && a._warranty.daysRemaining >= 0 && a._warranty.daysRemaining <= 30);
    if (warrantyFilter === "expiring90") data = data.filter((a) => a._warranty && a._warranty.daysRemaining > 30 && a._warranty.daysRemaining <= 90);
    if (warrantyFilter === "valid") data = data.filter((a) => a._warranty && a._warranty.daysRemaining > 90);
    return data;
  }, [enriched, deferredSearch, statusFilter, healthFilter, warrantyFilter]);

  const INVENTORY_STATUS_STYLES = {
    ACTIVE: "bg-[#ECFDF3] text-[#166534]",
    INACTIVE: "bg-[#FFEBEE] text-[#B71C1C]",
    NON_FUNCTIONAL: "bg-[#FFF7ED] text-[#C2410C]",
    UNDER_REPAIR: "bg-[#FFF3E0] text-[#E65100]",
    LOANED: "bg-[#E3F2FD] text-[#0D47A1]",
    OBSOLETE: "bg-[#FFF7ED] text-[#C2410C]",
    DISPOSED: "bg-[#FFEBEE] text-[#B71C1C]",
  };

  const columns = [
    {
      title: "Asset ID",
      dataIndex: "assetId",
      key: "assetId",
      render: (v) => <span className="font-semibold text-[#212121]">{v}</span>,
    },
    {
      title: "Device",
      key: "device",
      render: (_, r) => (
        <div>
          <p className="font-semibold text-[#212121]">{r.itItem?.brand} {r.itItem?.model}</p>
          <p className="text-xs text-[#9E9E9E]">{r.itItem?.category?.name || formatCapitalizedLabel(r.itItem?.deviceType)}</p>
        </div>
      ),
    },
    {
      title: "Assigned To",
      key: "assignedTo",
      render: (_, r) => (
        <div>
          <p className="text-sm text-[#212121]">{r.user?.name || "—"}</p>
          <p className="text-xs text-[#9E9E9E]">{r.department?.name || ""}</p>
        </div>
      ),
    },
    {
      title: "Health",
      key: "health",
      render: (_, r) => {
        const h = r._health;
        if (!h) return null;
        return (
          <div className="flex flex-col gap-1">
            <span className="w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ background: h.bg, color: h.color }}>
              {h.label}
            </span>
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#E5E7EB]">
              <div className="h-full rounded-full" style={{ width: `${h.score}%`, background: h.barColor }} />
            </div>
            <span className="text-[10px] text-[#9E9E9E]">{h.score}/100</span>
          </div>
        );
      },
    },
    {
      title: "Warranty",
      key: "warranty",
      render: (_, r) => {
        const w = r._warranty;
        if (!w) return <span className="text-xs text-[#9E9E9E]">—</span>;
        if (w.daysRemaining < 0)
          return (
            <div>
              <span className="rounded-full bg-[#FFEBEE] px-2 py-0.5 text-[11px] font-semibold text-[#B71C1C]">Expired</span>
              <p className="mt-0.5 text-[10px] text-[#9E9E9E]">{formatDate(w.expiry)}</p>
            </div>
          );
        if (w.daysRemaining <= 30)
          return (
            <div>
              <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[11px] font-semibold text-[#B45309]">{w.daysRemaining}d left</span>
              <p className="mt-0.5 text-[10px] text-[#9E9E9E]">{formatDate(w.expiry)}</p>
            </div>
          );
        if (w.daysRemaining <= 90)
          return (
            <div>
              <span className="rounded-full bg-[#FFF7ED] px-2 py-0.5 text-[11px] font-semibold text-[#C2410C]">{Math.ceil(w.daysRemaining / 30)}mo left</span>
              <p className="mt-0.5 text-[10px] text-[#9E9E9E]">{formatDate(w.expiry)}</p>
            </div>
          );
        return (
          <div>
            <span className="rounded-full bg-[#ECFDF3] px-2 py-0.5 text-[11px] font-semibold text-[#166534]">{Math.ceil(w.daysRemaining / 30)}mo left</span>
            <p className="mt-0.5 text-[10px] text-[#9E9E9E]">{formatDate(w.expiry)}</p>
          </div>
        );
      },
    },
    {
      title: "Open Incidents",
      key: "openIncidents",
      render: (_, r) => (
        <span className={`text-sm font-bold ${r._openTickets > 0 ? "text-[#B71C1C]" : "text-[#166534]"}`}>
          {r._openTickets}
        </span>
      ),
    },
    {
      title: "Protection",
      key: "protection",
      render: (_, r) => {
        const { endpointSecurity, spiceworks } = r._protection;
        if (endpointSecurity === undefined && spiceworks === undefined)
          return <span className="text-xs text-[#9E9E9E]">—</span>;
        const bothOn = endpointSecurity && spiceworks;
        const noneOn = endpointSecurity === false || spiceworks === false;
        return (
          <span className={`flex items-center gap-1 text-xs font-semibold ${bothOn ? "text-[#166534]" : noneOn ? "text-[#B71C1C]" : "text-[#B45309]"}`}>
            {bothOn ? <LuShieldCheck size={13} /> : noneOn ? <LuShieldOff size={13} /> : <LuShieldAlert size={13} />}
            {bothOn ? "Protected" : noneOn ? "Exposed" : "Partial"}
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (s) => (
        <Tag className={`rounded-full border-0 px-3 py-1 text-xs font-semibold ${INVENTORY_STATUS_STYLES[s] || "bg-[#F3F4F6] text-[#374151]"}`}>
          {formatCapitalizedLabel(s)}
        </Tag>
      ),
    },
    {
      title: "",
      key: "actions",
      render: (_, r) => (
        <Button size="small" onClick={() => setSelectedAsset(r)}>
          Details
        </Button>
      ),
    },
  ];

  return (
    <PageShell
      eyebrow="Asset Management"
      title="Asset Health Dashboard"
      description="Monitor warranty status, protection coverage, and health scores across all registered IT assets."
      stats={stats}
      actions={
        <div className="flex flex-wrap gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search assets"
            className="w-full md:w-[220px]"
          />
          <Select
            allowClear
            placeholder="Health"
            className="w-[120px]"
            onChange={setHealthFilter}
            options={[
              { value: "Healthy", label: "Healthy" },
              { value: "At Risk", label: "At Risk" },
              { value: "Critical", label: "Critical" },
            ]}
          />
          <Select
            allowClear
            placeholder="Warranty"
            className="w-[150px]"
            onChange={setWarrantyFilter}
            options={[
              { value: "expired", label: "Expired" },
              { value: "expiring30", label: "Expiring ≤ 30 days" },
              { value: "expiring90", label: "Expiring ≤ 90 days" },
              { value: "valid", label: "Valid (> 90 days)" },
            ]}
          />
          <Select
            allowClear
            placeholder="Status"
            className="w-[140px]"
            onChange={setStatusFilter}
            options={Object.keys(INVENTORY_STATUS_STYLES).map((s) => ({
              value: s,
              label: formatCapitalizedLabel(s),
            }))}
          />
        </div>
      }
    >
      <section className="rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#616161]">Asset Register</p>
            <h3 className="text-xl font-bold text-[#212121]">Health &amp; protection overview</h3>
          </div>
          <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#1D4ED8]">
            {filtered.length} asset{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 15, showSizeChanger: false }}
        />
      </section>

      {/* ── Detail Drawer ── */}
      <Drawer
        open={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
        title={selectedAsset ? `${selectedAsset.itItem?.brand} ${selectedAsset.itItem?.model} — ${selectedAsset.assetId}` : ""}
        width={480}
        placement="right"
      >
        {selectedAsset && (() => {
          const h = selectedAsset._health;
          const w = selectedAsset._warranty;
          const { endpointSecurity, spiceworks } = selectedAsset._protection;
          const openTickets = selectedAsset._openTickets;
          const totalMaintenance = selectedAsset.maintenanceTickets?.length || 0;
          const lastMaint = selectedAsset.maintenanceTickets?.[0]?.updatedAt;
          const openSdTickets = (selectedAsset.serviceDeskTickets || []).filter((t) => ACTIVE_SD.includes(t.status));
          const resolvedTickets = (selectedAsset.serviceDeskTickets || []).filter((t) => t.status === "RESOLVED" || t.status === "CLOSED");

          return (
            <div className="space-y-5">

              {/* Health Score */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[#9CA3AF]">Health Score</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold" style={{ color: h?.color }}>{h?.score}</span>
                  <span className="mb-1 text-sm font-semibold" style={{ color: h?.color }}>{h?.label}</span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
                  <div className="h-full rounded-full transition-all" style={{ width: `${h?.score || 0}%`, background: h?.barColor }} />
                </div>
                <p className="mt-2 text-[11px] text-[#9CA3AF]">Computed from status, open incidents, and warranty</p>
              </div>

              {/* Warranty */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-4">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[#9CA3AF]">Warranty</p>
                {w ? (
                  <>
                    <p className="text-sm font-semibold text-[#212121]">
                      Expires {w.expiry.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    {w.daysRemaining < 0 ? (
                      <p className="mt-1 text-xs font-semibold text-[#B71C1C]">Expired {Math.abs(w.daysRemaining)} days ago</p>
                    ) : (
                      <p className="mt-1 text-xs" style={{ color: w.daysRemaining <= 30 ? "#B71C1C" : w.daysRemaining <= 90 ? "#B45309" : "#166534" }}>
                        {w.daysRemaining} days remaining ({selectedAsset.warrantyPeriod}-month warranty)
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-[#9CA3AF]">Purchased {formatDate(selectedAsset.purchaseDate)}</p>
                  </>
                ) : (
                  <p className="text-sm text-[#9CA3AF]">No warranty data available</p>
                )}
              </div>

              {/* Protection */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#9CA3AF]">Protection Indicators</p>
                {endpointSecurity !== undefined || spiceworks !== undefined ? (
                  <div className="space-y-3">
                    {endpointSecurity !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#4B5563]">Endpoint Security</span>
                        <span className={`flex items-center gap-1 text-sm font-semibold ${endpointSecurity ? "text-[#166534]" : "text-[#B71C1C]"}`}>
                          {endpointSecurity ? <LuShieldCheck size={14} /> : <LuShieldOff size={14} />}
                          {endpointSecurity ? "Enabled" : "Not Enabled"}
                        </span>
                      </div>
                    )}
                    {spiceworks !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#4B5563]">Spiceworks Monitoring</span>
                        <span className={`flex items-center gap-1 text-sm font-semibold ${spiceworks ? "text-[#166534]" : "text-[#B71C1C]"}`}>
                          {spiceworks ? <LuShieldCheck size={14} /> : <LuShieldOff size={14} />}
                          {spiceworks ? "Enabled" : "Not Enabled"}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[#9CA3AF]">No protection data recorded for this device type</p>
                )}
              </div>

              {/* Incident summary */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#9CA3AF]">Incident Summary</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white p-3 text-center border border-[#E5E7EB]">
                    <p className={`text-2xl font-bold ${openTickets > 0 ? "text-[#B71C1C]" : "text-[#166534]"}`}>{openTickets}</p>
                    <p className="text-[11px] text-[#9CA3AF]">Open Incidents</p>
                  </div>
                  <div className="rounded-xl bg-white p-3 text-center border border-[#E5E7EB]">
                    <p className="text-2xl font-bold text-[#166534]">{resolvedTickets.length}</p>
                    <p className="text-[11px] text-[#9CA3AF]">Resolved</p>
                  </div>
                  <div className="rounded-xl bg-white p-3 text-center border border-[#E5E7EB]">
                    <p className="text-2xl font-bold text-[#1D4ED8]">{totalMaintenance}</p>
                    <p className="text-[11px] text-[#9CA3AF]">Maintenance Jobs</p>
                  </div>
                  <div className="rounded-xl bg-white p-3 text-center border border-[#E5E7EB]">
                    <p className="text-xs font-semibold text-[#212121]">{lastMaint ? formatDateTime(lastMaint) : "Never"}</p>
                    <p className="text-[11px] text-[#9CA3AF]">Last Service</p>
                  </div>
                </div>
              </div>

              {/* Open incidents list */}
              {openSdTickets.length > 0 && (
                <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-4">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#9CA3AF]">Active Tickets</p>
                  <div className="space-y-2">
                    {openSdTickets.map((t) => (
                      <div key={t.id} className="rounded-xl border border-[#E5E7EB] bg-white p-3">
                        <p className="text-xs font-bold text-[#212121]">{t.ticketNo} — {t.subject}</p>
                        <p className="mt-0.5 text-[11px] text-[#9CA3AF]">
                          {t.priority} · {t.status?.replaceAll("_", " ")} · {formatDate(t.createdAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assignment info */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#9CA3AF]">Assignment</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#4B5563]">Assigned To</span>
                    <span className="font-semibold text-[#212121]">{selectedAsset.user?.name || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4B5563]">Department</span>
                    <span className="font-semibold text-[#212121]">{selectedAsset.department?.name || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4B5563]">Unit</span>
                    <span className="font-semibold text-[#212121]">{selectedAsset.unit?.name || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4B5563]">Status</span>
                    <span className="font-semibold text-[#212121]">{formatCapitalizedLabel(selectedAsset.status)}</span>
                  </div>
                </div>
              </div>

            </div>
          );
        })()}
      </Drawer>
    </PageShell>
  );
};

export default AssetHealth;
