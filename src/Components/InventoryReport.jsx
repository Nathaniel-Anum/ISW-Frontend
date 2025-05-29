import { useQuery } from "@tanstack/react-query";
import React from "react";
import api from "../utils/config";
import { Link } from "react-router-dom";
import { Spin} from "antd";


const InventoryReport = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => {
      return api.get("reports/inventory/device-age");
    },
  });
  const { data: devices, isLoading: loading } = useQuery({
    queryKey: ["deviceDetails"],
    queryFn: () => {
      return api.get("reports/inventory/device-details");
    },
  });
  console.log(devices?.data?.summary?.totalAssets);

  return (
    <div className="px-[13rem]  ">
      <div className="  p-6 flex gap-6 cursor-pointer ">
        <Link to="/dashboard/total-asset">
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
                    Total Assets
                  </h2>
                </div>

                <div className="space-y-2">
                  <p className="font-mono text-gray-700 text-[8rem] text-center ">
                    {isLoading ? (
                      <Spin />
                    ) : (
                      <div>{data?.data?.summary?.totalAssets}</div>
                    )}
                  </p>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-orange-200/20 via-orange-300/40 to-orange-200/20" />
            </div>
          </div>
        </Link>
        <Link to="/dashboard/total-devices">
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
                    Total Devices
                  </h2>
                </div>

                <div className="space-y-2">
                  <p className="font-mono text-gray-700 text-[8rem] text-center ">
                    {isLoading ? (
                      <Spin />
                    ) : (
                      <div>{devices?.data?.summary?.totalAssets}</div>
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
  );
};

export default InventoryReport;
