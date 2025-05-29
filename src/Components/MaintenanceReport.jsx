import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { IoLocationOutline } from "react-icons/io5";
import { LuSearch } from "react-icons/lu";
import { Link } from "react-router-dom";
import { Spin } from "antd"; 
import api from "../utils/config";

const MaintenanceReport = () => {
  const { data, isLoading} = useQuery({
    queryKey: ["totalTicket"],
    queryFn: () => {
      return api.get("reports/workshop");
    },
  });

 

  const resolved = data?.data?.tickets.filter((ticket) => ticket.dateResolved);
  console.log("Resolved tickets are: ", resolved);

  const unresolved = data?.data?.tickets.filter(
    (ticket) => !ticket.dateResolved
  );
  console.log("Unresolved tickets are: ", unresolved);
  return (
    <div className="px-[13rem]  ">
      {/* <p>Maintenance Page</p> */}
      <div className="max-h-[90%] py-[4rem] grid grid-cols-2 overflow-scroll no-scrollbar h-screen">
        <div className="  p-6 flex gap-6 cursor-pointer ">
          <Link to="/dashboard/total-ticket">
            <div className="w-full   max-w-2xl">
              <div
                onClick={() => {}}
                className="relative transition-all  bg-[#dac8b999] w-[14rem]  rounded-2xl p-8  hover:bg-[#5f4a387d] overflow-hidden"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 90% 10%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.2) 25%, rgba(249, 238, 218, 0) 50%)",
                }}
              >
                <div className="absolute  top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-orange-100/30 rounded-bl-full" />

                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl text-center text-gray-800">
                      Total Tickets
                    </h2>
                  </div>

                  <div className="space-y-2">
                    <p className="font-mono text-gray-700 text-[8rem] text-center ">
                    {isLoading ? (
      <Spin /> 
    ) : (
      <div>{data?.data?.summary?.totalTickets}</div>
    )}
                    </p>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-200/20 via-orange-300/40 to-orange-200/20" />
              </div>
            </div>
          </Link>
          <Link to="/dashboard/resolved">
            <div className="w-full max-w-2xl">
              <div
                onClick={() => {}}
                className="relative transition-all bg-[#dac8b999] w-[14rem]  rounded-2xl p-8  hover:bg-[#5f4a387d] overflow-hidden"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 90% 10%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.2) 25%, rgba(249, 238, 218, 0) 50%)",
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-orange-100/30 rounded-bl-full" />

                <div className="space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl text-center text-gray-800">
                      Resolved
                    </h2>
                  </div>

                  <div className="space-y-2">
                    <p className="font-mono text-gray-700 text-[8rem] text-center ">
                    {isLoading ? (
      <Spin /> 
    ) : (
      <div>{data?.data?.summary?.resolved}</div>
    )}
                    </p>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-200/20 via-orange-300/40 to-orange-200/20" />
              </div>
            </div>
          </Link>
          <Link to="/dashboard/unresolved">
            <div className="w-full   max-w-2xl">
              <div
                onClick={() => {}}
                className="relative transition-all bg-[#dac8b999] w-[14rem]  rounded-2xl p-8  hover:bg-[#5f4a387d]  overflow-hidden"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 90% 10%, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.2) 25%, rgba(249, 238, 218, 0) 50%)",
                }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-transparent to-orange-100/30 rounded-bl-full" />

                <div className="space-y-6">
                  <div className="space-y-2 ">
                    <h2 className="text-xl text-center  text-gray-800">
                      Unresolved
                    </h2>
                  </div>

                  <div className="space-y-2">
                    <p className="font-mono text-gray-700 text-center text-[8rem] ">
                    {isLoading ? (
      <Spin /> 
    ) : (
      <div>{data?.data?.summary?.unresolved}</div>
    )}
                    </p>
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-200/20 via-orange-300/40 to-orange-200/20" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceReport;
