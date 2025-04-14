import { Outlet } from "react-router-dom";
import Layout from "./Layout";

const DashboardLayout = () => {
  return (
    <>
      <Layout />
      <Outlet />
    </>
  );
};
export default DashboardLayout;
