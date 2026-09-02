import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  DatePicker,
  Drawer,
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
import { LuLayoutGrid, LuPencil, LuShieldAlert, LuStar } from "react-icons/lu";
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
const HIDDEN_REPORT_STATUSES = ["CANCELLED"];
const CATEGORY_CARD_PREFIX = "category:";
const DEFAULT_SLA_CONFIGS = [
  { priority: "CRITICAL", firstResponseHours: 1, resolutionHours: 4 },
  { priority: "HIGH", firstResponseHours: 2, resolutionHours: 8 },
  { priority: "MEDIUM", firstResponseHours: 4, resolutionHours: 24 },
  { priority: "LOW", firstResponseHours: 8, resolutionHours: 72 },
];

const formatLabel = (value) => value?.replaceAll("_", " ") || "-";

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const getDeviceName = (ticket) => {
  const brand = ticket?.inventory?.itItem?.brand || "";
  const model = ticket?.inventory?.itItem?.model || "";
  const label = `${brand} ${model}`.trim();
  return label || "-";
};

const getCommentAuthorName = (comment) =>
  comment?.author?.name || comment?.author?.email || "Unknown";

const formatTicketComments = (ticket) => {
  const comments = ticket?.comments || [];
  if (!comments.length) return "-";

  const reporterId = ticket.reporterId || ticket.reporter?.id;

  return comments
    .map((comment, index) => {
      const name = getCommentAuthorName(comment);
      const authorId = comment.authorId || comment.author?.id;
      const isUserComment = Boolean(reporterId) && authorId === reporterId;
      const speaker = isUserComment
        ? `User (${name})`
        : `Service Desk: Technician (${name})`;

      return `${index + 1}. ${speaker}: ${comment.body || ""}`.trim();
    })
    .join("\n");
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
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [form] = Form.useForm();
  const deferredSearch = useDeferredValue(searchText.trim());

  const canAccessReport = user?.roles?.some((role) => REPORT_ROLES.includes(role));
  const canManageSLA = user?.roles?.some((r) => ["service_desk_manager", "admin"].includes(r));

  const { data: slaConfigsResponse } = useQuery({
    queryKey: ["sdSLAConfigs"],
    queryFn: () => api.get("/service-desk/sla-configs"),
    enabled: canAccessReport,
  });
  const slaConfigs = slaConfigsResponse?.data?.length
    ? slaConfigsResponse.data
    : DEFAULT_SLA_CONFIGS;

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

  const { data: departmentsResponse } = useQuery({
    queryKey: ["serviceDeskDepartments"],
    queryFn: () => api.get("/service-desk/departments"),
    enabled: canAccessReport,
  });

  const { data: ticketsResponse, isLoading, isFetching } = useQuery({
    queryKey: ["serviceDeskReport", submittedFilters, deferredSearch],
    queryFn: () => {
      const { month, ...apiFilters } = submittedFilters;
      return api.get("/service-desk/tickets", {
        params: {
          scope: "all",
          includeComments: true,
          ...apiFilters,
          ...(deferredSearch ? { search: deferredSearch } : {}),
        },
      });
    },
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
  const departments = departmentsResponse?.data || [];
  const tickets = ticketsResponse?.data || [];
  const selectedDepartment = departments.find((dept) => dept.id === submittedFilters.departmentId);

  const { overviewCards, categoryCards, activeSummaryCard } = useMemo(() => {
    const now = new Date();
    const TERMINAL = ["RESOLVED", "CLOSED", "CANCELLED"];
    const activeTickets = tickets.filter((ticket) => ACTIVE_STATUSES.includes(ticket.status));
    const resolvedTickets = tickets.filter((ticket) => ticket.status === "RESOLVED" || ticket.status === "CLOSED");
    const escalatedTickets = tickets.filter((ticket) => ticket.status === "ESCALATED");
    const slaBreached = tickets.filter((ticket) => ticket.dueAt && !TERMINAL.includes(ticket.status) && new Date(ticket.dueAt) < now);
    const ticketsByCategory = tickets.reduce((counts, ticket) => {
      const categoryId = ticket.category?.id || "none";
      counts[categoryId] = (counts[categoryId] || 0) + 1;
      return counts;
    }, {});
    const uncategorizedCount = ticketsByCategory.none || 0;
    const overview = [
      { key: null, label: "Total Tickets", value: tickets.length, caption: "Tickets in the current report" },
      { key: "active", label: "Active", value: activeTickets.length, caption: "Open operational workload" },
      { key: "resolved", label: "Resolved / Closed", value: resolvedTickets.length, caption: "Tickets already completed" },
      { key: "escalated", label: "Escalated", value: escalatedTickets.length, caption: "Tickets needing higher-tier attention" },
      { key: "slaBreached", label: "SLA Breached", value: slaBreached.length, caption: "Open tickets past their resolution deadline" },
    ];
    const byCategory = [
      ...categories.map((category) => ({
        key: `${CATEGORY_CARD_PREFIX}${category.id}`,
        label: category.name,
        value: ticketsByCategory[category.id] || 0,
        caption: "Tickets in this category",
      })),
      ...(uncategorizedCount
        ? [{
            key: `${CATEGORY_CARD_PREFIX}none`,
            label: "Uncategorized",
            value: uncategorizedCount,
            caption: "Tickets with no category",
          }]
        : []),
    ];
    const allCards = [...overview, ...byCategory];

    return {
      overviewCards: overview,
      categoryCards: byCategory,
      activeSummaryCard: allCards.find((card) =>
        card.key === null ? cardFilter === null : card.key === cardFilter,
      ) || overview[0],
    };
  }, [tickets, categories, cardFilter]);

  const tableData = useMemo(() => {
    const now = new Date();
    const TERMINAL = ["RESOLVED", "CLOSED", "CANCELLED"];
    if (cardFilter === "active") return tickets.filter((ticket) => ACTIVE_STATUSES.includes(ticket.status));
    if (cardFilter === "resolved") return tickets.filter((ticket) => ticket.status === "RESOLVED" || ticket.status === "CLOSED");
    if (cardFilter === "escalated") return tickets.filter((ticket) => ticket.status === "ESCALATED");
    if (cardFilter === "slaBreached") {
      return tickets.filter((ticket) => ticket.dueAt && !TERMINAL.includes(ticket.status) && new Date(ticket.dueAt) < now);
    }
    if (cardFilter?.startsWith(CATEGORY_CARD_PREFIX)) {
      const categoryId = cardFilter.slice(CATEGORY_CARD_PREFIX.length);
      if (categoryId === "none") return tickets.filter((ticket) => !ticket.category?.id);
      return tickets.filter((ticket) => ticket.category?.id === categoryId);
    }
    return tickets;
  }, [tickets, cardFilter]);

  const applySummaryFilter = (key) => {
    setCardFilter((prev) => (key == null || prev === key ? null : key));
    setSummaryOpen(false);
  };

  const filterFormInitialValues = useMemo(() => {
    const dateFrom = submittedFilters?.dateFrom ? dayjs(submittedFilters.dateFrom) : null;
    const dateTo = submittedFilters?.dateTo ? dayjs(submittedFilters.dateTo) : null;
    const month = submittedFilters?.month ? dayjs(submittedFilters.month, "YYYY-MM") : null;

    return {
      ...submittedFilters,
      month: month?.isValid() ? month : undefined,
      dateRange: dateFrom && dateTo ? [dateFrom, dateTo] : undefined,
    };
  }, [submittedFilters]);

  const resetFilters = () => {
    setSubmittedFilters({ scope: "all" });
    setCardFilter(null);
    form.resetFields();
    setOpen(false);
  };

  const columns = [
    {
      title: "Ticket",
      dataIndex: "ticketNo",
      key: "ticketNo",
      width: 120,
      render: (value) => <span className="font-semibold text-[#212121]">{value}</span>,
    },
    {
      title: "Subject",
      dataIndex: "subject",
      key: "subject",
      width: 260,
      ellipsis: { showTitle: false },
      render: (value) => (
        <Tooltip title={value || "-"}>
          <span className="block max-w-[240px] truncate">{value || "-"}</span>
        </Tooltip>
      ),
    },
    {
      title: "Reporter",
      key: "reporter",
      width: 180,
      render: (_, record) => record.reporter?.name || record.reporter?.email || "Unknown",
    },
    {
      title: "Category",
      key: "category",
      width: 160,
      render: (_, record) => record.category?.name || "General",
    },
    {
      title: "Device",
      key: "device",
      width: 220,
      ellipsis: { showTitle: false },
      render: (_, record) => {
        const deviceName = getDeviceName(record);
        if (deviceName === "-") return <span className="text-[#9E9E9E]">—</span>;
        return (
          <Tooltip title={deviceName}>
            <span className="block max-w-[200px] truncate">{deviceName}</span>
          </Tooltip>
        );
      },
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      width: 280,
      ellipsis: { showTitle: false },
      render: (value) => (
        <Tooltip title={value || "-"}>
          <span className="block max-w-[260px] truncate text-[#424242]">{value || "-"}</span>
        </Tooltip>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 120,
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
      width: 140,
      render: (status) => (
        <Tag className={`rounded-full border-0 px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status] || "bg-[#F3F4F6] text-[#374151]"}`}>
          {formatLabel(status)}
        </Tag>
      ),
    },
    {
      title: "Assigned Technician",
      key: "assignedTo",
      width: 190,
      render: (_, record) => record.assignedTo?.name || record.assignedTo?.email || "Unassigned",
    },
    {
      title: "Updated",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 170,
      render: formatDateTime,
    },
    {
      title: "SLA Due",
      dataIndex: "dueAt",
      key: "dueAt",
      width: 170,
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

    const TERMINAL_STATUSES = ["RESOLVED", "CLOSED", "CANCELLED"];
    const getUrgencyCheck = (ticket) => {
      const now = Date.now();
      const dueAtTime = ticket?.dueAt ? new Date(ticket.dueAt).getTime() : null;
      const isTerminal = TERMINAL_STATUSES.includes(ticket.status);

      if (!isTerminal && dueAtTime && dueAtTime < now) return "Overdue (SLA Breach)";
      if (!isTerminal && dueAtTime) {
        const hoursLeft = (dueAtTime - now) / (1000 * 60 * 60);
        if (hoursLeft <= 4) return "At Risk (<=4h to SLA)";
      }

      return formatLabel(ticket.priority);
    };

    const exportRows = tickets.map((ticket) => ({
      ID: ticket.ticketNo || ticket.id,
      "Title / Subject": ticket.subject || "-",
      Status: formatLabel(ticket.status),
      "Opening Date": formatDateTime(ticket.createdAt),
      "Last Updated": formatDateTime(ticket.updatedAt),
      Requester: ticket.reporter?.name || ticket.reporter?.email || "Unknown",
      "Assigned To - Technician": ticket.assignedTo?.name || ticket.assignedTo?.email || "Unassigned",
      Category: ticket.category?.name || "General",
      Description: ticket.description || "-",
      Comments: formatTicketComments(ticket),
      "Resolution Date": formatDateTime(ticket.resolvedAt || ticket.closedAt),
      "Urgency Check": getUrgencyCheck(ticket),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    worksheet["!cols"] = [
      { wch: 14 },
      { wch: 36 },
      { wch: 16 },
      { wch: 20 },
      { wch: 20 },
      { wch: 24 },
      { wch: 28 },
      { wch: 18 },
      { wch: 40 },
      { wch: 55 },
      { wch: 20 },
      { wch: 22 },
    ];
    worksheet["!rows"] = [
      { hpt: 22 },
      ...exportRows.map((row) => ({
        hpt: Math.min(120, Math.max(22, String(row.Comments || "-").split("\n").length * 18)),
      })),
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Service Desk Report");
    XLSX.writeFile(workbook, "service-desk-report.xlsx");
  };

  const onFinish = (values) => {
    const selectedMonth = values.month;
    const [dateFrom, dateTo] = values.dateRange ?? [];
    const monthStart = selectedMonth ? selectedMonth.startOf("month") : null;
    const monthEnd = selectedMonth ? selectedMonth.endOf("month") : null;

    setSubmittedFilters({
      scope: "all",
      ...(selectedMonth ? { month: selectedMonth.format("YYYY-MM") } : {}),
      ...(values.status ? { status: values.status } : {}),
      ...(values.priority ? { priority: values.priority } : {}),
      ...(values.categoryId ? { categoryId: values.categoryId } : {}),
      ...(values.departmentId ? { departmentId: values.departmentId } : {}),
      ...(values.assignedToId ? { assignedToId: values.assignedToId } : {}),
      ...(selectedMonth
        ? {
            dateFrom: monthStart.toISOString(),
            dateTo: monthEnd.toISOString(),
          }
        : {
            ...(dateFrom ? { dateFrom: dateFrom.startOf("day").toISOString() } : {}),
            ...(dateTo ? { dateTo: dateTo.endOf("day").toISOString() } : {}),
          }),
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
      loading={isLoading}
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
          <Button icon={<LuLayoutGrid size={16} />} onClick={() => setSummaryOpen(true)}>
            View Summary
          </Button>
          {canManageSLA && (
            <Tooltip title="Manage SLA thresholds">
              <Button
                icon={<LuShieldAlert size={14} />}
                onClick={() => document.getElementById("sla-thresholds")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
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
            {submittedFilters.month && (
              <span className="rounded-full bg-[#E8F5E9] px-3 py-1 text-xs font-semibold text-[#166534]">
                Month: {dayjs(submittedFilters.month, "YYYY-MM").format("MMMM YYYY")}
              </span>
            )}
            {submittedFilters.dateFrom && submittedFilters.dateTo && (
              <span className="rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-semibold text-[#92400E]">
                {dayjs(submittedFilters.dateFrom).format("DD MMM YYYY")} — {dayjs(submittedFilters.dateTo).format("DD MMM YYYY")}
              </span>
            )}
            {selectedDepartment && (
              <span className="rounded-full bg-[#F3E8FF] px-3 py-1 text-xs font-semibold text-[#7C3AED]">
                Department: {selectedDepartment.name}
              </span>
            )}
            {cardFilter && (
              <span className="rounded-full bg-[#FFF7F7] px-3 py-1 text-xs font-semibold text-[#D32F2F]">
                Summary: {activeSummaryCard?.label}
              </span>
            )}
            <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#1D4ED8]">
              Managers and supervisors overview
            </span>
          </div>
        </div>

        {tableData.length ? (
          <Table
            columns={columns}
            dataSource={tableData}
            rowKey="id"
            loading={isFetching}
            scroll={{ x: 1850 }}
            tableLayout="fixed"
            pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ["10", "20", "50"] }}
          />
        ) : (
          <Empty description="No tickets match the current report filters" />
        )}
      </section>

      <Modal title="Filter Service Desk Report" open={open} onCancel={() => setOpen(false)} footer={null} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={onFinish} initialValues={filterFormInitialValues}>
          <Form.Item name="month" label="Month">
            <DatePicker
              picker="month"
              className="w-full"
              allowClear
              format="MMMM YYYY"
              disabledDate={(current) => current && current.isAfter(dayjs().endOf("month"))}
            />
          </Form.Item>
          <Form.Item name="dateRange" label="Date Range (Created At)">
            <DatePicker.RangePicker
              className="w-full"
              disabledDate={(current) => current && current.isAfter(dayjs().endOf("day"))}
              format="DD MMM YYYY"
            />
          </Form.Item>
          <p className="-mt-3 mb-3 text-xs text-[#757575]">
            If Month is selected, it takes priority over Date Range.
          </p>
          <Form.Item name="status" label="Status">
            <Select allowClear placeholder="All statuses">
              {Object.keys(STATUS_STYLES)
                .filter((status) => !HIDDEN_REPORT_STATUSES.includes(status))
                .map((status) => (
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
          <Form.Item name="departmentId" label="Department">
            <Select
              allowClear
              showSearch
              placeholder="All departments"
              optionFilterProp="children"
            >
              {departments.map((department) => (
                <Select.Option key={department.id} value={department.id}>
                  {department.name}
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
            <div className="flex gap-2">
              <Button onClick={resetFilters} block>
                Reset
              </Button>
              <Button type="primary" htmlType="submit" block>
                Apply Filters
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        open={summaryOpen}
        onClose={() => setSummaryOpen(false)}
        width={560}
        title="Report summary"
        styles={{ body: { paddingTop: 12 } }}
      >
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Workload</p>
            <p className="mt-1 mb-3 text-sm text-[#616161]">Click a card to filter the report table.</p>
            <div className="grid grid-cols-2 gap-3">
              {overviewCards.map((card) => {
                const active = card.key == null ? cardFilter == null : cardFilter === card.key;
                return (
                  <button
                    key={card.label}
                    type="button"
                    onClick={() => applySummaryFilter(card.key)}
                    className={`rounded-3xl border p-4 text-left transition-all ${
                      active
                        ? "border-[#D32F2F] bg-[#FFF7F7] shadow-sm"
                        : "border-[#E5E7EB] bg-white hover:border-[#D32F2F] hover:bg-[#FFF7F7]"
                    }`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">{card.label}</p>
                    <p className="mt-2 text-3xl font-bold text-[#212121]">{card.value}</p>
                    <p className="mt-1 text-sm text-[#616161]">{card.caption}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">By category</p>
            <p className="mt-1 mb-3 text-sm text-[#616161]">Ticket counts for each service desk category.</p>
            <div className="grid grid-cols-2 gap-3">
              {categoryCards.map((card) => {
                const active = cardFilter === card.key;
                return (
                  <button
                    key={card.key}
                    type="button"
                    onClick={() => applySummaryFilter(card.key)}
                    className={`rounded-3xl border p-4 text-left transition-all ${
                      active
                        ? "border-[#D32F2F] bg-[#FFF7F7] shadow-sm"
                        : "border-[#E5E7EB] bg-white hover:border-[#D32F2F] hover:bg-[#FFF7F7]"
                    }`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">{card.label}</p>
                    <p className="mt-2 text-3xl font-bold text-[#212121]">{card.value}</p>
                    <p className="mt-1 text-sm text-[#616161]">{card.caption}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Drawer>

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
        <section
          id="sla-thresholds"
          className="mt-6 rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6"
        >
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
