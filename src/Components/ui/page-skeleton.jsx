import { Skeleton } from "antd";

const CardSkeleton = () => (
  <div className="rounded-3xl border border-[#F1F1F1] bg-[#F9FAFB] px-5 py-5 sm:px-6 sm:py-6">
    <Skeleton active title={{ width: "45%" }} paragraph={{ rows: 2, width: ["70%", "40%"] }} />
  </div>
);

const PageSkeleton = ({ cards = 4 }) => (
  <div className="px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 xl:px-12">
    <section className="rounded-[24px] border border-[#E0E0E0] bg-white px-6 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:px-8 sm:py-7 md:rounded-[28px] md:px-10 md:py-8">
      <Skeleton
        active
        title={{ width: 280 }}
        paragraph={{ rows: 2, width: ["55%", "35%"] }}
      />
      <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: cards }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    </section>
    <div className="mt-6 rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] sm:mt-8 md:p-6">
      <Skeleton active title={{ width: 200 }} paragraph={{ rows: 8 }} />
    </div>
  </div>
);

export default PageSkeleton;
