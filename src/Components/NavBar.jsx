import { Dropdown } from "antd";
import { LuChevronDown, LuLayoutDashboard, LuMenu, LuPlus } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { logout } from "../lib/auth";
import { useUser } from "../utils/userContext";
import NotificationBell from "./ui/NotificationBell";

const Navbar = ({ onOpenMenu = () => {} }) => {
  const { user, setUser } = useUser();
  const currentDate = new Date();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setUser(null);
    navigate("/");
  };

  const isAdmin = user?.roles?.includes("admin");
  const formattedDate = currentDate.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const initials =
    user?.name
      ?.split(" ")
      .filter(Boolean)
      .map((name) => name[0])
      .join("") || "IS";
  const roleLabel = user?.roles?.join(", ") || "User";

  const items = [
    ...(isAdmin
      ? [
          {
            label: (
              <button
                type="button"
                onClick={() => navigate("/backoffice/dashboard")}
                className="flex items-center gap-2 font-semibold"
              >
                <LuLayoutDashboard className="text-base" />
                Backoffice
              </button>
            ),
            key: "1",
          },
        ]
      : []),
    {
      label: <span className="font-semibold">Logout</span>,
      key: "0",
      onClick: handleLogout,
    },
  ];

  return (
    <div className="app-shell-topbar fixed left-0 right-0 top-0 z-20 border-b border-[#E0E0E0] bg-white px-4 py-3 md:left-[280px] md:px-6 lg:px-10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onOpenMenu}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E0E0E0] bg-white text-[#616161] transition-colors duration-150 hover:border-[#D32F2F]/40 hover:bg-[#FFEBEE] hover:text-[#D32F2F] md:hidden"
          >
            <LuMenu className="text-lg" />
          </button>

          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-widest text-[#9E9E9E] sm:text-[11px]">
              IT HUB
            </p>
            <p className="text-sm font-semibold text-[#212121]">{formattedDate}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3 lg:gap-4">
          <button
            type="button"
            onClick={() =>
              navigate("/dashboard/requisition", {
                state: { openCreateModal: true },
              })
            }
            className="hidden items-center gap-2 rounded-lg bg-[#D32F2F] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#B71C1C] md:flex"
          >
            <LuPlus className="text-base" />
            New Request
          </button>

          <NotificationBell />

          <Dropdown menu={{ items }} trigger={["click"]}>
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-[#E0E0E0] bg-white px-2 py-1.5 text-left transition-colors duration-150 hover:border-[#D32F2F]/30 hover:bg-[#FFF5F5] sm:gap-3 sm:px-3"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E1E1E] text-sm font-semibold text-white">
                {initials}
              </span>
              <div className="hidden text-left sm:block">
                <p className="max-w-[180px] truncate text-sm font-bold text-[#212121]">{user?.name}</p>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#616161]">{roleLabel}</p>
              </div>
              <LuChevronDown className="text-[#616161]" />
            </button>
          </Dropdown>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default Navbar;
