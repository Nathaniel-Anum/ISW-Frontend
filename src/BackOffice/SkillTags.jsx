import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SearchOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Switch, Table, Tag } from "antd";
import { useDeferredValue, useMemo, useState } from "react";
import { LuPlus, LuTag } from "react-icons/lu";
import { toast } from "react-toastify";
import PageShell from "../Components/ui/page-shell";
import api from "../utils/config";

const SkillTags = () => {
  const [open, setOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const deferredSearch = useDeferredValue(searchText.trim());

  const { data, isLoading } = useQuery({
    queryKey: ["adminSkillTags", deferredSearch],
    queryFn: () =>
      api.get("/service-desk/admin/skill-tags", {
        params: deferredSearch ? { search: deferredSearch } : undefined,
      }),
  });

  const tags = data?.data || [];

  const stats = useMemo(() => {
    const activeCount = tags.filter((t) => t.isActive).length;
    return [
      { label: "Skill Tags", value: tags.length, caption: "Competency labels for support staff" },
      { label: "Active", value: activeCount, caption: "Shown in support profile editor" },
      { label: "Inactive", value: tags.length - activeCount, caption: "Hidden from profile editor" },
    ];
  }, [tags]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["adminSkillTags"] });
    queryClient.invalidateQueries({ queryKey: ["activeSkillTags"] });
  };

  const createTag = useMutation({
    mutationFn: (values) => api.post("/service-desk/admin/skill-tags", values),
    onSuccess: () => {
      toast.success("Skill tag created");
      invalidate();
      setOpen(false);
      form.resetFields();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to create skill tag"),
  });

  const updateTag = useMutation({
    mutationFn: ({ id, ...values }) => api.patch(`/service-desk/admin/skill-tags/${id}`, values),
    onSuccess: () => {
      toast.success("Skill tag updated");
      invalidate();
      setOpen(false);
      setEditingRecord(null);
      form.resetFields();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to update skill tag"),
  });

  const deleteTag = useMutation({
    mutationFn: (id) => api.delete(`/service-desk/admin/skill-tags/${id}`),
    onSuccess: () => {
      toast.success("Skill tag deleted");
      invalidate();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to delete skill tag"),
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
      toast.error("Tag name is required");
      return;
    }

    if (editingRecord) {
      if (!editingRecord.id) {
        toast.error("Unable to update skill tag: missing tag ID");
        return;
      }
      updateTag.mutate({ id: editingRecord.id, ...payload });
      return;
    }

    createTag.mutate(payload);
  };

  const handleDeleteTag = (record) => {
    if (!record?.id) {
      toast.error("Unable to delete skill tag: missing tag ID");
      return;
    }
    deleteTag.mutate(record.id);
  };

  const columns = [
    {
      title: "Tag Name",
      dataIndex: "name",
      key: "name",
      render: (value) => (
        <span className="inline-flex items-center gap-1.5 font-semibold text-[#212121]">
          <LuTag size={14} className="text-[#D32F2F]" />
          {value}
        </span>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (value) => value || <span className="text-[#9E9E9E]">No description</span>,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (value) => (
        <Tag
          className={`rounded-full border-0 px-3 py-1 text-xs font-semibold ${
            value ? "bg-[#ECFDF3] text-[#166534]" : "bg-[#FFF7ED] text-[#C2410C]"
          }`}
        >
          {value ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div className="flex gap-2">
          <Button size="small" onClick={() => openEditModal(record)}>
            Edit
          </Button>
          <Button
            size="small"
            danger
            onClick={() => {
              Modal.confirm({
                title: `Delete "${record.name}"?`,
                content: "This tag will be removed from the skill tag list. Existing skill assignments on support profiles will not be affected.",
                okText: "Delete",
                okButtonProps: { danger: true },
                onOk: () => handleDeleteTag(record),
              });
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageShell
      eyebrow="Back Office"
      title="Skill Tags"
      description="Define the competency and expertise labels that can be assigned to service desk support staff profiles."
      stats={stats}
      actions={
        <>
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search skill tags"
            className="w-full sm:w-[320px]"
          />
          <Button
            type="primary"
            icon={<LuPlus size={16} />}
            className="!h-11 !rounded-2xl !px-5"
            onClick={openCreateModal}
          >
            Create Tag
          </Button>
        </>
      }
    >
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#212121]">Tag Registry</h3>
            <p className="text-sm text-[#616161]">
              Active tags appear as options in support profile editing, enabling skill-based ticket routing.
            </p>
          </div>
          <div className="section-badge inline-flex items-center gap-2 rounded-full bg-[#F9FAFB] px-4 py-2 text-sm font-medium text-[#616161]">
            <LuTag size={16} className="text-[#D32F2F]" />
            {tags.length} tags
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={tags}
          rowKey="id"
          loading={isLoading}
          size="middle"
          scroll={{ x: 700 }}
        />
      </section>

      <Modal
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditingRecord(null);
        }}
        footer={null}
        title={editingRecord ? "Edit Skill Tag" : "Create Skill Tag"}
        width={560}
        destroyOnClose
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Tag Name"
            rules={[{ required: true, message: "Please enter a tag name" }]}
          >
            <Input
              prefix={<LuTag size={16} className="text-[#616161]" />}
              placeholder="e.g. Networking, Hardware, Windows"
            />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea
              rows={3}
              placeholder="Briefly describe when this skill tag applies"
            />
          </Form.Item>

          <Form.Item name="isActive" label="Active (visible in profile editor)" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              block
              className="!h-11 !rounded-2xl"
              loading={createTag.isPending || updateTag.isPending}
            >
              {editingRecord ? "Update Tag" : "Create Tag"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageShell>
  );
};

export default SkillTags;
