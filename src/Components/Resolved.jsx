import { Button, DatePicker, Input, Select, Table, Form, Modal } from "antd";
import React, { useState } from "react";
import {
  DownloadOutlined,
  FilterOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import { useQuery } from "@tanstack/react-query";
import api from "../utils/config";

const Resolved = () => {
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [filteredTickets, setFilteredTickets] = useState(null);
  const { data } = useQuery({
    queryKey: ["totalTicket"],
    queryFn: () => {
      return api.get("reports/workshop");
    },
  });

  const { data: department } = useQuery({
    queryKey: ["department"],
    queryFn: () => {
      return api.get("admin/departments");
    },
  });

  const TableData = data?.data?.tickets.filter((ticket) => ticket.dateResolved);
  console.log("Resolved tickets are: ", TableData);

  const tickets = filteredTickets || TableData || [];

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date.$d).toISOString().split("T")[0]; // 'YYYY-MM-DD'
  };

  const handleFinish = (values) => {
    //This is formatting the date to YYYY-MM-DD
    const filters = {
      startDate: values.startDate ? formatDate(values.startDate) : null,
      endDate: values.endDate ? formatDate(values.endDate) : null,
      issueType: values.issueType || null,
      department: values.department || null,
    };
    console.log("Filtering with:", filters);

    const params = new URLSearchParams();

    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);
    if (filters.issueType) params.append("issueType", filters.issueType);
    if (values.department) params.append("departmentId", values.department);

    const url = `http://localhost:3000/reports/workshop?${params.toString()}`;
    console.log("Fetching from:", url);

    api
      .get(url)
      .then((res) => {
        console.log("Filtered data:", res.data);
        setFilteredTickets(res.data.tickets);
      })
      .catch((err) => {
        console.error("Error fetching filtered data:", err);
      });

    setOpen(false);
    form.resetFields();
  };

  const handleCancel = () => {
    setOpen(false);
    form.resetFields();
  };
  const handleDownload = () => {
    const tickets = data?.data?.tickets;

    const cleanData = tickets
      .filter(
        (record) =>
          record.userName.toLowerCase().includes(searchText.toLowerCase()) ||
          record.brand.toLowerCase().includes(searchText.toLowerCase()) ||
          record.model.toLowerCase().includes(searchText.toLowerCase()) ||
          record.technicianReceivedName
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          record.technicianReturnedName
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          record.remarks.toLowerCase().includes(searchText.toLowerCase())
      )

      .map((item, index) => ({
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
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return (
          record.userName.toLowerCase().includes(searchText.toLowerCase()) ||
          record.brand.toLowerCase().includes(searchText.toLowerCase()) ||
          record.model.toLowerCase().includes(searchText.toLowerCase()) ||
          record.technicianReceivedName
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          record.technicianReturnedName
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          record.remarks.toLowerCase().includes(searchText.toLowerCase())
        );
      },
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
    {
      title: "Date Resolved",
      dataIndex: "dateResolved",
      key: "dateResolved",
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
    <div className=" px-[3rem] py-[2rem]">
      <div className="flex gap-2 justify-end">
        <Input
          placeholder="Search..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<SearchOutlined />}
          style={{ width: "200px" }}
        />
        <Button icon={<FilterOutlined />} onClick={() => setOpen(true)} />
        <Button icon={<DownloadOutlined />} onClick={handleDownload} />
      </div>
      <div className="pl-[6rem] pt-6">
        <Table dataSource={tickets} columns={columns} />
        <Modal title="Filter" open={open} onCancel={handleCancel} footer={null}>
          <Form form={form} layout="vertical" onFinish={handleFinish}>
            <Form.Item label="Start Date" name="startDate">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item label="End Date" name="endDate">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item label="Issue Type" name="issueType">
              <Select placeholder="Select issue type">
                <Option value="HARDWARE">HARDWARE</Option>
                <Option value="SOFTWARE">SOFTWARE</Option>
              </Select>
            </Form.Item>
            <Form.Item name="department" label="Select Department">
              <Select placeholder="Choose a department">
                {department?.data.map((dept) => (
                  <Option key={dept.id} value={dept.id}>
                    {dept.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" className="w-full">
                Submit
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default Resolved;
