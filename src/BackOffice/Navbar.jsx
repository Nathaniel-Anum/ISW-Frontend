import { Button, Dropdown, Space } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { LuArrowRightLeft, LuMenu } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../utils/userContext";

const Navbar = ({ onOpenMenu = () => {} }) => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  const items = [
    {
      key: "workspace",
      label: <button onClick={() => navigate("/dashboard")}>Open workspace</button>,
    },
    {
      key: "logout",
      label: <button onClick={handleLogout}>Logout</button>,
    },
  ];

  return (
    <>
    <header className="fixed left-0 right-0 top-0 z-30 h-[72px] border-b border-[#E0E0E0] bg-white md:left-[280px]">
      <div className="flex h-full items-center justify-between gap-4 px-4 md:px-8 xl:px-10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E0E0E0] bg-white text-[#212121] transition-colors duration-200 hover:border-[#D32F2F]/40 hover:bg-[#FFEBEE] hover:text-[#D32F2F] md:hidden"
          >
            <LuMenu className="text-lg" />
          </button>

          <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#9E9E9E]">
            Back Office
          </p>
          <h1 className="mt-1 text-lg font-bold text-[#212121] md:text-xl">Administration</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            type="default"
            icon={<LuArrowRightLeft size={16} />}
            className="hidden !h-9 !rounded-lg !border-[#E0E0E0] !px-4 !text-[#212121] md:inline-flex"
            onClick={() => navigate("/dashboard")}
          >
            Main dashboard
          </Button>

          <div className="hidden rounded-lg border border-[#E0E0E0] px-3 py-2 md:block">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#9E9E9E]">
              Signed In
            </p>
            <p className="mt-1 text-sm font-semibold text-[#212121]">{user?.email || user?.name}</p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[#E0E0E0] bg-white px-2 py-1.5 sm:gap-3 sm:px-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1E1E1E] text-sm font-semibold text-white">
              {(user?.name || "IS")
                .split(" ")
                .slice(0, 2)
                .map((value) => value.charAt(0).toUpperCase())
                .join("")}
            </div>
            <Dropdown menu={{ items }} trigger={["click"]}>
              <button className="text-left text-sm font-semibold text-[#212121]">
                <Space>
                  <span className="hidden sm:inline">{user?.name || "Inventory Admin"}</span>
                  <DownOutlined />
                </Space>
              </button>
            </Dropdown>
          </div>
        </div>
      </div>
    </header>
    <ToastContainer position="top-right" autoClose={4000} hideProgressBar={false} closeOnClick pauseOnHover />
    </>
  );
};

export default Navbar;