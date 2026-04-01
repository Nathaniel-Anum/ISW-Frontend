import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SearchOutlined } from "@ant-design/icons";
import { Button, Checkbox, Form, Input, Popconfirm, Select, Table, Tag, Tooltip } from "antd";
import { useDeferredValue, useMemo, useState } from "react";
import { LuBoxes, LuLayers, LuPlus, LuShield, LuTrash2, LuPencil } from "react-icons/lu";
import { toast } from "react-toastify";
import PageShell from "../Components/ui/page-shell";
import api from "../utils/config";
import { formatCapitalizedLabel } from "../utils/formatText";

const DATA_TYPES = ["TEXT", "TEXTAREA", "NUMBER", "BOOLEAN", "DATE", "SELECT"];
const SCOPES = ["TEMPLATE", "ASSET", "BOTH"];

const scopeColor = { TEMPLATE: "orange", ASSET: "blue", BOTH: "green" };
const dataTypeColor = {
  TEXT: "default", TEXTAREA: "default", NUMBER: "purple",
  BOOLEAN: "cyan", DATE: "geekblue", SELECT: "gold",
};

const ItItemCategories = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const deferredSearch = useDeferredValue(searchText.trim().toLowerCase());

  const { data, isLoading } = useQuery({
    queryKey: ["itItemCategories"],
    queryFn: () => api.get("/admin/it-item-categories"),
  });

  const categories = data?.data || [];

  const filtered = useMemo(() => {
    if (!deferredSearch) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(deferredSearch) ||
        (c.description || "").toLowerCase().includes(deferredSearch),
    );
  }, [categories, deferredSearch]);

  const stats = useMemo(() => {
    const builtInCount = categories.filter((c) => c.isBuiltIn).length;
    const totalAttrs = categories.reduce((sum, c) => sum + (c.attributeDefinitions?.length || 0), 0);
    return [
      { label: "Categories", value: categories.length, caption: "Registered item category types" },
      { label: "Built-in", value: builtInCount, caption: "Managed by the system" },
      { label: "Attributes", value: totalAttrs, caption: "Total attribute definitions" },
    ];
  }, [categories]);

  const refreshCategories = () => {
    queryClient.invalidateQueries({ queryKey: ["itItemCategories"] });
    queryClient.invalidateQueries({ queryKey: ["stockReceiveCategories"] });
  };

  const createMutation = useMutation({
    mutationFn: (values) => api.post("/admin/it-item-categories", values),
    onSuccess: () => {
      toast.success("Category created");
      refreshCategories();
      closeModal();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to create category"),
  });

  const updateMutation = useMutation({
    mutationFn: (values) => api.patch(`/admin/it-item-categories/${editingRecord.id}`, values),
    onSuccess: () => {
      toast.success("Category updated");
      refreshCategories();
      closeModal();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to update category"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/it-item-categories/${id}`),
    onSuccess: () => {
      toast.success("Category deleted");
      refreshCategories();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to delete category"),
  });

  const openCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ attributeDefinitions: [] });
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      defaultItemClass: record.defaultItemClass ?? undefined,
      legacyDeviceType: record.legacyDeviceType ?? undefined,
      attributeDefinitions: (record.attributeDefinitions || []).map((attr) => ({
        key: attr.key,
        label: attr.label,
        dataType: attr.dataType,
        scope: attr.scope,
        isRequired: attr.isRequired,
        helpText: attr.helpText,
        optionsJson: Array.isArray(attr.optionsJson)
          ? attr.optionsJson.join(", ")
          : attr.optionsJson ?? "",
      })),
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const handleSubmit = (values) => {
    const payload = {
      name: values.name,
      description: values.description,
      defaultItemClass: values.defaultItemClass,
      legacyDeviceType: values.legacyDeviceType,
      attributeDefinitions: (values.attributeDefinitions || []).map((attr, index) => ({
        key: attr.key.trim().replace(/\s+/g, "_").toLowerCase(),
        label: attr.label,
        dataType: attr.dataType,
        scope: attr.scope || "BOTH",
        isRequired: attr.isRequired || false,
        sortOrder: index,
        helpText: attr.helpText,
        optionsJson:
          attr.dataType === "SELECT"
            ? attr.optionsJson
                ?.split(",")
                .map((o) => o.trim())
                .filter(Boolean)
            : undefined,
      })),
    };

    if (editingRecord) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns = [
    {
      title: "Category",
      key: "name",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#212121]">{record.name}</span>
          {record.isBuiltIn && (
            <Tooltip title="Built-in — managed by the system">
              <LuShield size={14} className="text-[#6366F1]" />
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (val) => <span className="text-sm text-[#616161]">{val || "—"}</span>,
    },
    {
      title: "Default Class",
      dataIndex: "defaultItemClass",
      key: "defaultItemClass",
      render: (val) =>
        val ? (
          <Tag className="rounded-full border-0 bg-[#EEF2FF] px-3 py-0.5 text-xs font-semibold text-[#3730A3]">
            {formatCapitalizedLabel(val)}
          </Tag>
        ) : (
          <span className="text-[#9CA3AF]">—</span>
        ),
    },
    {
      title: "Attributes",
      key: "attrs",
      render: (_, record) => {
        const count = record.attributeDefinitions?.length || 0;
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F9FAFB] px-3 py-0.5 text-xs font-medium text-[#374151]">
            <LuLayers size={12} />
            {count}
          </span>
        );
      },
    },
    {
      title: "Items",
      key: "items",
      render: (_, record) => (
        <span className="text-sm text-[#374151]">{record._count?.items ?? 0}</span>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Button
            size="small"
            icon={<LuPencil size={13} />}
            className="rounded-xl"
            onClick={() => openEdit(record)}
          >
            Edit
          </Button>
          {!record.isBuiltIn && (
            <Popconfirm
              title="Delete category"
              description={
                record._count?.items > 0
                  ? `This category has ${record._count.items} active item(s). Re-assign them first.`
                  : "This will permanently remove the category."
              }
              onConfirm={() => {
                if (record._count?.items > 0) return;
                deleteMutation.mutate(record.id);
              }}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ disabled: record._count?.items > 0 }}
            >
              <button className="rounded-full p-1.5 transition hover:bg-[#FFEBEE]">
                <LuTrash2 size={16} className="text-[#EF4444]" />
              </button>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <PageShell
      eyebrow="Back Office"
      title="IT Item Categories"
      description="Define the categories and their attribute schemas used when registering IT item templates in the catalog."
      stats={stats}
      actions={
        <>
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search categories"
            className="w-full sm:w-[300px]"
          />
          <Button
            type="primary"
            icon={<LuPlus size={16} />}
            className="!h-11 !rounded-2xl !px-5"
            onClick={openCreate}
          >
            New Category
          </Button>
        </>
      }
    >
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#212121]">Category Registry</h3>
            <p className="text-sm text-[#616161]">
              Each category defines the attribute schema that items of that type must capture.
            </p>
          </div>
          <div className="section-badge inline-flex items-center gap-2 rounded-full bg-[#F9FAFB] px-4 py-2 text-sm font-medium text-[#616161]">
            <LuBoxes size={16} className="text-[#D32F2F]" />
            {filtered.length} categories
          </div>
        </div>

        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          size="middle"
          scroll={{ x: 900 }}
          expandable={{
            expandedRowRender: (record) => {
              const attrs = record.attributeDefinitions || [];
              if (!attrs.length) {
                return (
                  <p className="px-4 py-3 text-sm text-[#9CA3AF]">No attribute definitions for this category.</p>
                );
              }
              return (
                <div className="flex flex-wrap gap-2 px-4 py-3">
                  {attrs.map((attr) => (
                    <div
                      key={attr.key}
                      className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] px-3 py-2 text-xs"
                    >
                      <p className="font-semibold text-[#111827]">{attr.label}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Tag color={dataTypeColor[attr.dataType] || "default"} className="m-0 text-[10px]">
                          {attr.dataType}
                        </Tag>
                        <Tag color={scopeColor[attr.scope] || "default"} className="m-0 text-[10px]">
                          {attr.scope}
                        </Tag>
                        {attr.isRequired && <Tag color="red" className="m-0 text-[10px]">Required</Tag>}
                      </div>
                    </div>
                  ))}
                </div>
              );
            },
            rowExpandable: () => true,
          }}
        />
      </section>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-10"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-2xl">
            <h2 className="mb-1 text-xl font-bold text-[#111827]">
              {editingRecord ? "Edit Category" : "New IT Item Category"}
            </h2>
            <p className="mb-6 text-sm text-[#6B7280]">
              {editingRecord
                ? "Update the category name, description, and attribute schema."
                : "Create a new category with an optional attribute schema for item templates."}
            </p>

            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
                <Form.Item
                  name="name"
                  label="Category Name"
                  rules={[{ required: true, message: "Name is required" }]}
                  className="md:col-span-2"
                >
                  <Input placeholder="e.g. Laptop, Network Switch, Projector" />
                </Form.Item>

                <Form.Item name="description" label="Description" className="md:col-span-2">
                  <Input.TextArea rows={2} placeholder="Brief description of this category" />
                </Form.Item>

                <Form.Item name="defaultItemClass" label="Default Item Class">
                  <Select placeholder="Select class" allowClear>
                    <Select.Option value="FIXED_ASSET">Fixed Asset</Select.Option>
                    <Select.Option value="CONSUMABLE">Consumable</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item name="legacyDeviceType" label="Legacy Device Type">
                  <Select placeholder="Select type (optional)" allowClear>
                    {["LAPTOP", "PRINTER", "UPS", "DESKTOP", "OTHER"].map((t) => (
                      <Select.Option key={t} value={t}>
                        {formatCapitalizedLabel(t)}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>

              {/* Attribute Definitions */}
              <div className="mb-4 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-[#111827]">Attribute Definitions</h4>
                    <p className="text-xs text-[#6B7280]">
                      Fields the inventory officer fills in when receiving stock for this category.
                    </p>
                  </div>
                </div>

                <Form.List name="attributeDefinitions">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map((field) => (
                        <div
                          key={field.key}
                          className="mb-3 rounded-xl border border-[#E5E7EB] bg-white p-3"
                        >
                          <div className="grid grid-cols-2 gap-x-3 gap-y-0">
                            <Form.Item
                              {...field}
                              name={[field.name, "label"]}
                              label="Label"
                              rules={[{ required: true, message: "Label required" }]}
                              className="mb-2"
                            >
                              <Input placeholder="Human-readable label" size="small" />
                            </Form.Item>

                            <Form.Item
                              {...field}
                              name={[field.name, "key"]}
                              label="Key"
                              rules={[{ required: true, message: "Key required" }]}
                              className="mb-2"
                            >
                              <Input placeholder="snake_case_key" size="small" />
                            </Form.Item>

                            <Form.Item
                              {...field}
                              name={[field.name, "dataType"]}
                              label="Data Type"
                              rules={[{ required: true }]}
                              className="mb-2"
                            >
                              <Select size="small" placeholder="Type">
                                {DATA_TYPES.map((t) => (
                                  <Select.Option key={t} value={t}>{t}</Select.Option>
                                ))}
                              </Select>
                            </Form.Item>

                            <Form.Item
                              {...field}
                              name={[field.name, "scope"]}
                              label="Scope"
                              initialValue="BOTH"
                              className="mb-2"
                            >
                              <Select size="small">
                                {SCOPES.map((s) => (
                                  <Select.Option key={s} value={s}>{s}</Select.Option>
                                ))}
                              </Select>
                            </Form.Item>

                            <Form.Item
                              noStyle
                              shouldUpdate={(prev, curr) =>
                                prev.attributeDefinitions?.[field.name]?.dataType !==
                                curr.attributeDefinitions?.[field.name]?.dataType
                              }
                            >
                              {({ getFieldValue }) => {
                                const dt = getFieldValue([
                                  "attributeDefinitions",
                                  field.name,
                                  "dataType",
                                ]);
                                return dt === "SELECT" ? (
                                  <Form.Item
                                    {...field}
                                    name={[field.name, "optionsJson"]}
                                    label="Options (comma-separated)"
                                    className="col-span-2 mb-2"
                                  >
                                    <Input placeholder="Option A, Option B, Option C" size="small" />
                                  </Form.Item>
                                ) : null;
                              }}
                            </Form.Item>

                            <Form.Item
                              {...field}
                              name={[field.name, "helpText"]}
                              label="Help Text"
                              className="col-span-2 mb-2"
                            >
                              <Input placeholder="Hint shown to user (optional)" size="small" />
                            </Form.Item>
                          </div>

                          <div className="flex items-center justify-between">
                            <Form.Item
                              {...field}
                              name={[field.name, "isRequired"]}
                              valuePropName="checked"
                              className="mb-0"
                            >
                              <Checkbox>Required</Checkbox>
                            </Form.Item>
                            <button
                              type="button"
                              onClick={() => remove(field.name)}
                              className="text-xs text-[#EF4444] underline"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}

                      <Button
                        type="dashed"
                        block
                        icon={<LuPlus size={14} />}
                        onClick={() => add({ scope: "BOTH", dataType: "TEXT", isRequired: false })}
                        className="!rounded-xl"
                      >
                        Add Attribute
                      </Button>
                    </>
                  )}
                </Form.List>
              </div>

              <div className="flex justify-end gap-3">
                <Button onClick={closeModal}>Cancel</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSubmitting}
                  className="!rounded-2xl !px-6"
                >
                  {editingRecord ? "Update" : "Create Category"}
                </Button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default ItItemCategories;
