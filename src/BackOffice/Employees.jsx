import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SearchOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Popconfirm, Select, Table, Tooltip, message } from "antd";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { LuBriefcaseBusiness, LuCheck, LuCopy, LuKeyRound, LuMail, LuPlus, LuUsersRound } from "react-icons/lu";
import { toast } from "react-toastify";
import { Delete, Edit } from "../Components/icons/icons.components";
import PageShell from "../Components/ui/page-shell";
import api from "../utils/config";
import { formatCapitalizedLabel } from "../utils/formatText";

const Employees = () => {
  const [open, setOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [tempPassRecord, setTempPassRecord] = useState(null);
  const [tempPassword, setTempPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const deferredSearch = useDeferredValue(searchText.trim());

  const { data: usersData } = useQuery({
    queryKey: ["getAllUsers", deferredSearch],
    queryFn: () =>
      api.get("/admin/users", {
        params: deferredSearch ? { search: deferredSearch } : undefined,
      }),
  });

  const { data: departmentsData } = useQuery({
    queryKey: ["getAllDepartments"],
    queryFn: () => api.get("/admin/departments?includeUnits=true"),
  });

  const { data: rolesData } = useQuery({
    queryKey: ["getAllRoles"],
    queryFn: () => api.get("/admin/roles"),
  });

  const users = usersData?.data || [];
  const departments = departmentsData?.data || [];
  const roles = rolesData?.data || [];

  const stats = useMemo(() => {
    const departmentsCovered = new Set(users.map((user) => user.department?.id).filter(Boolean)).size;
    const uniqueRoles = new Set(
      users.flatMap((user) => user.roles?.map((role) => role.role?.name).filter(Boolean) || [])
    ).size;

    return [
      { label: "Employees", value: users.length, caption: "Active staff records" },
      { label: "Departments covered", value: departmentsCovered, caption: "Departments represented in staffing" },
      { label: "Assigned roles", value: uniqueRoles, caption: "Distinct roles used by staff" },
    ];
  }, [users]);

  const openCreateModal = () => {
    setEditingRecord(null);
    setSelectedUnits([]);
    form.resetFields();
    setOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    const department = departments.find((item) => item.id === record.department?.id);
    setSelectedUnits(department?.units || []);
    setOpen(true);
  };

  useEffect(() => {
    if (!open) {
      return;
    }

    if (editingRecord) {
      form.setFieldsValue({
        staffId: editingRecord.staffId,
        name: editingRecord.name,
        email: editingRecord.email,
        departmentId: editingRecord.department?.id,
        unitId: editingRecord.unit?.id,
        roomNo: editingRecord.roomNo,
        roleNames: editingRecord.roles?.map((r) => r.role?.name).filter(Boolean) ?? [],
      });
      return;
    }

    form.resetFields();
  }, [editingRecord, form, open]);

  const createStaff = useMutation({
    mutationKey: ["createStaff"],
    mutationFn: (values) => api.post("/admin/user", values),
    onSuccess: () => {
      toast.success("Staff created successfully");
      form.resetFields();
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["getAllUsers"] });
    },
    onError: (error) => {
      const msg = error.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || "Failed to create staff");
    },
  });

  const editStaff = useMutation({
    mutationFn: (values) => api.patch(`/admin/user/${editingRecord.staffId}`, values),
    onSuccess: () => {
      toast.success("Staff updated successfully");
      form.resetFields();
      setOpen(false);
      setEditingRecord(null);
      queryClient.invalidateQueries({ queryKey: ["getAllUsers"] });
    },
    onError: (error) => {
      const msg = error.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || "Failed to update staff");
    },
  });

  const deleteStaff = useMutation({
    mutationFn: (staffId) => api.delete(`/admin/user/${staffId}/permanent`),
    onSuccess: () => {
      toast.success("Staff deleted successfully");
      message.success("Staff deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["getAllUsers"] });
    },
  });

  const generateTempPassword = useMutation({
    mutationFn: (staffId) => api.post(`/admin/user/${staffId}/reset-password`),
    onSuccess: (res, staffId) => {
      setTempPassword(res.data.tempPassword);
      setCopied(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to generate temporary password"),
  });

  const handleDepartmentChange = (departmentId) => {
    const department = departments.find((item) => item.id === departmentId);
    setSelectedUnits(department?.units || []);
    form.setFieldsValue({ unitId: undefined });
  };

  const handleSubmit = (values) => {
    if (editingRecord) {
      const { staffId: _staffId, ...updateValues } = values;
      editStaff.mutate(updateValues);
      return;
    }

    createStaff.mutate(values);
  };

  const columns = [
    {
      title: "Staff ID",
      dataIndex: "staffId",
      key: "staffId",
      render: (value) => <span className="font-semibold text-[#212121]">{value}</span>,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Department",
      dataIndex: ["department", "name"],
      key: "department",
      render: (value) => (value ? formatCapitalizedLabel(value) : "Not Assigned"),
    },
    {
      title: "Room No",
      dataIndex: "roomNo",
      key: "roomNo",
      render: (value) => value || "-",
    },
    {
      title: "Role",
      dataIndex: "roles",
      key: "roles",
      render: (roleList) => {
        const names = roleList?.map((r) => r.role?.name).filter(Boolean) ?? [];
        if (!names.length) return <span className="text-xs text-[#9E9E9E]">None</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {names.map((name) => (
              <span key={name} className="inline-flex items-center rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-xs font-semibold text-[#374151]">
                {formatCapitalizedLabel(name)}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <button className="rounded-full p-1.5 transition hover:bg-[#FFEBEE]" onClick={() => openEditModal(record)}>
            <Edit size={18} />
          </button>
          <Tooltip title="Generate temporary password">
            <button
              className="rounded-full p-1.5 transition hover:bg-[#FFF8E1]"
              onClick={() => { setTempPassRecord(record); setTempPassword(""); generateTempPassword.mutate(record.staffId); }}
            >
              <LuKeyRound size={18} className="text-[#F59E0B]" />
            </button>
          </Tooltip>
          <Popconfirm
            title="Delete staff"
            description="This action permanently removes the user record."
            onConfirm={() => deleteStaff.mutate(record.staffId)}
            okText="Delete"
            cancelText="Cancel"
          >
            <button className="rounded-full p-1.5 transition hover:bg-[#FFEBEE]">
              <Delete size={18} />
            </button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <PageShell
      eyebrow="Back Office"
      title="Employee Directory"
      description="Provision staff records with the right department, unit, and role so requests, approvals, and reporting stay tied to the right owners."
      stats={stats}
      actions={
        <>
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search staff, email, department, room, or role"
            className="w-full sm:w-[340px]"
          />
          <Button
            type="primary"
            icon={<LuPlus size={16} />}
            className="!h-11 !rounded-2xl !px-5"
            onClick={openCreateModal}
          >
            Create Staff
          </Button>
        </>
      }
    >
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#212121]">Staff Register</h3>
            <p className="text-sm text-[#616161]">Use this table to maintain core employee data and access assignments.</p>
          </div>
          <div className="section-badge inline-flex items-center gap-2 rounded-full bg-[#F9FAFB] px-4 py-2 text-sm font-medium text-[#616161]">
            <LuUsersRound size={16} className="text-[#D32F2F]" />
            {users.length} employees
          </div>
        </div>

        <Table columns={columns} dataSource={users} rowKey="id" size="middle" scroll={{ x: 980 }} />
      </section>

      <Modal
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditingRecord(null);
        }}
        footer={null}
        title={editingRecord ? "Edit Staff" : "Create Staff"}
        width={760}
        destroyOnClose
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <Form.Item name="staffId" label="Staff ID" rules={[{ required: true }]}>
              <Input placeholder="Enter Staff ID" />
            </Form.Item>

            <Form.Item name="name" label="Name" rules={[{ required: true }]}>
              <Input placeholder="Enter name" />
            </Form.Item>

            <Form.Item name="email" label="Email" rules={[{ required: true, type: "email" }]}>
              <Input prefix={<LuMail size={16} className="text-[#616161]" />} placeholder="Enter email" />
            </Form.Item>

            <Form.Item name="departmentId" label="Department" rules={[{ required: true }]}>
              <Select placeholder="Select department" onChange={handleDepartmentChange}>
                {departments.map((department) => (
                  <Select.Option key={department.id} value={department.id}>
                    {department.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="unitId" label="Unit" rules={editingRecord ? [{ required: true }] : []}>
              <Select placeholder="Select unit" disabled={!selectedUnits.length}>
                {selectedUnits.map((unit) => (
                  <Select.Option key={unit.id} value={unit.id}>
                    {unit.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="roomNo" label="Room No" rules={[{ required: true }]}>
              <Input prefix={<LuBriefcaseBusiness size={16} className="text-[#616161]" />} placeholder="Enter room number" />
            </Form.Item>

            <Form.Item name="roleNames" label="Roles" rules={[{ required: true, type: "array", min: 1, message: "Select at least one role" }]} className="md:col-span-2">
              <Select mode="multiple" placeholder="Select roles">
                {roles.map((role) => (
                  <Select.Option key={role.id} value={role.name}>
                    {role.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" block className="!h-11 !rounded-2xl">
              {editingRecord ? "Update Staff" : "Submit"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={!!tempPassRecord}
        onCancel={() => { setTempPassRecord(null); setTempPassword(""); }}
        footer={null}
        title={null}
        width={440}
        destroyOnClose
        centered
      >
        <div className="px-2 py-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF8E1]">
              <LuKeyRound size={20} className="text-[#F59E0B]" />
            </div>
            <div>
              <p className="text-base font-bold text-[#212121]">Temporary Password</p>
              <p className="text-sm text-[#757575]">{tempPassRecord?.name} · {tempPassRecord?.staffId}</p>
            </div>
          </div>

          <p className="mb-3 text-sm text-[#616161]">
            A temporary password has been generated. Share it securely with the employee — they can use it to log in directly.
          </p>

          <div className="flex items-center gap-3 rounded-2xl border border-[#E0E0E0] bg-[#F9FAFB] px-4 py-3">
            {generateTempPassword.isPending ? (
              <span className="flex-1 animate-pulse text-sm text-[#9E9E9E]">Generating…</span>
            ) : (
              <span className="flex-1 font-mono text-lg font-semibold tracking-widest text-[#212121]">
                {tempPassword || "—"}
              </span>
            )}
            <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
              <button
                disabled={!tempPassword}
                className="rounded-full p-2 transition hover:bg-[#FFEBEE] disabled:opacity-40"
                onClick={() => {
                  navigator.clipboard.writeText(tempPassword);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2500);
                }}
              >
                {copied ? <LuCheck size={18} className="text-[#4CAF50]" /> : <LuCopy size={18} className="text-[#616161]" />}
              </button>
            </Tooltip>
          </div>

          <p className="mt-3 text-xs text-[#9E9E9E]">
            An email with this password has also been sent to {tempPassRecord?.email}.
          </p>

          <div className="mt-5 flex gap-3">
            <Button
              block
              onClick={() => { generateTempPassword.mutate(tempPassRecord?.staffId); }}
              loading={generateTempPassword.isPending}
              icon={<LuKeyRound size={15} />}
            >
              Regenerate
            </Button>
            <Button
              type="primary"
              block
              onClick={() => { setTempPassRecord(null); setTempPassword(""); }}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </PageShell>
  );
};

export default Employees;