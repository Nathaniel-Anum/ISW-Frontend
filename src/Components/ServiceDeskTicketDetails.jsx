import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Dropdown,
  Empty,
  Form,
  Input,
  Modal,
  Rate,
  Select,
  Tag,
  Timeline,
} from "antd";
import { MoreOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import {
  LuArrowLeft,
  LuArrowUpRight,
  LuBadgeCheck,
  LuClock3,
  LuHardDrive,
  LuHeadset,
  LuInbox,
  LuMessageSquareText,
  LuPackageSearch,
  LuPlay,
  LuRefreshCcw,
  LuRotateCcw,
  LuStar,
  LuUserRoundPlus,
  LuWrench,
} from "react-icons/lu";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../utils/config";
import { useUser } from "../utils/userContext";
import PageShell from "./ui/page-shell";

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

const REQUISITION_STATUS_STYLES = {
  PENDING_DEPT_APPROVAL: "bg-[#FFF7ED] text-[#C2410C]",
  PENDING_ITD_APPROVAL: "bg-[#FFF7ED] text-[#C2410C]",
  DEPT_APPROVED: "bg-[#FEF3C7] text-[#B45309]",
  ITD_APPROVED: "bg-[#ECFDF3] text-[#166534]",
  PROCESSED: "bg-[#ECFDF3] text-[#166534]",
  DEPT_DECLINED: "bg-[#FFEBEE] text-[#B71C1C]",
  ITD_DECLINED: "bg-[#FFEBEE] text-[#B71C1C]",
};

const STATUS_MESSAGES = {
  NEW: "Your ticket has been received and is in the queue.",
  TRIAGED: "Your ticket is now being troubleshot by a technician.",
  ASSIGNED: "A support specialist has been assigned to your ticket.",
  IN_PROGRESS: "Your ticket is currently being worked on.",
  WAITING_FOR_USER: "The support team needs further information from you. Please add a comment below.",
  RESOLVED: "Your ticket has been marked as resolved. Please confirm if the issue is fixed.",
  CLOSED: "Your ticket has been closed. Thank you for using the help desk.",
  ESCALATED: "Your ticket has been escalated to a senior support team.",
  CANCELLED: "This ticket has been cancelled.",
  REOPENED: "Your ticket has been reopened and is under review again.",
};

const SUPPORT_ROLES = ["hardware_technician", "service_desk_manager", "supervisor", "workshop_supervisor", "admin"];
const MANAGER_ROLES = ["service_desk_manager", "supervisor", "workshop_supervisor", "admin"];
const ACCEPTABLE_STATUSES = ["NEW", "TRIAGED", "ASSIGNED", "ESCALATED", "REOPENED", "WAITING_FOR_USER"];
const ESCALATION_SOURCE_STATUSES = ["ASSIGNED", "IN_PROGRESS", "WAITING_FOR_USER", "REOPENED"];

// Valid next statuses per current status (mirrors backend VALID_TRANSITIONS).
// Managers see all options; technicians see only these.
const VALID_NEXT_STATUSES = {
  NEW:               ["TRIAGED", "IN_PROGRESS", "CANCELLED"],
  TRIAGED:           ["IN_PROGRESS", "CANCELLED"],
  ASSIGNED:          ["IN_PROGRESS", "TRIAGED", "CANCELLED"],
  IN_PROGRESS:       ["WAITING_FOR_USER", "RESOLVED", "CANCELLED"],
  WAITING_FOR_USER:  ["IN_PROGRESS", "RESOLVED", "CANCELLED"],
  ESCALATED:         ["IN_PROGRESS", "RESOLVED"],
  REOPENED:          ["IN_PROGRESS", "CANCELLED"],
  RESOLVED:          ["CLOSED"],
  CLOSED:            [],
  CANCELLED:         [],
};

const ALL_STATUSES = [
  "TRIAGED", "IN_PROGRESS", "WAITING_FOR_USER",
  "RESOLVED", "CANCELLED",
];

const STATUS_LABELS = {
  TRIAGED: "Troubleshooting",
  IN_PROGRESS: "In Progress",
  WAITING_FOR_USER: "Waiting For User",
  RESOLVED: "Resolved",
  ESCALATED: "Escalated",
  CANCELLED: "Cancelled",
};

const formatLabel = (value) => value?.replaceAll("_", " ") || "-";

const formatDateTime = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
};

