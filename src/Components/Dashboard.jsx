import React, { useEffect, useState } from "react";
import Layout from "./Layout";
import { Outlet } from "react-router-dom";

import api from "../utils/config";
import { useUser } from "../utils/userContext";
import {
  FaBoxOpen,
  FaChartLine,
  FaCheckCircle,
  FaFileAlt,
  FaSpinner,
  FaTools,
} from "react-icons/fa";
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

const Dashboard = () => {
  const { setUser } = useUser();
  useEffect(() => {
    api
      .get("/user/profile")
      .then((res) => {
        setUser(res.data);
        console.log("Profile:", res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch profile:", err);
      });
  }, [setUser]);

  // Sample data for the inventory bar graph
  const [inventoryData, setInventoryData] = useState([
    { name: "Active", count: 120 },
    { name: "Inactive", count: 80 },
    { name: "Obsolete", count: 40 },
    { name: "In Stock", count: 260 },
  ]);

  // Sample data for the pie chart
  const [pieData, setPieData] = useState([
    { name: "Available", value: 380 },
    { name: "Reserved", value: 120 },
  ]);

  // Colors for pie chart
  const COLORS = ["#3B82F6", "#EC4899"];

  // Simulate data updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update bar chart data
      setInventoryData(
        inventoryData.map((item) => ({
          ...item,
          count: item.count + Math.floor(Math.random() * 10 - 5),
        }))
      );

      // Update pie chart data
      setPieData([
        { name: "Available", value: 380 + Math.floor(Math.random() * 20 - 10) },
        { name: "Reserved", value: 120 + Math.floor(Math.random() * 10 - 5) },
      ]);
    }, 5000);
    return () => clearInterval(interval);
  }, [inventoryData, pieData]);

  return (
    <div>
      <Layout />
      <Outlet />
      <div className="px-[10rem] py-[3rem]">
        <div className="space-y-6 px-2 sm:px-4">
          {/* Dashboard Header */}
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 my-3 px-2">
            Dashboard Overview
          </h2>

          {/* All Cards in One Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {/* === INVENTORY CARDS === */}

            {/* Requisitions Card */}
            <div className="bg-white hover:bg-gray-100 cursor-pointer transition-colors duration-200 shadow-md rounded-xl hover:shadow-lg overflow-hidden border border-gray-200">
              <div className="p-4 sm:p-6">
                <div className="flex items-center mb-2 sm:mb-4">
                  <FaFileAlt className="text-blue-500 mr-2 sm:mr-3" size={20} />
                  <h3 className="text-gray-600 font-medium text-sm sm:text-base">
                    Total Requisitions
                  </h3>
                </div>
                <div className="mt-1 sm:mt-2">
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800">
                    500
                  </p>
                </div>
                <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-gray-100">
                  <span className="text-xs sm:text-sm text-gray-500">
                    Updated today
                  </span>
                </div>
              </div>
            </div>

            {/* Inventory Items Card */}
            <div className="bg-white hover:bg-gray-100 transition-colors cursor-pointer duration-200 shadow-md rounded-xl hover:shadow-lg overflow-hidden border border-gray-200">
              <div className="p-4 sm:p-6">
                <div className="flex items-center mb-2 sm:mb-4">
                  <FaBoxOpen
                    className="text-green-500 mr-2 sm:mr-3"
                    size={20}
                  />
                  <h3 className="text-gray-600 font-medium text-sm sm:text-base">
                    Inventory Items
                  </h3>
                </div>
                <div className="mt-1 sm:mt-2">
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800">
                    1,278
                  </p>
                </div>
                <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-gray-100">
                  <span className="text-xs sm:text-sm text-gray-500">
                    Updated today
                  </span>
                </div>
              </div>
            </div>

            {/* Stock Value Card */}
            <div className="bg-white hover:bg-gray-100 transition-colors cursor-pointer duration-200 shadow-md rounded-xl hover:shadow-lg overflow-hidden border border-gray-200">
              <div className="p-4 sm:p-6">
                <div className="flex items-center mb-2 sm:mb-4">
                  <FaChartLine
                    className="text-purple-500 mr-2 sm:mr-3"
                    size={20}
                  />
                  <h3 className="text-gray-600 font-medium text-sm sm:text-base">
                    Stock Value
                  </h3>
                </div>
                <div className="mt-1 sm:mt-2">
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800">
                    824
                  </p>
                </div>
                <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-gray-100">
                  <span className="text-xs sm:text-sm text-gray-500">
                    Updated today
                  </span>
                </div>
              </div>
            </div>

            {/* === HARDWARE CARDS === */}

            {/* Tickets Unresolved Card */}
            <div className="bg-white hover:bg-gray-100 transition-colors cursor-pointer duration-200 shadow-md rounded-xl hover:shadow-lg overflow-hidden border border-gray-200">
              <div className="p-4 sm:p-6">
                <div className="flex items-center mb-2 sm:mb-4">
                  <FaTools className="text-red-500 mr-2 sm:mr-3" size={20} />
                  <h3 className="text-gray-600 font-medium text-sm sm:text-base">
                    Tickets Unresolved
                  </h3>
                </div>
                <div className="mt-1 sm:mt-2">
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800">
                    45
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
            <div className="bg-white hover:bg-gray-100 transition-colors cursor-pointer duration-200 shadow-md rounded-xl hover:shadow-lg overflow-hidden border border-gray-200">
              <div className="p-4 sm:p-6">
                <div className="flex items-center mb-2 sm:mb-4">
                  <FaSpinner
                    className="text-yellow-500 mr-2 sm:mr-3"
                    size={20}
                  />
                  <h3 className="text-gray-600 font-medium text-sm sm:text-base">
                    Tickets In Progress
                  </h3>
                </div>
                <div className="mt-1 sm:mt-2">
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800">
                    32
                  </p>
                </div>
                <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-gray-100">
                  <span className="text-xs sm:text-sm text-gray-500">
                    Updated today
                  </span>
                </div>
              </div>
            </div>

            {/* Tickets Resolved Card */}
            <div className="bg-white hover:bg-gray-100 transition-colors cursor-pointer duration-200 shadow-md rounded-xl hover:shadow-lg overflow-hidden border border-gray-200">
              <div className="p-4 sm:p-6">
                <div className="flex items-center mb-2 sm:mb-4">
                  <FaCheckCircle
                    className="text-green-500 mr-2 sm:mr-3"
                    size={20}
                  />
                  <h3 className="text-gray-600 font-medium text-sm sm:text-base">
                    Tickets Resolved
                  </h3>
                </div>
                <div className="mt-1 sm:mt-2">
                  <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800">
                    87
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {/* Inventory Status Bar Chart */}
            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md border border-gray-200">
              <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-2 sm:mb-4">
                Inventory Status
              </h3>
              <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={inventoryData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="count" fill="#3B82F6" name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stock Allocation Pie Chart */}
            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md border border-gray-200">
              <h3 className="text-base sm:text-lg font-medium text-gray-700 mb-2 sm:mb-4">
                Stock Allocation
              </h3>
              <div className="h-64 sm:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [`${value} units`, "Quantity"]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
