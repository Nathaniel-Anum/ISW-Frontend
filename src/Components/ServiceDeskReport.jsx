import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Table,
  Tag,
} from "antd";
import { FilterOutlined, SearchOutlined } from "@ant-design/icons";
import { useDeferredValue, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import PageShell from "./ui/page-shell";
import api from "../utils/config";
import { useUser } from "../utils/userContext";

const STATUS_STYLES = {
  NEW: "bg-[#EFF6FF] text-[#1D4ED8]",
  TRIAGED: "bg-[#FFF7ED] text-[#C2410C]",
  ASSIGNED: "bg-[#FFF7ED] text-[#C2410C]",
  IN_PROGRESS: "bg-[#FEF3C7] text-[#B45309]",
  WAITING_FOR_USER: "bg-[#F3E8FF] text-[#7C3AED]",
  RESOLVED: "bg-[#ECFDF3] text-[#166534]",
  CLOSED: "bg-[#ECFDF3] text-[#166534]",
  ESCALATED: "bg-[#FFEBEE] text-[#B71C1C]",
  CANCELLED: "bg-[#FFEBEE] text-[#B71C1C]",
  REOPENED: "bg-[#FFF7ED] text-[#C2410C]",
};

const PRIORITY_STYLES = {
  LOW: "bg-[#F0FDF4] text-[#166534]",
  MEDIUM: "bg-[#FEF3C7] text-[#92400E]",
  HIGH: "bg-[#FFF7ED] text-[#C2410C]",
  CRITICAL: "bg-[#FFEBEE] text-[#B71C1C]",
};

const REPORT_ROLES = ["service_desk_manager", "supervisor", "admin"];
const ACTIVE_STATUSES = ["NEW", "TRIAGED", "ASSIGNED", "IN_PROGRESS", "WAITING_FOR_USER", "ESCALATED", "REOPENED"];

const formatLabel = (value) => value?.replaceAll("_", " ") || "-";

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const ServiceDeskReport = () => {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [submittedFilters, setSubmittedFilters] = useState({ scope: "all" });
  const [form] = Form.useForm();
  const deferredSearch = useDeferredValue(searchText.trim());

  const canAccessReport = user?.roles?.some((role) => REPORT_ROLES.includes(role));

  const { data: categoriesResponse } = useQuery({
    queryKey: ["serviceDeskCategories"],
    queryFn: () => api.get("/service-desk/categories"),
    enabled: canAccessReport,
  });

  const { data: supportStaffResponse } = useQuery({
    queryKey: ["serviceDeskSupportStaff"],
    queryFn: () => api.get("/service-desk/support-staff"),
    enabled: canAccessReport,
  });

  const { data: ticketsResponse, isFetching } = useQuery({
    queryKey: ["serviceDeskReport", submittedFilters, deferredSearch],
    queryFn: () =>
      api.get("/service-desk/tickets", {
        params: {
          scope: "all",
          ...submittedFilters,
          ...(deferredSearch ? { search: deferredSearch } : {}),
        },
      }),
    enabled: canAccessReport,
  });

  const { data: satisfactionResponse } = useQuery({
    queryKey: ["sdSatisfaction"],
    queryFn: () => api.get("/service-desk/reports/satisfaction"),
    enabled: canAccessReport,
  });

  const satisfaction = satisfactionResponse?.data || null;

  const categories = categoriesResponse?.data || [];
  const supportStaff = supportStaffResponse?.data || [];
  const tickets = ticketsResponse?.data || [];

  const stats = useMemo(() => {
    const activeTickets = tickets.filter((ticket) => ACTIVE_STATUSES.includes(ticket.status)).length;
    const resolvedTickets = tickets.filter((ticket) => ticket.status === "RESOLVED" || ticket.status === "CLOSED").length;
    const escalatedTickets = tickets.filter((ticket) => ticket.status === "ESCALATED").length;

    return [
      { label: "Total Tickets", value: tickets.length, caption: "Tickets in the current report" },
      { label: "Active", value: activeTickets, caption: "Open operational workload" },
      { label: "Resolved / Closed", value: resolvedTickets, caption: "Tickets already completed" },
      { label: "Escalated", value: escalatedTickets, caption: "Tickets needing higher-tier attention" },
    ];
  }, [tickets]);

  const columns = [
    {
      title: "Ticket",
      dataIndex: "ticketNo",
      key: "ticketNo",
      render: (value) => <span className="font-semibold text-[#212121]">{value}</span>,
    },
    { title: "Subject", dataIndex: "subject", key: "subject", ellipsis: true },
    {
      title: "Reporter",
      key: "reporter",
      render: (_, record) => record.reporter?.name || record.reporter?.email || "Unknown",
    },
    {
      title: "Category",
      key: "category",
      render: (_, record) => record.category?.name || "General",
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: (priority) => (
        <Tag className={`rounded-full border-0 px-3 py-1 text-xs font-semibold ${PRIORITY_STYLES[priority] || "bg-[#F3F4F6] text-[#374151]"}`}>
          {formatLabel(priority)}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag className={`rounded-full border-0 px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status] || "bg-[#F3F4F6] text-[#374151]"}`}>
          {formatLabel(status)}
        </Tag>
      ),
    },
    {
      title: "Assigned Technician",
      key: "assignedTo",
      render: (_, record) => record.assignedTo?.name || record.assignedTo?.email || "Unassigned",
    },
    {
      title: "Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: formatDateTime,
    },
  ];

  const downloadExcel = () => {
    if (!tickets.length) return;

    const exportRows = tickets.map((ticket) => ({
      Ticket: ticket.ticketNo,
      Subject: ticket.subject,
      Reporter: ticket.reporter?.name || ticket.reporter?.email || "Unknown",
      Category: ticket.category?.name || "General",
      Priority: formatLabel(ticket.priority),
      Status: formatLabel(ticket.status),
      AssignedTechnician: ticket.assignedTo?.name || ticket.assignedTo?.email || "Unassigned",
      Department: ticket.department?.name || "-",
      Unit: ticket.unit?.name || "-",
      CreatedAt: formatDateTime(ticket.createdAt),
      UpdatedAt: formatDateTime(ticket.updatedAt),
      ResolvedAt: formatDateTime(ticket.resolvedAt),
      ClosedAt: formatDateTime(ticket.closedAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Service Desk Report");
    XLSX.writeFile(workbook, "service-desk-report.xlsx");
  };

  const onFinish = (values) => {
    setSubmittedFilters({
      scope: "all",
      ...(values.status ? { status: values.status } : {}),
      ...(values.priority ? { priority: values.priority } : {}),
      ...(values.categoryId ? { categoryId: values.categoryId } : {}),
      ...(values.assignedToId ? { assignedToId: values.assignedToId } : {}),
    });
    setOpen(false);
  };

  if (!canAccessReport) {
    return (
      <PageShell
        eyebrow="Reporting Workspace"
        title="Service Desk Report"
        description="This report is available to service desk managers and supervisors."
      >
        <section className="rounded-[28px] border border-[#E0E0E0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <Empty description="You do not have access to this report" />
        </section>
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Reporting Workspace"
      title="Service Desk Report"
      description="Monitor ticket workload, escalations, and resolution progress across the support queue."
      stats={stats}
      actions={
        <>
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search report"
            className="w-full md:w-[280px]"
          />
          <Button icon={<FilterOutlined />} onClick={() => setOpen(true)}>
            Filters
          </Button>
          <Button type="primary" onClick={downloadExcel} disabled={!tickets.length}>
            Export Excel
          </Button>
        </>
      }
    >
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#616161]">Operational Report</p>
            <h3 className="text-xl font-bold text-[#212121]">Service desk performance snapshot</h3>
          </div>
          <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#1D4ED8]">
            Managers and supervisors overview
          </span>
        </div>

        {tickets.length ? (
          <Table columns={columns} dataSource={tickets} rowKey="id" loading={isFetching} scroll={{ x: 1200 }} />
        ) : (
          <Empty description="No tickets match the current report filters" />
        )}
      </section>

      <Modal title="Filter Service Desk Report" open={open} onCancel={() => setOpen(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={submittedFilters}>
          <Form.Item name="status" label="Status">
            <Select allowClear placeholder="All statuses">
              {Object.keys(STATUS_STYLES).map((status) => (
                <Select.Option key={status} value={status}>
                  {formatLabel(status)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="Priority">
            <Select allowClear placeholder="All priorities">
              {Object.keys(PRIORITY_STYLES).map((priority) => (
                <Select.Option key={priority} value={priority}>
                  {formatLabel(priority)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="categoryId" label="Category">
            <Select allowClear placeholder="All categories">
              {categories.map((category) => (
                <Select.Option key={category.id} value={category.id}>
                  {category.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="assignedToId" label="Assigned Technician">
            <Select allowClear placeholder="All technicians">
              {supportStaff.map((staff) => (
                <Select.Option key={staff.id} value={staff.id}>
                  {staff.name || staff.email}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" block>
              Apply Filters
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {satisfaction && (
        <section className="rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#616161]">Satisfaction Analytics</p>
              <h3 className="text-xl font-bold text-[#212121]">Customer satisfaction overview</h3>
            </div>
            <span className="rounded-full bg-[#F5F3FF] px-3 py-1 text-xs font-semibold text-[#7C3AED]">
              Based on closed tickets
            </span>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Overall Avg", value: satisfaction.overallAvg != null ? `${satisfaction.overallAvg}/5` : "N/A", caption: "Mean satisfaction score" },
              { label: "Total Responses", value: satisfaction.totalResponses ?? 0, caption: "Ratings submitted" },
              { label: "By Technicians", value: satisfaction.byTechnician?.length ?? 0, caption: "Technicians rated" },
              { label: "By Categories", value: satisfaction.byCategory?.length ?? 0, caption: "Categories rated" },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-[#E0E0E0] bg-[#F9FAFB] p-4">
                <p className="text-xs font-semibold text-[#9E9E9E]">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-[#212121]">{card.value}</p>
                <p className="mt-0.5 text-xs text-[#757575]">{card.caption}</p>
              </div>
            ))}
          </div>

          {satisfaction.byTechnician?.length > 0 && (
            <div className="mb-6">
              <p className="mb-3 text-sm font-bold text-[#424242]">By Technician</p>
              <Table
                rowKey="technicianId"
                size="small"
                pagination={false}
                dataSource={satisfaction.byTechnician}
                columns={[
                  { title: "Technician", dataIndex: "name", key: "name", render: (v) => <span className="font-semibold">{v}</span> },
                  { title: "Avg Score", dataIndex: "avgScore", key: "avgScore", render: (v) => (
                    <span className={`font-bold ${v >= 4 ? "text-[#166534]" : v >= 3 ? "text-[#B45309]" : "text-[#B71C1C]"}`}>{v} / 5</span>
                  )},
                  { title: "Responses", dataIndex: "responseCount", key: "responseCount" },
                ]}
              />
            </div>
          )}

          {satisfaction.byCategory?.length > 0 && (
            <div>
              <p className="mb-3 text-sm font-bold text-[#424242]">By Category</p>
              <Table
                rowKey="categoryId"
                size="small"
                pagination={false}
                dataSource={satisfaction.byCategory}
                columns={[
                  { title: "Category", dataIndex: "categoryName", key: "categoryName" },
                  { title: "Avg Score", dataIndex: "avgScore", key: "avgScore", render: (v) => (
                    <span className={`font-bold ${v >= 4 ? "text-[#166534]" : v >= 3 ? "text-[#B45309]" : "text-[#B71C1C]"}`}>{v} / 5</span>
                  )},
                  { title: "Responses", dataIndex: "responseCount", key: "responseCount" },
                ]}
              />
            </div>
          )}
        </section>
      )}
    </PageShell>
  );
};

export default ServiceDeskReport;