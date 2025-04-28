import { Outlet } from "react-router-dom";
import Layout from "./Layout";

const DashboardLayoutbo = () => {
  return (
    <>
      <Layout />
      <Outlet />
    </>
  );
};
export default DashboardLayoutbo;
