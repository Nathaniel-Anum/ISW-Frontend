import { Outlet } from "react-router-dom";
import Layout from "./Layout";

const DLayout = () => {
  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#212121]">
      <Layout />
      <main className="min-h-screen pl-0 pt-[88px] md:pl-[280px]">
        <Outlet />
      </main>
    </div>
  );
};

export default DLayout;