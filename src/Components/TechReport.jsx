import React, { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FilterOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, DatePicker, Form, Input, Modal, Select, Spin, Table } from "antd";
import * as XLSX from "xlsx";
import api from "../utils/config";

const { Option } = Select;

const TechReport = () => {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [submittedFilters, setSubmittedFilters] = useState({ reportType: "maintenance_tickets" });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form] = Form.useForm();
  const deferredSearch = useDeferredValue(searchText.trim());

  React.useEffect(() => {
    form.setFieldsValue({ reportType: "maintenance_tickets" });
  }, [form]);

  const { data: departmentsResponse } = useQuery({
    queryKey: ["department"],
    queryFn: () => api.get("/admin/departments?includeUnits=true"),
  });

  const { data: reportResponse, isFetching: reportLoading } = useQuery({
    queryKey: ["techReport", submittedFilters, deferredSearch],
    queryFn: () =>
      api.get("/hardware/reports", {
        params: {
          ...submittedFilters,
          ...(deferredSearch ? { search: deferredSearch } : {}),
        },
      }),
  });

  const reportRows = reportResponse?.data?.data || [];
  const hasReport = true;

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date.$d).toISOString().split("T")[0];
  };

  const handleSubmit = (values) => {
    setSearchText("");
    setSubmittedFilters({
      reportType: values.reportType,
      ...(values.status ? { status: values.status } : {}),
      ...(values.deviceType ? { deviceType: values.deviceType } : {}),
      ...(values.issueType ? { issueType: values.issueType } : {}),
      ...(values.departmentId ? { departmentId: values.departmentId } : {}),
      ...(values.startDate ? { startDate: formatDate(values.startDate) } : {}),
      ...(values.endDate ? { endDate: formatDate(values.endDate) } : {}),
    });
    setOpen(false);
    form.resetFields();
  };

  const handleDownload = () => {
    if (!reportRows.length) return;

    const cleanData = reportRows.map((item, index) => ({
      No: index + 1,
      UserName: item?.userName || "-",
      UnitName: item?.unitName || "-",
      Department: item?.departmentName || "-",
      ActionTaken: item?.actionTaken || "-",
      IssueType: item?.issueType || "-",
      DeviceType: item?.deviceType || "-",
      Brand: item?.brand || "-",
      Model: item?.model || "-",
      Remarks: item?.remarks || "-",
      ReceivedBy: item?.technicianReceivedName || "-",
      SentBy: item?.technicianReturnedName || "-",
      DateLogged: item?.dateLogged ? new Date(item.dateLogged).toLocaleDateString() : "-",
      DateResolved: item?.dateResolved ? new Date(item.dateResolved).toLocaleDateString() : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(cleanData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, "maintenance_tickets.xlsx");
  };

  const columns = [
    { title: "No", key: "index", render: (_text, _record, index) => (currentPage - 1) * pageSize + index + 1 },
    { title: "User Name", dataIndex: "userName", key: "userName" },
    { title: "Unit Name", dataIndex: "unitName", key: "unitName" },
    { title: "Department", dataIndex: "departmentName", key: "departmentName" },
    { title: "Action Taken", dataIndex: "actionTaken", key: "actionTaken", render: (text) => text || "-" },
    { title: "Issue Type", dataIndex: "issueType", key: "issueType" },
    { title: "Device Type", dataIndex: "deviceType", key: "deviceType" },
    { title: "Brand", dataIndex: "brand", key: "brand" },
    { title: "Model", dataIndex: "model", key: "model" },
    { title: "Remarks", dataIndex: "remarks", key: "remarks" },
    { title: "Received By", dataIndex: "technicianReceivedName", key: "technicianReceivedName" },
    { title: "Sent By", dataIndex: "technicianReturnedName", key: "technicianReturnedName" },
    { title: "Date Logged", dataIndex: "dateLogged", key: "dateLogged", render: (date) => new Date(date).toLocaleDateString() },
    { title: "Date Resolved", dataIndex: "dateResolved", key: "dateResolved", render: (date) => (date ? new Date(date).toLocaleDateString() : "-") },
  ];

  return (
    <div className="px-[3rem] py-[2rem]">
      <div className="px-[7rem] flex gap-2">
        <Button icon={<FilterOutlined />} onClick={() => setOpen(true)}>
          Filter
        </Button>
        <Input
          disabled={!hasReport}
          placeholder="Search..."
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          prefix={<SearchOutlined />}
          style={{ width: "200px" }}
        />
        <Button type="primary" onClick={handleDownload} disabled={!reportRows.length}>
          Download
        </Button>
      </div>
      <div className="pl-[6rem] pt-6">
        {reportLoading ? (
          <div className="flex justify-center items-center h-[300px]">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={hasReport ? columns : []}
            dataSource={reportRows}
            rowKey={(record) => record.id || record.ticketId}
            pagination={{
              current: currentPage,
              pageSize,
              onChange: (page, nextPageSize) => {
                setCurrentPage(page);
                setPageSize(nextPageSize);
              },
            }}
          />
        )}
      </div>
      <Modal title="Filter" open={open} onCancel={() => setOpen(false)} footer={null}>
        <div className="max-h-[39rem] overflow-y-auto pr-2 no-scrollbar">
          <Form form={form} onFinish={handleSubmit} layout="vertical">
            <Form.Item name="reportType" label="Report Type" rules={[{ required: true, message: "Select report type" }]}>
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
                <Select.Option value="RESOLVED">RESOLVED</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Issue Type" name="issueType">
              <Select placeholder="Issue Type" allowClear style={{ width: "100%" }}>
                <Select.Option value="HARDWARE">HARDWARE</Select.Option>
                <Select.Option value="SOFTWARE">SOFTWARE</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Device Type" name="deviceType">
              <Select placeholder="Device Type" allowClear style={{ width: "100%" }}>
                <Select.Option value="LAPTOP">LAPTOP</Select.Option>
                <Select.Option value="DESKTOP">DESKTOP</Select.Option>
                <Select.Option value="PRINTER">PRINTER</Select.Option>
                <Select.Option value="OTHER">OTHER</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Department" name="departmentId">
              <Select placeholder="Select Department" allowClear style={{ width: "100%" }} options={departmentsResponse?.data?.map((dept) => ({ label: dept.name, value: dept.id }))} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={reportLoading} className="w-full">
                Submit
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default TechReport;