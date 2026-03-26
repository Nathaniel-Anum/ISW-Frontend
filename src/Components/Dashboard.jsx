import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import api from "../utils/config";
import { useUser } from "../utils/userContext";
import {
  LuBadgeAlert,
  LuBadgeCheck,
  LuCircleDashed,
  LuClipboardList,
  LuShieldAlert,
  LuShieldCheck,
  LuWrench,
  LuPackage,
  LuMonitor,
  LuMessageSquare,
  LuInbox,
} from "react-icons/lu";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useQuery } from "@tanstack/react-query";

const RED = "#D32F2F";
const DARK_RED = "#B71C1C";
const LIGHT_RED = "#FFEBEE";
const ORANGE = "#F59E0B";
const GREEN = "#16A34A";
const SLATE = "#64748B";
const BLUE = "#1D4ED8";
const LIGHT_BLUE = "#EFF6FF";
const PURPLE = "#7C3AED";
const LIGHT_PURPLE = "#F5F3FF";
const TEAL = "#0D9488";
const LIGHT_TEAL = "#F0FDFA";

const SERVICE_DESK_ACTIVE_STATUSES = [
  "NEW",
  "TRIAGED",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING_FOR_USER",
  "ESCALATED",
  "REOPENED",
];

const SERVICE_DESK_DISTRIBUTION_ORDER = [
  { key: "NEW", name: "New", color: ORANGE },
  { key: "TRIAGED", name: "Troubleshooting", color: "#FBBF24" },
  { key: "ASSIGNED", name: "Assigned", color: PURPLE },
  { key: "IN_PROGRESS", name: "In Progress", color: BLUE },
  { key: "WAITING_FOR_USER", name: "Waiting For User", color: SLATE },
  { key: "ESCALATED", name: "Escalated", color: RED },
  { key: "REOPENED", name: "Reopened", color: DARK_RED },
  { key: "RESOLVED", name: "Resolved", color: GREEN },
  { key: "CLOSED", name: "Closed", color: TEAL },
  { key: "CANCELLED", name: "Cancelled", color: "#94A3B8" },
];

const SummaryCard = ({ card }) => {
  const Icon = card.icon;
  return (
    <button
      type="button"
      onClick={card.onClick}
      className="group rounded-xl border border-[#E0E0E0] bg-white p-6 text-left transition-colors duration-150 hover:border-[#D32F2F]/30 hover:bg-[#FAFAFA]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9E9E9E]">{card.title}</p>
          <p className="mt-3 text-3xl font-bold text-[#212121]">{card.value}</p>
        </div>
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: card.tone, color: card.accent }}
        >
          <Icon className="text-xl" />
        </span>
      </div>
      <div className="mt-4 border-t border-[#F1F1F1] pt-3">
        <p className="text-xs text-[#9E9E9E]">{card.note}</p>
      </div>
    </button>
  );
};

