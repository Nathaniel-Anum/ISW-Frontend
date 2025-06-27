import React, { useState } from "react";
import { FilterOutlined } from "@ant-design/icons";
import { Button, DatePicker, Form, Modal, Select, Spin, Table } from "antd";
import api from "../utils/config";
import * as XLSX from "xlsx";
import { useQuery } from "@tanstack/react-query";

const TechReport = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [form] = Form.useForm();

  const { data } = useQuery({
    queryKey: ["department"],
    queryFn: () => {
      return api.get("/admin/departments?includeUnits=true");
    },
  });

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date.$d).toISOString().split("T")[0]; // 'YYYY-MM-DD'
  };

  const onFinish = async (values) => {
    const { reportType, status, deviceType, issueType, departmentId } = values;
    const filters = {
      startDate: values.startDate ? formatDate(values.startDate) : null,
      endDate: values.endDate ? formatDate(values.endDate) : null,
    };
    console.log("Filtering with:", filters);
    const params = new URLSearchParams({ reportType });

    if (status) params.append("status", status);
    if (deviceType) params.append("deviceType", deviceType);
    if (issueType) params.append("issueType", issueType);
    if (departmentId) params.append("departmentId", departmentId);

    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    try {
      const response = await api.get(`/hardware/reports?${params.toString()}`);
      setSelectedReport(reportType);
      setReportData(response.data); //This will feed the table
      setOpen(false);
      form.resetFields();
    } catch (err) {
      console.error(err);
      setOpen(false);
      form.resetFields();
    }
  };
  const getColumns = () => {
    if (selectedReport === "maintenance_tickets") {
      return [
        {
          title: "Action Taken",
          dataIndex: "actionTaken",
          key: "actionTaken",
          render: (text) => (text ? text : "-"),
        },
        { title: "Brand", dataIndex: "brand", key: "brand" },
        { title: "Model", dataIndex: "model", key: "model" },
        {
          title: "Department",
          dataIndex: "departmentName",
          key: "departmentName",
        },
        {
          title: "Description",
          dataIndex: "description",
          key: "description",
        },
        {
          title: "Device Type",
          dataIndex: "deviceType",
          key: "deviceType",
        },
        {
          title: "Issue Type",
          dataIndex: "issueType",
          key: "issueType",
        },
        {
          title: "Priority",
          dataIndex: "priority",
          key: "priority",
        },
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
          title: "Ticket ID",
          dataIndex: "ticketId",
          key: "ticketId",
        },
        {
          title: "Unit Name",
          dataIndex: "unitName",
          key: "unitName",
        },
        {
          title: "User Name",
          dataIndex: "userName",
          key: "userName",
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
    }
  };

  const downloadExcel = () => {
    if (!reportData?.data?.length) return;

    let cleanData = [];

    if (selectedReport === "maintenance_tickets") {
      cleanData = reportData?.data.map((item, index) => ({
        No: index + 1,
        Item: item?.itItem?.model || "-",
        Supplier: item?.supplier?.name || "-",
        QuantityReceived: item?.quantityReceived || 0,
        DateReceived: item?.dateReceived
          ? new Date(item.dateReceived).toLocaleDateString()
          : "-",
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(cleanData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

    XLSX.writeFile(workbook, `${selectedReport || "report"}.xlsx`);
  };
  return (
    <div className="px-[3rem] py-[2rem]">
      <div className=" flex gap-2 justify-end">
        <Button
          // disabled={!reportData?.data?.length}
          icon={<FilterOutlined />}
          onClick={() => setOpen(true)}
        >
          Filter
        </Button>
        <Button
          type="primary"
          onClick={downloadExcel}
          disabled={!reportData?.data?.length}
        >
          Download
        </Button>
      </div>
      <div className="pl-[6rem] pt-6">
        {loading ? (
          <div className="flex justify-center items-center h-[300px]">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={getColumns()}
            dataSource={reportData?.data || []}
            rowKey={(record) => record.id || record.key}
          />
        )}
      </div>
      <Modal
        title="Filter"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
      >
        <Form form={form} onFinish={onFinish} layout="vertical">
          <Form.Item
            name="reportType"
            label="Report Type"
            rules={[{ required: true, message: "Select report type" }]}
          >
            <Select placeholder="Filter by" style={{ width: "100%" }}>
              <Option value="maintenance_tickets">Maintenance Ticket</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Start Date" name="startDate">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="End Date" name="endDate">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item label="Status" name="status">
            <Select placeholder="Status" allowClear style={{ width: "100%" }}>
              <Select.Option value="OPEN">OPEN</Select.Option>
              <Select.Option value="CLOSED">CLOSED</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Issue Type" name="issueType">
            <Select
              placeholder="Issue Type"
              allowClear
              style={{ width: "100%" }}
            >
              <Select.Option value="HARDWARE">HARDWARE</Select.Option>
              <Select.Option value="SOFTWARE">SOFTWARE</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Device Type" name="deviceType">
            <Select
              placeholder="Device Type"
              allowClear
              style={{ width: "100%" }}
            >
              <Select.Option value="LAPTOP">LAPTOP</Select.Option>
              <Select.Option value="DESKTOP">DESKTOP</Select.Option>
              <Select.Option value="PRINTER">PRINTER</Select.Option>
              <Select.Option value="OTHER">OTHER</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Department" name="departmentId">
            <Select
              placeholder="Select Department"
              allowClear
              style={{ width: "100%" }}
              options={data?.data.map((dept) => ({
                label: dept.name,
                value: dept.id,
              }))}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="w-full"
            >
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TechReport;
