import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Table } from "antd";
import api from "../utils/config";

const ITDApproval = () => {
  const { data: approval } = useQuery({
    queryKey: ["approval"],
    queryFn: () => {
      return api.get("/itd/requisitions");
    },
  });

  console.log(approval);

  const columns = [
    // {
    //   title: "Requisition ID",
    //   dataIndex: "requisitionID",
    //   key: "requisitionID"
    // },
    // {
    //   title: "Staff Name",
    //   dataIndex: ["staff", "name"],
    //   key: "staffName"
    // },
    // {
    //   title: "Staff Email",
    //   dataIndex: ["staff", "email"],
    //   key: "staffEmail"
    // },
    {
      title: "Item Description",
      dataIndex: "itemDescription",
      key: "itemDescription"
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity"
    },
    {
      title: "Urgency",
      dataIndex: "urgency",
      key: "urgency"
    },
    {
      title: "Purpose",
      dataIndex: "purpose",
      key: "purpose"
    },
    {
      title: "Department",
      dataIndex: ["department", "name"],
      key: "department"
    },
    {
      title: "Room No",
      dataIndex: "roomNo",
      key: "roomNo"
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status"
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => new Date(text).toLocaleString()
    }
  ];
  return (
    <div className="px-[10rem]">
      <p>This is the ITD Approval page.</p>
      <Table dataSource={approval?.data || []} columns={columns} rowKey="id" />
    </div>
  );
};

export default ITDApproval;
