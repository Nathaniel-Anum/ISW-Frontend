import React from "react";
import { LuBadgeCheck, LuLockKeyhole, LuShieldCheck } from "react-icons/lu";
import logo from "/assets/undraw_term-sheet_70lo.svg";
import cocoa from "/assets/logo.png";

const trustPoints = [
  {
    icon: LuShieldCheck,
    title: "Secure access",
  },
  {
    icon: LuBadgeCheck,
    title: "Clear workflows",
  },
  {
    icon: LuLockKeyhole,
    title: "Protected recovery",
  },
];

const AuthLayout = ({ children, title, description }) => {
  return (
    <div className="auth-shell min-h-screen bg-[#F5F5F5] px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1400px] overflow-hidden rounded-2xl border border-[#E0E0E0] bg-white shadow-sm lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative overflow-hidden bg-[#1E1E1E] px-6 py-8 text-white sm:px-10 sm:py-10 lg:px-14 lg:py-14">
          <div className="relative z-10 flex h-full flex-col justify-between gap-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white/80">
                Enterprise Access Portal
              </div>

              <div className="mt-8 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white p-2">
                  <img className="h-10 w-10 object-contain" src={cocoa} alt="Ghana Cocoa Board Logo" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/50">Ghana Cocoa Board</p>
                  <h1 className="mt-1 max-w-md text-2xl font-bold leading-snug sm:text-3xl">Inventory access portal.</h1>
                </div>
              </div>

              <p className="mt-5 max-w-xl text-sm leading-7 text-white/60 sm:text-base">Sign in to continue.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {trustPoints.map(({ icon: Icon, title: pointTitle }) => (
                <div
                  key={pointTitle}
                  className="rounded-xl border border-white/10 bg-white/[0.06] p-4"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-base text-white">
                    <Icon />
                  </div>
                  <p className="mt-3 text-sm font-semibold">{pointTitle}</p>
                </div>
              ))}
            </div>

            <div className="relative mx-auto hidden w-full max-w-[580px] lg:block">
              <img
                className="relative z-10 w-full max-w-[580px] object-contain opacity-90"
                src={logo}
                alt="System illustration"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center bg-white px-4 py-8 sm:px-8 lg:px-10 xl:px-14">
          <div className="w-full max-w-[480px]">
            <div className="inline-flex items-center rounded-lg border border-[#FFEBEE] bg-[#FFF4F2] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#D32F2F]">
              Secure Sign In
            </div>

            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#9E9E9E]">Welcome back</p>
              <h2 className="mt-2 text-2xl font-bold text-[#212121]">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-[#9E9E9E]">
                {description ||
                  "Use your staff credentials to continue into the inventory and stores requisition system."}
              </p>
            </div>

            <div className="mt-7">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;