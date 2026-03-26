import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useDeferredValue, useMemo, useState } from "react";
import { Button, DatePicker, Form, Input, Modal, Select, Switch, Table, Tag } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { LuCalendarClock, LuPlus, LuTrash2 } from "react-icons/lu";
import { toast } from "react-toastify";
import api from "../utils/config";
import { useUser } from "../utils/userContext";
import PageShell from "./ui/page-shell";
import dayjs from "dayjs";

const PMSchedules = () => {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [batchMode, setBatchMode] = useState(false);
  const [searchText, setSearchText] = useState("");
  const deferredSearch = useDeferredValue(searchText.trim().toLowerCase());

  const canManage = user?.roles?.some((r) => ["supervisor", "admin", "hardware_technician", "workshop_supervisor"].includes(r));
  const canDelete = user?.roles?.some((r) => ["supervisor", "admin", "workshop_supervisor"].includes(r));

  const { data: schedulesRes, isLoading } = useQuery({
    queryKey: ["pmSchedules"],
    queryFn: () => api.get("/hardware/pm-schedules"),
  });

  const { data: technicianRes } = useQuery({
    queryKey: ["technicians"],
    queryFn: () => api.get("/hardware/technicians"),
  });

  const { data: assetsRes } = useQuery({
    queryKey: ["fixedAssets"],
    queryFn: () => api.get("/hardware/fixed-assets"),
  });

  const schedules = schedulesRes?.data || [];
  const technicians = technicianRes?.data || [];
  const assets = assetsRes?.data || [];

  const filteredSchedules = useMemo(() => {
    if (!deferredSearch) return schedules;
    return schedules.filter((s) => [
      s.inventory?.itItem?.brand,
      s.inventory?.itItem?.model,
      s.inventory?.assetId,
      s.assignedTech?.name,
      s.notes,
    ].some((v) => v?.toLowerCase().includes(deferredSearch)));
  }, [schedules, deferredSearch]);

  const createMutation = useMutation({
    mutationFn: (data) => api.post("/hardware/pm-schedules", data),
    onSuccess: (res) => {
      const count = Array.isArray(res.data) ? res.data.length : 1;
      toast.success(`${count} PM schedule${count > 1 ? 's' : ''} created`);
      queryClient.invalidateQueries(["pmSchedules"]);
      setCreateOpen(false);
      createForm.resetFields();
    },
    onError: () => toast.error("Failed to create PM schedule"),
  });

  const batchMutation = useMutation({
    mutationFn: (data) => api.post("/hardware/pm-schedules/batch", data),
    onSuccess: (res) => {
      const count = Array.isArray(res.data) ? res.data.length : 1;
      toast.success(`${count} PM schedule${count > 1 ? 's' : ''} created for all matching assets`);
      queryClient.invalidateQueries(["pmSchedules"]);
      setCreateOpen(false);
      createForm.resetFields();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? "Failed to create batch PM schedules"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }) => api.patch(`/hardware/pm-schedules/${id}`, { isActive }),
    onSuccess: () => {
      toast.success("Schedule updated");
      queryClient.invalidateQueries(["pmSchedules"]);
    },
    onError: () => toast.error("Update failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/hardware/pm-schedules/${id}`),
    onSuccess: () => {
      toast.success("Schedule deleted");
      queryClient.invalidateQueries(["pmSchedules"]);
    },
    onError: () => toast.error("Delete failed"),
  });

  const stats = [
    { label: "Total Schedules", value: schedules.length, caption: "All PM schedules" },
    { label: "Active", value: schedules.filter((s) => s.isActive).length, caption: "Currently active" },
    {
      label: "Due Soon",
      value: schedules.filter((s) => s.isActive && new Date(s.nextDueAt) <= new Date(Date.now() + 7 * 86400000)).length,
      caption: "Due within 7 days",
    },
  ];

  const columns = [
    {
      title: "Asset",
      key: "asset",
      render: (_, r) => (
        <span className="font-semibold">
          {r.inventory?.itItem?.brand} {r.inventory?.itItem?.model}
          <span className="ml-1 text-xs text-[#757575]">({r.inventory?.assetId})</span>
        </span>
      ),
    },
    { title: "Frequency", dataIndex: "frequencyDays", render: (v) => `Every ${v} days` },
    { title: "Last Performed", dataIndex: "lastPerformedAt", render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
    {
      title: "Next Due",
      dataIndex: "nextDueAt",
      render: (v, r) => {
        const isOverdue = r.isActive && new Date(v) < new Date();
        return (
          <span className={isOverdue ? "font-semibold text-[#D32F2F]" : ""}>
            {new Date(v).toLocaleDateString()}
            {isOverdue && <Tag className="ml-1 rounded-full border-0 bg-[#FFEBEE] text-[#D32F2F]">Overdue</Tag>}
          </span>
        );
      },
    },
    { title: "Assigned Tech", key: "tech", render: (_, r) => r.assignedTech?.name ?? "—" },
    { title: "Notes", dataIndex: "notes", render: (v) => v ?? "—" },
    {
      title: "Status",
      dataIndex: "isActive",
      render: (v) => (
        <Tag className={`rounded-full border-0 px-3 text-xs font-semibold ${v ? "bg-[#ECFDF3] text-[#166534]" : "bg-[#F3F4F6] text-[#6B7280]"}`}>
          {v ? "Active" : "Paused"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, r) => (
        <div className="flex gap-2">
          {canManage && (
            <Button
              size="small"
              onClick={() => toggleActiveMutation.mutate({ id: r.id, isActive: !r.isActive })}
            >
              {r.isActive ? "Pause" : "Resume"}
            </Button>
          )}
          {canDelete && (
            <Button
              size="small"
              danger
              icon={<LuTrash2 size={13} />}
              onClick={() => deleteMutation.mutate(r.id)}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <PageShell
      eyebrow="Workshop Operations"
      title="Preventive Maintenance"
      description="Manage recurring maintenance schedules for assets. Tickets are auto-created when a schedule is due."
      stats={stats}
      actions={
        canManage ? (
          <Button type="primary" icon={<LuPlus />} onClick={() => setCreateOpen(true)}>
            New Schedule
          </Button>
        ) : null
      }
    >
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[#616161]">Schedule List</p>
            <h3 className="text-xl font-bold text-[#212121]">All preventive maintenance schedules</h3>
          </div>
          <div className="flex items-center gap-3">
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              prefix={<SearchOutlined />}
              placeholder="Search asset, technician, or notes"
              className="w-full sm:w-[280px]"
            />
            <LuCalendarClock size={22} className="shrink-0 text-[#9E9E9E]" />
          </div>
        </div>
        <Table columns={columns} dataSource={filteredSchedules} rowKey="id" loading={isLoading} scroll={{ x: 900 }} />
      </section>

      <Modal
        open={createOpen}
        title="Create PM Schedule"
        onCancel={() => { setCreateOpen(false); createForm.resetFields(); setBatchMode(false); }}
        footer={null}
        destroyOnClose
      >
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-[#F5F5F5] px-4 py-3">
          <span className={`text-sm font-medium ${!batchMode ? "text-[#212121]" : "text-[#9E9E9E]"}`}>Individual Assets</span>
          <Switch checked={batchMode} onChange={(v) => { setBatchMode(v); createForm.resetFields(); }} />
          <span className={`text-sm font-medium ${batchMode ? "text-[#212121]" : "text-[#9E9E9E]"}`}>Batch by Device Category</span>
        </div>

        {batchMode && (
          <p className="mb-4 text-xs text-[#757575]">
            Schedules will be created for <strong>all active fixed assets</strong> matching the selected device category.
            Assigned users will receive an email notification 7 days before the due date.
          </p>
        )}

        <Form
          form={createForm}
          layout="vertical"
          onFinish={(values) => {
            if (batchMode) {
              batchMutation.mutate({
                deviceType: values.deviceType,
                frequencyDays: Number(values.frequencyDays),
                nextDueAt: values.nextDueAt.toISOString(),
                assignedTechIds: values.assignedTechIds?.length ? values.assignedTechIds : undefined,
                notes: values.notes ?? undefined,
              });
            } else {
              createMutation.mutate({
                inventoryIds: values.inventoryIds,
                frequencyDays: Number(values.frequencyDays),
                nextDueAt: values.nextDueAt.toISOString(),
                assignedTechIds: values.assignedTechIds?.length ? values.assignedTechIds : undefined,
                notes: values.notes ?? undefined,
              });
            }
          }}
        >
          {batchMode ? (
            <Form.Item name="deviceType" label="Device Category" rules={[{ required: true, message: "Select a device category" }]}>
              <Select placeholder="Select device category">
                {["LAPTOP", "DESKTOP", "PRINTER", "UPS", "OTHER"].map((dt) => (
                  <Select.Option key={dt} value={dt}>{dt.charAt(0) + dt.slice(1).toLowerCase()}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          ) : (
            <Form.Item name="inventoryIds" label="Assets" rules={[{ required: true, type: "array", min: 1 }]}>
              <Select
                mode="multiple"
                showSearch
                placeholder="Select one or more assets"
                filterOption={(input, option) =>
                  (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                }
                options={assets.map((a) => ({
                  value: a.id,
                  label: `${a.itItem?.brand ?? ""} ${a.itItem?.model ?? ""} (${a.assetId})`,
                }))}
              />
            </Form.Item>
          )}

          <Form.Item name="frequencyDays" label="Frequency (days)" rules={[{ required: true }]}>
            <Input type="number" min={1} placeholder="e.g. 90" />
          </Form.Item>
          <Form.Item name="nextDueAt" label="First Due Date" rules={[{ required: true }]}>
            <DatePicker className="w-full" disabledDate={(d) => d.isBefore(dayjs())} />
          </Form.Item>
          <Form.Item name="assignedTechIds" label="Assigned Technicians">
            <Select mode="multiple" placeholder="Select technicians" allowClear>
              {technicians.map((t) => (
                <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={batchMode ? batchMutation.isPending : createMutation.isPending}
            >
              {batchMode ? "Create Batch Schedules" : "Create Schedule"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageShell>
  );
};

export default PMSchedules;
