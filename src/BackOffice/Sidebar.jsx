import React from "react";
import logo from "../../src/assets/logo.png";

import {
  AppConfigIcon,
  CalendarDates,
  Department,
  DesignationIcon,
  Districts,
  Division,
  Employees,
  FlowIcon,
  Permission,
  Regions,
  RolePermissions,
  Roles,
  SignatureIcon,
  Users,
} from "../../src/Components/icons/icons.components";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className=" fixed bg-[#4E67EB] grid grid-rows-2 gap-y-8 content-around h-full overflow-y-auto scrollbar-hide z-10 ">
      <div>
        <div className=" flex  items-center mx-4 mt-6 mb-10 ">
          <div className="w-16 h-10 -mt-2">
            <img src={logo} alt="Logo" />
          </div>
          <div className="w-[0.5px] h-5 bg-white mr-2 mt-4 "></div>
          <div className="text-white text-sm mt-[14px] font-bold">
            Ghana Cocoa Board
          </div>
        </div>
        <div className="bg-white border-b border-gray-300 h-[0.5px] w-[80%] mx-auto"></div>

        <nav className="mt-10 ">
          <ul className="overflow-y-auto">
            <li>
              <Link
                className="flex py-4 transition-colors ease-out duration-200 gap-4 items-center justify-start pl-[20%]  group hover:bg-white/20"
                to={"/backoffice/dashboard"}
              >
                <Employees />
                <span className="text-white text-sm font-medium group-hover:text-white">
                  Employees
                </span>
              </Link>
            </li>

            <li>
              <Link
                className="flex py-4 transition-colors ease-out duration-200 gap-4 items-center justify-start pl-[20%]  group hover:bg-accent"
                to={"/backoffice/dashboard/department"}
              >
                <Department />
                <span className="text-white text-sm font-medium group-hover:text-white">
                  Departments
                </span>
              </Link>
            </li>

            <li>
              <Link
                className="flex py-4 transition-colors ease-out duration-200 gap-4 items-center justify-start pl-[20%]  group hover:bg-accent"
                to={"/backoffice/dashboard/unit"}
              >
                <Division />
                <span className="text-white text-sm font-medium group-hover:text-white">
                  Units
                </span>
              </Link>
            </li>

            <li>
              <Link
                className="flex py-4 transition-colors ease-out duration-200 gap-4 items-center justify-start pl-[20%]  group hover:bg-accent"
                to={"/backoffice/dashboard/supplier"}
              >
                <Districts />
                <span className="text-white text-sm font-medium group-hover:text-white">
                  Suppliers
                </span>
              </Link>
            </li>
            <li>
              <Link
                className="flex py-4 transition-colors ease-out duration-200 gap-4 items-center justify-start pl-[20%]  group hover:bg-accent"
                to={"/backoffice/dashboard/it-items"}
              >
                <AppConfigIcon />
                <span className="text-white text-sm font-medium group-hover:text-white">
                  It Items
                </span>
              </Link>
            </li>

            {/* <li>
              <Link
                className="flex py-4 transition-colors ease-out duration-200 gap-4 items-center justify-start pl-[20%]  group hover:bg-accent"
                to={"regions"}
              >
                <Regions />
                <span className="text-white text-sm font-medium group-hover:text-white">
                  Regions
                </span>
              </Link>
            </li> */}

            <li>
              <Link
                className="flex py-4 transition-colors ease-out duration-200 gap-4 items-center justify-start pl-[20%]  group hover:bg-accent"
                to={"/backoffice/dashboard/roles"}
              >
                <Roles />
                <span className="text-white text-sm font-medium group-hover:text-white">
                  Roles
                </span>
              </Link>
            </li>

            <li>
              <Link
                className="flex py-4 transition-colors ease-out duration-200 gap-4 items-center justify-start pl-[20%]  group hover:bg-accent"
                to={"/backoffice/dashboard/permissions"}
              >
                <Permission />
                <span className="text-white text-sm font-medium group-hover:text-white">
                  Permissions
                </span>
              </Link>
            </li>

            <li>
              <Link
                className="flex py-4 transition-colors ease-out duration-200 gap-4 items-center justify-start pl-[20%]  group hover:bg-accent"
                to={"role_permissions"}
              >
                <RolePermissions />
                <span className="text-white text-sm font-medium group-hover:text-white">
                  Role Management
                </span>
              </Link>
            </li>

            {/* <li>
              <Link
                className="flex py-4 transition-colors ease-out duration-200 gap-4 items-center justify-start pl-[20%]  group hover:bg-accent"
                to={"signatures"}
              >
                <SignatureIcon />
                <span className="text-white text-sm font-medium group-hover:text-white">
                  Signatures
                </span>
              </Link>
            </li>

            <li>
              <Link
                className="flex py-4 transition-colors ease-out duration-200 gap-4 items-center justify-start pl-[20%]  group hover:bg-accent"
                to={"designations"}
              >
                <DesignationIcon />
                <span className="text-white text-sm font-medium group-hover:text-white">
                  Designations
                </span>
              </Link>
            </li> */}

            {/* <li>
              <Link
                className="flex py-4 transition-colors ease-out duration-200 gap-4 items-center justify-start pl-[20%]  group hover:bg-accent"
                to={"flows"}
              >
                <FlowIcon />
                <span className="text-white text-sm font-medium group-hover:text-white">
                  Flow Management
                </span>
              </Link>
            </li> */}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
