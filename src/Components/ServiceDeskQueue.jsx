import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Dropdown, Form, Input, Modal, Select, Table, Tag } from "antd";
import { MoreOutlined, SearchOutlined } from "@ant-design/icons";
import React, { useDeferredValue, useMemo, useState } from "react";
import { LuArrowUpRight, LuCheckCheck, LuHistory, LuMessageSquarePlus, LuPlay, LuPlus, LuRefreshCcw, LuTriangleAlert, LuUserRoundPlus, LuWrench } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../utils/config";
import { useUser } from "../utils/userContext";
import PageShell from "./ui/page-shell";

const STATUS_STYLES = {
  NEW: { backgroundColor: "#DBEAFE", color: "#1D4ED8", borderColor: "#93C5FD" },
  TRIAGED: { backgroundColor: "#FEF9C3", color: "#854D0E", borderColor: "#FDE68A" },
  ASSIGNED: { backgroundColor: "#CCFBF1", color: "#0F766E", borderColor: "#99F6E4" },
  IN_PROGRESS: { backgroundColor: "#FEF3C7", color: "#B45309", borderColor: "#FCD34D" },
  WAITING_FOR_USER: { backgroundColor: "#F3E8FF", color: "#7C3AED", borderColor: "#D8B4FE" },
  ESCALATED: { backgroundColor: "#FEE2E2", color: "#B91C1C", borderColor: "#FCA5A5" },
  REOPENED: { backgroundColor: "#FFE4E6", color: "#BE123C", borderColor: "#FDA4AF" },
  RESOLVED: { backgroundColor: "#ECFDF5", color: "#166534", borderColor: "#86EFAC" },
  CLOSED: { backgroundColor: "#D1FAE5", color: "#065F46", borderColor: "#6EE7B7" },
  CANCELLED: { backgroundColor: "#F3F4F6", color: "#6B7280", borderColor: "#D1D5DB" },
};

const DEFAULT_STATUS_STYLE = { backgroundColor: "#F3F4F6", color: "#374151", borderColor: "#D1D5DB" };
const UNASSIGNED_TAG_STYLE = { backgroundColor: "#FEE2E2", color: "#B91C1C", borderColor: "#FCA5A5" };

const getQueueRowStyle = (record) => {
  if (!record?.assignedToId) {
    return { backgroundColor: "#FFF7F7" };
  }

  if (record.status === "NEW") {
    return { backgroundColor: "#F5F9FF" };
  }

  return undefined;
};

const MANAGER_ROLES = ["service_desk_manager", "supervisor", "admin"];
const ACCEPTABLE_STATUSES = ["NEW", "TRIAGED", "ASSIGNED", "ESCALATED", "REOPENED", "WAITING_FOR_USER"];
const VALID_NEXT_STATUSES = {
  NEW: ["TRIAGED", "IN_PROGRESS", "CANCELLED"],
  TRIAGED: ["IN_PROGRESS", "CANCELLED"],
  ASSIGNED: ["IN_PROGRESS", "TRIAGED", "CANCELLED"],
  IN_PROGRESS: ["WAITING_FOR_USER", "RESOLVED", "CANCELLED"],
  WAITING_FOR_USER: ["IN_PROGRESS", "RESOLVED", "CANCELLED"],
  ESCALATED: ["IN_PROGRESS", "RESOLVED"],
  REOPENED: ["IN_PROGRESS", "CANCELLED"],
  RESOLVED: [],
  CLOSED: [],
  CANCELLED: [],
};
const ALL_MANUAL_STATUSES = ["TRIAGED", "IN_PROGRESS", "WAITING_FOR_USER", "RESOLVED", "CANCELLED"];
const STATUS_LABELS = {
  TRIAGED: "Troubleshooting",
  IN_PROGRESS: "In Progress",
  WAITING_FOR_USER: "Waiting For User",
  RESOLVED: "Resolved",
  ESCALATED: "Escalated",
  CANCELLED: "Cancelled",
};
const ESCALATION_SOURCE_STATUSES = ["IN_PROGRESS", "WAITING_FOR_USER", "REOPENED"];

