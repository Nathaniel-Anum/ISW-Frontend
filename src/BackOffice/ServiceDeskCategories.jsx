import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SearchOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Switch, Table, Tag } from "antd";
import { useDeferredValue, useMemo, useState } from "react";
import { LuHeadset, LuPlus, LuTags } from "react-icons/lu";
import { toast } from "react-toastify";
import PageShell from "../Components/ui/page-shell";
import api from "../utils/config";

const ServiceDeskCategories = () => {
  const [open, setOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const deferredSearch = useDeferredValue(searchText.trim());

  const { data, isLoading } = useQuery({
    queryKey: ["serviceDeskAdminCategories", deferredSearch],
    queryFn: () =>
      api.get("/service-desk/admin/categories", {
        params: deferredSearch ? { search: deferredSearch } : undefined,
      }),
  });

  const categories = data?.data || [];

  const stats = useMemo(() => {
    const activeCount = categories.filter((category) => category.isActive).length;

    return [
      { label: "Categories", value: categories.length, caption: "Helpdesk request groupings" },
      { label: "Active", value: activeCount, caption: "Available to reporters" },
      { label: "Inactive", value: categories.length - activeCount, caption: "Hidden from new ticket forms" },
    ];
  }, [categories]);

  const refreshCategories = () => {
    queryClient.invalidateQueries({ queryKey: ["serviceDeskAdminCategories"] });
    queryClient.invalidateQueries({ queryKey: ["serviceDeskCategories"] });
  };

  const createCategory = useMutation({
    mutationFn: (values) => api.post("/service-desk/admin/categories", values),
    onSuccess: () => {
      toast.success("Category created");
      refreshCategories();
      setOpen(false);
      form.resetFields();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to create category"),
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, ...values }) => api.patch(`/service-desk/admin/categories/${id}`, values),
    onSuccess: () => {
      toast.success("Category updated");
      refreshCategories();
      setOpen(false);
      setEditingRecord(null);
      form.resetFields();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to update category"),
  });

  const openCreateModal = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setOpen(true);
  };

  const openEditModal = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      isActive: record.isActive,
    });
    setOpen(true);
  };

  const handleSubmit = (values) => {
    const payload = {
      name: values.name?.trim(),
      description: values.description?.trim() || undefined,
      isActive: values.isActive,
    };

    if (!payload.name) {
      toast.error("Category name is required");
      return;
    }

    if (editingRecord) {
      if (!editingRecord.id) {
        toast.error("Unable to update category: missing category ID");
        return;
      }
      updateCategory.mutate({ id: editingRecord.id, ...payload });
      return;
    }

    createCategory.mutate(payload);
  };

  const columns = [
    {
      title: "Category",
      dataIndex: "name",
      key: "name",
      render: (value) => <span className="font-semibold text-[#212121]">{value}</span>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (value) => value || "No description",
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (value) => (
        <Tag className={`rounded-full border-0 px-3 py-1 text-xs font-semibold ${value ? "bg-[#ECFDF3] text-[#166534]" : "bg-[#FFF7ED] text-[#C2410C]"}`}>
          {value ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Tickets",
      dataIndex: ["_count", "tickets"],
      key: "tickets",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button size="small" onClick={() => openEditModal(record)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <PageShell
      eyebrow="Back Office"
      title="Service Desk Categories"
      description="Maintain the issue categories reporters can choose from when raising service desk tickets."
      stats={stats}
      actions={
        <>
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search category names or descriptions"
            className="w-full sm:w-[320px]"
          />
          <Button type="primary" icon={<LuPlus size={16} />} className="!h-11 !rounded-2xl !px-5" onClick={openCreateModal}>
            Create Category
          </Button>
        </>
      }
    >
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#212121]">Category Registry</h3>
            <p className="text-sm text-[#616161]">Organize requests into stable buckets for routing, reporting, and triage.</p>
          </div>
          <div className="section-badge inline-flex items-center gap-2 rounded-full bg-[#F9FAFB] px-4 py-2 text-sm font-medium text-[#616161]">
            <LuTags size={16} className="text-[#D32F2F]" />
            {categories.length} categories
          </div>
        </div>

        <Table columns={columns} dataSource={categories} rowKey="id" loading={isLoading} size="middle" scroll={{ x: 900 }} />
      </section>

      <Modal
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditingRecord(null);
        }}
        footer={null}
        title={editingRecord ? "Edit Category" : "Create Category"}
        width={680}
        destroyOnClose
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={handleSubmit}
        >
          <Form.Item name="name" label="Category Name" rules={[{ required: true, message: "Please enter a category name" }]}>
            <Input prefix={<LuHeadset size={16} className="text-[#616161]" />} placeholder="Enter category name" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={4} placeholder="Describe the type of service requests this category should cover" />
          </Form.Item>

          <Form.Item name="isActive" label="Available for ticket creation" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" block className="!h-11 !rounded-2xl" loading={createCategory.isPending || updateCategory.isPending}>
              {editingRecord ? "Update Category" : "Create Category"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageShell>
  );
};

export default ServiceDeskCategories;
