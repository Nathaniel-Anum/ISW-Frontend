import React, { useEffect } from "react";
import Layout from "./Layout";
import { Outlet } from "react-router-dom";

import api from "../utils/config";
import { useUser } from "../utils/userContext";

const Dashboard = () => {
  const { setUser } = useUser();
  useEffect(() => {
    api
      .get("/user/profile")
      .then((res) => {
        setUser(res.data);
        console.log("Profile:", res.data); // ✅ will only run once
      })
      .catch((err) => {
        console.error("Failed to fetch profile:", err);
      });
  }, []); // 👈 empty array means run only once on mount
  return (
    <div>
      <Layout />
      <Outlet />
    </div>
  );
};

export default Dashboard;
