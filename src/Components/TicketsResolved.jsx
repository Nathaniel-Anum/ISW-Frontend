import { useQuery } from "@tanstack/react-query";
import React from "react";
import api from "../utils/config";
import { Table } from "antd";

const TicketsResolved = () => {
  const { data: ticketsResolved } = useQuery({
    queryKey: ["ticketsResolved"],
    queryFn: () => api.get("/hardware/tickets?status=RESOLVED"),
  });

  const column = [
    {
      title: "User Name",
      dataIndex: "userName",
      key: "userName",
    },
    {
      title: "Unit Name",
      dataIndex: "unitName",
      key: "unitName",
    },
    {
      title: "Department",
      dataIndex: "departmentName",
      key: "departmentName",
    },
    {
      title: "Dept Location",
      dataIndex: "departmentLocation",
      key: "departmentLocation",
      render: (text) => (text ? text : "-"),
    },
    {
      title: "Action Taken",
      dataIndex: "actionTaken",
      key: "actionTaken",
      render: (text) => (text ? text : "-"),
    },

    // {
    //   title: "Description",
    //   dataIndex: "description",
    //   key: "description",
    // },
    {
      title: "Issue Type",
      dataIndex: "issueType",
      key: "issueType",
    },
    {
      title: "Device Type",
      dataIndex: "deviceType",
      key: "deviceType",
    },
    { title: "Brand", dataIndex: "brand", key: "brand" },
    { title: "Model", dataIndex: "model", key: "model" },
    // {
    //   title: "Priority",
    //   dataIndex: "priority",
    //   key: "priority",
    // },
    {
      title: "Remarks",
      dataIndex: "remarks",
      key: "remarks",
    },
    {
      title: "Received By",
      dataIndex: "technicianReceivedName",
      key: "technicianReceivedName",
    },
    {
      title: "Sent By",
      dataIndex: "technicianReturnedName",
      key: "technicianReturnedName",
    },

    {
      title: "Date Logged",
      dataIndex: "dateLogged",
      key: "dateLogged",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Date Resolved",
      dataIndex: "dateResolved",
      key: "dateResolved",
      render: (date) => (date ? new Date(date).toLocaleDateString() : "-"),
    },
  ];
  return (
    <div className="px-[3rem] py-[2rem]">
      <div className="pl-[6rem] pt-6">
        <Table columns={column} dataSource={ticketsResolved?.data || []} />
      </div>
    </div>
  );
};

export default TicketsResolved;
