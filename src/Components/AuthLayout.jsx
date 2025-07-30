import React from "react";

const AuthLayout = ({ children, title }) => {
  return (
    <div className="h-screen px-[18rem] grid lg:grid-cols-2 md:grid-cols-1 py-[10rem] w-screen gap-[150px] bg-[#E3E5E6]">
      {/* Left Column: Illustration */}
      <div className="flex flex-col justify-end h-[82%] gap-[20px]">
        <div>
          <img
            className="w-[620px] h-auto object-contain"
            src="/src/assets/undraw_term-sheet_70lo.svg"
            alt="Illustration"
          />
        </div>
      </div>

      {/* Right Column: Branding and Content */}
      <div className="bg-[#fff] text-black p-[15px] rounded-[10px] py-[50px]">
        <div>
          <p className="text-center font-semibold">WELCOME TO</p>
        </div>
        <div className=" flex items-center justify-center">
          <div className="flex items-center">
            <img
              className="w-[70px] h-auto"
              src="/src/assets/logo.9a18109e1c16584832d5.png"
              alt="Ghana Cocoa Board Logo"
            />
            <div className="h-[20px] w-[2px] bg-[#6C63FF] mr-2"></div>
            <div>
              <p className="font-bold">Ghana Cocoa Board</p>
              <p className="text-[9px] font-semibold">
                Poised to Maintain Premium Quality Cocoa
              </p>
            </div>
          </div>
        </div>
        <div>
          <p className="text-[14px]  text-center pb-[15px] font-semibold">
            {title}
          </p>
        </div>
        <div className="">{children}</div>
      </div>
    </div>
  );
};

export default AuthLayout;
