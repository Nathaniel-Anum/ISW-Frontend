import React from "react";
import { Skeleton } from "antd";

const PageShell = ({ eyebrow, title, description, stats = [], actions, loading = false, children }) => {
  const skeletonCount = Math.max(stats.length, loading ? 4 : 0);

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 xl:px-12">
      <section className="rounded-[24px] border border-[#E0E0E0] bg-white px-6 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:px-8 sm:py-7 md:rounded-[28px] md:px-10 md:py-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#616161]">
              {eyebrow}
            </p>
            <h2 className="mt-3 text-2xl font-bold leading-tight text-[#212121] sm:text-3xl md:text-4xl">
              {title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#616161] md:text-base md:leading-7">
              {description}
            </p>
          </div>

          {actions ? (
            <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center xl:w-auto xl:justify-end">
              {actions}
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: skeletonCount || 4 }).map((_, index) => (
              <div key={index} className="rounded-3xl border border-[#F1F1F1] bg-[#F9FAFB] px-5 py-5 sm:px-6 sm:py-6">
                <Skeleton active title={{ width: "50%" }} paragraph={{ rows: 2, width: ["70%", "40%"] }} />
              </div>
            ))}
          </div>
        ) : stats.length > 0 ? (
          <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                onClick={stat.onClick}
                className={`rounded-3xl border px-5 py-5 sm:px-6 sm:py-6 transition-all ${
                  stat.active
                    ? "border-[#D32F2F] bg-[#FFF7F7] shadow-sm cursor-pointer"
                    : stat.onClick
                    ? "border-[#F1F1F1] bg-[#F9FAFB] cursor-pointer hover:border-[#D32F2F] hover:bg-[#FFF7F7]"
                    : "border-[#F1F1F1] bg-[#F9FAFB]"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#616161]">
                  {stat.label}
                </p>
                <p className="mt-3 text-2xl font-bold text-[#212121] sm:text-3xl">{stat.value}</p>
                {stat.caption ? (
                  <p className="mt-1 text-sm text-[#616161]">{stat.caption}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <div className="mt-6 sm:mt-8">
        {loading ? (
          <div className="rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
            <Skeleton active title={{ width: 200 }} paragraph={{ rows: 8 }} />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default PageShell;
