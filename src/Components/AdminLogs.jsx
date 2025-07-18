import { Table, Spin } from "antd";
import React from "react";
import api from "../utils/config";
import { useQuery } from "@tanstack/react-query";

const AdminLogs = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["adminLogs"],
    queryFn: () => {
      return api.get("/admin/audit-logs");
    },
  });

  const skip = data?.data?.skip ?? 0;
  const take = data?.data?.take ?? 0;
  const total = data?.data?.total ?? 0;

  const columns = [
    {
      title: "Action Type",
      dataIndex: "actionType",
      key: "actionType",
      render: (text) =>
        text
          .toLowerCase()
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
    },
    {
      title: "Performed By",
      dataIndex: ["performedBy", "name"],
      key: "performedBy.name",
    },
    {
      title: "User Agent",
      dataIndex: "userAgent",
      key: "useragent",
    },
    {
      title: "Affected User",
      dataIndex: ["affectedUser", "name"],
      key: "affectedUser.name",
    },
    // {
    //   title: "Staff ID",
    //   dataIndex: ["affectedUser", "staffId"],
    //   key: "affectedUser.staffId",
    // },

    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) => {
        const date = new Date(createdAt);
        const options = { year: "numeric", month: "long", day: "numeric" };
        const formattedDate = date.toLocaleDateString(undefined, options);
        return formattedDate; // e.g. July 15, 2025
      },
    },
    {
      title: "Time",
      dataIndex: "createdAt",
      key: "createdAtTime",
      render: (createdAt) => {
        const date = new Date(createdAt);
        const formattedTime = date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false, // Set to true for AM/PM
        });
        return formattedTime; // e.g. 16:16
      },
    },
    {
      title: "IP Address",
      dataIndex: "ipAddress",
      key: "ipAddress",
    },
  ];

  return (
    <div className="px-[3rem] py-[2rem]">
      <div className="pl-[6rem] pt-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Spin tip="Loading data..." />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={data?.data?.data || []}
            rowKey="id"
            pagination={false}
            footer={() => (
              <div className="flex justify-between text-sm text-gray-600 px-4">
                <span>Skip: {skip}</span>
                <span>Take: {take}</span>
                <span>Total: {total}</span>
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
};

export default AdminLogs;
