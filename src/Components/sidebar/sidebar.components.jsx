import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';
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
} from '../icons/icons.components';
import { useAppStore } from '../../store/store';
import { PERMISSIONS, checkRole } from '../../utils/roles';

const Sidebar = () => {
  const currentUser = useAppStore((state) => state.currentUser);
  return (
    <div className=" fixed grid grid-rows-2 gap-y-8 content-around h-full overflow-y-auto scrollbar-hide z-10 ">
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
            {checkRole(currentUser, PERMISSIONS.GET_EMPLOYEES) && (
              <li>
                <Link
                  className="flex py-4 transition-colors ease-out duration-200 gap-4 items-center justify-start pl-[20%]  group hover:bg-accent"
                  to={'/employees'}
                >
                  <Employees />
                  <span className="text-white text-sm font-medium group-hover:text-white">
                    Employees
                  </span>
                </Link>
              </li>
            )}

            {checkRole(currentUser, PERMISSIONS.GET_DEPARTMENTS) && (
              <li>
                <Link
                  className="flex py-4 transition-colors ease-out duration-200 gap-4 items-center justify-start pl-[20%]  group hover:bg-accent"
                  to={'/departments'}
                >
                  <Department />
                  <span className="text-white text-sm font-medium group-hover:text-white">
                    Departments
                  </span>
                </Link>
              </li>
            )}

            {checkRole(currentUser, PERMISSIONS.GET_DIVISIONS) && (
              <li>
                <Link
                  className="flex py-4 transition-colors ease-out duration-200 gap-4 items-center justify-start pl-[20%]  group hover:bg-accent"
                  to={'divisions'}
                >
                  <Division />
                  <span className="text-white text-sm font-medium group-hover:text-white">
                    Divisions
                  </span>
                </Link>
              </li>
            )}

            {checkRole(currentUser, PERMISSIONS.GET_DISTRICTS) && (
              <li>
                <Link
                  className="flex py-4 transition-colors ease-out duration-200 gap-4 items-center justify-start pl-[20%]  group hover:bg-accent"
                  to={'districts'}
                >
                  <Districts />
                  <span className="text-white text-sm font-medium group-hover:text-white">
                    Districts
                  </span>
                </Link>
              </li>
            )}

            {checkRole(currentUser, PERMISSIONS.GET_REGIONS) && (
              <li>
                <Link
                  className="flex py-4 transition-colors ease-out duration-200 gap-4 items-center justify-start pl-[20%]  group hover:bg-accent"
                  to={'regions'}
                >
                  <Regions />
                  <span className="text-white text-sm font-medium group-hover:text-white">
                    Regions
                  </span>
                </Link>
              </li>
            )}

            {checkRole(currentUser, PERMISSIONS.GET_ROLES) && (
              <li>
                <Link
                  className="flex py-4 transition-colors ease-out duration-200 gap-4 items-center justify-start pl-[20%]  group hover:bg-accent"
                  to={'roles'}
                >
                  <Roles />
                  <span className="text-white text-sm font-medium group-hover:text-white">
                    Roles
                  </span>
                </Link>
              </li>
            )}

            {checkRole(currentUser, PERMISSIONS.GET_PERMISSIONS) && (
              <li>
                <Link
                  className="flex py-4 transition-colors ease-out duration-200 gap-4 items-center justify-start pl-[20%]  group hover:bg-accent"
                  to={'permissions'}
                >
                  <Permission />
                  <span className="text-white text-sm font-medium group-hover:text-white">
                    Permissions
                  </span>
                </Link>
              </li>
            )}

            {checkRole(currentUser, PERMISSIONS.GET_ROLE_PERMISSIONS) && (
              <li>
                <Link
                  className="flex py-4 transition-colors ease-out duration-200 gap-4 items-center justify-start pl-[20%]  group hover:bg-accent"
                  to={'role_permissions'}
                >
                  <RolePermissions />
                  <span className="text-white text-sm font-medium group-hover:text-white">
                    Role Management
                  </span>
                </Link>
              </li>
            )}

            {checkRole(currentUser, PERMISSIONS.GET_SIGNATURES) && (
              <li>
                <Link
                  className="flex py-4 transition-colors ease-out duration-200 gap-4 items-center justify-start pl-[20%]  group hover:bg-accent"
                  to={'signatures'}
                >
                  <SignatureIcon />
                  <span className="text-white text-sm font-medium group-hover:text-white">
                    Signatures
                  </span>
                </Link>
              </li>
            )}

            {checkRole(currentUser, PERMISSIONS.GET_DESIGNATIONS) && (
              <li>
                <Link
                  className="flex py-4 transition-colors ease-out duration-200 gap-4 items-center justify-start pl-[20%]  group hover:bg-accent"
                  to={'designations'}
                >
                  <DesignationIcon />
                  <span className="text-white text-sm font-medium group-hover:text-white">
                    Designations
                  </span>
                </Link>
              </li>
            )}

            {checkRole(currentUser, PERMISSIONS.GET_APPCONFIGS) && (
              <li>
                <Link
                  className="flex py-4 transition-colors ease-out duration-200 gap-4 items-center justify-start pl-[20%]  group hover:bg-accent"
                  to={'configurations'}
                >
                  <AppConfigIcon />
                  <span className="text-white text-sm font-medium group-hover:text-white">
                    App Configuration
                  </span>
                </Link>
              </li>
            )}

            {checkRole(currentUser, PERMISSIONS.GET_FLOWS) && (
              <li>
                <Link
                  className="flex py-4 transition-colors ease-out duration-200 gap-4 items-center justify-start pl-[20%]  group hover:bg-accent"
                  to={'flows'}
                >
                  <FlowIcon />
                  <span className="text-white text-sm font-medium group-hover:text-white">
                    Flow Management
                  </span>
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </div>

      {/* <div className="bg-white/80  h-[40vh] w-5/6 rounded-md justify-self mx-auto">
        <div className="py-5 px-2">
          <img src={leave} alt="Logo" className="w-full h-full" />
          <div className="h-2 w-full mb-6 -mt-1"></div>
        </div>
      </div> */}
    </div>
  );
};

export default Sidebar;
