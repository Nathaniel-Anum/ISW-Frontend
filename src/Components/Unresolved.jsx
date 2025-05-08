import { Button, Input, Table } from "antd";
import React from "react";
import {
  DownloadOutlined,
  FilterOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import { useQuery } from "@tanstack/react-query";
import api from "../utils/config";

const Unresolved = () => {
  const { data } = useQuery({
    queryKey: ["totalTicket"],
    queryFn: () => {
      return api.get("reports/workshop");
    },
  });

  const TableData = data?.data?.tickets.filter(
    (ticket) => !ticket.dateResolved
  );
  console.log("Resolved tickets are: ", TableData);

  const handleDownload = () => {
    const tickets = data?.data?.tickets;

    const cleanData = tickets.map((item, index) => ({
      No: index + 1,
      TicketID: item.ticketId,
      User: item.userName,
      Priority: item.priority,
      IssueType: item.issueType,
      Brand: item.brand,
      Model: item.model,
      ReceivedBy: item.technicianReceivedName,
      ReturnedBy: item.technicianReturnedName,
      ActionTaken: item.actionTaken || "-",
      Remarks: item.remarks || "-",
      DateLogged: item.dateLogged
        ? new Date(item.dateLogged).toLocaleDateString()
        : "-",
      DateResolved: item.dateResolved
        ? new Date(item.dateResolved).toLocaleDateString()
        : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(cleanData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");

    XLSX.writeFile(workbook, "AllTickets.xlsx");
  };
  const columns = [
    {
      title: "No.",
      key: "index",
      render: (text, record, index) => index + 1,
    },
    {
      title: "Ticket ID",
      dataIndex: "ticketId",
    },
    {
      title: "Brand",
      dataIndex: "brand",
    },
    {
      title: "Model",
      dataIndex: "model",
    },
    {
      title: "User Name",
      dataIndex: "userName",
    },
    {
      title: "Issue Type",
      dataIndex: "issueType",
    },
    {
      title: "Received By",
      dataIndex: "technicianReceivedName",
    },
    {
      title: "Returned By",
      dataIndex: "technicianReturnedName",
    },
    {
      title: "Action Taken",
      dataIndex: "actionTaken",
      render: (value) => (value ? value : "-"),
    },
    {
      title: "Remarks",
      dataIndex: "remarks",
    },
    {
      title: "Date Logged",
      dataIndex: "dateLogged",
      key: "dateLogged",
      render: (value) =>
        value
          ? new Date(value).toLocaleString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })
          : "-",
    },
  ];
  return (
    <div>
      <div className=" py-[2rem]">
        <div className="flex justify-end items-center gap-2 pr-[4.4rem] mb-4">
          <Input
            placeholder="Search..."
            onChange={() => {}}
            prefix={<SearchOutlined />}
            style={{ width: "200px" }}
          />
          <Button icon={<FilterOutlined />} onClick={() => {}} />
          <Button icon={<DownloadOutlined />} onClick={handleDownload} />
        </div>
        <div className="flex justify-center px-[8.9rem]">
          <Table dataSource={TableData || []} columns={columns} />
        </div>
      </div>
    </div>
  );
};

export default Unresolved;
