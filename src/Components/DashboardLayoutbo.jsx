import Layout from "./Layout";
import OutletWithPageSkeleton from "./OutletWithPageSkeleton";

const DashboardLayoutbo = () => {
  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#212121]">
      <Layout />
      <main className="min-h-screen pl-0 pt-[88px] md:pl-[280px]">
        <OutletWithPageSkeleton />
      </main>
    </div>
  );
};
export default DashboardLayoutbo;
