import React from "react";

const PageShell = ({ eyebrow, title, description, stats = [], actions, children }) => {
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

        {stats.length > 0 ? (
          <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-[#F1F1F1] bg-[#F9FAFB] px-5 py-5 sm:px-6 sm:py-6"
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

      <div className="mt-6 sm:mt-8">{children}</div>
    </div>
  );
};

export default PageShell;