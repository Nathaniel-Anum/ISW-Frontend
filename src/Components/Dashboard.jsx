import React from "react";
import Layout from "./Layout";
import { Outlet } from "react-router-dom";

const Dashboard = () => {
  return (
    <div>
      <Layout />
      <Outlet/>
    </div>
  );
};

export default Dashboard;
