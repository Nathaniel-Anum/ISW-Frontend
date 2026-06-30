import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  DatePicker,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Table,
  Tag,
  Tooltip,
} from "antd";
import { FilterOutlined, SearchOutlined } from "@ant-design/icons";
import { useDeferredValue, useMemo, useState } from "react";
import dayjs from "dayjs";
import { LuPencil, LuShieldAlert, LuStar } from "react-icons/lu";
import { toast } from "react-toastify";
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
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [slaOpen, setSlaOpen] = useState(false);
  const [editingSla, setEditingSla] = useState(null);
  const [slaForm] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [submittedFilters, setSubmittedFilters] = useState({ scope: "all" });
  const [cardFilter, setCardFilter] = useState(null);
  const [form] = Form.useForm();
  const deferredSearch = useDeferredValue(searchText.trim());

  const canAccessReport = user?.roles?.some((role) => REPORT_ROLES.includes(role));
  const canManageSLA = user?.roles?.some((r) => ["service_desk_manager", "admin"].includes(r));

  const { data: slaConfigsResponse } = useQuery({
    queryKey: ["sdSLAConfigs"],
    queryFn: () => api.get("/service-desk/sla-configs"),
    enabled: canAccessReport,
  });
  const slaConfigs = slaConfigsResponse?.data || [];

  const updateSLAConfig = useMutation({
    mutationFn: ({ priority, values }) => api.patch(`/service-desk/sla-configs/${priority}`, values),
    onSuccess: () => {
      toast.success("SLA threshold updated");
      queryClient.invalidateQueries({ queryKey: ["sdSLAConfigs"] });
      setSlaOpen(false);
      setEditingSla(null);
      slaForm.resetFields();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to update SLA threshold");
    },
  });

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
    const now = new Date();
    const TERMINAL = ["RESOLVED", "CLOSED", "CANCELLED"];
    const activeTickets = tickets.filter((ticket) => ACTIVE_STATUSES.includes(ticket.status));
    const resolvedTickets = tickets.filter((ticket) => ticket.status === "RESOLVED" || ticket.status === "CLOSED");
    const escalatedTickets = tickets.filter((ticket) => ticket.status === "ESCALATED");
    const slaBreached = tickets.filter((ticket) => ticket.dueAt && !TERMINAL.includes(ticket.status) && new Date(ticket.dueAt) < now);
    const toggleFilter = (key) => setCardFilter((prev) => (prev === key ? null : key));

    return [
      { label: "Total Tickets", value: tickets.length, caption: "Tickets in the current report", active: cardFilter === null, onClick: () => setCardFilter(null) },
      { label: "Active", value: activeTickets.length, caption: "Open operational workload", active: cardFilter === "active", onClick: () => toggleFilter("active") },
      { label: "Resolved / Closed", value: resolvedTickets.length, caption: "Tickets already completed", active: cardFilter === "resolved", onClick: () => toggleFilter("resolved") },
      { label: "Escalated", value: escalatedTickets.length, caption: "Tickets needing higher-tier attention", active: cardFilter === "escalated", onClick: () => toggleFilter("escalated") },
      { label: "SLA Breached", value: slaBreached.length, caption: "Open tickets past their resolution deadline", active: cardFilter === "slaBreached", onClick: () => toggleFilter("slaBreached") },
    ];
  }, [tickets, cardFilter]);

  const tableData = useMemo(() => {
    const now = new Date();
    const TERMINAL = ["RESOLVED", "CLOSED", "CANCELLED"];
    if (cardFilter === "active") return tickets.filter((ticket) => ACTIVE_STATUSES.includes(ticket.status));
    if (cardFilter === "resolved") return tickets.filter((ticket) => ticket.status === "RESOLVED" || ticket.status === "CLOSED");
    if (cardFilter === "escalated") return tickets.filter((ticket) => ticket.status === "ESCALATED");
    if (cardFilter === "slaBreached") {
      return tickets.filter((ticket) => ticket.dueAt && !TERMINAL.includes(ticket.status) && new Date(ticket.dueAt) < now);
    }
    return tickets;
  }, [tickets, cardFilter]);

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
    {
      title: "SLA Due",
      dataIndex: "dueAt",
      key: "dueAt",
      render: (val, record) => {
        if (!val) return <span className="text-[#9E9E9E]">—</span>;
        const TERMINAL = ["RESOLVED", "CLOSED", "CANCELLED"];
        const breached = !TERMINAL.includes(record.status) && new Date(val) < new Date();
        return (
          <span className={`flex items-center gap-1 text-xs font-semibold ${breached ? "text-[#B71C1C]" : "text-[#166534]"}`}>
            {breached && <LuShieldAlert size={13} />}
            {dayjs(val).format("DD MMM YYYY HH:mm")}
          </span>
        );
      },
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
    const [dateFrom, dateTo] = values.dateRange ?? [];
    setSubmittedFilters({
      scope: "all",
      ...(values.status ? { status: values.status } : {}),
      ...(values.priority ? { priority: values.priority } : {}),
      ...(values.categoryId ? { categoryId: values.categoryId } : {}),
      ...(values.assignedToId ? { assignedToId: values.assignedToId } : {}),
      ...(dateFrom ? { dateFrom: dateFrom.startOf("day").toISOString() } : {}),
      ...(dateTo ? { dateTo: dateTo.endOf("day").toISOString() } : {}),
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
          {canManageSLA && (
            <Tooltip title="Manage SLA thresholds">
              <Button icon={<LuShieldAlert size={14} />} onClick={() => setSlaOpen(true)}>
                SLA Thresholds
              </Button>
            </Tooltip>
          )}
          <Button type="primary" onClick={downloadExcel} disabled={!tickets.length}>
            Export Excel
          </Button>
        </>
      }
    >
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#616161]">Operational Report</p>
            <h3 className="text-xl font-bold text-[#212121]">Service desk performance snapshot</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {submittedFilters.dateFrom && submittedFilters.dateTo && (
              <span className="rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-semibold text-[#92400E]">
                {dayjs(submittedFilters.dateFrom).format("DD MMM YYYY")} — {dayjs(submittedFilters.dateTo).format("DD MMM YYYY")}
              </span>
            )}
            <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#1D4ED8]">
              Managers and supervisors overview
            </span>
          </div>
        </div>

        {tableData.length ? (
          <Table columns={columns} dataSource={tableData} rowKey="id" loading={isFetching} scroll={{ x: 1200 }} />
        ) : (
          <Empty description="No tickets match the current report filters" />
        )}
      </section>

      <Modal title="Filter Service Desk Report" open={open} onCancel={() => setOpen(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={submittedFilters}>
          <Form.Item name="dateRange" label="Date Range (Created At)">
            <DatePicker.RangePicker
              className="w-full"
              disabledDate={(current) => current && current.isAfter(dayjs().endOf("day"))}
              format="DD MMM YYYY"
            />
          </Form.Item>
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
        <section className="mt-6 rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
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
              {
                label: "Overall Avg",
                value: satisfaction.overallAvg != null ? (
                  <span className="flex items-center gap-1">
                    <LuStar className="text-[#F59E0B]" />
                    <span>{satisfaction.overallAvg} / 5</span>
                  </span>
                ) : "N/A",
                caption: "Mean satisfaction score",
              },
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
                  {
                    title: "Avg Score", dataIndex: "avgRating", key: "avgRating",
                    render: (v) => (
                      <span className={`flex items-center gap-1 font-bold ${v >= 4 ? "text-[#166534]" : v >= 3 ? "text-[#B45309]" : "text-[#B71C1C]"}`}>
                        {"★".repeat(Math.round(v ?? 0))}{"☆".repeat(5 - Math.round(v ?? 0))}
                        <span className="ml-1">{v} / 5</span>
                      </span>
                    ),
                  },
                  { title: "Responses", dataIndex: "responseCount", key: "responseCount" },
                ]}
              />
            </div>
          )}

          {satisfaction.byCategory?.length > 0 && (
            <div className="mb-6">
              <p className="mb-3 text-sm font-bold text-[#424242]">By Category</p>
              <Table
                rowKey="name"
                size="small"
                pagination={false}
                dataSource={satisfaction.byCategory}
                columns={[
                  { title: "Category", dataIndex: "name", key: "name" },
                  {
                    title: "Avg Score", dataIndex: "avgRating", key: "avgRating",
                    render: (v) => (
                      <span className={`flex items-center gap-1 font-bold ${v >= 4 ? "text-[#166534]" : v >= 3 ? "text-[#B45309]" : "text-[#B71C1C]"}`}>
                        {"★".repeat(Math.round(v ?? 0))}{"☆".repeat(5 - Math.round(v ?? 0))}
                        <span className="ml-1">{v} / 5</span>
                      </span>
                    ),
                  },
                  { title: "Responses", dataIndex: "responseCount", key: "responseCount" },
                ]}
              />
            </div>
          )}

          {satisfaction.byReporter?.length > 0 && (
            <div>
              <p className="mb-3 text-sm font-bold text-[#424242]">By User (Reporter)</p>
              <Table
                rowKey="reporterId"
                size="small"
                pagination={{ pageSize: 8 }}
                dataSource={satisfaction.byReporter}
                expandable={{
                  expandedRowRender: (record) => (
                    <div className="pl-4 py-2 space-y-2">
                      {record.ratings?.map((r) => (
                        <div key={r.id || r.ticketId || r.ticketNo} className="flex flex-wrap items-start gap-x-3 gap-y-1 text-sm">
                          <span className="font-semibold text-[#212121] shrink-0">{r.ticketNo}</span>
                          <span className="text-[#616161] flex-1">{r.subject}</span>
                          <span className={`font-bold shrink-0 ${r.rating >= 4 ? "text-[#166534]" : r.rating >= 3 ? "text-[#B45309]" : "text-[#B71C1C]"}`}>
                            {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} {r.rating}/5
                          </span>
                          {r.feedback && (
                            <span className="italic text-[#757575] w-full pl-0">"{r.feedback}"</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ),
                }}
                columns={[
                  {
                    title: "User",
                    key: "name",
                    render: (_, r) => (
                      <div>
                        <p className="font-semibold text-[#212121]">{r.name}</p>
                        {r.staffId && <p className="text-xs text-[#9E9E9E]">{r.staffId}</p>}
                      </div>
                    ),
                  },
                  {
                    title: "Avg Rating", dataIndex: "avgRating", key: "avgRating",
                    render: (v) => (
                      <span className={`flex items-center gap-1 font-bold ${v >= 4 ? "text-[#166534]" : v >= 3 ? "text-[#B45309]" : "text-[#B71C1C]"}`}>
                        {"★".repeat(Math.round(v ?? 0))}{"☆".repeat(5 - Math.round(v ?? 0))}
                        <span className="ml-1">{v} / 5</span>
                      </span>
                    ),
                  },
                  { title: "Submissions", dataIndex: "responseCount", key: "responseCount" },
                ]}
              />
            </div>
          )}
        </section>
      )}

      {/* SLA Thresholds inline section */}
      {canManageSLA && (
        <section className="rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#616161]">SLA Management</p>
              <h3 className="text-xl font-bold text-[#212121]">Resolution SLA Thresholds</h3>
            </div>
          </div>
          <Table
            size="small"
            dataSource={slaConfigs}
            rowKey="priority"
            pagination={false}
            columns={[
              {
                title: "Priority",
                dataIndex: "priority",
                key: "priority",
                render: (v) => (
                  <Tag className={`rounded-full border-0 px-3 py-1 text-xs font-semibold ${
                    v === "CRITICAL" ? "bg-[#FEE2E2] text-[#B91C1C]"
                    : v === "HIGH" ? "bg-[#FEF3C7] text-[#B45309]"
                    : v === "MEDIUM" ? "bg-[#EFF6FF] text-[#1D4ED8]"
                    : "bg-[#F3F4F6] text-[#374151]"
                  }`}>{v}</Tag>
                ),
              },
              {
                title: "First Response",
                dataIndex: "firstResponseHours",
                key: "firstResponseHours",
                render: (v) => `${v}h`,
              },
              {
                title: "Resolution",
                dataIndex: "resolutionHours",
                key: "resolutionHours",
                render: (v) => `${v}h`,
              },
              {
                title: "Actions",
                key: "actions",
                render: (_, row) => (
                  <Button
                    size="small"
                    icon={<LuPencil size={13} />}
                    onClick={() => {
                      setEditingSla(row);
                      slaForm.setFieldsValue({
                        firstResponseHours: row.firstResponseHours,
                        resolutionHours: row.resolutionHours,
                      });
                      setSlaOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                ),
              },
            ]}
          />
        </section>
      )}

      {/* SLA Edit Modal */}
      <Modal
        open={slaOpen}
        title={editingSla ? `Edit SLA — ${editingSla.priority}` : "Edit SLA"}
        onCancel={() => { setSlaOpen(false); slaForm.resetFields(); setEditingSla(null); }}
        onOk={() => slaForm.submit()}
        confirmLoading={updateSLAConfig.isPending}
        okText="Save"
      >
        <Form
          form={slaForm}
          layout="vertical"
          onFinish={(values) => {
            if (!editingSla?.priority) {
              toast.error("Unable to update SLA. Missing priority.");
              return;
            }
            updateSLAConfig.mutate({ priority: editingSla.priority, values });
          }}
        >
          <Form.Item
            name="firstResponseHours"
            label="First Response (hours)"
            rules={[{ required: true, type: "number", min: 1 }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="resolutionHours"
            label="Resolution (hours)"
            rules={[{ required: true, type: "number", min: 1 }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </PageShell>
  );
};

export default ServiceDeskReport;