const ServiceDeskQueue = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const isHardwareTech = user?.roles?.includes("hardware_technician");
  const isWorkshopSupervisor = user?.roles?.includes("workshop_supervisor");
  const isManager = user?.roles?.some((role) => MANAGER_ROLES.includes(role));
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState("");
  const [scope, setScope] = useState("all");
  const effectiveScope = isHardwareTech ? "mine" : scope;
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [commentOpen, setCommentOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createBehalfUserId, setCreateBehalfUserId] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkAssignForm] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [statusForm] = Form.useForm();
  const [commentForm] = Form.useForm();
  const [escalateForm] = Form.useForm();
  const [maintenanceForm] = Form.useForm();
  const [reporterHistoryOpen, setReporterHistoryOpen] = useState(false);
  const [historyReporterId, setHistoryReporterId] = useState(null);
  const [closeTicketOpen, setCloseTicketOpen] = useState(false);
  const [closeTicketRecord, setCloseTicketRecord] = useState(null);
  const [cardFilter, setCardFilter] = useState(null);
  const deferredSearch = useDeferredValue(searchText.trim());

  const { data: ticketsResponse, isLoading } = useQuery({
    queryKey: ["serviceDeskQueue", effectiveScope, deferredSearch],
    queryFn: () =>
      api.get("/service-desk/tickets", {
        params: {
          scope: effectiveScope,
          ...(deferredSearch ? { search: deferredSearch } : {}),
        },
      }),
  });

  const { data: staffResponse } = useQuery({
    queryKey: ["serviceDeskSupportStaff"],
    queryFn: () => api.get("/service-desk/support-staff"),
  });

  const { data: allUsersResponse } = useQuery({
    queryKey: ["allUsersForProxy"],
    queryFn: () => api.get("/admin/users"),
    enabled: !!isManager,
    staleTime: 5 * 60 * 1000,
  });

  const { data: categoriesResponse } = useQuery({
    queryKey: ["serviceDeskCategories"],
    queryFn: () => api.get("/service-desk/categories"),
    enabled: !!isManager,
  });

  const { data: reporterHistoryResponse, isLoading: historyLoading } = useQuery({
    queryKey: ["reporterHistory", historyReporterId],
    queryFn: () => api.get(`/service-desk/reporter/${historyReporterId}/history`),
    enabled: !!historyReporterId && reporterHistoryOpen,
    staleTime: 2 * 60 * 1000,
  });
  const reporterHistory = reporterHistoryResponse?.data;

  const { data: reporterAssetsResponse } = useQuery({
    queryKey: ["reporterAssets", selectedTicket?.reporter?.id],
    queryFn: () => api.get(`/service-desk/user-assets/${selectedTicket.reporter.id}`),
    enabled: !!isManager && !!selectedTicket?.reporter?.id && statusOpen,
    staleTime: 2 * 60 * 1000,
  });
  const reporterAssets = reporterAssetsResponse?.data || [];

  const { data: createBehalfAssetsResponse } = useQuery({
    queryKey: ["createBehalfAssets", createBehalfUserId],
    queryFn: () => api.get(`/service-desk/user-assets/${createBehalfUserId}`),
    enabled: !!isManager && !!createBehalfUserId,
    staleTime: 2 * 60 * 1000,
  });
  const createBehalfAssets = createBehalfAssetsResponse?.data || [];

  const tickets = ticketsResponse?.data || [];
  const displayedTickets = useMemo(
    () => (isWorkshopSupervisor ? tickets.filter((t) => t.maintenanceTicket != null) : tickets),
    [tickets, isWorkshopSupervisor]
  );
  const supportStaff = staffResponse?.data || [];
  const canAssignTickets = user?.roles?.includes("service_desk_manager") || user?.roles?.includes("admin");
  const canUpdateTickets =
    user?.roles?.includes("hardware_technician") ||
    user?.roles?.includes("service_desk_manager") ||
    user?.roles?.includes("supervisor") ||
    user?.roles?.includes("admin");
  const canAcceptTickets =
    user?.roles?.includes("hardware_technician") ||
    user?.roles?.includes("supervisor") ||
    user?.roles?.includes("admin");
  const isSupportStaff = canUpdateTickets;

  const getAllowedStatuses = (ticket) => {
    if (!ticket) return [];
    return isManager ? ALL_MANUAL_STATUSES : VALID_NEXT_STATUSES[ticket.status] || [];
  };

  const canAcceptTicket = (ticket) =>
    canAcceptTickets &&
    ACCEPTABLE_STATUSES.includes(ticket.status) &&
    (!ticket.assignedToId || ticket.assignedToId === user?.id);

  const canUpdateTicket = (ticket) =>
    canUpdateTickets &&
    (isManager || ticket.assignedToId === user?.id) &&
    getAllowedStatuses(ticket).length > 0;

  const canEscalateTicket = (ticket) =>
    canUpdateTickets &&
    (isManager || ticket.assignedToId === user?.id) &&
    ESCALATION_SOURCE_STATUSES.includes(ticket.status);

  const canCreateMaintenanceTicket = (ticket) =>
    canUpdateTickets &&
    ticket?.issueType === "HARDWARE" &&
    ticket?.inventory &&
    !ticket?.maintenanceTicket &&
    (isManager || ticket.assignedToId === user?.id);

  const getAcceptLabel = (ticket) => (ticket.assignedToId === user?.id ? "Start Work" : "Accept");

  const stats = useMemo(() => {
    const totalLabel = isHardwareTech ? "My Assigned" : isWorkshopSupervisor ? "Maintenance Jobs" : "Total";
    const toggleFilter = (key) => setCardFilter((prev) => (prev === key ? null : key));
    return [
      {
        label: totalLabel,
        value: displayedTickets.length,
        caption: "Tickets in current view",
        active: cardFilter === null,
        onClick: () => setCardFilter(null),
      },
      {
        label: "Unassigned",
        value: displayedTickets.filter((ticket) => !ticket.assignedToId).length,
        caption: "Need ownership",
        active: cardFilter === "unassigned",
        onClick: () => toggleFilter("unassigned"),
      },
      {
        label: "Waiting On User",
        value: displayedTickets.filter((ticket) => ticket.status === "WAITING_FOR_USER").length,
        caption: "Reporter response needed",
        active: cardFilter === "waiting",
        onClick: () => toggleFilter("waiting"),
      },
    ];
  }, [displayedTickets, isHardwareTech, isWorkshopSupervisor, cardFilter]);

  const tableData = useMemo(() => {
    if (cardFilter === "unassigned") return displayedTickets.filter((t) => !t.assignedToId);
    if (cardFilter === "waiting") return displayedTickets.filter((t) => t.status === "WAITING_FOR_USER");
    return displayedTickets;
  }, [displayedTickets, cardFilter]);

  const refreshQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["serviceDeskQueue"] });
    queryClient.invalidateQueries({ queryKey: ["serviceDeskTickets"] });
  };

  const assignTicket = useMutation({
    mutationFn: ({ ticketId, assignedToId }) => api.patch(`/service-desk/tickets/${ticketId}/assign`, { assignedToId }),
    onSuccess: () => {
      toast.success("Ticket assigned");
      refreshQueries();
      setAssignOpen(false);
      assignForm.resetFields();
    },
    onError: (error) => toast.error(error?.response?.data?.message || "Failed to assign ticket"),
  });

  const acceptTicket = useMutation({
    mutationFn: (ticketId) => api.patch(`/service-desk/tickets/${ticketId}/accept`),
    onSuccess: () => { toast.success("Ticket accepted"); refreshQueries(); },
    onError: (error) => toast.error(error?.response?.data?.message || "Failed to accept ticket"),
  });

  const updateStatus = useMutation({
    mutationFn: ({ ticketId, values }) => api.patch(`/service-desk/tickets/${ticketId}/status`, values),
    onSuccess: () => {
      toast.success("Ticket updated");
      refreshQueries();
      setStatusOpen(false);
      statusForm.resetFields();
    },
    onError: (error) => toast.error(error?.response?.data?.message || "Failed to update ticket"),
  });

  const closeTicketMutation = useMutation({
    mutationFn: (ticketId) => api.post(`/service-desk/tickets/${ticketId}/close`),
    onSuccess: () => {
      toast.success("Ticket closed");
      refreshQueries();
      setCloseTicketOpen(false);
      setCloseTicketRecord(null);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to close ticket"),
  });

  const addComment = useMutation({
    mutationFn: ({ ticketId, values }) => api.post(`/service-desk/tickets/${ticketId}/comments`, values),
    onSuccess: () => {
      toast.success("Comment added");
      refreshQueries();
      setCommentOpen(false);
      commentForm.resetFields();
    },
    onError: (error) => toast.error(error?.response?.data?.message || "Failed to add comment"),
  });

  const escalateTicket = useMutation({
    mutationFn: ({ ticketId, values }) => api.post(`/service-desk/tickets/${ticketId}/escalate`, values),
    onSuccess: () => {
      toast.success("Ticket escalated");
      refreshQueries();
      setEscalateOpen(false);
      escalateForm.resetFields();
    },
    onError: (error) => toast.error(error?.response?.data?.message || "Failed to escalate ticket"),
  });

  const createMaintenance = useMutation({
    mutationFn: ({ ticketId, values }) => api.post(`/service-desk/tickets/${ticketId}/maintenance`, values),
    onSuccess: () => {
      toast.success("Maintenance job created");
      refreshQueries();
      setMaintenanceOpen(false);
      maintenanceForm.resetFields();
    },
    onError: (error) => toast.error(error?.response?.data?.message || "Failed to create maintenance job"),
  });

  const createTicketOnBehalf = useMutation({
    mutationFn: (values) => api.post("/service-desk/tickets", values),
    onSuccess: () => {
      toast.success("Ticket created successfully");
      refreshQueries();
      setCreateOpen(false);
      createForm.resetFields();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to create ticket"),
  });

  const bulkAction = useMutation({
    mutationFn: (payload) => api.post("/service-desk/tickets/bulk", payload),
    onSuccess: (res) => {
      const { succeeded, failed } = res.data;
      if (succeeded > 0) toast.success(`${succeeded} ticket(s) updated`);
      if (failed > 0) toast.warning(`${failed} ticket(s) could not be updated`);
      setSelectedRowKeys([]);
      refreshQueries();
      setBulkAssignOpen(false);
      bulkAssignForm.resetFields();
    },
    onError: (error) => toast.error(error?.response?.data?.message || "Bulk action failed"),
  });

  const getSelectedTicketId = () => selectedTicket?.id;

  const handleAssignSubmit = (values) => {
    const ticketId = getSelectedTicketId();
    if (!ticketId) return toast.error("Unable to assign ticket. Missing ticket ID.");
    assignTicket.mutate({ ticketId, assignedToId: values.assignedToId });
  };

  const handleStatusSubmit = (values) => {
    const ticketId = getSelectedTicketId();
    if (!ticketId) return toast.error("Unable to update ticket. Missing ticket ID.");
    updateStatus.mutate({
      ticketId,
      values: {
        ...values,
        resolutionNotes: values.resolutionNotes?.trim() || undefined,
      },
    });
  };

  const handleCommentSubmit = (values) => {
    const ticketId = getSelectedTicketId();
    const body = values.body?.trim();
    if (!ticketId) return toast.error("Unable to add comment. Missing ticket ID.");
    if (!body) return toast.error("Please enter a comment.");
    addComment.mutate({ ticketId, values: { ...values, body } });
  };

  const handleEscalateSubmit = (values) => {
    const ticketId = getSelectedTicketId();
    if (!ticketId) return toast.error("Unable to escalate ticket. Missing ticket ID.");
    const reason = values.reason?.trim();
    if (!reason) return toast.error("Please enter an escalation reason.");
    const { priorityJustification, ...payload } = values;
    escalateTicket.mutate({
      ticketId,
      values: {
        ...payload,
        reason,
        priorityJustification: priorityJustification?.trim() || undefined,
      },
    });
  };

  const handleMaintenanceSubmit = (values) => {
    const ticketId = getSelectedTicketId();
    if (!ticketId) return toast.error("Unable to create maintenance job. Missing ticket ID.");
    createMaintenance.mutate({ ticketId, values });
  };

  const handleCreateTicketOnBehalf = (values) => {
    const subject = values.subject?.trim();
    const description = values.description?.trim();
    if (!subject || !description) return toast.error("Subject and description are required.");
    createTicketOnBehalf.mutate({ ...values, subject, description });
  };

  const handleBulkAction = (action) => {
    if (!selectedRowKeys.length) return toast.error("Select at least one ticket.");
    bulkAction.mutate({ ticketIds: selectedRowKeys, action });
  };

  const handleBulkAssignSubmit = (values) => {
    if (!selectedRowKeys.length) return toast.error("Select at least one ticket.");
    bulkAction.mutate({ ticketIds: selectedRowKeys, action: "REASSIGN", assignedToId: values.assignedToId });
  };

  const handleAcceptTicket = (record) => {
    if (!record?.id) return toast.error("Unable to accept ticket. Missing ticket ID.");
    acceptTicket.mutate(record.id);
  };

  const handleCloseTicket = () => {
    if (!closeTicketRecord?.id) return toast.error("Unable to close ticket. Missing ticket ID.");
    closeTicketMutation.mutate(closeTicketRecord.id);
  };

  const openAssignModal = (ticket) => {
    setSelectedTicket(ticket);
    assignForm.setFieldsValue({ assignedToId: ticket.assignedToId });
    setAssignOpen(true);
  };

  const openStatusModal = (ticket) => {
    setSelectedTicket(ticket);
    statusForm.setFieldsValue({
      status: ticket.status,
      resolutionNotes: ticket.resolutionNotes,
      categoryId: ticket.category?.id ?? undefined,
      issueType: ticket.issueType ?? undefined,
      inventoryId: ticket.inventoryId ?? undefined,
    });
    setStatusOpen(true);
  };

  const openCommentModal = (ticket) => {
    setSelectedTicket(ticket);
    commentForm.resetFields();
    setCommentOpen(true);
  };

  const openEscalationModal = (ticket) => {
    setSelectedTicket(ticket);
    escalateForm.resetFields();
    escalateForm.setFieldsValue({ priority: ticket.priority });
    setEscalateOpen(true);
  };

  const openMaintenanceModal = (ticket) => {
    setSelectedTicket(ticket);
    maintenanceForm.resetFields();
    maintenanceForm.setFieldsValue({ technicianReceivedById: ticket.assignedToId || user?.id });
    setMaintenanceOpen(true);
  };

  const columns = [
    { title: "Ticket", dataIndex: "ticketNo", key: "ticketNo", width: 96, render: (value) => <span className="font-semibold">{value}</span> },
    { title: "Subject", dataIndex: "subject", key: "subject", width: 190, ellipsis: true },
    {
      title: "Reporter",
      key: "reporter",
      width: 170,
      render: (_, record) => {
        const dept = record.reporter?.department?.name;
        const room = record.reporter?.roomNo;
        return (
          <div>
            <p className="font-medium text-[#212121]">{record.reporter?.name || "Unknown"}</p>
            {(dept || room) && (
              <p className="text-xs text-[#757575]">
                {[dept, room ? `Rm ${room}` : null].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        );
      },
    },
    { title: "Work Type", dataIndex: ["category", "name"], key: "category", width: 130, ellipsis: true, render: (value) => value || "-" },
    { title: "Priority", dataIndex: "priority", key: "priority", width: 86 },
    {
      title: "SLA",
      dataIndex: "dueAt",
      key: "dueAt",
      width: 110,
      render: (dueAt, record) => {
        if (!dueAt || ["RESOLVED", "CLOSED", "CANCELLED"].includes(record.status)) return <span className="text-xs text-[#9E9E9E]">—</span>;
        const minsLeft = Math.floor((new Date(dueAt) - Date.now()) / 60000);
        if (minsLeft < 0) return <Tag className="rounded-full border-0 bg-[#FFEBEE] px-2 text-xs font-semibold text-[#D32F2F]">Overdue {Math.abs(minsLeft)}m</Tag>;
        if (minsLeft < 60) return <Tag className="rounded-full border-0 bg-[#FFF3E0] px-2 text-xs font-semibold text-[#E65100]">{minsLeft}m left</Tag>;
        const hrsLeft = Math.floor(minsLeft / 60);
        if (hrsLeft < 24) return <Tag className="rounded-full border-0 bg-[#FFF9C4] px-2 text-xs font-semibold text-[#F57F17]">{hrsLeft}h left</Tag>;
        return <Tag className="rounded-full border-0 bg-[#E8F5E9] px-2 text-xs font-semibold text-[#2E7D32]">{Math.floor(hrsLeft / 24)}d left</Tag>;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 132,
      render: (status) => (
        <Tag
          bordered
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={STATUS_STYLES[status] || DEFAULT_STATUS_STYLE}
        >
          {STATUS_LABELS[status] || status.replaceAll("_", " ")}
        </Tag>
      ),
    },
    {
      title: "Assigned To",
      dataIndex: ["assignedTo", "name"],
      key: "assignedTo",
      width: 135,
      ellipsis: true,
      render: (value) =>
        value ? (
          <span className="text-sm">{value}</span>
        ) : (
          <Tag bordered className="rounded-full px-2 py-0.5 text-xs font-semibold" style={UNASSIGNED_TAG_STYLE}>
            Unassigned
          </Tag>
        ),
    },
    { title: "Comments", dataIndex: ["_count", "comments"], key: "comments", width: 84 },
    {
      title: "Actions",
      key: "actions",
      width: 64,
      fixed: "right",
      align: "center",
      render: (_, record) => {
        const isTerminal = ["RESOLVED", "CLOSED", "CANCELLED"].includes(record.status);
        const items = [
          {
            key: "view",
            label: "View ticket",
            onClick: () => navigate(`/dashboard/service-desk/tickets/${record.id}`),
          },
          ...(!isTerminal && canAcceptTicket(record)
            ? [{ key: "accept", label: getAcceptLabel(record), icon: <LuPlay size={14} />, onClick: () => handleAcceptTicket(record) }]
            : []),
          ...(!isTerminal && canAssignTickets
            ? [{ key: "assign", label: "Assign", icon: <LuUserRoundPlus size={14} />, onClick: () => openAssignModal(record) }]
            : []),
          ...(!isTerminal && canUpdateTicket(record)
            ? [{ key: "update", label: "Update status", icon: <LuRefreshCcw size={14} />, onClick: () => openStatusModal(record) }]
            : []),
          ...(!isTerminal && canEscalateTicket(record)
            ? [{ key: "escalate", label: "Escalate", icon: <LuArrowUpRight size={14} />, onClick: () => openEscalationModal(record) }]
            : []),
          ...(!isTerminal && canCreateMaintenanceTicket(record)
            ? [{ key: "maintenance", label: "Open maintenance job", icon: <LuWrench size={14} />, onClick: () => openMaintenanceModal(record) }]
            : []),
          ...(!isTerminal
            ? [{
                key: "comment",
                label: "Add comment",
                icon: <LuMessageSquarePlus size={14} />,
                onClick: () => openCommentModal(record),
              }]
            : []),
          ...(isManager && record.status === "RESOLVED"
            ? [{
                key: "close",
                label: "Close ticket",
                icon: <LuCheckCheck size={14} />,
                onClick: () => { setCloseTicketRecord(record); setCloseTicketOpen(true); },
              }]
            : []),
          ...(isSupportStaff && record.reporter?.id
            ? [{
                key: "reporterHistory",
                label: "Reporter history",
                icon: <LuHistory size={14} />,
                onClick: () => { setHistoryReporterId(record.reporter.id); setReporterHistoryOpen(true); },
              }]
            : []),
        ];

        return (
          <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
            <Button size="small" type="text" icon={<MoreOutlined />} aria-label="Ticket actions" />
          </Dropdown>
        );
      },
    },
  ];

  const selectedAllowedStatuses = getAllowedStatuses(selectedTicket);

  const pageTitle = isHardwareTech
    ? "My Assigned Tickets"
    : isWorkshopSupervisor
      ? "Maintenance Tickets"
      : "All Tickets";
  const pageEyebrow = isHardwareTech ? "My Work" : isWorkshopSupervisor ? "Workshop" : "Support Workspace";
  const pageDescription = isHardwareTech
    ? "Tickets assigned to you – track progress, update status, and log resolution notes."
    : isWorkshopSupervisor
      ? "Service tickets that have been escalated into maintenance jobs."
      : "Review and manage all helpdesk tickets, assign owners, update progress, and log work feedback.";

  return (
    <PageShell
      eyebrow={pageEyebrow}
      title={pageTitle}
      description={pageDescription}
      stats={stats}
      actions={
        <>
          {isManager && (
            <Button
              type="primary"
              icon={<LuPlus />}
              onClick={() => setCreateOpen(true)}
              style={{ backgroundColor: "#D32F2F", borderColor: "#D32F2F" }}
            >
              New Ticket
            </Button>
          )}
          {!isHardwareTech && !isWorkshopSupervisor && (
            <Select value={scope} onChange={setScope} className="w-full md:w-[190px]">
              <Select.Option value="all">All Tickets</Select.Option>
              <Select.Option value="mine">My Tickets</Select.Option>
              <Select.Option value="unassigned">Unassigned</Select.Option>
              <Select.Option value="reported">Reported By Me</Select.Option>
            </Select>
          )}
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search queue"
            className="w-full md:w-[260px]"
          />
        </>
      }
    >
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#616161]">
              {isHardwareTech ? "Assigned To Me" : isWorkshopSupervisor ? "Maintenance Jobs" : "Operational Queue"}
            </p>
            <h3 className="text-xl font-bold text-[#212121]">
              {isHardwareTech
                ? "Tickets you are responsible for"
                : isWorkshopSupervisor
                  ? "Service tickets with active maintenance workflows"
                  : "Support tickets in progress"}
            </h3>
          </div>
          <span className="rounded-full bg-[#FFEBEE] px-3 py-1 text-xs font-semibold text-[#D32F2F]">
            {isHardwareTech ? "My workload" : isWorkshopSupervisor ? "Workshop view" : "Assignment and feedback enabled"}
          </span>
        </div>

        {canAssignTickets && selectedRowKeys.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-[#E0E0E0] bg-[#F9FAFB] px-4 py-3">
            <span className="text-sm font-semibold text-[#212121]">{selectedRowKeys.length} selected</span>
            <Button size="small" onClick={() => setBulkAssignOpen(true)}>Reassign</Button>
            <Button size="small" danger onClick={() => handleBulkAction("CLOSE")} loading={bulkAction.isPending}>Close All</Button>
            <Button size="small" onClick={() => handleBulkAction("ESCALATE")} loading={bulkAction.isPending}>Escalate All</Button>
            <Button size="small" type="link" onClick={() => setSelectedRowKeys([])}>Clear</Button>
          </div>
        )}

        <Table columns={columns} dataSource={tableData} rowKey="id" loading={isLoading} scroll={{ x: "max-content" }} tableLayout="fixed"
          onRow={(record) => ({ style: getQueueRowStyle(record) })}
          rowSelection={canAssignTickets ? {
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          } : undefined}
        />
      </section>

      <Modal title={`Assign Ticket${selectedTicket ? ` - ${selectedTicket.ticketNo}` : ""}`} open={assignOpen} onCancel={() => setAssignOpen(false)} footer={null} destroyOnClose>
        <Form
          form={assignForm}
          layout="vertical"
          onFinish={handleAssignSubmit}
        >
          <Form.Item name="assignedToId" label="Assign Technician" rules={[{ required: true, message: "Please select a technician" }]}>
            <Select placeholder="Choose a technician">
              {supportStaff.map((staff) => (
                <Select.Option key={staff.id} value={staff.id}>
                  {staff.name || staff.email} - {staff.availabilityStatus} ({staff.activeTicketCount} open)
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" block loading={assignTicket.isPending}>
              Save Assignment
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={`Update Ticket${selectedTicket ? ` - ${selectedTicket.ticketNo}` : ""}`} open={statusOpen} onCancel={() => setStatusOpen(false)} footer={null} destroyOnClose>
        <Form
          form={statusForm}
          layout="vertical"
          onFinish={handleStatusSubmit}
        >
          <Form.Item name="status" label="Status" rules={[{ required: true, message: "Please select a status" }]}>
            <Select>
              {selectedAllowedStatuses.map((status) => (
                <Select.Option key={status} value={status}>
                  {STATUS_LABELS[status]}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          {isManager && (
            <div className="grid grid-cols-2 gap-4">
              <Form.Item name="categoryId" label="Category">
                <Select allowClear placeholder="Select category">
                  {(categoriesResponse?.data || []).map((cat) => (
                    <Select.Option key={cat.id} value={cat.id}>{cat.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="issueType" label="Issue Type">
                <Select allowClear placeholder="Select issue type">
                  <Select.Option value="HARDWARE">Hardware</Select.Option>
                  <Select.Option value="SOFTWARE">Software</Select.Option>
                </Select>
              </Form.Item>
            </div>
          )}
          {isManager && (
            <Form.Item
              noStyle
              shouldUpdate={(prev, curr) => prev.issueType !== curr.issueType}
            >
              {({ getFieldValue }) =>
                getFieldValue("issueType") === "HARDWARE" ? (
                  <Form.Item name="inventoryId" label="Affected Asset">
                    <Select
                      allowClear
                      placeholder={reporterAssets.length ? "Select the affected device" : "No assigned assets found"}
                      optionFilterProp="label"
                      options={reporterAssets.map((asset) => ({
                        value: asset.id,
                        label: `${asset.assetId} - ${asset.brand} ${asset.model} (${asset.deviceType})`,
                      }))}
                      notFoundContent="No assigned hardware assets available"
                    />
                  </Form.Item>
                ) : null
              }
            </Form.Item>
          )}
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.status !== currentValues.status}
          >
            {({ getFieldValue }) => (
              <Form.Item
                name="resolutionNotes"
                label="Resolution Notes"
                rules={
                  getFieldValue("status") === "RESOLVED"
                    ? [{ required: true, message: "Resolution notes are required when resolving a ticket" }]
                    : []
                }
              >
                <Input.TextArea rows={4} placeholder="Describe what was done on the job" />
              </Form.Item>
            )}
          </Form.Item>
          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" block loading={updateStatus.isPending}>
              Update Ticket
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={`Add Comment${selectedTicket ? ` - ${selectedTicket.ticketNo}` : ""}`} open={commentOpen} onCancel={() => setCommentOpen(false)} footer={null} destroyOnClose>
        <Form
          form={commentForm}
          layout="vertical"
          onFinish={handleCommentSubmit}
        >
          <Form.Item name="visibility" label="Visibility" initialValue="INTERNAL">
            <Select>
              <Select.Option value="INTERNAL">Internal</Select.Option>
              <Select.Option value="PUBLIC">Public</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="body" label="Comment" rules={[{ required: true, message: "Please enter a comment" }]}>
            <Input.TextArea rows={4} placeholder="Share progress, blockers, or next steps" />
          </Form.Item>
          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" block loading={addComment.isPending}>
              Add Comment
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={`Escalate Ticket${selectedTicket ? ` - ${selectedTicket.ticketNo}` : ""}`} open={escalateOpen} onCancel={() => setEscalateOpen(false)} footer={null} destroyOnClose>
        <Form
          form={escalateForm}
          layout="vertical"
          onFinish={handleEscalateSubmit}
        >
          <Form.Item name="reason" label="Escalation Reason" rules={[{ required: true, message: "Please explain why this ticket is being escalated" }]}>
            <Input.TextArea rows={4} placeholder="Describe the blocker, specialist skill needed, or why this needs higher-level attention" />
          </Form.Item>
          {canAssignTickets ? (
            <Form.Item name="assignedToId" label="Escalate To Technician (optional)">
              <Select allowClear placeholder="Leave blank to return this to the escalation queue">
                {supportStaff.map((staff) => (
                  <Select.Option key={staff.id} value={staff.id}>
                    {staff.name || staff.email} - {staff.availabilityStatus} ({staff.activeTicketCount} open)
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          ) : null}
          <Form.Item name="priority" label="Priority (optional)">
            <Select allowClear placeholder="Keep current priority">
              <Select.Option value="LOW">Low</Select.Option>
              <Select.Option value="MEDIUM">Medium</Select.Option>
              <Select.Option value="HIGH">High</Select.Option>
              <Select.Option value="CRITICAL">Critical</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.priority !== currentValues.priority}
          >
            {({ getFieldValue }) => {
              const selectedPriority = getFieldValue("priority");
              const needsJustification = ["HIGH", "CRITICAL"].includes(selectedPriority);
              return (
                <Form.Item
                  name="priorityJustification"
                  label="Priority Justification"
                  rules={
                    needsJustification
                      ? [{ required: true, message: "Justification is required for HIGH or CRITICAL priority" }]
                      : []
                  }
                >
                  <Input.TextArea
                    rows={3}
                    placeholder={
                      needsJustification
                        ? "Explain why this needs elevated urgency"
                        : "Optional note"
                    }
                  />
                </Form.Item>
              );
            }}
          </Form.Item>
          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" block loading={escalateTicket.isPending}>
              Escalate Ticket
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Open Maintenance Job${selectedTicket ? ` - ${selectedTicket.ticketNo}` : ""}`}
        open={maintenanceOpen}
        onCancel={() => setMaintenanceOpen(false)}
        footer={null}
        destroyOnClose
      >
        <div className="mb-4 rounded-2xl bg-[#F9FAFB] p-4 text-sm text-[#616161]">
          <p className="font-semibold text-[#212121]">Asset</p>
          <p className="mt-1">{selectedTicket?.inventory?.assetId} - {selectedTicket?.inventory?.itItem?.brand} {selectedTicket?.inventory?.itItem?.model}</p>
          <p className="mt-2 font-semibold text-[#212121]">Issue</p>
          <p className="mt-1">{selectedTicket?.subject}</p>
        </div>

        <Form
          form={maintenanceForm}
          layout="vertical"
          onFinish={handleMaintenanceSubmit}
        >
          {isManager ? (
            <Form.Item
              name="technicianReceivedById"
              label="Assign Technician"
              rules={[{ required: true, message: "Please select a hardware technician" }]}
            >
              <Select placeholder="Choose a hardware technician">
                {supportStaff.map((staff) => (
                  <Select.Option key={staff.id} value={staff.id}>
                    {staff.name || staff.email} - {staff.availabilityStatus}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          ) : null}

          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" block loading={createMaintenance.isPending}>
              Create Maintenance Job
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Create Ticket on Behalf of User"
        open={createOpen}
        onCancel={() => { setCreateOpen(false); createForm.resetFields(); setCreateBehalfUserId(null); }}
        footer={null}
        width={640}
        destroyOnClose
      >
        <Form
          form={createForm}
          layout="vertical"
          initialValues={{ priority: "MEDIUM" }}
          onFinish={handleCreateTicketOnBehalf}
        >
          <Form.Item
            name="onBehalfOfUserId"
            label="Reporter (creating on behalf of)"
            rules={[{ required: true, message: "Please select the user reporting this issue" }]}
          >
            <Select
              showSearch
              placeholder="Search by name, email, or staff ID"
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              onChange={(val) => { setCreateBehalfUserId(val || null); createForm.setFieldValue("inventoryId", undefined); }}
              options={(allUsersResponse?.data || []).map((u) => ({
                value: u.id,
                label: `${u.name || u.email}${u.department?.name ? ` · ${u.department.name}` : ""}${u.staffId ? ` (${u.staffId})` : ""}`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, message: "Please enter a subject" }]}
          >
            <Input placeholder="Brief description of the issue" />
          </Form.Item>
          <Form.Item
            name="priority"
            label="Priority"
            rules={[{ required: true, message: "Please select a priority" }]}
          >
            <Select placeholder="Select priority">
              <Select.Option value="LOW">Low</Select.Option>
              <Select.Option value="MEDIUM">Medium</Select.Option>
              <Select.Option value="HIGH">High</Select.Option>
              <Select.Option value="CRITICAL">Critical</Select.Option>
            </Select>
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="categoryId" label="Category">
              <Select allowClear placeholder="Select category">
                {(categoriesResponse?.data || []).map((cat) => (
                  <Select.Option key={cat.id} value={cat.id}>{cat.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="issueType" label="Issue Type">
              <Select allowClear placeholder="Select issue type">
                <Select.Option value="HARDWARE">Hardware</Select.Option>
                <Select.Option value="SOFTWARE">Software</Select.Option>
              </Select>
            </Form.Item>
          </div>
          {createBehalfUserId && (
            <Form.Item name="inventoryId" label="Affected Asset (optional)">
              <Select
                allowClear
                placeholder={createBehalfAssets.length ? "Select reporter's device (if applicable)" : "No assets found for this user"}
                disabled={!createBehalfAssets.length}
                options={createBehalfAssets.map((a) => ({
                  value: a.id,
                  label: `${a.assetId} — ${a.itItem?.brand ?? ""} ${a.itItem?.model ?? ""}`.trim(),
                }))}
              />
            </Form.Item>
          )}
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Please describe the issue" }]}
          >
            <Input.TextArea rows={4} placeholder="Provide details about the problem, error messages, or steps to reproduce" />
          </Form.Item>
          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={createTicketOnBehalf.isPending}
              style={{ backgroundColor: "#D32F2F", borderColor: "#D32F2F" }}
            >
              Create Ticket
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Bulk Reassign Tickets" open={bulkAssignOpen} onCancel={() => { setBulkAssignOpen(false); bulkAssignForm.resetFields(); }} footer={null} destroyOnClose>
        <Form
          form={bulkAssignForm}
          layout="vertical"
          onFinish={handleBulkAssignSubmit}
        >
          <p className="mb-4 text-sm text-[#616161]">Reassigning {selectedRowKeys.length} ticket(s) to:</p>
          <Form.Item name="assignedToId" label="Technician" rules={[{ required: true, message: "Please select a technician" }]}>
            <Select placeholder="Choose a technician">
              {supportStaff.map((staff) => (
                <Select.Option key={staff.id} value={staff.id}>
                  {staff.name || staff.email} ({staff.activeTicketCount} open)
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" block loading={bulkAction.isPending}>
              Reassign Tickets
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Close Ticket Confirmation Modal ── */}
      <Modal
        title="Close this ticket?"
        open={closeTicketOpen}
        onCancel={() => { setCloseTicketOpen(false); setCloseTicketRecord(null); }}
        onOk={handleCloseTicket}
        okText="Yes, close it"
        cancelText="Cancel"
        confirmLoading={closeTicketMutation.isPending}
        destroyOnClose
      >
        <p className="text-sm text-[#616161]">
          This confirms the issue is fully resolved. The ticket status will change to <strong>Closed</strong> and cannot be reopened.
        </p>
      </Modal>

      {/* ── Reporter History Modal ── */}
      <Modal
        title={reporterHistory ? `Issue History — ${reporterHistory.reporter?.name}` : "Reporter History"}
        open={reporterHistoryOpen}
        onCancel={() => { setReporterHistoryOpen(false); setHistoryReporterId(null); }}
        footer={null}
        width={820}
        destroyOnClose
      >
        {historyLoading ? (
          <div className="py-10 text-center text-sm text-[#9E9E9E]">Loading history…</div>
        ) : reporterHistory ? (
          <div className="space-y-5">
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total Tickets", value: reporterHistory.totalTickets },
                { label: "Still Open", value: reporterHistory.openTickets },
                { label: "Recurring Issues", value: reporterHistory.recurringSubjects.length + reporterHistory.recurringCategories.length },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-[#E0E0E0] bg-[#F9FAFB] p-3 text-center">
                  <p className="text-xl font-bold text-[#212121]">{value}</p>
                  <p className="text-xs text-[#9E9E9E]">{label}</p>
                </div>
              ))}
            </div>

            {/* Recurring patterns */}
            {(reporterHistory.recurringSubjects.length > 0 || reporterHistory.recurringCategories.length > 0) && (
              <div className="rounded-xl border border-[#FEE2E2] bg-[#FFF7F7] p-4">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#B91C1C]">
                  <LuTriangleAlert size={14} /> Recurring Issues Detected
                </p>
                <div className="flex flex-wrap gap-2">
                  {reporterHistory.recurringSubjects.map(({ subject, count }) => (
                    <span key={subject} className="rounded-full bg-[#FEE2E2] px-3 py-1 text-xs font-medium text-[#B91C1C]">
                      "{subject}" — {count}×
                    </span>
                  ))}
                  {reporterHistory.recurringCategories.map(({ category, count }) => (
                    <span key={category} className="rounded-full bg-[#FEF3C7] px-3 py-1 text-xs font-medium text-[#92400E]">
                      {category} — {count}×
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Ticket list */}
            <Table
              size="small"
              dataSource={reporterHistory.tickets}
              rowKey="id"
              pagination={{ pageSize: 8, size: "small" }}
              scroll={{ x: 640 }}
              columns={[
                { title: "Ticket", dataIndex: "ticketNo", key: "ticketNo", render: (v) => <span className="font-semibold">{v}</span> },
                { title: "Subject", dataIndex: "subject", key: "subject" },
                { title: "Work Type", dataIndex: ["category", "name"], key: "category", render: (v) => v || "-" },
                { title: "Priority", dataIndex: "priority", key: "priority" },
                {
                  title: "Status",
                  dataIndex: "status",
                  key: "status",
                  render: (status) => (
                    <Tag style={STATUS_STYLES[status] || DEFAULT_STATUS_STYLE} bordered={false}>
                      {STATUS_LABELS[status] || status.replaceAll("_", " ")}
                    </Tag>
                  ),
                },
                { title: "Date", dataIndex: "createdAt", key: "createdAt", render: (v) => new Date(v).toLocaleDateString() },
              ]}
            />
          </div>
        ) : null}
      </Modal>
    </PageShell>
  );
};

export default ServiceDeskQueue;
