import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, Modal, Rate, Select, Table, Tabs, Tag } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import React, { useDeferredValue, useMemo, useState } from "react";
import { LuBookOpen, LuHardDrive, LuHeadset, LuPackageSearch, LuPlus, LuStar, LuWrench } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
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

const REQUISITION_STATUS_STYLES = {
  PENDING_DEPT_APPROVAL: "bg-[#FFF7ED] text-[#C2410C]",
  PENDING_ITD_APPROVAL: "bg-[#FFF7ED] text-[#C2410C]",
  DEPT_APPROVED: "bg-[#FEF3C7] text-[#B45309]",
  ITD_APPROVED: "bg-[#ECFDF3] text-[#166534]",
  PROCESSED: "bg-[#ECFDF3] text-[#166534]",
  DEPT_DECLINED: "bg-[#FFEBEE] text-[#B71C1C]",
  ITD_DECLINED: "bg-[#FFEBEE] text-[#B71C1C]",
};

const STATUS_LABELS = { TRIAGED: "Troubleshooting" };
const formatStatusLabel = (value) => STATUS_LABELS[value] ?? (value?.replaceAll("_", " ") || "-");

const ServiceDesk = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRateOpen, setIsRateOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [createForm] = Form.useForm();
  const [ratingForm] = Form.useForm();
  const [subjectInput, setSubjectInput] = useState("");
  const [categoryInput, setCategoryInput] = useState(null);
  const deferredSubject = useDeferredValue(subjectInput.trim());
  const deferredSearch = useDeferredValue(searchText.trim());

  const { data: categoriesResponse } = useQuery({
    queryKey: ["serviceDeskCategories"],
    queryFn: () => api.get("/service-desk/categories"),
  });

  const { data: assetsResponse } = useQuery({
    queryKey: ["serviceDeskMyAssets"],
    queryFn: () => api.get("/service-desk/my-assets"),
  });

  const { data: ticketsResponse, isLoading } = useQuery({
    queryKey: ["serviceDeskTickets", deferredSearch],
    queryFn: () =>
      api.get("/service-desk/tickets", {
        params: {
          scope: "reported",
          ...(deferredSearch ? { search: deferredSearch } : {}),
        },
      }),
  });

  const tickets = ticketsResponse?.data || [];

  const activeTickets = useMemo(
    () => tickets.filter((t) => !["RESOLVED", "CLOSED", "CANCELLED"].includes(t.status)),
    [tickets]
  );
  const historyTickets = useMemo(
    () => tickets.filter((t) => ["RESOLVED", "CLOSED", "CANCELLED"].includes(t.status)),
    [tickets]
  );

  const categories = categoriesResponse?.data || [];
  const assets = assetsResponse?.data || [];

  const { data: kbSuggestionsRes } = useQuery({
    queryKey: ["kbSuggestions", deferredSubject, categoryInput],
    queryFn: () =>
      api.get("/service-desk/knowledge-base/suggest", {
        params: {
          subject: deferredSubject,
          ...(categoryInput ? { categoryId: categoryInput } : {}),
        },
      }),
    enabled: deferredSubject.length >= 3,
  });
  const kbSuggestions = kbSuggestionsRes?.data || [];

  const stats = useMemo(
    () => [
      { label: "Active Tickets", value: activeTickets.length, caption: "Issues being worked on" },
      { label: "Total Raised", value: tickets.length, caption: "All issues you have reported" },
      {
        label: "Linked Requisitions",
        value: tickets.filter((ticket) => ticket.maintenanceTicket?.requisitions?.length).length,
        caption: "Tickets with maintenance item requests",
      },
    ],
    [tickets, activeTickets]
  );

  const createTicket = useMutation({
    mutationFn: (values) => api.post("/service-desk/tickets", values),
    onSuccess: () => {
      toast.success("Service desk ticket created");
      queryClient.invalidateQueries({ queryKey: ["serviceDeskTickets"] });
      setIsCreateOpen(false);
      setSubjectInput("");
      setCategoryInput(null);
      createForm.resetFields();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to create service desk ticket");
    },
  });

  const confirmResolution = useMutation({
    mutationFn: (ticketId) => api.post(`/service-desk/tickets/${ticketId}/confirm-resolution`),
    onSuccess: () => {
      toast.success("Resolution confirmed");
      queryClient.invalidateQueries({ queryKey: ["serviceDeskTickets"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to confirm resolution");
    },
  });

  const submitSatisfaction = useMutation({
    mutationFn: ({ ticketId, values }) => api.post(`/service-desk/tickets/${ticketId}/satisfaction`, values),
    onSuccess: () => {
      toast.success("Feedback submitted");
      queryClient.invalidateQueries({ queryKey: ["serviceDeskTickets"] });
      setIsRateOpen(false);
      setSelectedTicket(null);
      ratingForm.resetFields();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to submit feedback");
    },
  });

  const handleCreateTicket = (values) => {
    const subject = values.subject?.trim();
    const description = values.description?.trim();
    if (!subject || !description) {
      toast.error("Subject and description are required.");
      return;
    }

    createTicket.mutate({
      ...values,
      subject,
      description,
    });
  };

  const handleConfirmResolution = (record) => {
    if (!record?.id) {
      toast.error("Unable to confirm this ticket. Missing ticket ID.");
      return;
    }

    confirmResolution.mutate(record.id);
  };

  const handleSubmitSatisfaction = (values) => {
    if (!selectedTicket?.id) {
      toast.error("Unable to submit feedback. Missing ticket ID.");
      return;
    }

    submitSatisfaction.mutate({
      ticketId: selectedTicket.id,
      values: { ...values, feedback: values.feedback?.trim() || undefined },
    });
  };

  const getLatestMaintenanceRequisition = (ticket) =>
    ticket?.maintenanceTicket?.requisitions?.[0] || null;

  const renderExpandedRow = (record) => {
    const latestRequisition = getLatestMaintenanceRequisition(record);

    return (
      <div className="grid grid-cols-1 gap-4 rounded-2xl bg-[#FAFAFA] p-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#F0F0F0] bg-white p-4">
          <div className="mb-2 flex items-center gap-2">
            <LuHardDrive size={16} className="text-[#D32F2F]" />
            <h4 className="text-sm font-bold text-[#212121]">Linked Asset</h4>
          </div>
          {record.inventory ? (
            <div className="space-y-1 text-sm text-[#616161]">
              <p className="font-semibold text-[#212121]">{record.inventory.assetId}</p>
              <p>{record.inventory.itItem?.brand} {record.inventory.itItem?.model}</p>
              <p>{record.inventory.itItem?.deviceType || "Unknown device type"}</p>
            </div>
          ) : (
            <p className="text-sm text-[#9E9E9E]">No asset linked to this ticket.</p>
          )}
        </div>

        <div className="rounded-2xl border border-[#F0F0F0] bg-white p-4">
          <div className="mb-2 flex items-center gap-2">
            <LuWrench size={16} className="text-[#D32F2F]" />
            <h4 className="text-sm font-bold text-[#212121]">Maintenance Flow</h4>
          </div>
          {record.maintenanceTicket ? (
            <div className="space-y-2 text-sm text-[#616161]">
              <p className="font-semibold text-[#212121]">{record.maintenanceTicket.ticketId}</p>
              {latestRequisition ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#616161]">
                      <LuPackageSearch size={12} className="text-[#D32F2F]" />
                      {latestRequisition.requisitionID}
                    </span>
                    <Tag
                      className={`rounded-full border-0 px-3 py-1 text-xs font-semibold ${
                        REQUISITION_STATUS_STYLES[latestRequisition.status] || "bg-[#F3F4F6] text-[#374151]"
                      }`}
                    >
                      {formatStatusLabel(latestRequisition.status)}
                    </Tag>
                  </div>
                  <p>{latestRequisition.itemDescription}</p>
                  <p>Quantity: {latestRequisition.quantity}</p>
                </>
              ) : (
                <p className="text-sm text-[#757575]">Maintenance job exists, but no requisition has been raised yet.</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-[#9E9E9E]">No maintenance workflow opened for this ticket.</p>
          )}
        </div>
      </div>
    );
  };

  const hasExpandableDetails = (record) =>
    Boolean(record.inventory || record.maintenanceTicket);

  const IT_ROLES = ["hardware_technician", "service_desk_manager", "workshop_supervisor", "supervisor", "admin"];
  const isITStaff = user?.roles?.some((r) => IT_ROLES.includes(r));

  const toggleExpandedRow = (recordId) => {
    setExpandedRowKeys((currentKeys) =>
      currentKeys.includes(recordId)
        ? currentKeys.filter((key) => key !== recordId)
        : [...currentKeys, recordId]
    );
  };

  const columns = [
    { title: "Ticket", dataIndex: "ticketNo", key: "ticketNo", render: (value) => <span className="font-semibold">{value}</span> },
    { title: "Subject", dataIndex: "subject", key: "subject" },
    { title: "Work Type", dataIndex: ["category", "name"], key: "category", render: (value) => value || "-" },
    { title: "Priority", dataIndex: "priority", key: "priority" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag className={`rounded-full border-0 px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status] || "bg-[#F3F4F6] text-[#374151]"}`}>
          {formatStatusLabel(status)}
        </Tag>
      ),
    },
    ...(isITStaff
      ? [{ title: "Assigned To", dataIndex: ["assignedTo", "name"], key: "assignedTo", render: (value) => value || "Unassigned" }]
      : []),
    { title: "Resolution", dataIndex: "resolutionNotes", key: "resolutionNotes", render: (value) => value || "-" },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <div className="flex flex-wrap gap-2">
          {isITStaff && hasExpandableDetails(record) ? (
            <Button size="small" onClick={() => toggleExpandedRow(record.id)}>
              {expandedRowKeys.includes(record.id) ? "Hide linked flow" : "Show linked flow"}
            </Button>
          ) : null}
          <Button size="small" onClick={() => navigate(`/dashboard/service-desk/tickets/${record.id}`)}>
            View
          </Button>
          {record.status === "RESOLVED" ? (
            <Button size="small" onClick={() => handleConfirmResolution(record)} loading={confirmResolution.isPending}>
              Confirm Fixed
            </Button>
          ) : null}
          {record.status === "CLOSED" && !record.satisfaction ? (
            <Button
              size="small"
              type="primary"
              icon={<LuStar size={14} />}
              onClick={() => {
                setSelectedTicket(record);
                setIsRateOpen(true);
              }}
            >
              Rate
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <PageShell
      eyebrow="Helpdesk"
      title="Service Desk"
      description="Report issues, track your active tickets, and review resolved cases from one workspace."
      stats={stats}
      actions={
        <>
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search my tickets"
            className="w-full md:w-[260px]"
          />
          <Button type="primary" icon={<LuPlus />} onClick={() => setIsCreateOpen(true)}>
            Report Issue
          </Button>
        </>
      }
    >
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#616161]">My Helpdesk Tickets</p>
            <h3 className="text-xl font-bold text-[#212121]">Active tickets and resolution history</h3>
          </div>
          <span className="rounded-full bg-[#FFEBEE] px-3 py-1 text-xs font-semibold text-[#D32F2F] inline-flex items-center gap-2">
            <LuHeadset size={14} /> Support workflow enabled
          </span>
        </div>

        <Tabs
          items={[
            {
              key: "active",
              label: `Active Tickets (${activeTickets.length})`,
              children: (
                <Table
                  columns={columns}
                  dataSource={activeTickets}
                  rowKey="id"
                  loading={isLoading}
                  scroll={{ x: 1100 }}
                  expandable={{
                    expandedRowRender: renderExpandedRow,
                    rowExpandable: hasExpandableDetails,
                    expandedRowKeys,
                    onExpandedRowsChange: (keys) => setExpandedRowKeys(keys),
                    showExpandColumn: false,
                  }}
                />
              ),
            },
            {
              key: "history",
              label: `History (${historyTickets.length})`,
              children: (
                <Table
                  columns={columns}
                  dataSource={historyTickets}
                  rowKey="id"
                  loading={isLoading}
                  scroll={{ x: 1100 }}
                  expandable={{
                    expandedRowRender: renderExpandedRow,
                    rowExpandable: hasExpandableDetails,
                    expandedRowKeys,
                    onExpandedRowsChange: (keys) => setExpandedRowKeys(keys),
                    showExpandColumn: false,
                  }}
                />
              ),
            },
          ]}
        />
      </section>

      <Modal title="Report an Issue" open={isCreateOpen} onCancel={() => { setIsCreateOpen(false); setSubjectInput(""); setCategoryInput(null); createForm.resetFields(); }} footer={null} width={600} destroyOnClose>
        <Form
          form={createForm}
          layout="vertical"
          initialValues={{ priority: "MEDIUM" }}
          onValuesChange={(changedValues) => {
            if (changedValues.subject !== undefined) setSubjectInput(changedValues.subject);
          }}
          onFinish={handleCreateTicket}
        >
          <Form.Item name="subject" label="Subject" rules={[{ required: true, message: "Please enter a subject" }]}>
            <Input placeholder="Short issue summary" />
          </Form.Item>

          {kbSuggestions.length > 0 && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                <LuBookOpen className="text-sm" /> Related articles that may help:
              </p>
              <ul className="space-y-1">
                {kbSuggestions.map((article) => (
                  <li key={article.id}>
                    <a
                      href={`/dashboard/knowledge-base`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {article.title}
                    </a>
                    {article.tags?.length > 0 && (
                      <span className="ml-2 text-[10px] text-gray-400">
                        {article.tags.slice(0, 3).join(", ")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Form.Item name="inventoryId" label="Affected Asset (optional)">
            <Select
              allowClear
              placeholder={assets.length ? "Select the device this issue relates to" : "No assets assigned to you"}
              disabled={!assets.length}
              options={assets.map((a) => ({
                value: a.id,
                label: `${a.assetId} — ${a.itItem?.brand ?? ""} ${a.itItem?.model ?? ""}`.trim(),
              }))}
            />
          </Form.Item>

          <Form.Item name="description" label="Description" rules={[{ required: true, message: "Please describe the issue" }]}>
            <Input.TextArea rows={5} placeholder="Describe the issue, impact, and what you have already tried" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" block loading={createTicket.isPending}>
              Submit Ticket
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Rate Support${selectedTicket ? ` - ${selectedTicket.ticketNo}` : ""}`}
        open={isRateOpen}
          onCancel={() => { setIsRateOpen(false); setSelectedTicket(null); ratingForm.resetFields(); }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={ratingForm}
          layout="vertical"
          onFinish={handleSubmitSatisfaction}
        >
          <Form.Item name="rating" label="Rating" rules={[{ required: true, message: "Please select a rating" }]}>
            <Rate count={5} />
          </Form.Item>
          <Form.Item name="feedback" label="Feedback">
            <Input.TextArea rows={4} placeholder="What went well or what should improve" />
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

export default ServiceDesk;
