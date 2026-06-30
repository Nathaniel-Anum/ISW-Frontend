import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SearchOutlined } from "@ant-design/icons";
import { Button, Checkbox, Form, Input, Modal, Popconfirm, Select, Table, Tabs, Tag, Tooltip } from "antd";
import { useDeferredValue, useMemo, useState } from "react";
import { LuBadgeCheck, LuKey, LuPencil, LuPlus, LuShield } from "react-icons/lu";
import { toast } from "react-toastify";
import { Delete } from "../Components/icons/icons.components";
import PageShell from "../Components/ui/page-shell";
import api from "../utils/config";
import { formatCapitalizedLabel } from "../utils/formatText";

const ACTION_COLORS = {
  read: "blue",
  create: "green",
  update: "orange",
  delete: "red",
  approve: "purple",
  decline: "volcano",
  assign: "cyan",
  close: "gold",
};

const ALL_ACTIONS = ["read", "create", "update", "delete", "approve", "decline", "assign", "close"];

const Roles = () => {
  // ── Roles state ───────────────────────────────────────────────────────────
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [manageRole, setManageRole] = useState(null);
  const [selectedPermIds, setSelectedPermIds] = useState([]);
  const [addPickerValue, setAddPickerValue] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [addForm] = Form.useForm();

  // ── Permissions state ─────────────────────────────────────────────────────
  const [isPermAddOpen, setIsPermAddOpen] = useState(false);
  const [editingPerm, setEditingPerm] = useState(null);
  const [permSearchText, setPermSearchText] = useState("");
  const [permAddForm] = Form.useForm();
  const [permEditForm] = Form.useForm();

  const [activeTab, setActiveTab] = useState("roles");

  const queryClient = useQueryClient();
  const deferredSearch = useDeferredValue(searchText.trim());
  const deferredPermSearch = useDeferredValue(permSearchText.trim());

  // ── Data queries ──────────────────────────────────────────────────────────
  const { data: rolesData } = useQuery({
    queryKey: ["roles", deferredSearch],
    queryFn: () =>
      api.get("/admin/roles", {
        params: deferredSearch ? { search: deferredSearch } : undefined,
      }),
  });

  const { data: permissionsData } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => api.get("/admin/permissions"),
  });

  const { data: permissionsWithRolesData } = useQuery({
    queryKey: ["permissionsWithRoles", deferredPermSearch],
    queryFn: () =>
      api.get("/admin/permissions", {
        params: {
          includeRoles: "true",
          ...(deferredPermSearch ? { search: deferredPermSearch } : {}),
        },
      }),
  });

  const roles = rolesData?.data || [];
  const permissions = permissionsData?.data || [];
  const permissionsWithRoles = permissionsWithRolesData?.data || [];

  const stats = useMemo(() => {
    const totalGuards = permissions.length;
    return [
      { label: "Roles", value: roles.length, caption: "Permission bundles configured" },
      { label: "Resources", value: [...new Set(permissions.map((p) => p.resource))].length, caption: "Protected resource types" },
      { label: "Route Guards", value: totalGuards, caption: "Active action:resource checks" },
    ];
  }, [permissions, roles.length]);

  // ── Roles mutations ───────────────────────────────────────────────────────
  const addRole = useMutation({
    mutationFn: (values) =>
      api.post("/admin/role", {
        name: values.name?.trim(),
        permissions: values.permissions ?? [],
      }),
    onSuccess: () => {
      toast.success("Role created successfully");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      addForm.resetFields();
      setIsAddOpen(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to create role"),
  });

  const updatePermissions = useMutation({
    mutationFn: ({ roleId, permissionIds }) =>
      api.patch(`/admin/role/${roleId}/permissions`, { permissionIds }),
    onSuccess: async () => {
      toast.success("Permissions updated");
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
      setManageRole(null);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to update permissions"),
  });

  const handleDeleteRole = (id) => {
    if (!id) {
      toast.error("Unable to delete role: missing role ID");
      return;
    }
    api
      .delete(`/admin/roles/${id}`)
      .then(() => {
        toast.success("Role deleted");
        queryClient.invalidateQueries({ queryKey: ["roles"] });
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to delete role"));
  };

  const openManage = (role) => {
    setSelectedPermIds(role.permissions?.map((p) => p.permission?.id).filter(Boolean) || []);
    setAddPickerValue([]);
    setManageRole(role);
  };

  const removePermission = (id) => setSelectedPermIds((prev) => prev.filter((pid) => pid !== id));

  const handleAddPicked = () => {
    setSelectedPermIds((prev) => [...new Set([...prev, ...addPickerValue])]);
    setAddPickerValue([]);
  };

  const handleCreateRole = (values) => {
    const name = values.name?.trim();
    if (!name) {
      toast.error("Role name is required");
      return;
    }
    addRole.mutate({ name, permissions: values.permissions ?? [] });
  };

  const handleSaveRolePermissions = () => {
    if (!manageRole?.id) {
      toast.error("Unable to update permissions: missing role ID");
      return;
    }
    updatePermissions.mutate({
      roleId: manageRole.id,
      permissionIds: selectedPermIds,
    });
  };

  // ── Permissions mutations ─────────────────────────────────────────────────
  const createPermission = useMutation({
    mutationFn: (values) =>
      api.post("/admin/permissions", { resource: values.resource?.trim(), actions: values.actions }),
    onSuccess: () => {
      toast.success("Permission created");
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      queryClient.invalidateQueries({ queryKey: ["permissionsWithRoles"] });
      permAddForm.resetFields();
      setIsPermAddOpen(false);
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Failed to create permission"),
  });

  const updatePermission = useMutation({
    mutationFn: ({ id, resource, action }) =>
      api.patch(`/admin/permissions/${id}`, { resource: resource?.trim(), action }),
    onSuccess: () => {
      toast.success("Permission updated");
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      queryClient.invalidateQueries({ queryKey: ["permissionsWithRoles"] });
      setEditingPerm(null);
    },
    onError: (err) =>
      toast.error(err?.response?.data?.message || "Failed to update permission"),
  });

  const handleDeletePermission = (id) => {
    if (!id) {
      toast.error("Unable to delete permission: missing permission ID");
      return;
    }
    api
      .delete(`/admin/permissions/${id}`)
      .then(() => {
        toast.success("Permission deleted");
        queryClient.invalidateQueries({ queryKey: ["permissions"] });
        queryClient.invalidateQueries({ queryKey: ["permissionsWithRoles"] });
      })
      .catch((err) => toast.error(err?.response?.data?.message || "Failed to delete permission"));
  };

  const handleCreatePermission = (values) => {
    const resource = values.resource?.trim();
    if (!resource || !values.actions?.length) {
      toast.error("Resource and at least one action are required");
      return;
    }
    createPermission.mutate({ resource, actions: values.actions });
  };

  const handleUpdatePermission = (values) => {
    if (!editingPerm?.id) {
      toast.error("Unable to update permission: missing permission ID");
      return;
    }
    const resource = values.resource?.trim();
    if (!resource || !values.action) {
      toast.error("Resource and action are required");
      return;
    }
    updatePermission.mutate({ id: editingPerm.id, resource, action: values.action });
  };

  const openEditPerm = (perm) => {
    permEditForm.setFieldsValue({ resource: perm.resource, action: perm.action });
    setEditingPerm(perm);
  };
  // ── Roles table columns ───────────────────────────────────────────────────
  const roleColumns = [
    {
      title: "Role Name",
      dataIndex: "name",
      key: "name",
      width: 180,
      render: (value) => (
        <span className="font-semibold text-[#212121]">{formatCapitalizedLabel(value)}</span>
      ),
    },
    {
      title: "Assigned Permissions",
      key: "permissions",
      render: (_, record) => {
        const perms = record.permissions?.map((p) => p.permission) ?? [];
        if (perms.length === 0)
          return <span className="text-xs text-[#9E9E9E]">No permissions assigned</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {perms.map((perm) => (
              <Tag
                key={perm.id}
                color={ACTION_COLORS[perm.action] ?? "default"}
                className="!m-0 !font-mono !text-[11px]"
              >
                {perm.action}:{perm.resource}
              </Tag>
            ))}
          </div>
        );
      },
    },
    {
      title: "",
      key: "action",
      width: 100,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Tooltip title="Manage permissions">
            <button
              onClick={() => openManage(record)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E0E0E0] bg-white text-[#616161] transition hover:border-[#D32F2F]/30 hover:bg-[#FFEBEE] hover:text-[#D32F2F]"
            >
              <LuPencil size={14} />
            </button>
          </Tooltip>
          <Popconfirm
            title="Delete role"
            description="This removes the role and unlinks all assigned users."
            onConfirm={() => handleDeleteRole(record.id)}
            okText="Delete"
            cancelText="Cancel"
          >
            <button className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E0E0E0] bg-white text-[#616161] transition hover:border-[#FFEBEE] hover:bg-[#FFEBEE]">
              <Delete size={14} />
            </button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  // ── Permissions table columns ─────────────────────────────────────────────
  const permColumns = [
    {
      title: "Permission",
      key: "guard",
      render: (_, record) => (
        <Tag
          color={ACTION_COLORS[record.action] ?? "default"}
          className="!font-mono !text-[12px]"
        >
          {record.action}:{record.resource}
        </Tag>
      ),
    },
    {
      title: "Assigned Roles",
      key: "assignedRoles",
      width: 220,
      render: (_, record) => {
        const assignedRoles = record.roles?.map((rp) => rp.role) ?? [];
        if (assignedRoles.length === 0)
          return <span className="text-xs text-[#9E9E9E]">Unassigned</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {assignedRoles.map((r) => (
              <span
                key={r.id}
                className="inline-block rounded-full bg-[#EEF2FF] px-2 py-0.5 text-xs font-medium text-[#4338CA]"
              >
                {formatCapitalizedLabel(r.name)}
              </span>
            ))}
          </div>
        );
      },
    },
    {
      title: "",
      key: "action",
      width: 80,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Tooltip title="Edit permission">
            <button
              onClick={() => openEditPerm(record)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E0E0E0] bg-white text-[#616161] transition hover:border-[#D32F2F]/30 hover:bg-[#FFEBEE] hover:text-[#D32F2F]"
            >
              <LuPencil size={14} />
            </button>
          </Tooltip>
          <Popconfirm
            title="Delete permission"
            description="This removes the permission from all roles that use it."
            onConfirm={() => handleDeletePermission(record.id)}
            okText="Delete"
            cancelText="Cancel"
          >
            <button className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#E0E0E0] bg-white text-[#616161] transition hover:border-[#FFEBEE] hover:bg-[#FFEBEE]">
              <Delete size={14} />
            </button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  // ── Perm form shared fields ───────────────────────────────────────────────
  // Create form: resource + multi-action → creates one DB row per action
  const PermCreateFields = () => (
    <>
      <Form.Item
        name="resource"
        label={<span className="font-semibold">Resource Name</span>}
        rules={[
          { required: true, message: "Enter a resource name" },
          {
            pattern: /^[a-z0-9_.-]+$/,
            message: "Use lowercase letters, numbers, underscores, hyphens, or dots",
          },
        ]}
        extra={<span className="text-xs text-[#9E9E9E]">e.g. hardware, service_desk, reports</span>}
      >
        <Input placeholder="resource_name" className="font-mono" />
      </Form.Item>

      <Form.Item
        name="actions"
        label={<span className="font-semibold">Actions</span>}
        rules={[{ required: true, message: "Select at least one action" }]}
        extra={<span className="text-xs text-[#9E9E9E]">Creates one permission row per action</span>}
      >
        <Select
          mode="multiple"
          placeholder="Select actions"
          options={ALL_ACTIONS.map((a) => ({
            label: <Tag color={ACTION_COLORS[a] ?? "default"} className="!m-0">{a}</Tag>,
            value: a,
          }))}
        />
      </Form.Item>
    </>
  );

  // Edit form: resource + single action (editing one row)
  const PermEditFields = () => (
    <>
      <Form.Item
        name="resource"
        label={<span className="font-semibold">Resource Name</span>}
        rules={[
          { required: true, message: "Enter a resource name" },
          {
            pattern: /^[a-z0-9_.-]+$/,
            message: "Use lowercase letters, numbers, underscores, hyphens, or dots",
          },
        ]}
      >
        <Input placeholder="resource_name" className="font-mono" />
      </Form.Item>

      <Form.Item
        name="action"
        label={<span className="font-semibold">Action</span>}
        rules={[{ required: true, message: "Select an action" }]}
      >
        <Select
          placeholder="Select action"
          options={ALL_ACTIONS.map((a) => ({
            label: <Tag color={ACTION_COLORS[a] ?? "default"} className="!m-0">{a}</Tag>,
            value: a,
          }))}
        />
      </Form.Item>
    </>
  );

  return (
    <PageShell
      eyebrow="Back Office"
      title="Role Management"
      description="Permissions are the sole access gate — every route requires a specific action:resource check. Roles are named bundles of permissions assigned to users."
      stats={stats}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        size="large"
        className="roles-tabs"
        items={[
          {
            key: "roles",
            label: (
              <span className="flex items-center gap-2">
                <LuShield size={15} />
                Roles
              </span>
            ),
            children: (
              <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-[#212121]">Role Directory</h3>
                    <p className="text-sm text-[#616161]">
                      Each tag shows an <span className="font-mono font-semibold">action:resource</span> guard string — the exact check applied when a user hits the corresponding route.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Input
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      allowClear
                      prefix={<SearchOutlined />}
                      placeholder="Search roles or permissions"
                      className="w-full sm:w-[280px]"
                    />
                    <Button
                      type="primary"
                      icon={<LuPlus size={16} />}
                      className="!h-9 !rounded-2xl !px-5"
                      onClick={() => setIsAddOpen(true)}
                    >
                      Add Role
                    </Button>
                  </div>
                </div>
                <div className="mb-4 flex items-center gap-2">
                  <div className="section-badge inline-flex items-center gap-2 rounded-full bg-[#F9FAFB] px-4 py-2 text-sm font-medium text-[#616161]">
                    <LuBadgeCheck size={16} className="text-[#D32F2F]" />
                    {roles.length} configured roles
                  </div>
                </div>
                <Table
                  dataSource={roles}
                  columns={roleColumns}
                  rowKey="id"
                  pagination={false}
                  size="middle"
                  scroll={{ x: 700 }}
                />
              </section>
            ),
          },
          {
            key: "permissions",
            label: (
              <span className="flex items-center gap-2">
                <LuKey size={15} />
                Permissions
              </span>
            ),
            children: (
              <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:p-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-[#212121]">Permission Catalog</h3>
                    <p className="text-sm text-[#616161]">
                      Each resource + action combination becomes an <span className="font-mono font-semibold">action:resource</span> guard string. Assign resource entries to roles to grant access.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Input
                      value={permSearchText}
                      onChange={(e) => setPermSearchText(e.target.value)}
                      allowClear
                      prefix={<SearchOutlined />}
                      placeholder="Search permissions or roles"
                      className="w-full sm:w-[280px]"
                    />
                    <Button
                      type="primary"
                      icon={<LuPlus size={16} />}
                      className="!h-9 !rounded-2xl !px-5"
                      onClick={() => setIsPermAddOpen(true)}
                    >
                      Add Permission
                    </Button>
                  </div>
                </div>
                <div className="mb-4 flex items-center gap-2">
                  <div className="section-badge inline-flex items-center gap-2 rounded-full bg-[#F9FAFB] px-4 py-2 text-sm font-medium text-[#616161]">
                    <LuKey size={16} className="text-[#D32F2F]" />
                    {permissionsWithRoles.length} permission entries
                  </div>
                </div>
                <Table
                  dataSource={permissionsWithRoles}
                  columns={permColumns}
                  rowKey="id"
                  pagination={false}
                  size="middle"
                  scroll={{ x: 800 }}
                />
              </section>
            ),
          },
        ]}
      />

      {/* ── Add Role modal ────────────────────────────────────────────────── */}
      <Modal
        title="Add Role"
        open={isAddOpen}
        onCancel={() => setIsAddOpen(false)}
        footer={null}
        width={640}
        destroyOnClose
      >
        <Form form={addForm} layout="vertical" onFinish={handleCreateRole}>
          <Form.Item
            name="name"
            label="Role Name"
            rules={[{ required: true, message: "Enter a role name" }]}
          >
            <Input placeholder="e.g. stores_officer" />
          </Form.Item>

          <Form.Item name="permissions" label="Initial Permissions (optional)">
            <Checkbox.Group className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {permissions.map((perm) => (
                <Checkbox key={perm.id} value={perm.id}>
                  <div>
                    <span className="font-semibold text-[#212121]">{perm.resource}</span>
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {perm.actions?.map((a) => (
                        <Tag key={a} color={ACTION_COLORS[a] ?? "default"} className="!m-0 !text-[10px]">
                          {a}
                        </Tag>
                      ))}
                    </div>
                  </div>
                </Checkbox>
              ))}
            </Checkbox.Group>
          </Form.Item>

          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={addRole.isPending}
              className="!h-11 !rounded-2xl"
            >
              Create Role
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Manage Permissions modal (assign perms to a role) ─────────────── */}
      <Modal
        title={
          <div>
            <p className="text-base font-bold text-[#212121]">Manage Permissions</p>
            {manageRole && (
              <p className="mt-0.5 text-sm font-normal text-[#616161]">
                Role:{" "}
                <span className="font-semibold text-[#D32F2F]">{manageRole.name}</span>
              </p>
            )}
          </div>
        }
        open={!!manageRole}
        onCancel={() => setManageRole(null)}
        footer={null}
        width={680}
        destroyOnClose
      >
        {(() => {
          const assignedPerms = permissions.filter((p) => selectedPermIds.includes(p.id));
          const unassignedPerms = permissions.filter((p) => !selectedPermIds.includes(p.id));
          return (
            <div>
              {/* ── Assigned list ── */}
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#212121]">
                  Assigned Permissions
                </span>
                <span className="rounded-full bg-[#F0F9FF] px-2.5 py-0.5 text-xs font-semibold text-[#0369A1]">
                  {assignedPerms.length}
                </span>
              </div>

              {assignedPerms.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#E0E0E0] px-6 py-8 text-center text-sm text-[#9E9E9E]">
                  No permissions assigned to this role yet.
                </div>
              ) : (
                <div className="max-h-72 flex flex-wrap gap-1.5 overflow-y-auto">
                  {assignedPerms.map((perm) => (
                    <span
                      key={perm.id}
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] font-semibold"
                      style={{
                        borderColor: (ACTION_COLORS[perm.action] ? undefined : "#E0E0E0"),
                        backgroundColor: "#F8FAFC",
                        color: "#424242"
                      }}
                    >
                      <Tag
                        color={ACTION_COLORS[perm.action] ?? "default"}
                        className="!m-0 !font-mono !text-[11px]"
                        closable
                        onClose={(e) => { e.preventDefault(); removePermission(perm.id); }}
                      >
                        {perm.action}:{perm.resource}
                      </Tag>
                    </span>
                  ))}
                </div>
              )}

              {/* ── Add picker ── */}
              {unassignedPerms.length > 0 && (
                <>
                  <div className="my-4 border-t border-[#F1F1F1]" />
                  <div className="mb-2 text-sm font-semibold text-[#212121]">Add Permissions</div>
                  <div className="flex gap-2">
                    <Select
                      mode="multiple"
                      className="flex-1"
                      placeholder="Search and select permissions to add…"
                      value={addPickerValue}
                      onChange={setAddPickerValue}
                      optionFilterProp="label"
                      options={unassignedPerms.map((p) => ({
                        label: `${p.action}:${p.resource}`,
                        value: p.id,
                      }))}
                      optionRender={(opt) => (
                        <Tag
                          color={ACTION_COLORS[opt.data.label.split(":")[0]] ?? "default"}
                          className="!font-mono !text-[11px]"
                        >
                          {opt.data.label}
                        </Tag>
                      )}
                    />
                    <Button
                      type="primary"
                      icon={<LuPlus size={14} />}
                      disabled={addPickerValue.length === 0}
                      onClick={handleAddPicked}
                      className="!h-9 !shrink-0 !rounded-2xl !px-4"
                    >
                      Add
                    </Button>
                  </div>
                </>
              )}

              {/* ── Footer ── */}
              <div className="mt-6 flex gap-3">
                <Button
                  onClick={() => setManageRole(null)}
                  className="!h-11 !flex-1 !rounded-2xl"
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  loading={updatePermissions.isPending}
                  onClick={handleSaveRolePermissions}
                  className="!h-11 !flex-1 !rounded-2xl"
                >
                  Save Permissions
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ── Add Permission modal ──────────────────────────────────────────── */}
      <Modal
        title={
          <span className="flex items-center gap-2 text-base font-bold text-[#212121]">
            <LuKey size={16} className="text-[#D32F2F]" />
            Create Permission
          </span>
        }
        open={isPermAddOpen}
        onCancel={() => { setIsPermAddOpen(false); permAddForm.resetFields(); }}
        footer={null}
        width={520}
        destroyOnClose
      >
        <Form form={permAddForm} layout="vertical" onFinish={handleCreatePermission} className="pt-2">
          <PermCreateFields />
          <Form.Item className="mb-0 pt-2">
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={createPermission.isPending}
              className="!h-11 !rounded-2xl"
            >
              Create Permission
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Edit Permission modal ────────────────────────────────────────── */}
      <Modal
        title={
          <div>
            <span className="flex items-center gap-2 text-base font-bold text-[#212121]">
              <LuPencil size={16} className="text-[#D32F2F]" />
              Edit Permission
            </span>
            {editingPerm && (
              <p className="mt-0.5 font-mono text-sm font-normal text-[#616161]">
                {editingPerm.resource}
              </p>
            )}
          </div>
        }
        open={!!editingPerm}
        onCancel={() => setEditingPerm(null)}
        footer={null}
        width={520}
        destroyOnClose
      >
        <Form
          form={permEditForm}
          layout="vertical"
          onFinish={handleUpdatePermission}
          className="pt-2"
        >
          <PermEditFields />
          <div className="flex gap-3 pt-2">
            <Button onClick={() => setEditingPerm(null)} className="!h-11 !flex-1 !rounded-2xl">
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={updatePermission.isPending}
              className="!h-11 !flex-1 !rounded-2xl"
            >
              Save Changes
            </Button>
          </div>
        </Form>
      </Modal>
    </PageShell>
  );
};

export default Roles;
