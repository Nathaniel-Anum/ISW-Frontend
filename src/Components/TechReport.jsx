import React, { useDeferredValue, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FilterOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, DatePicker, Drawer, Form, Input, Modal, Select, Spin, Table, Tag } from "antd";
import { toast } from "react-toastify";
import api from "../utils/config";
import { downloadApiFile } from "../utils/download";
import PageShell from "./ui/page-shell";

const { Option } = Select;

const formatDate = (date) => (date ? new Date(date).toLocaleString() : "-");

const DetailRow = ({ label, value }) => (
  <div className="border-b border-[#F1F1F1] py-3 last:border-0">
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">{label}</p>
    <p className="mt-1 text-sm text-[#212121] whitespace-pre-wrap">{value || "-"}</p>
  </div>
);

const TechReport = () => {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [submittedFilters, setSubmittedFilters] = useState({ reportType: "maintenance_tickets" });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedRow, setSelectedRow] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [form] = Form.useForm();
  const deferredSearch = useDeferredValue(searchText.trim());

  React.useEffect(() => {
    form.setFieldsValue({ reportType: "maintenance_tickets" });
  }, [form]);

  const { data: departmentsResponse } = useQuery({
    queryKey: ["department"],
    queryFn: () => api.get("/admin/departments?includeUnits=true"),
  });

  const { data: reportResponse, isLoading, isFetching: reportLoading } = useQuery({
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

  const toIsoDate = (date) => {
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
      ...(values.startDate ? { startDate: toIsoDate(values.startDate) } : {}),
      ...(values.endDate ? { endDate: toIsoDate(values.endDate) } : {}),
    });
    setOpen(false);
    form.resetFields();
  };

  const handleDownload = async () => {
    try {
      setExporting(true);
      await downloadApiFile(
        api,
        "/hardware/reports/export",
        {
          ...submittedFilters,
          ...(deferredSearch ? { search: deferredSearch } : {}),
        },
        "maintenance-report.csv"
      );
    } catch (error) {
      toast.error(error?.message || "Failed to export report");
    } finally {
      setExporting(false);
    }
  };

  const columns = [
    { title: "Ticket", dataIndex: "ticketId", key: "ticketId", render: (value) => <span className="font-semibold">{value}</span> },
    { title: "User", dataIndex: "userName", key: "userName" },
    {
      title: "Device",
      key: "device",
      render: (_, record) => `${record.brand || "-"} ${record.model || ""}`.trim(),
    },
    { title: "Department", dataIndex: "departmentName", key: "departmentName" },
    {
      title: "Status",
      key: "status",
      render: (_, record) =>
        record.dateResolved ? (
          <Tag className="rounded-full border-0 bg-[#ECFDF3] px-3 text-[#166534] font-semibold">Resolved</Tag>
        ) : (
          <Tag className="rounded-full border-0 bg-[#FFF7ED] px-3 text-[#C2410C] font-semibold">Open</Tag>
        ),
    },
    { title: "Technician", dataIndex: "technicianReceivedName", key: "technicianReceivedName" },
    {
      title: "Logged",
      dataIndex: "dateLogged",
      key: "dateLogged",
      render: (date) => (date ? new Date(date).toLocaleDateString() : "-"),
    },
  ];

  return (
    <PageShell
      eyebrow="Reporting Workspace"
      title="Maintenance Report"
      description="Review workshop jobs, resolution progress, and technician activity. Click a row for full details."
      loading={isLoading}
      actions={
        <>
          <Button icon={<FilterOutlined />} onClick={() => setOpen(true)}>
            Filter
          </Button>
          <Input
            placeholder="Search report"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            allowClear
            prefix={<SearchOutlined />}
            className="w-full md:w-[240px]"
          />
          <Button type="primary" onClick={handleDownload} loading={exporting} disabled={!reportRows.length}>
            Download
          </Button>
        </>
      }
    >
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#616161]">Workshop Output</p>
            <h3 className="text-xl font-bold text-[#212121]">Maintenance jobs</h3>
          </div>
          <span className="rounded-full bg-[#FFEBEE] px-3 py-1 text-xs font-semibold text-[#D32F2F]">
            Click a row for details
          </span>
        </div>
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={reportRows}
            rowKey={(record) => record.id || record.ticketId}
            loading={reportLoading}
            scroll={{ x: "max-content" }}
            tableLayout="fixed"
            onRow={(record) => ({
              onClick: () => setSelectedRow(record),
              className: "cursor-pointer",
            })}
            pagination={{
              current: currentPage,
              pageSize,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
              onChange: (page, nextPageSize) => {
                setCurrentPage(page);
                setPageSize(nextPageSize);
              },
            }}
          />
        )}
      </section>
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
      <Drawer
        open={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        title={selectedRow ? selectedRow.ticketId : "Ticket details"}
        width={480}
      >
        {selectedRow && (
          <div>
            <DetailRow label="User" value={selectedRow.userName} />
            <DetailRow label="Department" value={`${selectedRow.departmentName || "-"} ${selectedRow.unitName ? `• ${selectedRow.unitName}` : ""}`} />
            <DetailRow label="Device" value={`${selectedRow.brand || "-"} ${selectedRow.model || ""} (${selectedRow.deviceType || "-"})`} />
            <DetailRow label="Issue type" value={selectedRow.issueType} />
            <DetailRow label="Priority" value={selectedRow.priority} />
            <DetailRow label="Description" value={selectedRow.description} />
            <DetailRow label="Action taken" value={selectedRow.actionTaken} />
            <DetailRow label="Remarks" value={selectedRow.remarks} />
            <DetailRow label="Received by" value={selectedRow.technicianReceivedName} />
            <DetailRow label="Returned by" value={selectedRow.technicianReturnedName} />
            <DetailRow label="Date logged" value={formatDate(selectedRow.dateLogged)} />
            <DetailRow label="Date resolved" value={formatDate(selectedRow.dateResolved)} />
            <DetailRow label="LPO / Voucher" value={`${selectedRow.lpoReference || "-"} / ${selectedRow.voucherNumber || "-"}`} />
            <DetailRow label="Supplier" value={selectedRow.supplier?.name} />
          </div>
        )}
      </Drawer>
    </PageShell>
  );
};

export default TechReport;