const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-6">
    <h3 className="text-lg font-bold text-[#212121]">{title}</h3>
    {subtitle && <p className="mt-0.5 text-sm text-[#616161]">{subtitle}</p>}
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUser();

  const hasRole = (role) => user?.roles?.includes(role);
  const isAdmin = hasRole("admin");
  const isSupervisor = hasRole("supervisor");
  const isStoresOfficer = hasRole("stores_officer");
  const isInventoryOfficer = hasRole("inventory_officer");
  const isHardwareTech = hasRole("hardware_technician");
  const isServiceDeskMgr = hasRole("service_desk_manager");
  const isDeptApprover = hasRole("dept_approver");
  const isITDApprover = hasRole("itd_approver");

  // Section visibility flags
  const showReqSection = !isStoresOfficer && !isInventoryOfficer && !isHardwareTech && !isServiceDeskMgr;
  const showDeptQueue = isDeptApprover;
  const showITDQueue = isITDApprover;
  const showHardware = isHardwareTech;
  const showStock = isStoresOfficer || isSupervisor || isAdmin;
  const showApprovedReqs = isStoresOfficer || isSupervisor;
  const showInventory = isInventoryOfficer;
  const showSdAll = isServiceDeskMgr || isSupervisor || isAdmin;
  // Roles that primarily submit/track their own SD tickets (exclude stores/inventory officers)
  const showMySdSection = !showSdAll && !isStoresOfficer && !isInventoryOfficer;
  // Charts only make sense for overview roles
  const showCharts = isAdmin || isSupervisor;

  // SD scope: full view for managers, assigned tickets for HW tech, own reported tickets for others
  const sdScope = showSdAll ? "all" : isHardwareTech ? "mine" : "reported";

  useEffect(() => {
    api
      .get("/user/profile")
      .then((res) => {
        setUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data));
      })
      .catch((err) => {
        console.error("Failed to fetch profile:", err);
      });
  }, [setUser]);

  // ── Requisitions (all roles except specialist-only roles) ──────────────────
  const { data: requisitions } = useQuery({
    queryKey: ["requisitions"],
    queryFn: () => api.get("/user/requisitions"),
    enabled: showReqSection,
  });
  const reqs = requisitions?.data || [];
  const reqResolved = reqs.filter((i) => i.status === "PROCESSED");
  const reqDeclined = reqs.filter((i) => i.status === "ITD_DECLINED");
  const reqDeptDeclined = reqs.filter((i) => i.status === "DEPT_DECLINED");
  const reqPendingDept = reqs.filter((i) => i.status === "PENDING_DEPT_APPROVAL");
  const reqPendingITD = reqs.filter((i) => i.status === "PENDING_ITD_APPROVAL");

  // ── Dept Approval Queue ────────────────────────────────────────────────────
  const { data: deptQueueRes } = useQuery({
    queryKey: ["dept-queue"],
    queryFn: () => api.get("/dept/requisitions"),
    enabled: showDeptQueue,
  });
  const deptQueue = deptQueueRes?.data || [];

  // ── ITD Approval Queue ─────────────────────────────────────────────────────
  const { data: itdQueueRes } = useQuery({
    queryKey: ["itd-queue"],
    queryFn: () => api.get("/itd/requisitions"),
    enabled: showITDQueue,
  });
  const itdQueue = itdQueueRes?.data || [];

  // ── Hardware Tickets ───────────────────────────────────────────────────────
  const { data: hwOpenRes } = useQuery({
    queryKey: ["hw-tickets-open"],
    queryFn: () => api.get("/hardware/tickets?status=OPEN"),
    enabled: showHardware,
  });
  const { data: hwInProgressRes } = useQuery({
    queryKey: ["hw-tickets-inprogress"],
    queryFn: () => api.get("/hardware/tickets?status=IN_PROGRESS"),
    enabled: showHardware,
  });
  const { data: hwResolvedRes } = useQuery({
    queryKey: ["hw-tickets-resolved"],
    queryFn: () => api.get("/hardware/tickets?status=RESOLVED"),
    enabled: showHardware,
  });
  const hwOpen = hwOpenRes?.data || [];
  const hwInProgress = hwInProgressRes?.data || [];
  const hwResolved = hwResolvedRes?.data || [];

  // ── Service Desk Tickets ───────────────────────────────────────────────────
  const { data: sdRes } = useQuery({
    queryKey: ["sd-tickets-dash", sdScope],
    queryFn: () => api.get(`/service-desk/tickets?scope=${sdScope}`),
  });
  const sdTickets = sdRes?.data || [];
  const sdOpen = sdTickets.filter((t) => SERVICE_DESK_ACTIVE_STATUSES.includes(t.status));
  const sdInProgress = sdTickets.filter((t) => t.status === "IN_PROGRESS");
  const sdResolved = sdTickets.filter((t) => ["RESOLVED", "CLOSED"].includes(t.status));
  const sdUnassigned = sdTickets.filter((t) => !t.assignedToId);

  // ── Stock ──────────────────────────────────────────────────────────────────
  const { data: stockRes } = useQuery({
    queryKey: ["stores-stock-dash"],
    queryFn: () => api.get("/stores/stock"),
    enabled: showStock,
  });
  const stockItems = stockRes?.data?.data || [];
  const stockLow = stockItems.filter((s) => s.quantityInStock > 0 && s.quantityInStock <= 5);
  const stockOut = stockItems.filter((s) => s.quantityInStock === 0);

  // ── Approved Reqs Pending Issue ────────────────────────────────────────────
  const { data: approvedReqsRes } = useQuery({
    queryKey: ["stores-approved-reqs-dash"],
    queryFn: () => api.get("/stores/reqs/approved"),
    enabled: showApprovedReqs,
  });
  const approvedReqs = approvedReqsRes?.data || [];

  // ── Inventory ──────────────────────────────────────────────────────────────
  const { data: inventoryRes } = useQuery({
    queryKey: ["inventory-dash"],
    queryFn: () => api.get("/inventory/all"),
    enabled: showInventory,
  });
  const inventoryData = inventoryRes?.data || [];
  const invActive = inventoryData.filter((i) => i.status === "ACTIVE");
  const invAttention = inventoryData.filter((i) =>
    ["INACTIVE", "NON_FUNCTIONAL", "OBSOLETE", "DISPOSED"].includes(i.status)
  );

  // ── Hero panel values ──────────────────────────────────────────────────────
  const heroLabel1 = isHardwareTech
    ? "Open Jobs"
    : isServiceDeskMgr
    ? "Open Tickets"
    : isStoresOfficer
    ? "Pending Issue"
    : isInventoryOfficer
    ? "Total Assets"
    : isDeptApprover
    ? "Dept Queue"
    : isITDApprover
    ? "ITD Queue"
    : "Open Requests";

  const heroValue1 = isHardwareTech
    ? hwOpen.length
    : isServiceDeskMgr
    ? sdOpen.length
    : isStoresOfficer
    ? approvedReqs.length
    : isInventoryOfficer
    ? inventoryData.length
    : isDeptApprover
    ? deptQueue.length
    : isITDApprover
    ? itdQueue.length
    : reqPendingDept.length + reqPendingITD.length;

  const heroLabel2 = isHardwareTech
    ? "Resolved Jobs"
    : isServiceDeskMgr
    ? "Unassigned"
    : isStoresOfficer
    ? "Low Stock"
    : isInventoryOfficer
    ? "Attention Needed"
    : isDeptApprover || isITDApprover
    ? "My Requests"
    : "Open Tickets";

  const heroValue2 = isHardwareTech
    ? hwResolved.length
    : isServiceDeskMgr
    ? sdUnassigned.length
    : isStoresOfficer
    ? stockLow.length
    : isInventoryOfficer
    ? invAttention.length
    : isDeptApprover || isITDApprover
    ? reqs.length
    : sdOpen.length;

  const heroTitle = isHardwareTech
    ? "Hardware maintenance and repair job tracker."
    : isServiceDeskMgr
    ? "Service desk queue management and ticket assignment."
    : isStoresOfficer
    ? "Stores issuance queue, stock levels, and approved requisitions."
    : isInventoryOfficer
    ? "IT asset registry, device details, and inventory health."
    : isDeptApprover
    ? "Departmental requisition approvals and request management."
    : isITDApprover
    ? "IT directorate requisition review and approval pipeline."
    : isSupervisor || isAdmin
    ? "Enterprise overview for requisitions, stock, and service operations."
    : "Track your requests, approvals, and service desk tickets.";

  // ── Card sets ──────────────────────────────────────────────────────────────
  const reqCards = [
    { title: "Total Requisitions", value: reqs.length, note: "All requests in the system", icon: LuClipboardList, accent: RED, tone: LIGHT_RED, onClick: () => navigate("/dashboard/requisition") },
    { title: "Approved", value: reqResolved.length, note: "Processed and ready for follow-up", icon: LuBadgeCheck, accent: GREEN, tone: "#ECFDF3", onClick: () => navigate("/dashboard/status-table", { state: { status: "PROCESSED", requisitions: reqs } }) },
    { title: "Pending Dept Approval", value: reqPendingDept.length, note: "Awaiting departmental sign-off", icon: LuCircleDashed, accent: ORANGE, tone: "#FFF7ED", onClick: () => navigate("/dashboard/status-table", { state: { status: "PENDING_DEPT_APPROVAL", requisitions: reqs } }) },
    { title: "Pending ITD Approval", value: reqPendingITD.length, note: "Queued for IT review", icon: LuShieldCheck, accent: ORANGE, tone: "#FFF7ED", onClick: () => navigate("/dashboard/status-table", { state: { status: "PENDING_ITD_APPROVAL", requisitions: reqs } }) },
    { title: "Department Declined", value: reqDeptDeclined.length, note: "Requests requiring correction", icon: LuBadgeAlert, accent: RED, tone: LIGHT_RED, onClick: () => navigate("/dashboard/status-table", { state: { status: "DEPT_DECLINED", requisitions: reqs } }) },
    { title: "ITD Declined", value: reqDeclined.length, note: "Rejected during technical review", icon: LuShieldAlert, accent: DARK_RED, tone: LIGHT_RED, onClick: () => navigate("/dashboard/status-table", { state: { status: "ITD_DECLINED", requisitions: reqs } }) },
  ];

  const deptQueueCards = [
    { title: "Pending Reviews", value: deptQueue.length, note: "Awaiting departmental sign-off", icon: LuClipboardList, accent: ORANGE, tone: "#FFF7ED", onClick: () => navigate("/dashboard/dpt-approval") },
    { title: "Units Requested", value: deptQueue.reduce((s, r) => s + Number(r.quantity || 0), 0), note: "Total quantity in queue", icon: LuInbox, accent: BLUE, tone: LIGHT_BLUE, onClick: () => navigate("/dashboard/dpt-approval") },
  ];

  const itdQueueCards = [
    { title: "Pending Reviews", value: itdQueue.length, note: "Awaiting ITD sign-off", icon: LuClipboardList, accent: PURPLE, tone: LIGHT_PURPLE, onClick: () => navigate("/dashboard/itd-approval") },
    { title: "Units Requested", value: itdQueue.reduce((s, r) => s + Number(r.quantity || 0), 0), note: "Total quantity in queue", icon: LuInbox, accent: PURPLE, tone: LIGHT_PURPLE, onClick: () => navigate("/dashboard/itd-approval") },
  ];

  const hwCards = [
    { title: "Open Jobs", value: hwOpen.length, note: "Awaiting technician assignment", icon: LuWrench, accent: ORANGE, tone: "#FFF7ED", onClick: () => navigate("/dashboard/maintenance") },
    { title: "In Progress", value: hwInProgress.length, note: "Currently being worked on", icon: LuCircleDashed, accent: BLUE, tone: LIGHT_BLUE, onClick: () => navigate("/dashboard/maintenance") },
    { title: "Resolved Jobs", value: hwResolved.length, note: "Completed maintenance jobs", icon: LuBadgeCheck, accent: GREEN, tone: "#ECFDF3", onClick: () => navigate("/dashboard/resolved-tickets") },
  ];

  const sdAllCards = [
    { title: "Open Tickets", value: sdOpen.length, note: "Awaiting assignment or action", icon: LuInbox, accent: ORANGE, tone: "#FFF7ED", onClick: () => navigate("/dashboard/service-desk-queue") },
    { title: "In Progress", value: sdInProgress.length, note: "Currently being handled", icon: LuCircleDashed, accent: BLUE, tone: LIGHT_BLUE, onClick: () => navigate("/dashboard/service-desk-queue") },
    { title: "Resolved", value: sdResolved.length, note: "Awaiting user confirmation", icon: LuBadgeCheck, accent: GREEN, tone: "#ECFDF3", onClick: () => navigate("/dashboard/service-desk-queue") },
    { title: "Unassigned", value: sdUnassigned.length, note: "No technician assigned yet", icon: LuBadgeAlert, accent: RED, tone: LIGHT_RED, onClick: () => navigate("/dashboard/service-desk-queue") },
  ];

  const sdMyCards = [
    { title: isHardwareTech ? "My Assigned Tickets" : "My Tickets", value: sdTickets.length, note: isHardwareTech ? "Tickets assigned to you" : "Service requests raised by you", icon: LuMessageSquare, accent: TEAL, tone: LIGHT_TEAL, onClick: () => navigate(isHardwareTech ? "/dashboard/service-desk-queue" : "/dashboard/service-desk") },
    { title: "Open", value: sdOpen.length, note: "Awaiting resolution", icon: LuCircleDashed, accent: ORANGE, tone: "#FFF7ED", onClick: () => navigate(isHardwareTech ? "/dashboard/service-desk-queue" : "/dashboard/service-desk") },
    { title: "Resolved", value: sdResolved.length, note: isHardwareTech ? "Completed resolutions" : "Confirm to close", icon: LuBadgeCheck, accent: GREEN, tone: "#ECFDF3", onClick: () => navigate(isHardwareTech ? "/dashboard/service-desk-queue" : "/dashboard/service-desk") },
  ];

  const stockCards = [
    ...(showApprovedReqs ? [{ title: "Approved Reqs to Issue", value: approvedReqs.length, note: "Ready for collection", icon: LuBadgeCheck, accent: GREEN, tone: "#ECFDF3", onClick: () => navigate("/dashboard/stores-officer") }] : []),
    { title: "Total Stock Items", value: stockItems.length, note: "Tracked item types in store", icon: LuPackage, accent: BLUE, tone: LIGHT_BLUE, onClick: () => navigate("/dashboard/stock") },
    { title: "Low Stock Items", value: stockLow.length, note: "5 or fewer units remaining", icon: LuBadgeAlert, accent: ORANGE, tone: "#FFF7ED", onClick: () => navigate("/dashboard/stock") },
    { title: "Out of Stock", value: stockOut.length, note: "Items requiring replenishment", icon: LuBadgeAlert, accent: RED, tone: LIGHT_RED, onClick: () => navigate("/dashboard/stock") },
  ];

  const inventoryCards = [
    { title: "Total Assets", value: inventoryData.length, note: "All tracked IT devices", icon: LuMonitor, accent: BLUE, tone: LIGHT_BLUE, onClick: () => navigate("/dashboard/inventory") },
    { title: "Active Assets", value: invActive.length, note: "Operational and in use", icon: LuBadgeCheck, accent: GREEN, tone: "#ECFDF3", onClick: () => navigate("/dashboard/inventory") },
    { title: "Attention Needed", value: invAttention.length, note: "Inactive, disposed or obsolete", icon: LuBadgeAlert, accent: RED, tone: LIGHT_RED, onClick: () => navigate("/dashboard/inventory") },
  ];

  // ── Chart data ─────────────────────────────────────────────────────────────
  const approvalChartData = [
    { name: "Approved", value: reqResolved.length, color: GREEN },
    { name: "Pending Dept", value: reqPendingDept.length, color: ORANGE },
    { name: "Pending ITD", value: reqPendingITD.length, color: "#FBBF24" },
    { name: "Declined", value: reqDeclined.length + reqDeptDeclined.length, color: RED },
  ];

  const workflowChartData = [
    { name: "Submitted", total: reqs.length },
    { name: "Approved", total: reqResolved.length },
    { name: "Dept Pending", total: reqPendingDept.length },
    { name: "ITD Pending", total: reqPendingITD.length },
  ];

  const hwChartData = [
    { name: "Open", value: hwOpen.length, color: ORANGE },
    { name: "In Progress", value: hwInProgress.length, color: BLUE },
    { name: "Resolved", value: hwResolved.length, color: GREEN },
  ];

  const sdChartData = SERVICE_DESK_DISTRIBUTION_ORDER.map((item) => ({
    name: item.name,
    value: sdTickets.filter((ticket) => ticket.status === item.key).length,
    color: item.color,
  })).filter((item) => item.value > 0);

  const renderCards = (cards) => (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <SummaryCard key={card.title} card={card} />
      ))}
    </div>
  );

  // ── Hardware Technician: focused live-workload view ────────────────────────
  if (isHardwareTech) {
    const activeJobs = [...hwOpen, ...hwInProgress].slice(0, 8);
    const activeSdTickets = sdTickets
      .filter((t) => SERVICE_DESK_ACTIVE_STATUSES.includes(t.status))
      .slice(0, 8);
    const PRIORITY_DOT = { CRITICAL: DARK_RED, HIGH: RED, MEDIUM: ORANGE, LOW: SLATE };
    const STATUS_CHIP = {
      OPEN: { bg: "#FFF7ED", text: ORANGE, label: "Open" },
      IN_PROGRESS: { bg: LIGHT_BLUE, text: BLUE, label: "In Progress" },
      NEW: { bg: "#FFF7ED", text: ORANGE, label: "New" },
      TRIAGED: { bg: "#FFFBEB", text: "#D97706", label: "Troubleshooting" },
      ASSIGNED: { bg: LIGHT_PURPLE, text: PURPLE, label: "Assigned" },
      WAITING_FOR_USER: { bg: "#F8FAFC", text: SLATE, label: "Waiting" },
      ESCALATED: { bg: LIGHT_RED, text: RED, label: "Escalated" },
      REOPENED: { bg: LIGHT_RED, text: DARK_RED, label: "Reopened" },
    };

    return (
      <div className="px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 xl:px-12">
        <Outlet />

        {/* Hero */}
        <section className="rounded-xl bg-[#1E1E1E] px-6 py-7 text-white md:px-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Hardware Technician</p>
              <h2 className="mt-2 text-2xl font-bold leading-snug md:text-3xl">
                {user?.name ? `Hey ${user.name.split(" ")[0]} — ` : ""}here's your active workload.
              </h2>
              <p className="mt-1 text-sm text-white/60">Assigned maintenance jobs and open service tickets</p>
            </div>
            <div className="grid grid-cols-3 gap-5 rounded-xl border border-white/10 bg-white/[0.06] p-4 md:min-w-[320px]">
              <div>
                <p className="text-xs uppercase tracking-widest text-white/50">Open Jobs</p>
                <p className="mt-2 text-3xl font-bold" style={{ color: ORANGE }}>{hwOpen.length}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-white/50">In Progress</p>
                <p className="mt-2 text-3xl font-bold" style={{ color: "#60A5FA" }}>{hwInProgress.length}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-white/50">SD Tickets</p>
                <p className="mt-2 text-3xl font-bold" style={{ color: "#34D399" }}>{activeSdTickets.length}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Two-column live panels */}
        <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
          {/* ── Maintenance Jobs ── */}
          <section className="rounded-xl border border-[#E0E0E0] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#9E9E9E]">Maintenance</p>
                <h3 className="mt-0.5 text-base font-bold text-[#212121]">Active Jobs</h3>
              </div>
              <button
                onClick={() => navigate("/dashboard/maintenance")}
                className="text-xs font-semibold text-[#D32F2F] hover:underline"
              >
                View all →
              </button>
            </div>

            {activeJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <LuBadgeCheck className="mb-2 text-3xl text-[#16A34A]" />
                <p className="text-sm font-semibold text-[#212121]">All clear — no active jobs</p>
                <p className="mt-1 text-xs text-[#9E9E9E]">Open jobs will appear here once assigned to you</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F5F5F5]">
                {activeJobs.map((job) => {
                  const sdt = job.serviceDeskTicket;
                  const dotColor = PRIORITY_DOT[job.priority] || SLATE;
                  const chip = STATUS_CHIP[job.status] || { bg: "#F5F5F5", text: SLATE, label: job.status };
                  return (
                    <div key={job.id} className="flex items-start gap-3 py-3">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#212121]">
                          {sdt?.subject || job.issueType || "Maintenance Job"}
                        </p>
                        <p className="mt-0.5 text-xs text-[#9E9E9E]">
                          {sdt?.ticketNo ? `#${sdt.ticketNo} · ` : ""}{job.issueType ? `${job.issueType} · ` : ""}{job.priority}
                        </p>
                      </div>
                      <span
                        className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{ backgroundColor: chip.bg, color: chip.text }}
                      >
                        {chip.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-[#F5F5F5] pt-4">
              {[
                { label: "Open", value: hwOpen.length, color: ORANGE, path: "/dashboard/maintenance" },
                { label: "In Progress", value: hwInProgress.length, color: BLUE, path: "/dashboard/maintenance" },
                { label: "Resolved", value: hwResolved.length, color: GREEN, path: "/dashboard/resolved-tickets" },
              ].map((s) => (
                <button
                  key={s.label}
                  onClick={() => navigate(s.path)}
                  className="rounded-lg border border-[#E0E0E0] p-3 text-center transition-colors hover:bg-[#FAFAFA]"
                >
                  <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="mt-0.5 text-xs text-[#9E9E9E]">{s.label}</p>
                </button>
              ))}
            </div>
          </section>

          {/* ── Assigned Service Desk Tickets ── */}
          <section className="rounded-xl border border-[#E0E0E0] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#9E9E9E]">Service Desk</p>
                <h3 className="mt-0.5 text-base font-bold text-[#212121]">Assigned Tickets</h3>
              </div>
              <button
                onClick={() => navigate("/dashboard/service-desk-queue")}
                className="text-xs font-semibold text-[#D32F2F] hover:underline"
              >
                View all →
              </button>
            </div>

            {activeSdTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <LuBadgeCheck className="mb-2 text-3xl text-[#16A34A]" />
                <p className="text-sm font-semibold text-[#212121]">No open tickets assigned to you</p>
                <p className="mt-1 text-xs text-[#9E9E9E]">New assignments will appear here</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F5F5F5]">
                {activeSdTickets.map((ticket) => {
                  const dotColor = PRIORITY_DOT[ticket.priority] || SLATE;
                  const chip = STATUS_CHIP[ticket.status] || {
                    bg: "#F5F5F5",
                    text: SLATE,
                    label: ticket.status?.replaceAll("_", " "),
                  };
                  return (
                    <div key={ticket.id} className="flex items-start gap-3 py-3">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dotColor }} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#212121]">{ticket.subject}</p>
                        <p className="mt-0.5 text-xs text-[#9E9E9E]">#{ticket.ticketNo} · {ticket.priority}</p>
                      </div>
                      <span
                        className="inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{ backgroundColor: chip.bg, color: chip.text }}
                      >
                        {chip.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#F5F5F5] pt-4">
              {[
                { label: "Active", value: sdOpen.length, color: ORANGE, path: "/dashboard/service-desk-queue" },
                { label: "Resolved", value: sdResolved.length, color: GREEN, path: "/dashboard/service-desk-queue" },
              ].map((s) => (
                <button
                  key={s.label}
                  onClick={() => navigate(s.path)}
                  className="rounded-lg border border-[#E0E0E0] p-3 text-center transition-colors hover:bg-[#FAFAFA]"
                >
                  <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="mt-0.5 text-xs text-[#9E9E9E]">{s.label}</p>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 xl:px-12">
      <Outlet />

      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <section className="rounded-xl bg-[#1E1E1E] px-6 py-7 text-white md:px-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
              Dashboard
            </p>
            <h2 className="mt-2 text-2xl font-bold leading-snug md:text-3xl">
              {heroTitle}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-5 rounded-xl border border-white/10 bg-white/[0.06] p-4 md:min-w-[280px]">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/50">{heroLabel1}</p>
              <p className="mt-2 text-3xl font-bold">{heroValue1}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/50">{heroLabel2}</p>
              <p className="mt-2 text-3xl font-bold">{heroValue2}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Department Approval Queue ────────────────────────────────────────── */}
      {showDeptQueue && (
        <section className="mt-8">
          <SectionHeader
            title="Department Approval Queue"
            subtitle="Requisitions awaiting your departmental sign-off"
          />
          {renderCards(deptQueueCards)}
        </section>
      )}

      {/* ── ITD Approval Queue ───────────────────────────────────────────────── */}
      {showITDQueue && (
        <section className="mt-8">
          <SectionHeader
            title="ITD Approval Queue"
            subtitle="Requisitions awaiting IT directorate review"
          />
          {renderCards(itdQueueCards)}
        </section>
      )}

      {/* ── Requisition Overview ─────────────────────────────────────────────── */}
      {showReqSection && (
        <section className="mt-8">
          <SectionHeader
            title={isDeptApprover || isITDApprover ? "My Requisitions" : "Requisition Overview"}
            subtitle={
              isDeptApprover || isITDApprover
                ? "Your own submitted requests"
                : "Status breakdown for all submitted requests"
            }
          />
          {renderCards(reqCards)}
        </section>
      )}

      {/* ── Hardware Maintenance ─────────────────────────────────────────────── */}
      {showHardware && (
        <section className="mt-8">
          <SectionHeader
            title="Maintenance Jobs"
            subtitle="Hardware repair and maintenance ticket status"
          />
          {renderCards(hwCards)}
        </section>
      )}

      {/* ── Service Desk — Full view (managers / supervisor / admin) ─────────── */}
      {showSdAll && (
        <section className="mt-8">
          <SectionHeader
            title="Service Desk Overview"
            subtitle="All active support tickets across the system"
          />
          {renderCards(sdAllCards)}
        </section>
      )}

      {/* ── Service Desk — My tickets (roles that actively use service desk) ─── */}
      {showMySdSection && (
        <section className="mt-8">
          <SectionHeader
            title="My Service Desk Tickets"
            subtitle="Support requests raised by you"
          />
          {renderCards(sdMyCards)}
        </section>
      )}

      {/* ── Stock Overview ───────────────────────────────────────────────────── */}
      {showStock && (
        <section className="mt-8">
          <SectionHeader
            title="Stock Overview"
            subtitle="IT stock levels, approved requisitions, and replenishment status"
          />
          {renderCards(stockCards)}
        </section>
      )}

      {/* ── IT Asset Inventory ───────────────────────────────────────────────── */}
      {showInventory && (
        <section className="mt-8">
          <SectionHeader
            title="IT Asset Inventory"
            subtitle="Tracked devices, status, and assigned users"
          />
          {renderCards(inventoryCards)}
        </section>
      )}

      {/* ── Charts: Requisition workflow (admin / supervisor overview) ─────── */}
      {showCharts && showReqSection && (
        <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1.45fr_0.95fr]">
          <div className="rounded-xl border border-[#E0E0E0] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#9E9E9E]">Workflow Snapshot</p>
                <h3 className="mt-1 text-base font-bold text-[#212121]">Requisition lifecycle</h3>
              </div>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workflowChartData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: SLATE, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: SLATE, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "rgba(211, 47, 47, 0.06)" }} />
                  <Legend />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]} fill={RED} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-[#E0E0E0] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9E9E9E]">Approval Mix</p>
            <h3 className="mt-1 text-base font-bold text-[#212121]">Requisition distribution</h3>
            <div className="mt-4 h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={approvalChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={4}
                  >
                    {approvalChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {approvalChartData.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg bg-[#F5F5F5] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium text-[#212121]">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#212121]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Charts: Hardware ticket pipeline ────────────────────────────────── */}
      {showHardware && (
        <section className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[1.45fr_0.95fr]">
          <div className="rounded-xl border border-[#E0E0E0] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#9E9E9E]">Maintenance Snapshot</p>
                <h3 className="mt-1 text-base font-bold text-[#212121]">Hardware job pipeline</h3>
              </div>
            </div>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: "Open", total: hwOpen.length },
                    { name: "In Progress", total: hwInProgress.length },
                    { name: "Resolved", total: hwResolved.length },
                  ]}
                  barSize={40}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: SLATE, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: SLATE, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: "rgba(29, 78, 216, 0.06)" }} />
                  <Legend />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]} fill={BLUE} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-[#E0E0E0] bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9E9E9E]">Job Status Mix</p>
            <h3 className="mt-1 text-base font-bold text-[#212121]">Tickets by status</h3>
            <div className="mt-4 h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={hwChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={82}
                    paddingAngle={4}
                  >
                    {hwChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-2">
              {hwChartData.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg bg-[#F5F5F5] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium text-[#212121]">{item.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-[#212121]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Charts: Service Desk distribution (supervisor / admin) ─────────── */}
      {showCharts && showSdAll && (
        <section className="mt-6">
          <div className="rounded-xl border border-[#E0E0E0] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#9E9E9E]">Service Desk</p>
                <h3 className="mt-1 text-base font-bold text-[#212121]">Ticket status distribution</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.45fr_0.95fr]">
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sdChartData.map((d) => ({ name: d.name, total: d.value }))}
                    barSize={36}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: SLATE, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: SLATE, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "rgba(13, 148, 136, 0.06)" }} />
                    <Legend />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]} fill={TEAL} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid content-start gap-3">
                {sdChartData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between rounded-lg bg-[#F5F5F5] px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-medium text-[#212121]">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-[#212121]">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Dashboard;
