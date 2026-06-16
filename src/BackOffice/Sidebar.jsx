import { Drawer } from "antd";
import logo from "../assets/logo.png";
import { NavLink } from "react-router-dom";
import { LuHeadset, LuTag, LuUsersRound } from "react-icons/lu";
import {
  AppConfigIcon,
  Department,
  Districts,
  Employees,
  Permission,
  Roles,
  Close,
  Division,
} from "../Components/icons/icons.components";

const sections = [
  {
    title: "People",
    items: [
      { label: "Employees", to: "/backoffice/dashboard", icon: Employees, end: true },
      { label: "Departments", to: "/backoffice/dashboard/department", icon: Department },
      { label: "Units", to: "/backoffice/dashboard/unit", icon: Division },
    ],
  },
  {
    title: "Catalog",
    items: [
      { label: "Suppliers", to: "/backoffice/dashboard/supplier", icon: Districts },
    ],
  },
  {
    title: "Setup",
    items: [
      { label: "Purchase Type", to: "/backoffice/dashboard/projects", icon: AppConfigIcon },
      { label: "Item Categories", to: "/backoffice/dashboard/it-item-categories", icon: AppConfigIcon },
      { label: "Item Registration", to: "/backoffice/dashboard/it-items", icon: AppConfigIcon },
      { label: "Requisition Items", to: "/backoffice/dashboard/requisition-items", icon: AppConfigIcon },
    ],
  },
  {
    title: "Service Desk",
    items: [
      { label: "Categories", to: "/backoffice/dashboard/service-desk-categories", icon: LuHeadset },
      { label: "Skill Tags", to: "/backoffice/dashboard/skill-tags", icon: LuTag },
      { label: "Support Profiles", to: "/backoffice/dashboard/support-profiles", icon: LuUsersRound },
    ],
  },
  {
    title: "Access",
    items: [
      { label: "Roles", to: "/backoffice/dashboard/roles", icon: Roles },
      { label: "Permissions", to: "/backoffice/dashboard/permissions", icon: Permission },
    ],
  },
];

const Sidebar = ({ mobileOpen = false, onClose = () => {} }) => {
  const sidebarContent = (isMobile = false) => (
    <div className="h-full overflow-y-auto bg-[#1E1E1E] px-5 py-6 text-white">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2">
            <img src={logo} alt="Ghana Cocoa Board" className="max-h-full max-w-full object-contain" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60">
              Inventory Suite
            </p>
            <h2 className="mt-1 text-lg font-bold">Back Office</h2>
          </div>
          {isMobile ? (
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200"
            >
              <Close size={18} className="text-white" />
            </button>
          ) : null}
        </div>
        <p className="mt-4 text-sm leading-6 text-white/70">
          Manage master data, staff structure, suppliers, and permission controls from one workspace.
        </p>
      </div>

      <nav className="mt-8 space-y-7">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">
              {section.title}
            </p>
            <div className="space-y-1.5">
              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={isMobile ? onClose : undefined}
                    className={({ isActive }) =>
                      [
                        "group flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-200",
                        isActive
                          ? "bg-[#D32F2F] text-white shadow-[0_14px_30px_rgba(211,47,47,0.35)]"
                          : "text-white/72 hover:bg-white/8 hover:text-white",
                      ].join(" ")
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div
                          className={[
                            "flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200",
                            isActive ? "border-white/20 bg-white/10" : "border-white/10 bg-white/5",
                          ].join(" ")}
                        >
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{item.label}</p>
                          <p className="text-xs text-current/70">Admin module</p>
                        </div>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[280px] overflow-y-auto border-r border-white/10 bg-[#1E1E1E] md:block">
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