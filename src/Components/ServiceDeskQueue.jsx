import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Dropdown, Form, Input, Modal, Select, Table, Tag } from "antd";
import { MoreOutlined, SearchOutlined } from "@ant-design/icons";
import React, { useDeferredValue, useMemo, useState } from "react";
import { LuArrowUpRight, LuMessageSquarePlus, LuPlay, LuPlus, LuRefreshCcw, LuUserRoundPlus, LuWrench } from "react-icons/lu";
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
const ESCALATION_SOURCE_STATUSES = ["ASSIGNED", "IN_PROGRESS", "WAITING_FOR_USER", "REOPENED"];

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
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [bulkAssignForm] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [createForm] = Form.useForm();
  const [statusForm] = Form.useForm();
  const [commentForm] = Form.useForm();
  const [escalateForm] = Form.useForm();
  const [maintenanceForm] = Form.useForm();
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
    const queueLabel = isHardwareTech ? "My Assigned" : isWorkshopSupervisor ? "Maintenance Jobs" : "Queue Size";
    return [
      { label: queueLabel, value: displayedTickets.length, caption: "Tickets in current view" },
      {
        label: "Unassigned",
        value: displayedTickets.filter((ticket) => !ticket.assignedToId).length,
        caption: "Need ownership",
      },
      {
        label: "Waiting On User",
        value: displayedTickets.filter((ticket) => ticket.status === "WAITING_FOR_USER").length,
        caption: "Reporter response needed",
      },
    ];
  }, [displayedTickets, isHardwareTech, isWorkshopSupervisor]);

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
  });

  const acceptTicket = useMutation({
    mutationFn: (ticketId) => api.patch(`/service-desk/tickets/${ticketId}/accept`),
    onSuccess: () => { toast.success("Ticket accepted"); refreshQueries(); },
  });

  const updateStatus = useMutation({
    mutationFn: ({ ticketId, values }) => api.patch(`/service-desk/tickets/${ticketId}/status`, values),
    onSuccess: () => {
      toast.success("Ticket updated");
      refreshQueries();
      setStatusOpen(false);
      statusForm.resetFields();
    },
  });

  const addComment = useMutation({
    mutationFn: ({ ticketId, values }) => api.post(`/service-desk/tickets/${ticketId}/comments`, values),
    onSuccess: () => {
      toast.success("Comment added");
      refreshQueries();
      setCommentOpen(false);
      commentForm.resetFields();
    },
  });

  const escalateTicket = useMutation({
    mutationFn: ({ ticketId, values }) => api.post(`/service-desk/tickets/${ticketId}/escalate`, values),
    onSuccess: () => {
      toast.success("Ticket escalated");
      refreshQueries();
      setEscalateOpen(false);
      escalateForm.resetFields();
    },
  });

  const createMaintenance = useMutation({
    mutationFn: ({ ticketId, values }) => api.post(`/service-desk/tickets/${ticketId}/maintenance`, values),
    onSuccess: () => {
      toast.success("Maintenance job created");
      refreshQueries();
      setMaintenanceOpen(false);
      maintenanceForm.resetFields();
    },
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
    onError: () => toast.error("Bulk action failed"),
  });

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
    { title: "Ticket", dataIndex: "ticketNo", key: "ticketNo", render: (value) => <span className="font-semibold">{value}</span> },
    { title: "Subject", dataIndex: "subject", key: "subject" },
    {
      title: "Reporter",
      key: "reporter",
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
    { title: "Category", dataIndex: ["category", "name"], key: "category", render: (value) => value || "General" },
    { title: "Priority", dataIndex: "priority", key: "priority" },
    {
      title: "SLA",
      dataIndex: "dueAt",
      key: "dueAt",
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
      render: (value) =>
        value ? (
          <span className="text-sm">{value}</span>
        ) : (
          <Tag bordered className="rounded-full px-2 py-0.5 text-xs font-semibold" style={UNASSIGNED_TAG_STYLE}>
            Unassigned
          </Tag>
        ),
    },
    { title: "Comments", dataIndex: ["_count", "comments"], key: "comments" },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        const items = [
          {
            key: "view",
            label: "View ticket",
            onClick: () => navigate(`/dashboard/service-desk/tickets/${record.id}`),
          },
          ...(canAcceptTicket(record)
            ? [{ key: "accept", label: getAcceptLabel(record), icon: <LuPlay size={14} />, onClick: () => acceptTicket.mutate(record.id) }]
            : []),
          ...(canAssignTickets
            ? [{ key: "assign", label: "Assign", icon: <LuUserRoundPlus size={14} />, onClick: () => openAssignModal(record) }]
            : []),
          ...(canUpdateTicket(record)
            ? [{ key: "update", label: "Update status", icon: <LuRefreshCcw size={14} />, onClick: () => openStatusModal(record) }]
            : []),
          ...(canEscalateTicket(record)
            ? [{ key: "escalate", label: "Escalate", icon: <LuArrowUpRight size={14} />, onClick: () => openEscalationModal(record) }]
            : []),
          ...(canCreateMaintenanceTicket(record)
            ? [{ key: "maintenance", label: "Open maintenance job", icon: <LuWrench size={14} />, onClick: () => openMaintenanceModal(record) }]
            : []),
          {
            key: "comment",
            label: "Add comment",
            icon: <LuMessageSquarePlus size={14} />,
            onClick: () => openCommentModal(record),
          },
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
            <Button size="small" danger onClick={() => bulkAction.mutate({ ticketIds: selectedRowKeys, action: "CLOSE" })} loading={bulkAction.isPending}>Close All</Button>
            <Button size="small" onClick={() => bulkAction.mutate({ ticketIds: selectedRowKeys, action: "ESCALATE" })} loading={bulkAction.isPending}>Escalate All</Button>
            <Button size="small" type="link" onClick={() => setSelectedRowKeys([])}>Clear</Button>
          </div>
        )}

        <Table columns={columns} dataSource={displayedTickets} rowKey="id" loading={isLoading} scroll={{ x: 1200 }}
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
          onFinish={(values) => assignTicket.mutate({ ticketId: selectedTicket.id, assignedToId: values.assignedToId })}
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
          onFinish={(values) => updateStatus.mutate({ ticketId: selectedTicket.id, values })}
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
          onFinish={(values) => addComment.mutate({ ticketId: selectedTicket.id, values })}
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
          onFinish={(values) => escalateTicket.mutate({ ticketId: selectedTicket.id, values })}
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
          onFinish={(values) => createMaintenance.mutate({ ticketId: selectedTicket.id, values })}
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
        onCancel={() => { setCreateOpen(false); createForm.resetFields(); }}
        footer={null}
        width={640}
        destroyOnClose
      >
        <Form
          form={createForm}
          layout="vertical"
          initialValues={{ priority: "MEDIUM" }}
          onFinish={(values) => createTicketOnBehalf.mutate(values)}
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
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="categoryId" label="Category">
              <Select allowClear placeholder="Select category">
                {(categoriesResponse?.data || []).map((cat) => (
                  <Select.Option key={cat.id} value={cat.id}>{cat.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="priority" label="Priority">
              <Select>
                <Select.Option value="LOW">Low</Select.Option>
                <Select.Option value="MEDIUM">Medium</Select.Option>
                <Select.Option value="HIGH">High</Select.Option>
                <Select.Option value="CRITICAL">Critical</Select.Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item name="issueType" label="Issue Type">
            <Select allowClear placeholder="Select issue type">
              <Select.Option value="HARDWARE">Hardware</Select.Option>
              <Select.Option value="SOFTWARE">Software</Select.Option>
            </Select>
          </Form.Item>
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
          onFinish={(values) => bulkAction.mutate({ ticketIds: selectedRowKeys, action: "REASSIGN", assignedToId: values.assignedToId })}
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
    </PageShell>
  );
};

export default ServiceDeskQueue;