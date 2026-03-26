import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import { Button, DatePicker, Dropdown, Form, Input, Modal, Select, Spin, Table, Tabs, Tag } from "antd";
import { MoreOutlined, SearchOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import { LuArrowRight, LuChartBar, LuHistory, LuPackagePlus, LuPlus, LuUserCheck } from "react-icons/lu";
import { toast } from "react-toastify";
import api from "../utils/config";
import { Edit } from "./icons/icons.components";
import PageShell from "./ui/page-shell";
import { useUser } from "../utils/userContext";

const includesSearch = (values, term) => {
  const normalizedTerm = `${term ?? ""}`.toLowerCase();
  return values.some((value) =>
    `${value ?? ""}`.toLowerCase().includes(normalizedTerm)
  );
};

const MAINTENANCE_STATUS_LABELS = {
  OPEN: "Open",
  DIAGNOSING: "Diagnosing",
  WAITING_FOR_PARTS: "Waiting for Parts",
  PART_REPLACEMENT: "Part Replacement",
  IN_REPAIR: "In Repair",
  WAITING_FOR_USER: "Waiting for User",
  RESOLVED: "Resolved",
  CANCELLED: "Cancelled",
};

const MAINTENANCE_STATUS_STYLES = {
  OPEN: "bg-[#EFF6FF] text-[#1D4ED8]",
  DIAGNOSING: "bg-[#FEF9C3] text-[#854D0E]",
  WAITING_FOR_PARTS: "bg-[#FFF7ED] text-[#C2410C]",
  PART_REPLACEMENT: "bg-[#FFE4E6] text-[#BE123C]",
  IN_REPAIR: "bg-[#FEF3C7] text-[#B45309]",
  WAITING_FOR_USER: "bg-[#F3E8FF] text-[#7C3AED]",
  RESOLVED: "bg-[#ECFDF3] text-[#166534]",
  CANCELLED: "bg-[#F3F4F6] text-[#6B7280]",
};

const MAINTENANCE_STATUS_OPTIONS = [
  "OPEN",
  "DIAGNOSING",
  "WAITING_FOR_PARTS",
  "PART_REPLACEMENT",
  "IN_REPAIR",
  "WAITING_FOR_USER",
  "RESOLVED",
  "CANCELLED",
];

const formatMaintenanceStatus = (value) => MAINTENANCE_STATUS_LABELS[value] || value || "-";

const Maintenance = () => {
  const [createForm] = Form.useForm();
  const [resolveForm] = Form.useForm();
  const [requisitionForm] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRequisitionModalOpen, setIsRequisitionModalOpen] = useState(false);
  const [isPartsHistoryOpen, setIsPartsHistoryOpen] = useState(false);
  const [partsHistoryRecord, setPartsHistoryRecord] = useState(null);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignRecord, setAssignRecord] = useState(null);
  const [assignForm] = Form.useForm();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [record, setRecord] = useState(null);
  const [requisitionRecord, setRequisitionRecord] = useState(null);
  const queryClient = useQueryClient();
  const { user } = useUser();
  const canViewOpenJobs = user?.roles?.some((r) => ["supervisor", "workshop_supervisor"].includes(r));
  const canViewMTTR = user?.roles?.some((r) => ["supervisor", "admin", "workshop_supervisor"].includes(r));
  const canAssignJob = user?.roles?.some((r) => ["workshop_supervisor", "admin"].includes(r));

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setDebouncedSearch(searchTerm);

      if (!searchTerm.trim()) {
        setSelectedDevice(null);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const { data: ticketsResponse, isLoading: ticketsLoading } = useQuery({
    queryKey: ["tickets"],
    queryFn: () => api.get("/hardware/tickets?status=OPEN"),
  });

  const { data: deviceSearchResults, isLoading: isDeviceLoading } = useQuery({
    queryKey: ["devices", debouncedSearch],
    queryFn: () =>
      api
        .get(`/hardware/devices/search?q=${debouncedSearch}`)
        .then((res) => res.data),
    enabled: !!debouncedSearch,
  });

  const { data: technicians } = useQuery({
    queryKey: ["technicians"],
    queryFn: () => api.get("/hardware/technicians"),
  });

  const [analyticsFilters, setAnalyticsFilters] = useState({});
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [analyticsForm] = Form.useForm();

  const { data: slaConfigsRes } = useQuery({
    queryKey: ["maintenanceSLAConfigs"],
    queryFn: () => api.get("/reports/sla-configs"),
  });

  const slaMap = (slaConfigsRes?.data || []).reduce((acc, cfg) => {
    acc[cfg.priority] = cfg.maxResolutionHours;
    return acc;
  }, {});

  const isOverdue = (ticket) => {
    if (ticket.dateResolved) return false;
    const maxHours = slaMap[ticket.priority];
    if (!maxHours) return false;
    const ageHours = (Date.now() - new Date(ticket.dateLogged).getTime()) / 3_600_000;
    return ageHours > maxHours;
  };

  const { data: analyticsRes, isFetching: analyticsLoading, refetch: fetchAnalytics } = useQuery({
    queryKey: ["maintenanceAnalytics", analyticsFilters],
    queryFn: () => api.get("/hardware/reports/analytics", { params: analyticsFilters }),
    enabled: analyticsOpen,
  });

  const analytics = analyticsRes?.data || null;

  const { data: workloadResponse } = useQuery({
    queryKey: ["hwWorkload"],
    queryFn: () => api.get("/hardware/workload"),
    enabled: !!canViewOpenJobs,
  });

  const { data: partsHistoryResponse, isFetching: partsHistoryLoading } = useQuery({
    queryKey: ["partsHistory", partsHistoryRecord?.assetId],
    queryFn: () => api.get(`/hardware/assets/${partsHistoryRecord?.assetId}/parts-history`),
    enabled: !!partsHistoryRecord?.assetId,
  });

  const workload = workloadResponse?.data || [];
  const partsHistory = partsHistoryResponse?.data || null;

  const tickets = ticketsResponse?.data || [];

  const stats = useMemo(() => {
    const searchMatches = searchText
      ? tickets.filter((row) =>
          includesSearch(
            [
              row.userName,
              row.brand,
              row.model,
              row.departmentName,
              row.technicianReceivedName,
              row.technicianReturnedName,
            ],
            searchText
          )
        ).length
      : tickets.length;

    return [
      {
        label: "Open Tickets",
        value: tickets.length,
        caption: "Current maintenance queue",
      },
      {
        label: "Technicians",
        value: technicians?.data?.length || 0,
        caption: "Available handlers",
      },
      {
        label: "Visible Results",
        value: searchMatches,
        caption: "Current filtered view",
      },
    ];
  }, [searchText, technicians?.data?.length, tickets]);

  const handleEdit = (currentRecord) => {
    setIsModalOpen(true);
    setRecord(currentRecord);
    resolveForm.setFieldsValue({
      status: currentRecord.status || "OPEN",
      actionTaken: currentRecord.actionTaken,
      technicianReturnedById: currentRecord.technicianReturnedById,
      remarks: currentRecord.remarks,
    });
  };

  const handleCreateRequisition = (currentRecord) => {
    setRequisitionRecord(currentRecord);
    setIsRequisitionModalOpen(true);
    requisitionForm.setFieldsValue({
      purpose: `Parts or replacement required for maintenance ticket ${currentRecord.ticketId}`,
      urgency: "MEDIUM",
    });
  };

  const handleOpenDetails = (currentRecord) => {
    setRecord(currentRecord);
    setIsDetailModalOpen(true);
  };

  const columns = [
    {
      title: "Brand",
      dataIndex: "brand",
      key: "brand",
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
    },
    {
      title: "User",
      dataIndex: "userName",
      key: "userName",
      filteredValue: [searchText],
      onFilter: (value, row) =>
        includesSearch(
          [
            row.userName,
            row.brand,
            row.model,
            row.departmentName,
            row.technicianReceivedName,
            row.technicianReturnedName,
          ],
          value
        ),
    },
    {
      title: "System Received By",
      dataIndex: "technicianReceivedName",
    },
    {
      title: "Department",
      dataIndex: "departmentName",
    },
    {
      title: "Department Location",
      dataIndex: "departmentLocation",
      render: (text) => text || "N/A",
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (text, record) => (
        <span className="flex items-center gap-2">
          {text}
          {isOverdue(record) && (
            <Tag className="rounded-full border-0 bg-[#FFEBEE] px-2 text-xs font-semibold text-[#D32F2F]">Overdue</Tag>
          )}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value) => (
        <Tag className={`rounded-full border-0 px-3 py-1 text-xs font-semibold ${MAINTENANCE_STATUS_STYLES[value] || "bg-[#F3F4F6] text-[#374151]"}`}>
          {formatMaintenanceStatus(value)}
        </Tag>
      ),
    },
    {
      title: "Date Logged",
      dataIndex: "dateLogged",
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: "Action",
      key: "action",
      render: (_, currentRecord) => {
        const items = [
          {
            key: "parts-history",
            label: "Parts History",
            icon: <LuHistory size={14} />,
            onClick: () => {
              setPartsHistoryRecord(currentRecord);
              setIsPartsHistoryOpen(true);
            },
          },
          {
            key: "edit-job",
            label: "Update Job",
            icon: <Edit />,
            onClick: () => handleEdit(currentRecord),
          },
          {
            key: "details",
            label: "Details",
            onClick: () => handleOpenDetails(currentRecord),
          },
          {
            key: "request-item",
            label:
              currentRecord.requisitionCount > 0
                ? `Request Item (${currentRecord.requisitionCount})`
                : "Request Item",
            icon: <LuPackagePlus size={14} />,
            onClick: () => handleCreateRequisition(currentRecord),
          },
          ...(canAssignJob && !currentRecord.dateResolved
            ? [
                {
                  key: "reassign",
                  label: "Reassign",
                  icon: <LuUserCheck size={14} />,
                  onClick: () => {
                    setAssignRecord(currentRecord);
                    setIsAssignOpen(true);
                  },
                },
              ]
            : []),
        ];

        return (
          <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
            <Button size="small" type="text" icon={<MoreOutlined />} aria-label="Maintenance job actions" />
          </Dropdown>
        );
      },
    },
  ];

  const { mutate: createTicket, isPending: isCreating } = useMutation({
    mutationFn: (ticketData) => api.post("/hardware/tickets/create", ticketData),
    onSuccess: () => {
      toast.success("Ticket created successfully");
      createForm.resetFields();
      setSelectedDevice(null);
      queryClient.invalidateQueries(["tickets"]);
      setOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to create ticket");
      console.error("Create Ticket Error:", error);
    },
  });

  const onFinish = (values) => {
    const payload = {
      assetId: selectedDevice.inventoryId,
      userId: selectedDevice.userId,
      departmentId: selectedDevice.departmentId,
      unitId: selectedDevice.unitId,
      description: values.description,
      issueType: values.issueType,
      technicianReceivedById: values.technicianReceivedById,
      priority: "MEDIUM",
    };

    createTicket(payload);
  };

  const { mutate: resolveTicket, isPending: isResolving } = useMutation({
    mutationFn: (payload) => api.patch(`/hardware/tickets/${record?.id}/update`, payload),
    onSuccess: () => {
      toast.success("Job updated successfully");
      resolveForm.resetFields();
      queryClient.invalidateQueries(["tickets"]);
      setRecord(null);
      setIsModalOpen(false);
    },
    onError: () => {
      toast.error("Failed to update job");
    },
  });

  const handleResolve = (values) => {
    resolveTicket(values);
  };

  const { mutate: createMaintenanceRequisition, isPending: isCreatingRequisition } = useMutation({
    mutationFn: (payload) =>
      api.post(`/hardware/tickets/${requisitionRecord?.id}/requisitions`, payload),
    onSuccess: (response) => {
      toast.success(response?.data?.message || "Maintenance requisition created successfully");
      requisitionForm.resetFields();
      setRequisitionRecord(null);
      setIsRequisitionModalOpen(false);
      queryClient.invalidateQueries(["tickets"]);
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to create maintenance requisition"
      );
    },
  });

  const { mutate: assignJob, isPending: isAssigning } = useMutation({
    mutationFn: (payload) => api.patch(`/hardware/tickets/${assignRecord?.id}/assign`, payload),
    onSuccess: () => {
      toast.success("Technician reassigned successfully");
      assignForm.resetFields();
      queryClient.invalidateQueries(["tickets"]);
      setAssignRecord(null);
      setIsAssignOpen(false);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to reassign technician");
    },
  });

  const handleRequisitionSubmit = (values) => {
    createMaintenanceRequisition({
      ...values,
      quantity: Number(values.quantity),
    });
  };

  return (
    <PageShell
      eyebrow="Workshop Operations"
      title="Maintenance Desk"
      description="Log repair jobs, assign technicians, and clear the open queue from one structured maintenance workspace."
      stats={stats}
      actions={
        <>
          <Input
            placeholder="Search tickets"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            prefix={<SearchOutlined />}
            className="w-full md:w-[260px]"
          />
          <Button type="primary" icon={<LuPlus />} onClick={() => setOpen(true)}>
            Create Job Card
          </Button>
          <Link to="/dashboard/resolved-tickets">
            <Button icon={<LuArrowRight />}>Resolved Jobs</Button>
          </Link>
        </>
      }
    >
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#616161]">Open Job Cards</p>
            <h3 className="text-xl font-bold text-[#212121]">Current maintenance queue</h3>
          </div>
          <span className="section-badge rounded-full bg-[#FFEBEE] px-3 py-1 text-xs font-semibold text-[#D32F2F]">
            Live service queue
          </span>
        </div>

        <Table
          columns={columns}
          dataSource={tickets}
          loading={ticketsLoading}
          rowKey="id"
          size="middle"
          scroll={{ x: 1100 }}
        />
      </section>

      <Modal
        open={open}
        footer={null}
        onCancel={() => {
          setOpen(false);
          setSelectedDevice(null);
          setSearchTerm("");
          createForm.resetFields();
        }}
        title="Create Maintenance Job Card"
        width={720}
        destroyOnClose
      >
        <Input
          placeholder="Search device by brand or model"
          onChange={(event) => setSearchTerm(event.target.value)}
          allowClear
          style={{ marginBottom: 16 }}
        />

        {isDeviceLoading ? (
          <Spin />
        ) : !selectedDevice ? (
          <ul className="max-h-[220px] space-y-2 overflow-y-auto pr-1">
            {deviceSearchResults?.map((device) => (
              <li
                key={device.inventoryId}
                className="cursor-pointer rounded-2xl border border-[#E0E0E0] px-4 py-3 transition-colors duration-200 hover:bg-[#F7F7F7]"
                onClick={() => setSelectedDevice(device)}
              >
                <p className="font-semibold text-[#212121]">
                  {device.brand} - {device.model}
                </p>
                <p className="text-sm text-[#616161]">
                  {device.userName || "Unassigned user"}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <Form form={createForm} layout="vertical" onFinish={onFinish}>
            <div className="mb-4 rounded-2xl bg-[#F9FAFB] p-4">
              <p className="text-sm font-semibold text-[#212121]">
                Selected device: {selectedDevice.brand} {selectedDevice.model}
              </p>
              <p className="mt-1 text-sm text-[#616161]">
                Asset #{selectedDevice.inventoryId}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
              <Form.Item label="Issue Type" name="issueType" initialValue="HARDWARE">
                <Select>
                  <Select.Option value="HARDWARE">HARDWARE</Select.Option>
                  <Select.Option value="SOFTWARE">SOFTWARE</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="technicianReceivedById"
                label="Received By"
                rules={[{ required: true, message: "Please select a technician" }]}
              >
                <Select placeholder="Select technician">
                  {technicians?.data?.map((technician) => (
                    <Select.Option key={technician.id} value={technician.id}>
                      {technician.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>

            <Form.Item
              label="Description"
              name="description"
              rules={[{ required: true, message: "Please enter a Description" }]}
            >
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item>
              <Button htmlType="submit" type="primary" loading={isCreating} block>
                Submit
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        open={isModalOpen}
        title="Update Job"
        onCancel={() => {
          setIsModalOpen(false);
          setRecord(null);
          resolveForm.resetFields();
        }}
        footer={null}
        width={720}
        destroyOnClose
      >
        <Form form={resolveForm} layout="vertical" onFinish={handleResolve}>
          <Form.Item
            name="status"
            label="Job Status"
            rules={[{ required: true, message: "Please select a job status" }]}
          >
            <Select>
              {MAINTENANCE_STATUS_OPTIONS.map((status) => (
                <Select.Option key={status} value={status}>
                  {formatMaintenanceStatus(status)}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <Form.Item
              name="actionTaken"
              label="Work Performed / Action Taken"
            >
              <Input />
            </Form.Item>

            <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.status !== currentValues.status}>
              {({ getFieldValue }) =>
                getFieldValue("status") === "RESOLVED" ? (
                  <Form.Item
                    name="technicianReturnedById"
                    label="Returned By"
                    rules={[{ required: true, message: "Please select a technician" }]}
                  >
                    <Select placeholder="Select technician">
                      {technicians?.data?.map((technician) => (
                        <Select.Option key={technician.id} value={technician.id}>
                          {technician.name}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                ) : null
              }
            </Form.Item>
          </div>

          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea placeholder="Add workshop notes such as awaiting part replacement, diagnosing issue, user follow-up needed, or repair progress" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button htmlType="submit" type="primary" loading={isResolving} block>
              Save Update
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={isDetailModalOpen}
        title={`Maintenance Details${record?.ticketId ? ` - ${record.ticketId}` : ""}`}
        onCancel={() => {
          setIsDetailModalOpen(false);
          setRecord(null);
        }}
        footer={null}
        width={760}
        destroyOnClose
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-[#F9FAFB] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9E9E9E]">Device</p>
              <p className="mt-1 font-semibold text-[#212121]">{record?.brand} {record?.model}</p>
              <p className="text-sm text-[#616161]">User: {record?.userName || "-"}</p>
            </div>
            <div className="rounded-2xl bg-[#F9FAFB] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9E9E9E]">Workshop Status</p>
              <div className="mt-1">
                <Tag className={`rounded-full border-0 px-3 py-1 text-xs font-semibold ${MAINTENANCE_STATUS_STYLES[record?.status] || "bg-[#F3F4F6] text-[#374151]"}`}>
                  {formatMaintenanceStatus(record?.status)}
                </Tag>
              </div>
              <p className="mt-1 text-sm text-[#616161]">Logged: {record?.dateLogged ? new Date(record.dateLogged).toLocaleString() : "-"}</p>
              <p className="text-sm text-[#616161]">Resolved: {record?.dateResolved ? new Date(record.dateResolved).toLocaleString() : "Not resolved"}</p>
            </div>
          </div>

          {record?.serviceDeskTicket ? (
            <div className="rounded-2xl border border-[#F0F0F0] bg-[#FFF8F7] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9E9E9E]">Source Service Desk Ticket</p>
              <p className="mt-1 font-semibold text-[#212121]">{record.serviceDeskTicket.ticketNo}</p>
              <p className="mt-1 text-sm text-[#616161]">{record.serviceDeskTicket.subject}</p>
              <p className="mt-1 text-sm text-[#616161]">Status: {record.serviceDeskTicket.status?.replaceAll("_", " ")}</p>
            </div>
          ) : null}

          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-[#616161]">Requisition History</h4>
            {record?.requisitions?.length ? (
              <div className="mt-3 space-y-3">
                {record.requisitions.map((requisition) => (
                  <article key={requisition.id} className="rounded-2xl border border-[#F0F0F0] bg-[#FAFAFA] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[#212121]">{requisition.requisitionID}</p>
                        <p className="text-xs text-[#757575]">{new Date(requisition.createdAt).toLocaleString()}</p>
                      </div>
                      <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#1D4ED8]">
                        {requisition.status?.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-medium text-[#212121]">{requisition.itemDescription || "Requested item"}</p>
                    <p className="mt-1 text-sm text-[#616161]">Quantity: {requisition.quantity}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-[#E0E0E0] bg-[#F9FAFB] px-4 py-5 text-sm text-[#757575]">
                No maintenance requisitions have been created for this job yet.
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={isPartsHistoryOpen}
        title={`Parts History — ${partsHistoryRecord?.brand || ""} ${partsHistoryRecord?.model || ""}`}
        onCancel={() => { setIsPartsHistoryOpen(false); setPartsHistoryRecord(null); }}
        footer={null}
        width={760}
        destroyOnClose
      >
        {partsHistoryLoading ? (
          <Spin />
        ) : partsHistory ? (
          <div className="space-y-4">
            {partsHistory.tickets.length === 0 && (
              <p className="text-sm text-[#757575]">No maintenance history for this asset yet.</p>
            )}
            {partsHistory.tickets.map((t) => (
              <div key={t.ticketId} className="rounded-2xl border border-[#E0E0E0] bg-[#FAFAFA] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-[#212121]">{t.ticketId}</p>
                    <p className="text-xs text-[#616161]">{t.issueType} · {t.priority}</p>
                  </div>
                  <p className="text-xs text-[#757575]">{new Date(t.dateLogged).toLocaleDateString()}</p>
                </div>
                {t.parts.length > 0 && (
                  <Table
                    className="mt-3"
                    size="small"
                    rowKey="requisitionID"
                    pagination={false}
                    dataSource={t.parts}
                    columns={[
                      { title: "Requisition", dataIndex: "requisitionID", key: "req" },
                      { title: "Item", dataIndex: "itemDescription", key: "item" },
                      { title: "Qty", dataIndex: "quantity", key: "qty" },
                      { title: "Status", dataIndex: "status", key: "status", render: (v) => <Tag>{v?.replaceAll("_", " ")}</Tag> },
                      { title: "Issued", dataIndex: "issuedAt", key: "issued", render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
                    ]}
                  />
                )}
                {t.parts.length === 0 && (
                  <p className="mt-2 text-xs text-[#9E9E9E]">No parts requisitioned for this job.</p>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={isRequisitionModalOpen}
        title="Create Maintenance Requisition"
        onCancel={() => {
          setIsRequisitionModalOpen(false);
          setRequisitionRecord(null);
          requisitionForm.resetFields();
        }}
        footer={null}
        width={720}
        destroyOnClose
      >
        <div className="mb-4 rounded-2xl bg-[#F9FAFB] p-4">
          <p className="text-sm font-semibold text-[#212121]">
            Maintenance ticket: {requisitionRecord?.ticketId || "-"}
          </p>
          <p className="mt-1 text-sm text-[#616161]">
            Device: {requisitionRecord?.brand || "-"} {requisitionRecord?.model || ""}
          </p>
          <p className="mt-1 text-sm text-[#616161]">
            Beneficiary: {requisitionRecord?.userName || "-"}
          </p>
        </div>

        <Form form={requisitionForm} layout="vertical" onFinish={handleRequisitionSubmit}>
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <Form.Item
              name="itemDescription"
              label="Requested Item"
              rules={[{ required: true, message: "Please enter the requested item" }]}
            >
              <Input placeholder="Replacement adapter, RAM module, replacement laptop, etc." />
            </Form.Item>

            <Form.Item
              name="quantity"
              label="Quantity"
              rules={[{ required: true, message: "Please enter the quantity" }]}
            >
              <Input type="number" min={1} />
            </Form.Item>
          </div>

          <Form.Item name="urgency" label="Urgency" initialValue="MEDIUM">
            <Select>
              <Select.Option value="LOW">LOW</Select.Option>
              <Select.Option value="MEDIUM">MEDIUM</Select.Option>
              <Select.Option value="HIGH">HIGH</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="purpose"
            label="Purpose"
            rules={[{ required: true, message: "Please enter the purpose" }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button htmlType="submit" type="primary" loading={isCreatingRequisition} block>
              Submit Maintenance Requisition
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={isAssignOpen}
        title={`Reassign Technician — ${assignRecord?.ticketId || ""}`}
        onCancel={() => { setIsAssignOpen(false); setAssignRecord(null); assignForm.resetFields(); }}
        footer={null}
        destroyOnClose
      >
        <div className="mb-4 rounded-2xl bg-[#F9FAFB] p-4 text-sm text-[#616161]">
          <p className="font-semibold text-[#212121]">Job: {assignRecord?.ticketId}</p>
          <p className="mt-1">Device: {assignRecord?.brand} {assignRecord?.model}</p>
          <p className="mt-1">Current technician: {assignRecord?.technicianReceivedName || "—"}</p>
        </div>
        <Form form={assignForm} layout="vertical" onFinish={(values) => assignJob(values)}>
          <Form.Item
            name="technicianReceivedById"
            label="Assign To"
            rules={[{ required: true, message: "Please select a technician" }]}
          >
            <Select placeholder="Select technician">
              {technicians?.data?.map((t) => (
                <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" loading={isAssigning} block>
              Assign Technician
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {canViewOpenJobs && workload.length > 0 && (
        <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#616161]">Technician Workload</p>
              <h3 className="text-xl font-bold text-[#212121]">Open jobs per technician</h3>
            </div>
            <span className="rounded-full bg-[#FFF7ED] px-3 py-1 text-xs font-semibold text-[#C2410C]">
              Live snapshot
            </span>
          </div>
          <Table
            rowKey="technicianId"
            size="small"
            pagination={false}
            dataSource={workload}
            columns={[
              { title: "Technician", dataIndex: "name", key: "name", render: (v) => <span className="font-semibold">{v}</span> },
              { title: "Staff ID", dataIndex: "staffId", key: "staffId" },
              { title: "Open Jobs", dataIndex: "openTickets", key: "openTickets", render: (v) => <Tag className="rounded-full border-0 bg-[#FFEBEE] px-3 text-[#D32F2F] font-semibold">{v}</Tag> },
              { title: "Resolved", dataIndex: "resolvedTickets", key: "resolvedTickets", render: (v) => <Tag className="rounded-full border-0 bg-[#ECFDF3] px-3 text-[#166534] font-semibold">{v}</Tag> },
              { title: "Avg Resolution (hrs)", dataIndex: "avgResolutionHours", key: "avgResolutionHours", render: (v) => v != null ? `${v}h` : "—" },
            ]}
          />
        </section>
      )}

      {canViewMTTR && (
        <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#616161]">MTTR Analytics</p>
              <h3 className="text-xl font-bold text-[#212121]">Mean Time To Repair</h3>
            </div>
            <Button icon={<LuChartBar />} onClick={() => { setAnalyticsOpen(true); fetchAnalytics(); }}>
              {analyticsOpen ? "Refresh" : "Load Analytics"}
            </Button>
          </div>

          {analyticsOpen && (
            <>
              <Form
                form={analyticsForm}
                layout="inline"
                className="mb-4 flex flex-wrap gap-2"
                onFinish={(values) => {
                  const params = {};
                  if (values.dateRange?.[0]) params.startDate = values.dateRange[0].toISOString();
                  if (values.dateRange?.[1]) params.endDate = values.dateRange[1].toISOString();
                  if (values.technicianId) params.technicianId = values.technicianId;
                  if (values.deviceType) params.deviceType = values.deviceType;
                  setAnalyticsFilters(params);
                }}
              >
                <Form.Item name="dateRange">
                  <DatePicker.RangePicker size="small" />
                </Form.Item>
                <Form.Item name="technicianId">
                  <Select placeholder="Technician" allowClear size="small" style={{ minWidth: 160 }}>
                    {technicians?.data?.map((t) => (
                      <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item>
                  <Button htmlType="submit" size="small" type="primary">Filter</Button>
                </Form.Item>
                <Form.Item>
                  <Button size="small" onClick={() => { analyticsForm.resetFields(); setAnalyticsFilters({}); }}>Clear</Button>
                </Form.Item>
              </Form>

              {analyticsLoading ? <Spin /> : analytics ? (
                <Tabs
                  items={[
                    {
                      key: "summary",
                      label: "Summary",
                      children: (
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                          <div className="rounded-2xl bg-[#F9FAFB] p-4 text-center">
                            <p className="text-2xl font-bold text-[#212121]">{analytics.totalResolved}</p>
                            <p className="text-xs text-[#757575]">Total Resolved</p>
                          </div>
                          <div className="rounded-2xl bg-[#F9FAFB] p-4 text-center">
                            <p className="text-2xl font-bold text-[#212121]">{analytics.overallMTTR}h</p>
                            <p className="text-xs text-[#757575]">Overall MTTR</p>
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "byTech",
                      label: "By Technician",
                      children: (
                        <Table
                          size="small"
                          rowKey="technicianId"
                          pagination={false}
                          dataSource={analytics.byTechnician}
                          columns={[
                            { title: "Technician", dataIndex: "technicianName", key: "name" },
                            { title: "Resolved", dataIndex: "resolvedCount", key: "count" },
                            { title: "Avg Hours", dataIndex: "avgResolutionHours", key: "avg", render: (v) => `${v}h` },
                          ]}
                        />
                      ),
                    },
                    {
                      key: "byIssue",
                      label: "By Issue Type",
                      children: (
                        <Table
                          size="small"
                          rowKey="issueType"
                          pagination={false}
                          dataSource={analytics.byIssueType}
                          columns={[
                            { title: "Issue Type", dataIndex: "issueType", key: "type" },
                            { title: "Resolved", dataIndex: "resolvedCount", key: "count" },
                            { title: "Avg Hours", dataIndex: "avgResolutionHours", key: "avg", render: (v) => `${v}h` },
                          ]}
                        />
                      ),
                    },
                    {
                      key: "byDevice",
                      label: "By Device Type",
                      children: (
                        <Table
                          size="small"
                          rowKey="deviceType"
                          pagination={false}
                          dataSource={analytics.byDeviceType}
                          columns={[
                            { title: "Device Type", dataIndex: "deviceType", key: "type" },
                            { title: "Resolved", dataIndex: "resolvedCount", key: "count" },
                            { title: "Avg Hours", dataIndex: "avgResolutionHours", key: "avg", render: (v) => `${v}h` },
                          ]}
                        />
                      ),
                    },
                    {
                      key: "trend",
                      label: "Monthly Trend",
                      children: (
                        <Table
                          size="small"
                          rowKey="month"
                          pagination={false}
                          dataSource={analytics.monthlyTrend}
                          columns={[
                            { title: "Month", dataIndex: "month", key: "month" },
                            { title: "Resolved", dataIndex: "resolvedCount", key: "count" },
                            { title: "Avg Hours", dataIndex: "avgResolutionHours", key: "avg", render: (v) => `${v}h` },
                          ]}
                        />
                      ),
                    },
                  ]}
                />
              ) : null}
            </>
          )}
        </section>
      )}
    </PageShell>
  );
};

export default Maintenance;
