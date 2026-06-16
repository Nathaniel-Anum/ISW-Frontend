import { Drawer } from "antd";
import { NavLink } from "react-router-dom";
import {
  LuArrowRightLeft,
  LuBadgeCheck,
  LuBookOpen,
  LuBoxes,
  LuBriefcaseBusiness,
  LuCalendarClock,
  LuClipboardList,
  LuHeadset,
  LuHardDrive,
  LuHeartPulse,
  LuHouse,
  LuLibrary,
  LuPackageCheck,
  LuPackagePlus,
  LuPackageSearch,
  LuScanSearch,
  LuSettings2,
  LuShieldCheck,
  LuSquareActivity,
  LuX,
  LuWarehouse,
  LuWrench,
} from "react-icons/lu";
import { useUser } from "../utils/userContext";
import cocoa from "/assets/logo.9a18109e1c16584832d5.png";

const Sidebar = ({ mobileOpen = false, onClose = () => {} }) => {
  const { user } = useUser();

  const baseItems = [
    { to: "/dashboard", label: "Dashboard", icon: LuHouse },
    { to: "/dashboard/requisition", label: "Requisitions", icon: LuClipboardList },
    { to: "/dashboard/service-desk", label: "Service Desk", icon: LuHeadset },
    { to: "/dashboard/acknowledge", label: "Confirm Receipt", icon: LuPackageCheck },
  ];

  const roleItems = [
    user?.roles?.includes("dept_approver") && {
      to: "/dashboard/dpt-approval",
      label: "Department Approval",
      icon: LuShieldCheck,
    },
    user?.roles?.includes("itd_approver") && {
      to: "/dashboard/itd-approval",
      label: "ITD Approval",
      icon: LuShieldCheck,
    },
    user?.roles?.includes("stores_officer") && {
      to: "/dashboard/stores",
      label: "Receive Stock",
      icon: LuPackagePlus,
    },
    user?.roles?.includes("stores_officer") && {
      to: "/dashboard/stores-officer",
      label: "Issue Items",
      icon: LuArrowRightLeft,
    },
    user?.roles?.includes("inventory_officer") && {
      to: "/dashboard/inventory",
      label: "Inventory",
      icon: LuBoxes,
    },
    (user?.roles?.includes("inventory_officer") ||
      user?.roles?.includes("service_desk_manager") ||
      user?.roles?.includes("supervisor") ||
      user?.roles?.includes("admin")) && {
      to: "/dashboard/asset-health",
      label: "Asset Health",
      icon: LuHeartPulse,
    },
    user?.roles?.includes("stores_officer") && {
      to: "/dashboard/stock",
      label: "Stock",
      icon: LuWarehouse,
    },
    (user?.roles?.includes("hardware_technician") ||
      user?.roles?.includes("service_desk_manager") ||
      user?.roles?.includes("supervisor") ||
      user?.roles?.includes("workshop_supervisor") ||
      user?.roles?.includes("inventory_officer") ||
      user?.roles?.includes("stores_officer") ||
      user?.roles?.includes("itd_approver") ||
      user?.roles?.includes("admin")) && {
      to: "/dashboard/knowledge-base",
      label: "Knowledge Base",
      icon: LuLibrary,
    },
    (user?.roles?.includes("hardware_technician") ||
      user?.roles?.includes("service_desk_manager") ||
      user?.roles?.includes("supervisor") ||
      user?.roles?.includes("workshop_supervisor") ||
      user?.roles?.includes("admin")) && {
      to: "/dashboard/maintenance",
      label: "Maintenance",
      icon: LuWrench,
    },
    user?.roles?.includes("hardware_technician") && {
      to: "/dashboard/service-desk-queue",
      label: "My Assigned Tickets",
      icon: LuBriefcaseBusiness,
    },
    user?.roles?.includes("workshop_supervisor") && {
      to: "/dashboard/service-desk-queue",
      label: "Maintenance Tickets",
      icon: LuWrench,
    },
    (user?.roles?.includes("service_desk_manager") ||
      user?.roles?.includes("supervisor") ||
      user?.roles?.includes("admin")) && {
      to: "/dashboard/service-desk-queue",
      label: "All Tickets",
      icon: LuBriefcaseBusiness,
    },
    (user?.roles?.includes("service_desk_manager") ||
      user?.roles?.includes("supervisor") ||
      user?.roles?.includes("admin")) && {
      to: "/dashboard/service-desk-report",
      label: "Service Desk Report",
      icon: LuSquareActivity,
    },
    (user?.roles?.includes("hardware_technician") ||
      user?.roles?.includes("supervisor") ||
      user?.roles?.includes("workshop_supervisor") ||
      user?.roles?.includes("admin")) && {
      to: "/dashboard/pm-schedules",
      label: "PM Schedules",
      icon: LuCalendarClock,
    },
    (user?.roles?.includes("supervisor") || user?.roles?.includes("workshop_supervisor")) && {
      to: "/dashboard/technician-report",
      label: "Maintenance Report",
      icon: LuSquareActivity,
    },
    user?.roles?.includes("admin") && {
      to: "/dashboard/admin-logs",
      label: "Admin Logs",
      icon: LuSettings2,
    },
    user?.roles?.includes("supervisor") && {
      to: "/dashboard/inv-officer-report",
      label: "Inventory Report",
      icon: LuHardDrive,
    },
    user?.roles?.includes("stores_officer") && {
      to: "/dashboard/stores-report",
      label: "Stores Report",
      icon: LuScanSearch,
    },
    user?.roles?.includes("supervisor") && {
      to: "/dashboard/stores-report",
      label: "Supervisor Stores Report",
      icon: LuScanSearch,
    },
    user?.roles?.includes("hardware_technician") && {
      to: "/dashboard/technician-report",
      label: "Technician Report",
      icon: LuBadgeCheck,
    },
    user?.roles?.includes("workshop_supervisor") && {
      to: "/dashboard/technician-report",
      label: "Workshop Report",
      icon: LuBadgeCheck,
    },
    user?.roles?.includes("inventory_officer") && {
      to: "/dashboard/inv-officer-report",
      label: "Officer Report",
      icon: LuPackageSearch,
    },
  ].filter(Boolean);

  const renderItem = ({ to, label, icon: Icon }, isMobile = false) => (
    <NavLink key={to} to={to} end={to === "/dashboard"} onClick={isMobile ? onClose : undefined}>
      {({ isActive }) => (
        <div
          className={`group relative flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200 ease-out ${
            isActive
              ? "border-[#D32F2F]/40 bg-[#FFEBEE] text-white shadow-sm"
              : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/[0.06] hover:text-white"
          }`}
        >
          <span
            className={`absolute left-0 top-2 bottom-2 w-1 rounded-full ${
              isActive ? "bg-[#D32F2F]" : "bg-transparent"
            }`}
          />
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg ${
              isActive
                ? "border-[#D32F2F]/20 bg-white text-[#D32F2F]"
                : "border-white/10 bg-white/5 text-slate-200"
            }`}
          >
            <Icon />
          </span>
          <span className={`text-sm font-semibold leading-5 ${isActive ? "text-[#212121]" : "text-inherit"}`}>
            {label}
          </span>
        </div>
      )}
    </NavLink>
  );

  const sidebarContent = (isMobile = false) => (
    <div className="flex h-full flex-col overflow-hidden bg-[#1E1E1E] px-5 py-6 text-white">
      <div className="mb-8 flex items-center gap-3 border-b border-white/10 pb-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/6 p-2">
          <img src={cocoa} alt="logo" className="max-h-full w-auto object-contain" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Operations Platform
          </p>
          <h1 className="text-lg font-bold text-white">IT HUB</h1>
        </div>
        {isMobile ? (
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200"
          >
            <LuX />
          </button>
        ) : null}
      </div>

      <div className="mb-4">
        <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Workspace
        </p>
      </div>

      <nav className="no-scrollbar flex-1 space-y-2 overflow-y-auto pr-1">
        {baseItems.map((item) => renderItem(item, isMobile))}

        {roleItems.length > 0 && (
          <div className="pt-5">
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Operations
            </p>
            <div className="space-y-2">{roleItems.map((item) => renderItem(item, isMobile))}</div>
          </div>
        )}
      </nav>

      <div className="mt-4 border-t border-white/10 pt-4">
        {renderItem({ to: "/dashboard/user-guide", label: "User Guide", icon: LuBookOpen }, isMobile)}
      </div>
    </div>
  );

  return (
    <>
      <aside className="app-shell-sidebar fixed left-0 top-0 z-30 hidden h-screen w-[280px] flex-col overflow-hidden border-r border-white/10 bg-[#1E1E1E] md:flex">
        {sidebarContent(false)}
      </aside>

      <Drawer
        placement="left"
        open={mobileOpen}
        onClose={onClose}
        closable={false}
        width={300}
        rootClassName="md:!hidden"
        styles={{
          body: { padding: 0, background: "#1E1E1E" },
          content: { background: "#1E1E1E" },
          mask: { backdropFilter: "blur(6px)" },
          wrapper: { maxWidth: "100vw" },
        }}
      >
        {sidebarContent(true)}
      </Drawer>
    </>
  );
};

export default Sidebar;
