import React from "react";
import { DownOutlined } from "@ant-design/icons";
import { Dropdown, Space } from "antd";
import { Navigate, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useUser } from "../utils/userContext";

const Navbar = () => {
  const { user, setUser } = useUser();
  const currentDate = new Date();
  // console.log(currentDate);

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
    navigate("/");
    localStorage.removeItem("user");
  };

  const isAdmin = user?.roles?.includes("admin");

  // Assuming `user` is accessible globally in your app
  const items = [
    // If user is admin, add this item first
    ...(isAdmin
      ? [
          {
            label: <a href="/dashboard">Go to Dashboard</a>,
            key: "1",
          },
        ]
      : []),

    // Logout is always present
    {
      label: <a onClick={handleLogout}>Logout</a>,
      key: "0",
    },
  ];
  return (
    <div>
      <div className="flex justify-between items-center pt-[20px]">
        <div className="pl-[15rem]">
          {/* <p className="font-semibold text-[23px]">Dashboard</p> */}

          <p className="font-semibold ">{currentDate.toDateString()}</p>
          {/* <p>{currentDate.toLocaleTimeString()}</p> */}
        </div>

        <div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="svgs1"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
            />
          </svg>
        </div>

        <div className="pr-[51px] flex gap-2 items-center">
          <p className=" border  px-3 py-2 font-semibold rounded-md text-[18px]">
            IS
          </p>
          <Dropdown
            menu={{
              items,
            }}
            trigger={["click"]}
          >
            <a
              className="font-semibold  cursor-pointer"
              onClick={(e) => e.preventDefault()}
            >
              <Space>
                {user?.name}
                <DownOutlined />
              </Space>
            </a>
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
