import React, { useEffect, useState } from "react";
import Layout from "./Layout";
import { Link, Outlet, useNavigate } from "react-router-dom";

import api from "../utils/config";
import { useUser } from "../utils/userContext";
import { FaCheckCircle, FaFileAlt, FaSpinner, FaTools } from "react-icons/fa";
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
import { Divider } from "antd";
import { useQuery } from "@tanstack/react-query";

const Dashboard = () => {
  const navigate = useNavigate();
  const { setUser } = useUser();
  useEffect(() => {
    api
      .get("/user/profile")
      .then((res) => {
        setUser(res.data);
        console.log("Profile:", res.data);
        localStorage.setItem("user", JSON.stringify(res.data));
      })
      .catch((err) => {
        console.error("Failed to fetch profile:", err);
      });
  }, [setUser]);

  const { data: requisitions } = useQuery({
    queryKey: ["requisitions"],
    queryFn: () => api.get("/user/requisitions"),
  });
  console.log(requisitions?.data);
  const resolved = requisitions?.data?.filter((i) => i.status === "PROCESSED");

  const declined = requisitions?.data?.filter(
    (i) => i.status === "ITD_DECLINED"
  );
  const pending = requisitions?.data?.filter(
    (i) => i.status === "PENDING_DEPT_APPROVAL"
  );
  const ITDpending = requisitions?.data?.filter(
    (i) => i.status === "PENDING_ITD_APPROVAL"
  );

  return (
    <div>
      <Outlet />
      <div className="px-[10rem] py-[3rem]">
        <div className="space-y-6 px-2 sm:px-4">
          {/* Dashboard Header */}
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 my-3 px-2">
            Dashboard Overview
          </h2>

          {/* All Cards in One Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 lg:pr-[41rem] gap-3 sm:gap-4">
            {/* === INVENTORY CARDS === */}

            {/* Requisitions Card */}
            <Link to="/dashboard/requisition">
              <div className="bg-white hover:bg-gray-100 cursor-pointer transition-colors duration-200 shadow-md rounded-xl hover:shadow-lg overflow-hidden border border-gray-200">
                <div className="p-4 sm:p-6">
                  <div className="flex items-center mb-2 sm:mb-4">
                    <FaFileAlt
                      className="text-blue-500 mr-2 sm:mr-3"
                      size={20}
                    />
                    <h3 className="text-gray-600 font-medium text-sm sm:text-base">
                      Total Requisitions
                    </h3>
                  </div>
                  <div className="mt-1 sm:mt-2">
                    <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800">
                      {requisitions?.data?.length || 0}
                    </p>
                  </div>
                  <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-gray-100">
                    <span className="text-xs sm:text-sm text-gray-500">
                      Updated today
                    </span>
                  </div>
                </div>
              </div>
            </Link>
            {/* Tickets Resolved Card */}
            <div
              onClick={() =>
                navigate("/dashboard/status-table", {
                  state: {
                    status: "PROCESSED",
                    requisitions: requisitions?.data,
                  },
                })
              }
              className="bg-white hover:bg-gray-100 transition-colors cursor-pointer duration-200 shadow-md rounded-xl hover:shadow-lg overflow-hidden border border-gray-200"
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center mb-2 sm:mb-4">
                  <FaCheckCircle
                    className="text-green-500 mr-2 sm:mr-3"
                    size={20}
                  />
                  <h3 className="text-gray-600 font-medium text-sm sm:text-base">
                    Requisition Approved
                  </h3>
                </div>
                <div className="mt-1 sm:mt-2">
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800">
                    {resolved?.length || 0}
                  </p>
                </div>
                <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-gray-100">
                  <span className="text-xs sm:text-sm text-gray-500">
                    Updated today
                  </span>
                </div>
              </div>
            </div>

            {/* Tickets In Progress Card */}
            <div
              onClick={() =>
                navigate("/dashboard/status-table", {
                  state: {
                    status: "PENDING_DEPT_APPROVAL",
                    requisitions: requisitions?.data,
                  },
                })
              }
              className="bg-white hover:bg-gray-100 transition-colors cursor-pointer duration-200 shadow-md rounded-xl hover:shadow-lg overflow-hidden border border-gray-200"
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center mb-2 sm:mb-4">
                  <FaSpinner
                    className="text-yellow-500 mr-2 sm:mr-3"
                    size={20}
                  />
                  <h3 className="text-gray-600 font-medium text-sm sm:text-base">
                    Pending Department Approval
                  </h3>
                </div>
                <div className="mt-1 sm:mt-2">
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800">
                    {pending?.length || 0}
                  </p>
                </div>
                <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-gray-100">
                  <span className="text-xs sm:text-sm text-gray-500">
                    Updated today
                  </span>
                </div>
              </div>
            </div>
            {/* Tickets In Progress Card */}
            <div
              onClick={() =>
                navigate("/dashboard/status-table", {
                  state: {
                    status: "PENDING_ITD_APPROVAL",
                    requisitions: requisitions?.data,
                  },
                })
              }
              className="bg-white hover:bg-gray-100 transition-colors cursor-pointer duration-200 shadow-md rounded-xl hover:shadow-lg overflow-hidden border border-gray-200"
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center mb-2 sm:mb-4">
                  <FaSpinner
                    className="text-yellow-500 mr-2 sm:mr-3"
                    size={20}
                  />
                  <h3 className="text-gray-600 font-medium text-sm sm:text-base">
                    Pending ITD Approval
                  </h3>
                </div>
                <div className="mt-1 sm:mt-2">
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800">
                    {ITDpending?.length || 0}
                  </p>
                </div>
                <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-gray-100">
                  <span className="text-xs sm:text-sm text-gray-500">
                    Updated today
                  </span>
                </div>
              </div>
            </div>
            {/* Tickets Unresolved Card */}
            <div
              onClick={() =>
                navigate("/dashboard/status-table", {
                  state: {
                    status: "ITD_DECLINED",
                    requisitions: requisitions?.data,
                  },
                })
              }
              className="bg-white hover:bg-gray-100 transition-colors cursor-pointer duration-200 shadow-md rounded-xl hover:shadow-lg overflow-hidden border border-gray-200"
            >
              <div className="p-4 sm:p-6">
                <div className="flex items-center mb-2 sm:mb-4">
                  <FaTools className="text-red-500 mr-2 sm:mr-3" size={20} />
                  <h3 className="text-gray-600 font-medium text-sm sm:text-base">
                    Requisitions Declined
                  </h3>
                </div>
                <div className="mt-1 sm:mt-2">
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800">
                    {declined?.length || 0}
                  </p>
                </div>
                <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-gray-100">
                  <span className="text-xs sm:text-sm text-gray-500">
                    Updated today
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Divider />
          {/* Two Graphs in a Grid */}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