const AssetContextCard = ({ ticket }) => {
  if (!ticket?.inventory) {
    return null;
  }

  return (
    <section className="rounded-[24px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
      <div className="mb-4 flex items-center gap-2">
        <LuHardDrive size={18} className="text-[#D32F2F]" />
        <h4 className="text-lg font-bold text-[#212121]">Linked Asset</h4>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-[#FAFAFA] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9E9E9E]">Asset ID</p>
          <p className="mt-1 font-medium text-[#212121]">{ticket.inventory.assetId}</p>
        </div>
        <div className="rounded-2xl bg-[#FAFAFA] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9E9E9E]">Device</p>
          <p className="mt-1 font-medium text-[#212121]">
            {ticket.inventory.itItem?.brand} {ticket.inventory.itItem?.model}
          </p>
          <p className="text-xs text-[#757575]">{formatLabel(ticket.inventory.itItem?.deviceType)}</p>
        </div>
      </div>
    </section>
  );
};

const MaintenanceWorkflowCard = ({
  ticket,
  canCreateMaintenance = false,
  onCreateMaintenance,
  maintenanceBusy = false,
}) => {
  const maintenanceTicket = ticket?.maintenanceTicket;
  const maintenanceActions = [
    {
      key: "open-maintenance-job",
      label: "Open Maintenance Job",
      onClick: onCreateMaintenance,
      disabled: maintenanceBusy,
    },
  ];

  if (!ticket?.inventory && !maintenanceTicket) {
    return null;
  }

  return (
    <section className="rounded-[24px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <LuWrench size={18} className="text-[#D32F2F]" />
          <h4 className="text-lg font-bold text-[#212121]">Maintenance Workflow</h4>
        </div>
        {canCreateMaintenance ? (
          <Dropdown menu={{ items: maintenanceActions }} trigger={["click"]} placement="bottomRight">
            <Button size="small" type="text" icon={<MoreOutlined />} aria-label="Maintenance workflow options" loading={maintenanceBusy} />
          </Dropdown>
        ) : null}
      </div>

      {maintenanceTicket ? (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-[#FAFAFA] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9E9E9E]">Maintenance Ticket</p>
              <p className="mt-1 font-medium text-[#212121]">{maintenanceTicket.ticketId}</p>
              <p className="text-xs text-[#757575]">Opened {formatDateTime(maintenanceTicket.dateLogged)}</p>
            </div>
            <div className="rounded-2xl bg-[#FAFAFA] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9E9E9E]">Technician</p>
              <p className="mt-1 font-medium text-[#212121]">
                {maintenanceTicket.technicianReceived?.name || maintenanceTicket.technicianReceived?.email || "Assigned technician"}
              </p>
              <p className="text-xs text-[#757575]">
                {maintenanceTicket.dateResolved ? `Resolved ${formatDateTime(maintenanceTicket.dateResolved)}` : "Job still in progress"}
              </p>
            </div>
          </div>

          {maintenanceTicket.actionTaken ? (
            <div className="mt-4 rounded-2xl bg-[#FFF8F7] px-4 py-3 text-sm text-[#616161]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9E9E9E]">Action Taken</p>
              <p className="mt-1 text-[#424242]">{maintenanceTicket.actionTaken}</p>
            </div>
          ) : null}

          <div className="mt-5">
            <div className="mb-3 flex items-center gap-2">
              <LuPackageSearch size={16} className="text-[#D32F2F]" />
              <h5 className="text-sm font-bold uppercase tracking-[0.18em] text-[#616161]">Linked Requisitions</h5>
            </div>

            {maintenanceTicket.requisitions?.length ? (
              <div className="space-y-3">
                {maintenanceTicket.requisitions.map((requisition) => (
                  <article key={requisition.id} className="rounded-2xl border border-[#F0F0F0] bg-[#FAFAFA] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[#212121]">{requisition.requisitionID}</p>
                        <p className="text-xs text-[#757575]">{formatDateTime(requisition.createdAt)}</p>
                      </div>
                      <Tag className={`rounded-full border-0 px-3 py-1 text-xs font-semibold ${REQUISITION_STATUS_STYLES[requisition.status] || "bg-[#F3F4F6] text-[#374151]"}`}>
                        {formatLabel(requisition.status)}
                      </Tag>
                    </div>
                    <p className="mt-3 text-sm font-medium text-[#212121]">{requisition.itemDescription}</p>
                    <p className="mt-1 text-sm text-[#616161]">Qty: {requisition.quantity}</p>
                    <p className="mt-1 text-sm text-[#616161]">{requisition.purpose}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#E0E0E0] bg-[#F9FAFB] px-4 py-5 text-sm text-[#757575]">
                No maintenance requisitions have been raised for this job yet.
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-[#E0E0E0] bg-[#F9FAFB] px-4 py-5 text-sm text-[#616161]">
          <p className="font-semibold text-[#212121]">No maintenance job has been opened yet.</p>
          <p className="mt-1">This ticket is linked to an asset and can be pushed into the maintenance workflow when hands-on workshop action is required.</p>
        </div>
      )}
    </section>
  );
};

// â”€â”€â”€ Reporter (minimal) view â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ReporterView = ({ ticket, ticketId, isLoading, refreshQueries }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [ratingOpen, setRatingOpen] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const [commentForm] = Form.useForm();
  const [ratingForm] = Form.useForm();
  const [reopenForm] = Form.useForm();

  const confirmResolution = useMutation({
    mutationFn: () => api.post(`/service-desk/tickets/${ticketId}/confirm-resolution`),
    onSuccess: () => { toast.success("Resolution confirmed"); refreshQueries(); },
  });

  const reopenTicket = useMutation({
    mutationFn: (values) => api.post(`/service-desk/tickets/${ticketId}/reopen`, values),
    onSuccess: () => {
      toast.success("Ticket reopened — the support team has been notified");
      refreshQueries();
      setReopenOpen(false);
      reopenForm.resetFields();
    },
  });

  const submitSatisfaction = useMutation({
    mutationFn: (values) => api.post(`/service-desk/tickets/${ticketId}/satisfaction`, values),
    onSuccess: () => {
      toast.success("Feedback submitted");
      refreshQueries();
      setRatingOpen(false);
      ratingForm.resetFields();
    },
  });

  const addComment = useMutation({
    mutationFn: (values) => api.post(`/service-desk/tickets/${ticketId}/comments`, { ...values, visibility: "PUBLIC" }),
    onSuccess: () => { toast.success("Message sent"); refreshQueries(); commentForm.resetFields(); },
  });

  const lifecycleItems = useMemo(() => {
    if (!ticket) return [];
    return [
      { key: `created`, date: ticket.createdAt, color: "blue", title: "Ticket submitted", description: "We received your request and it's in the queue." },
      ticket.firstResponseAt ? { key: `first-response`, date: ticket.firstResponseAt, color: "blue", title: "Support team responded", description: "A support specialist started reviewing your ticket." } : null,
      ticket.resolvedAt ? { key: `resolved`, date: ticket.resolvedAt, color: "green", title: "Marked as resolved", description: ticket.resolutionNotes || "The support team marked this ticket resolved." } : null,
      ticket.requesterConfirmedAt ? { key: `confirmed`, date: ticket.requesterConfirmedAt, color: "green", title: "You confirmed the fix", description: "You confirmed the issue was resolved." } : null,
      ticket.closedAt ? { key: `closed`, date: ticket.closedAt, color: "gray", title: "Ticket closed", description: "This ticket has been closed." } : null,
    ]
      .filter(Boolean)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((item) => ({
        color: item.color,
        children: (
          <div className="pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-[#212121]">{item.title}</p>
              <span className="text-xs text-[#757575]">{formatDateTime(item.date)}</span>
            </div>
            <p className="mt-1 text-sm leading-6 text-[#616161]">{item.description}</p>
          </div>
        ),
      }));
  }, [ticket]);

  const publicComments = useMemo(
    () => (ticket?.comments || []).filter((c) => c.visibility === "PUBLIC"),
    [ticket],
  );

  return (
    <PageShell
      eyebrow="Help Desk"
      title={ticket ? ticket.ticketNo : "Your Ticket"}
      description="Track the progress of your support request."
      stats={[
        { label: "Status", value: formatLabel(ticket?.status), caption: "Current stage of your ticket" },
        { label: "Priority", value: formatLabel(ticket?.priority), caption: "How urgently this is being handled" },
        { label: "Submitted", value: formatDateTime(ticket?.createdAt), caption: "When you raised this ticket" },
      ]}
      actions={
        <>
          <Button icon={<LuArrowLeft size={16} />} onClick={() => navigate(-1)}>Back</Button>
          {ticket?.status === "RESOLVED" ? (
            <Button type="primary" icon={<LuBadgeCheck size={15} />} onClick={() => confirmResolution.mutate()} loading={confirmResolution.isPending}>
              Confirm Fixed
            </Button>
          ) : null}
          {ticket?.status === "RESOLVED" ? (
            <Button danger icon={<LuRotateCcw size={15} />} onClick={() => setReopenOpen(true)}>
              Not Fixed — Reopen
            </Button>
          ) : null}
          {ticket?.status === "CLOSED" && !ticket?.satisfaction ? (
            <Button type="primary" icon={<LuStar size={15} />} onClick={() => setRatingOpen(true)}>
              Rate Support
            </Button>
          ) : null}
        </>
      }
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
        {/* Left: ticket overview */}
        <div className="space-y-5">
          {/* Header card */}
          <section className="rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-bold text-[#212121]">{ticket?.subject}</h3>
              {ticket ? (
                <Tag className={`rounded-full border-0 px-3 py-1 text-xs font-semibold ${STATUS_STYLES[ticket.status] || "bg-[#F3F4F6] text-[#374151]"}`}>
                  {formatLabel(ticket.status)}
                </Tag>
              ) : null}
              {ticket ? (
                <Tag className={`rounded-full border-0 px-3 py-1 text-xs font-semibold ${PRIORITY_STYLES[ticket.priority] || "bg-[#F3F4F6] text-[#374151]"}`}>
                  {formatLabel(ticket.priority)}
                </Tag>
              ) : null}
            </div>

            <p className="mt-4 text-sm leading-7 text-[#616161]">{ticket?.description}</p>

            {/* Status message banner */}
            {ticket?.status ? (
              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#F9FAFB] p-4">
                <LuHeadset size={18} className="mt-0.5 shrink-0 text-[#D32F2F]" />
                <p className="text-sm leading-6 text-[#374151]">
                  {STATUS_MESSAGES[ticket.status] || "Your ticket is being processed."}
                </p>
              </div>
            ) : null}

            {/* Meta info */}
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-[#616161]">
              {ticket?.category?.name ? (
                <div className="rounded-xl bg-[#FAFAFA] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#9E9E9E]">Category</p>
                  <p className="mt-1 font-medium text-[#212121]">{ticket.category.name}</p>
                </div>
              ) : null}
              {ticket?.issueType ? (
                <div className="rounded-xl bg-[#FAFAFA] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#9E9E9E]">Issue Type</p>
                  <p className="mt-1 font-medium text-[#212121]">{formatLabel(ticket.issueType)}</p>
                </div>
              ) : null}
              <div className="rounded-xl bg-[#FAFAFA] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#9E9E9E]">Submitted</p>
                <p className="mt-1 font-medium text-[#212121]">{formatDateTime(ticket?.createdAt)}</p>
              </div>
              {ticket?.resolvedAt ? (
                <div className="rounded-xl bg-[#FAFAFA] px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#9E9E9E]">Resolved</p>
                  <p className="mt-1 font-medium text-[#212121]">{formatDateTime(ticket.resolvedAt)}</p>
                </div>
              ) : null}
            </div>
          </section>

          <AssetContextCard ticket={ticket} />
          <MaintenanceWorkflowCard ticket={ticket} />

          {/* Timeline */}
          <section className="rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
            <div className="mb-4 flex items-center gap-2">
              <LuClock3 size={18} className="text-[#D32F2F]" />
              <h4 className="text-lg font-bold text-[#212121]">Ticket Progress</h4>
            </div>
            {lifecycleItems.length ? (
              <Timeline items={lifecycleItems} />
            ) : (
              <Empty description="No progress recorded yet" />
            )}
          </section>
        </div>

        {/* Right: comments */}
        <div className="space-y-5">
          <section className="rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
            <div className="mb-4 flex items-center gap-2">
              <LuMessageSquareText size={18} className="text-[#D32F2F]" />
              <h4 className="text-lg font-bold text-[#212121]">Messages</h4>
            </div>

            <div className="space-y-4">
              {publicComments.length ? (
                publicComments.map((comment) => (
                  <article key={comment.id} className="rounded-2xl border border-[#F0F0F0] bg-[#FAFAFA] p-4">
                    <p className="text-sm font-semibold text-[#212121]">{comment.author?.name || "Support Team"}</p>
                    <p className="text-xs text-[#757575]">{formatDateTime(comment.createdAt)}</p>
                    <p className="mt-3 text-sm leading-6 text-[#616161]">{comment.body}</p>
                  </article>
                ))
              ) : (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <LuInbox size={32} className="text-[#E0E0E0]" />
                  <p className="text-sm text-[#9E9E9E]">No messages yet. The support team will respond here.</p>
                </div>
              )}
            </div>
          </section>

          {ticket?.status !== "CLOSED" && ticket?.status !== "CANCELLED" ? (
            <section className="rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
              <h4 className="text-base font-bold text-[#212121]">Send a Message</h4>
              <p className="mt-1 text-sm text-[#616161]">Add any extra details or respond to the support team.</p>
              <Form form={commentForm} layout="vertical" className="mt-4" onFinish={(values) => addComment.mutate(values)}>
                <Form.Item name="body" rules={[{ required: true, message: "Please enter a message" }]}>
                  <Input.TextArea rows={4} placeholder="Type your message hereâ€¦" />
                </Form.Item>
                <Form.Item className="mb-0">
                  <Button type="primary" htmlType="submit" block loading={addComment.isPending}>
                    Send Message
                  </Button>
                </Form.Item>
              </Form>
            </section>
          ) : null}

          {ticket?.satisfaction ? (
            <section className="rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
              <div className="flex items-center gap-2">
                <LuStar size={16} className="text-[#D32F2F]" />
                <h4 className="text-base font-bold text-[#212121]">Your Feedback</h4>
              </div>
              <Rate disabled defaultValue={ticket.satisfaction.rating} className="mt-3" />
              {ticket.satisfaction.feedback ? (
                <p className="mt-2 text-sm text-[#616161]">{ticket.satisfaction.feedback}</p>
              ) : null}
            </section>
          ) : null}
        </div>
      </div>

      <Modal title="Reopen Ticket" open={reopenOpen} onCancel={() => setReopenOpen(false)} footer={null} destroyOnClose>
        <p className="mb-4 text-sm text-[#616161]">
          Tell the support team why the issue was not resolved. They will be notified and pick it up again.
        </p>
        <Form form={reopenForm} layout="vertical" onFinish={(values) => reopenTicket.mutate(values)}>
          <Form.Item name="reason" label="What is still wrong?" rules={[{ required: true, message: "Please describe the issue" }]}>
            <Input.TextArea rows={4} placeholder="e.g. The problem came back after restarting, the fix only worked temporarily…" />
          </Form.Item>
          <Form.Item className="mb-0">
            <Button danger htmlType="submit" block loading={reopenTicket.isPending}>
              Submit — Reopen Ticket
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Rate Support" open={ratingOpen} onCancel={() => setRatingOpen(false)} footer={null} destroyOnClose>
        <Form form={ratingForm} layout="vertical" onFinish={(values) => submitSatisfaction.mutate(values)}>
          <Form.Item name="rating" label="How would you rate the support you received?" rules={[{ required: true, message: "Please select a rating" }]}>
            <Rate count={5} />
          </Form.Item>
          <Form.Item name="feedback" label="Feedback (optional)">
            <Input.TextArea rows={4} placeholder="What went well or what could be improved?" />
          </Form.Item>
          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" block loading={submitSatisfaction.isPending}>
              Submit Feedback
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageShell>
  );
};

// â”€â”€â”€ Support staff (full) view â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const SupportView = ({ ticket, ticketId, isLoading, refreshQueries, user }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [assignOpen, setAssignOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [escalateOpen, setEscalateOpen] = useState(false);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [commentForm] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [statusForm] = Form.useForm();
  const [escalateForm] = Form.useForm();
  const [maintenanceForm] = Form.useForm();

  const isManager = user?.roles?.some((role) => MANAGER_ROLES.includes(role));
  const canAssignTickets = user?.roles?.includes("service_desk_manager") || user?.roles?.includes("admin");
  const canUpdateTickets =
    user?.roles?.includes("hardware_technician") ||
    user?.roles?.includes("service_desk_manager") ||
    user?.roles?.includes("supervisor") ||
    user?.roles?.includes("workshop_supervisor") ||
    user?.roles?.includes("admin");
  const canAcceptTickets =
    user?.roles?.includes("hardware_technician") ||
    user?.roles?.includes("supervisor") ||
    user?.roles?.includes("workshop_supervisor") ||
    user?.roles?.includes("admin");

  // Which statuses this user can move to from the current ticket state
  const allowedNextStatuses = ticket
    ? isManager
      ? ALL_STATUSES
      : (VALID_NEXT_STATUSES[ticket.status] || [])
    : [];

  // Whether the current user can "accept" (self-assign + start work) this ticket
  const canAccept =
    canAcceptTickets &&
    ticket &&
    ACCEPTABLE_STATUSES.includes(ticket.status) &&
    (!ticket.assignedToId || ticket.assignedToId === user?.id);

  const canOpenStatusUpdate =
    canUpdateTickets &&
    ticket &&
    (isManager || ticket.assignedToId === user?.id) &&
    allowedNextStatuses.length > 0;

  const canEscalate =
    canUpdateTickets &&
    ticket &&
    (isManager || ticket.assignedToId === user?.id) &&
    ESCALATION_SOURCE_STATUSES.includes(ticket.status);
  const canCreateMaintenance =
    canUpdateTickets &&
    ticket &&
    ticket.issueType === "HARDWARE" &&
    ticket.inventory &&
    !ticket.maintenanceTicket &&
    (isManager || ticket.assignedToId === user?.id);

  const acceptLabel = ticket?.assignedToId === user?.id ? "Start Work" : "Accept Ticket";

  const { data: supportStaffResponse } = useQuery({
    queryKey: ["serviceDeskSupportStaff"],
    queryFn: () => api.get("/service-desk/support-staff"),
    enabled: canAssignTickets || isManager,
  });
  const supportStaff = supportStaffResponse?.data || [];

  const acceptTicket = useMutation({
    mutationFn: () => api.patch(`/service-desk/tickets/${ticketId}/accept`),
    onSuccess: () => { toast.success("Ticket accepted — you are now working on it"); refreshQueries(); },
  });

  const assignTicket = useMutation({
    mutationFn: (values) => api.patch(`/service-desk/tickets/${ticketId}/assign`, values),
    onSuccess: () => { toast.success("Ticket assigned"); refreshQueries(); setAssignOpen(false); assignForm.resetFields(); },
  });

  const updateStatus = useMutation({
    mutationFn: (values) => api.patch(`/service-desk/tickets/${ticketId}/status`, values),
    onSuccess: () => { toast.success("Ticket updated"); refreshQueries(); setStatusOpen(false); statusForm.resetFields(); },
  });

  const escalateTicket = useMutation({
    mutationFn: (values) => api.post(`/service-desk/tickets/${ticketId}/escalate`, values),
    onSuccess: () => {
      toast.success("Ticket escalated");
      refreshQueries();
      setEscalateOpen(false);
      escalateForm.resetFields();
    },
  });

  const addComment = useMutation({
    mutationFn: (values) => api.post(`/service-desk/tickets/${ticketId}/comments`, values),
    onSuccess: () => { toast.success("Comment added"); refreshQueries(); commentForm.resetFields(); },
  });

  const createMaintenance = useMutation({
    mutationFn: (values) => api.post(`/service-desk/tickets/${ticketId}/maintenance`, values),
    onSuccess: () => {
      toast.success("Maintenance job created");
      refreshQueries();
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      setMaintenanceOpen(false);
      maintenanceForm.resetFields();
    },
  });

  const timelineItems = useMemo(() => {
    if (!ticket) return [];
    const lifecycleItems = [
      { key: `created-${ticket.id}`, date: ticket.createdAt, color: "red", title: "Ticket created", description: `${ticket.ticketNo} was reported by ${ticket.reporter?.name || ticket.reporter?.email || "the requester"}.` },
      ticket.firstResponseAt ? { key: `first-response-${ticket.id}`, date: ticket.firstResponseAt, color: "blue", title: "First response logged", description: "A support owner started active handling on the ticket." } : null,
      ticket.resolvedAt ? { key: `resolved-${ticket.id}`, date: ticket.resolvedAt, color: "green", title: "Ticket resolved", description: ticket.resolutionNotes || "Resolution notes were added by the support team." } : null,
      ticket.requesterConfirmedAt ? { key: `confirmed-${ticket.id}`, date: ticket.requesterConfirmedAt, color: "green", title: "Resolution confirmed", description: "The requester confirmed the outcome." } : null,
      ticket.closedAt ? { key: `closed-${ticket.id}`, date: ticket.closedAt, color: "gray", title: "Ticket closed", description: "The service desk workflow was completed." } : null,
    ].filter(Boolean);

    const commentItems = (ticket.comments || []).map((comment) => ({
      key: comment.id,
      date: comment.createdAt,
      color: comment.visibility === "INTERNAL" ? "orange" : "blue",
      title: `${comment.visibility === "INTERNAL" ? "Internal" : "Public"} comment`,
      description: `${comment.author?.name || comment.author?.email || "Support"}: ${comment.body}`,
    }));

    return [...lifecycleItems, ...commentItems]
      .sort((l, r) => new Date(l.date) - new Date(r.date))
      .map((item) => ({
        color: item.color,
        children: (
          <div className="pb-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-[#212121]">{item.title}</p>
              <span className="text-xs text-[#757575]">{formatDateTime(item.date)}</span>
            </div>
            <p className="mt-1 text-sm leading-6 text-[#616161]">{item.description}</p>
          </div>
        ),
      }));
  }, [ticket]);

  const stats = useMemo(() => {
    if (!ticket) return [];
    return [
      { label: "Current Status", value: formatLabel(ticket.status), caption: "Latest lifecycle stage" },
      { label: "Priority", value: formatLabel(ticket.priority), caption: "Operational urgency" },
      { label: "Comments", value: ticket._count?.comments || 0, caption: "Recorded updates on the ticket" },
    ];
  }, [ticket]);

  return (
    <PageShell
      eyebrow="Helpdesk"
      title={ticket ? `${ticket.ticketNo} Details` : "Ticket Details"}
      description="Review the full ticket context, operational timeline, comments, and next actions from one screen."
      stats={stats}
      actions={
        <>
          <Button icon={<LuArrowLeft size={16} />} onClick={() => navigate(-1)}>Back</Button>
          {canAccept ? (
            <Button icon={<LuPlay size={15} />} onClick={() => acceptTicket.mutate()} loading={acceptTicket.isPending}>
              {acceptLabel}
            </Button>
          ) : null}
          {canAssignTickets ? (
            <Button icon={<LuUserRoundPlus size={15} />} onClick={() => { assignForm.setFieldsValue({ assignedToId: ticket?.assignedToId }); setAssignOpen(true); }}>
              Assign
            </Button>
          ) : null}
          {canEscalate ? (
            <Button icon={<LuArrowUpRight size={15} />} onClick={() => { escalateForm.resetFields(); setEscalateOpen(true); }}>
              Escalate
            </Button>
          ) : null}
          {canOpenStatusUpdate ? (
            <Button type="primary" icon={<LuRefreshCcw size={15} />} onClick={() => { statusForm.setFieldsValue({ status: ticket?.status, resolutionNotes: ticket?.resolutionNotes }); setStatusOpen(true); }}>
              Update Status
            </Button>
          ) : null}
        </>
      }
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.95fr)]">
        <section className="space-y-6 rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#F1F1F1] pb-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-2xl font-bold text-[#212121]">{ticket?.subject || "Loading ticket"}</h3>
                {ticket ? (
                  <Tag className={`rounded-full border-0 px-3 py-1 text-xs font-semibold ${STATUS_STYLES[ticket.status] || "bg-[#F3F4F6] text-[#374151]"}`}>
                    {formatLabel(ticket.status)}
                  </Tag>
                ) : null}
                {ticket ? (
                  <Tag className={`rounded-full border-0 px-3 py-1 text-xs font-semibold ${PRIORITY_STYLES[ticket.priority] || "bg-[#F3F4F6] text-[#374151]"}`}>
                    {formatLabel(ticket.priority)}
                  </Tag>
                ) : null}
              </div>
              <p className="mt-3 text-sm leading-7 text-[#616161]">{ticket?.description}</p>
            </div>
            <div className="rounded-2xl bg-[#FFF7F7] px-4 py-3 text-sm text-[#616161]">
              <p className="font-semibold text-[#212121]">Assigned To</p>
              <p className="mt-1">{ticket?.assignedTo?.name || ticket?.assignedTo?.email || "Unassigned"}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-[#FAFAFA] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9E9E9E]">Reporter</p>
              <p className="mt-2 text-sm font-semibold text-[#212121]">{ticket?.reporter?.name || "-"}</p>
              <p className="text-sm text-[#616161]">{ticket?.reporter?.email || "-"}</p>
              <p className="mt-1 text-xs text-[#757575]">Staff ID: {ticket?.reporter?.staffId || "-"}</p>
            </div>
            <div className="rounded-2xl bg-[#FAFAFA] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9E9E9E]">Category</p>
              <p className="mt-2 text-sm font-semibold text-[#212121]">{ticket?.category?.name || "General"}</p>
              <p className="text-sm text-[#616161]">{ticket?.department?.name || "No department"}</p>
              <p className="mt-1 text-xs text-[#757575]">Unit: {ticket?.unit?.name || "Not assigned"}</p>
            </div>
            <div className="rounded-2xl bg-[#FAFAFA] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9E9E9E]">Timing</p>
              <p className="mt-2 text-sm text-[#616161]">Created: {formatDateTime(ticket?.createdAt)}</p>
              <p className="text-sm text-[#616161]">First response: {formatDateTime(ticket?.firstResponseAt)}</p>
              <p className="text-sm text-[#616161]">Due: {formatDateTime(ticket?.dueAt)}</p>
            </div>
            <div className="rounded-2xl bg-[#FAFAFA] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9E9E9E]">Resolution</p>
              <p className="mt-2 text-sm text-[#616161]">Resolved: {formatDateTime(ticket?.resolvedAt)}</p>
              <p className="text-sm text-[#616161]">Confirmed: {formatDateTime(ticket?.requesterConfirmedAt)}</p>
              <p className="text-sm text-[#616161]">Closed: {formatDateTime(ticket?.closedAt)}</p>
            </div>
          </div>

          <AssetContextCard ticket={ticket} />
          <MaintenanceWorkflowCard
            ticket={ticket}
            canCreateMaintenance={canCreateMaintenance}
            onCreateMaintenance={() => {
              maintenanceForm.setFieldsValue({ technicianReceivedById: ticket?.assignedToId || user?.id });
              setMaintenanceOpen(true);
            }}
            maintenanceBusy={createMaintenance.isPending}
          />

          <div className="rounded-[24px] border border-[#F0F0F0] bg-[#FCFCFC] p-5">
            <div className="mb-4 flex items-center gap-2">
              <LuClock3 size={18} className="text-[#D32F2F]" />
              <h4 className="text-lg font-bold text-[#212121]">Activity Timeline</h4>
            </div>
            <Timeline items={timelineItems} />
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
            <div className="mb-4 flex items-center gap-2">
              <LuMessageSquareText size={18} className="text-[#D32F2F]" />
              <h4 className="text-lg font-bold text-[#212121]">Comments</h4>
            </div>
            <div className="space-y-4">
              {(ticket?.comments || []).length ? (
                ticket.comments.map((comment) => (
                  <article key={comment.id} className="rounded-2xl border border-[#F0F0F0] bg-[#FAFAFA] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[#212121]">{comment.author?.name || comment.author?.email || "User"}</p>
                        <p className="text-xs text-[#757575]">{formatDateTime(comment.createdAt)}</p>
                      </div>
                      <Tag className={`rounded-full border-0 px-3 py-1 text-xs font-semibold ${comment.visibility === "INTERNAL" ? "bg-[#FFF7ED] text-[#C2410C]" : "bg-[#EFF6FF] text-[#1D4ED8]"}`}>
                        {comment.visibility}
                      </Tag>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#616161]">{comment.body}</p>
                  </article>
                ))
              ) : (
                <Empty description="No comments recorded yet" />
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
            <h4 className="text-lg font-bold text-[#212121]">Add Update</h4>
            <p className="mt-1 text-sm text-[#616161]">Capture user-visible updates or internal notes directly on the ticket.</p>
            <Form form={commentForm} layout="vertical" className="mt-5" onFinish={(values) => addComment.mutate(values)}>
              <Form.Item name="visibility" label="Visibility" initialValue="INTERNAL">
                <Select>
                  <Select.Option value="INTERNAL">Internal</Select.Option>
                  <Select.Option value="PUBLIC">Public</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="body" label="Comment" rules={[{ required: true, message: "Please enter a comment" }]}>
                <Input.TextArea rows={5} placeholder="Share progress, blockers, resolution details, or follow-up questions" />
              </Form.Item>
              <Form.Item className="mb-0">
                <Button type="primary" htmlType="submit" block loading={addComment.isPending}>
                  Save Comment
                </Button>
              </Form.Item>
            </Form>
          </div>
        </section>
      </div>

      {/* Assign modal */}
      <Modal title={`Assign Ticket${ticket ? ` - ${ticket.ticketNo}` : ""}`} open={assignOpen} onCancel={() => setAssignOpen(false)} footer={null} destroyOnClose>
        <Form form={assignForm} layout="vertical" onFinish={(values) => assignTicket.mutate(values)}>
          <Form.Item name="assignedToId" label="Assign Technician" rules={[{ required: true, message: "Please select a technician" }]}>
            <Select placeholder="Choose a technician">
              {supportStaff.map((staff) => (
                <Select.Option key={staff.id} value={staff.id}>
                  {staff.name || staff.email} â€” {staff.availabilityStatus} ({staff.activeTicketCount} open)
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" block loading={assignTicket.isPending}>Save Assignment</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Status modal */}
      <Modal title={`Update Ticket${ticket ? ` - ${ticket.ticketNo}` : ""}`} open={statusOpen} onCancel={() => setStatusOpen(false)} footer={null} destroyOnClose>
        <Form form={statusForm} layout="vertical" onFinish={(values) => updateStatus.mutate(values)}>
          <Form.Item name="status" label="Status" rules={[{ required: true, message: "Please select a status" }]}>
            <Select>
              {allowedNextStatuses.map((s) => (
                <Select.Option key={s} value={s}>{STATUS_LABELS[s]}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="Priority (optional — update if triage changes urgency)">
            <Select allowClear placeholder="Keep current priority">
              <Select.Option value="LOW">Low</Select.Option>
              <Select.Option value="MEDIUM">Medium</Select.Option>
              <Select.Option value="HIGH">High</Select.Option>
              <Select.Option value="CRITICAL">Critical</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.status !== currentValues.status}>
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
            <Button type="primary" htmlType="submit" block loading={updateStatus.isPending}>Update Ticket</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={`Escalate Ticket${ticket ? ` - ${ticket.ticketNo}` : ""}`} open={escalateOpen} onCancel={() => setEscalateOpen(false)} footer={null} destroyOnClose>
        <Form form={escalateForm} layout="vertical" onFinish={(values) => escalateTicket.mutate(values)}>
          <Form.Item name="reason" label="Escalation Reason" rules={[{ required: true, message: "Please provide an escalation reason" }]}>
            <Input.TextArea rows={4} placeholder="Explain why this ticket needs escalation, what has been tried, and what support is needed next." />
          </Form.Item>
          {canAssignTickets ? (
            <Form.Item name="assignedToId" label="Reassign To Technician (optional)">
              <Select allowClear placeholder="Leave empty to return the ticket to the escalated queue">
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
            <Button type="primary" htmlType="submit" block loading={escalateTicket.isPending}>Escalate Ticket</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Open Maintenance Job${ticket ? ` - ${ticket.ticketNo}` : ""}`}
        open={maintenanceOpen}
        onCancel={() => setMaintenanceOpen(false)}
        footer={null}
        destroyOnClose
      >
        <div className="mb-4 rounded-2xl bg-[#F9FAFB] p-4 text-sm text-[#616161]">
          <p className="font-semibold text-[#212121]">Asset</p>
          <p className="mt-1">{ticket?.inventory?.assetId} - {ticket?.inventory?.itItem?.brand} {ticket?.inventory?.itItem?.model}</p>
          <p className="mt-2 font-semibold text-[#212121]">Issue</p>
          <p className="mt-1">{ticket?.subject}</p>
        </div>

        <Form form={maintenanceForm} layout="vertical" onFinish={(values) => createMaintenance.mutate(values)}>
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
    </PageShell>
  );
};

// â”€â”€â”€ Root component (decides which view to render) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ServiceDeskTicketDetails = () => {
  const { ticketId } = useParams();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isSupport = user?.roles?.some((role) => SUPPORT_ROLES.includes(role));

  const { data: ticketResponse, isLoading } = useQuery({
    queryKey: ["serviceDeskTicket", ticketId],
    queryFn: () => api.get(`/service-desk/tickets/${ticketId}`),
    enabled: Boolean(ticketId),
  });

  const ticket = ticketResponse?.data;

  const refreshQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["serviceDeskTicket", ticketId] });
    queryClient.invalidateQueries({ queryKey: ["serviceDeskTickets"] });
    queryClient.invalidateQueries({ queryKey: ["serviceDeskQueue"] });
  };

  if (!ticket && !isLoading) {
    return (
      <PageShell
        eyebrow="Help Desk"
        title="Ticket Details"
        description="The selected ticket could not be loaded."
        actions={
          <Button icon={<LuArrowLeft size={16} />} onClick={() => navigate("/dashboard/service-desk")}>
            Back to Service Desk
          </Button>
        }
      >
        <section className="rounded-[28px] border border-[#E0E0E0] bg-white p-8 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <Empty description="Ticket not found or no longer accessible" />
        </section>
      </PageShell>
    );
  }

  if (isSupport) {
    return <SupportView ticket={ticket} ticketId={ticketId} isLoading={isLoading} refreshQueries={refreshQueries} user={user} />;
  }

  return <ReporterView ticket={ticket} ticketId={ticketId} isLoading={isLoading} refreshQueries={refreshQueries} />;
};

export default ServiceDeskTicketDetails;
