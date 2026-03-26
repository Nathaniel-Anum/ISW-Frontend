import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SearchOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Popconfirm, Select, Table, message } from "antd";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { LuBriefcaseBusiness, LuMail, LuPlus, LuUsersRound } from "react-icons/lu";
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
  });

  const editStaff = useMutation({
    mutationFn: (values) => api.patch(`/admin/user/${editingRecord.staffId}`, values),
    onSuccess: () => {
      toast.success("Staff updated successfully");
      message.success("Staff updated successfully");
      form.resetFields();
      setOpen(false);
      setEditingRecord(null);
      queryClient.invalidateQueries({ queryKey: ["getAllUsers"] });
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

  const handleDepartmentChange = (departmentId) => {
    const department = departments.find((item) => item.id === departmentId);
    setSelectedUnits(department?.units || []);
    form.setFieldsValue({ unitId: undefined });
  };

  const handleSubmit = (values) => {
    if (editingRecord) {
      editStaff.mutate(values);
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
    </PageShell>
  );
};

export default Employees;