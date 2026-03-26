import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";
import { useState } from "react";
import { LuBookOpen, LuEye, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
import { toast } from "react-toastify";
import api from "../utils/config";
import { useUser } from "../utils/userContext";
import PageShell from "./ui/page-shell";

const { TextArea } = Input;

export default function KnowledgeBase() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [searchText, setSearchText] = useState("");

  const canManage = user?.roles?.some((r) =>
    ["admin", "service_desk_manager"].includes(r)
  );
  const canDelete = user?.roles?.some((r) => ["admin"].includes(r));

  const { data: articlesRes, isLoading } = useQuery({
    queryKey: ["kbArticles", searchText],
    queryFn: () =>
      api.get("/service-desk/knowledge-base", {
        params: { search: searchText || undefined },
      }),
  });

  const { data: categoriesRes } = useQuery({
    queryKey: ["sdCategories"],
    queryFn: () => api.get("/service-desk/categories"),
  });

  const articles = articlesRes?.data || [];
  const categories = categoriesRes?.data || [];

  const createMutation = useMutation({
    mutationFn: (data) => api.post("/service-desk/knowledge-base", data),
    onSuccess: () => {
      toast.success("Article created");
      queryClient.invalidateQueries(["kbArticles"]);
      setCreateOpen(false);
      createForm.resetFields();
    },
    onError: () => toast.error("Failed to create article"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) =>
      api.patch(`/service-desk/knowledge-base/${id}`, data),
    onSuccess: () => {
      toast.success("Article updated");
      queryClient.invalidateQueries(["kbArticles"]);
      setEditRecord(null);
    },
    onError: () => toast.error("Failed to update article"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/service-desk/knowledge-base/${id}`),
    onSuccess: () => {
      toast.success("Article deleted");
      queryClient.invalidateQueries(["kbArticles"]);
    },
    onError: () => toast.error("Failed to delete article"),
  });

  const togglePublished = (record) => {
    updateMutation.mutate({ id: record.id, isPublished: !record.isPublished });
  };

  const openEdit = (record) => {
    setEditRecord(record);
    editForm.setFieldsValue({
      title: record.title,
      body: record.body,
      categoryId: record.categoryId,
      tags: record.tags,
      isPublished: record.isPublished,
    });
  };

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      width: 280,
      render: (title, record) => (
        <button
          type="button"
          className="text-left font-medium text-blue-600 hover:underline"
          onClick={() => setViewRecord(record)}
        >
          {title}
        </button>
      ),
    },
    {
      title: "Category",
      dataIndex: ["category", "name"],
      key: "category",
      render: (name) => (name ? <Tag color="blue">{name}</Tag> : "—"),
    },
    {
      title: "Tags",
      dataIndex: "tags",
      key: "tags",
      render: (tags) =>
        tags?.length > 0 ? (
          <Space wrap size={4}>
            {tags.map((t) => (
              <Tag key={t}>{t}</Tag>
            ))}
          </Space>
        ) : (
          "—"
        ),
    },
    {
      title: "Views",
      dataIndex: "viewCount",
      key: "viewCount",
      width: 80,
      align: "center",
    },
    {
      title: "Published",
      dataIndex: "isPublished",
      key: "isPublished",
      width: 100,
      align: "center",
      render: (val, record) =>
        canManage ? (
          <Switch
            size="small"
            checked={val}
            onChange={() => togglePublished(record)}
            loading={updateMutation.isPending}
          />
        ) : (
          <Tag color={val ? "green" : "default"}>{val ? "Yes" : "No"}</Tag>
        ),
    },
    {
      title: "Author",
      dataIndex: ["createdBy", "name"],
      key: "author",
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<LuEye />}
            onClick={() => setViewRecord(record)}
          />
          {canManage && (
            <Button
              size="small"
              icon={<LuPencil />}
              onClick={() => openEdit(record)}
            />
          )}
          {canDelete && (
            <Button
              size="small"
              danger
              icon={<LuTrash2 />}
              onClick={() =>
                Modal.confirm({
                  title: "Delete Article",
                  content: "This article will be soft-deleted. Continue?",
                  okType: "danger",
                  onOk: () => deleteMutation.mutate(record.id),
                })
              }
            />
          )}
        </Space>
      ),
    },
  ];

  const ArticleFormFields = ({ form }) => (
    <>
      <Form.Item
        name="title"
        label="Title"
        rules={[{ required: true, message: "Title is required" }]}
      >
        <Input placeholder="Enter article title" />
      </Form.Item>
      <Form.Item
        name="body"
        label="Content"
        rules={[{ required: true, message: "Content is required" }]}
      >
        <TextArea rows={8} placeholder="Write the article content here..." />
      </Form.Item>
      <Form.Item name="categoryId" label="Category">
        <Select
          allowClear
          placeholder="Select category"
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
        />
      </Form.Item>
      <Form.Item name="tags" label="Tags">
        <Select
          mode="tags"
          placeholder="Add tags (press Enter)"
          tokenSeparators={[","]}
        />
      </Form.Item>
      <Form.Item name="isPublished" label="Published" valuePropName="checked">
        <Switch />
      </Form.Item>
    </>
  );

  const published = articles.filter((a) => a.isPublished).length;
  const drafts = articles.filter((a) => !a.isPublished).length;

  return (
    <PageShell
      title="Knowledge Base"
      subtitle="Manage support articles and troubleshooting guides"
      icon={<LuBookOpen className="text-2xl" />}
      extra={
        canManage && (
          <Button
            type="primary"
            icon={<LuPlus />}
            onClick={() => setCreateOpen(true)}
          >
            New Article
          </Button>
        )
      }
    >
      {/* Stats */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { label: "Total Articles", value: articles.length, color: "bg-blue-50 text-blue-700" },
          { label: "Published", value: published, color: "bg-green-50 text-green-700" },
          { label: "Drafts", value: drafts, color: "bg-yellow-50 text-yellow-700" },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl p-4 ${color}`}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <Input.Search
          placeholder="Search articles by title, content, or tag..."
          allowClear
          onSearch={(val) => setSearchText(val)}
          onChange={(e) => !e.target.value && setSearchText("")}
          style={{ maxWidth: 400 }}
        />
      </div>

      <Table
        dataSource={articles}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 15 }}
        scroll={{ x: 900 }}
      />

      {/* Create Modal */}
      <Modal
        title="New Knowledge Base Article"
        open={createOpen}
        onCancel={() => {
          setCreateOpen(false);
          createForm.resetFields();
        }}
        onOk={() =>
          createForm
            .validateFields()
            .then((values) => createMutation.mutate(values))
        }
        confirmLoading={createMutation.isPending}
        okText="Create"
        width={700}
      >
        <Form form={createForm} layout="vertical" className="mt-4">
          <ArticleFormFields form={createForm} />
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Article"
        open={!!editRecord}
        onCancel={() => setEditRecord(null)}
        onOk={() =>
          editForm
            .validateFields()
            .then((values) =>
              updateMutation.mutate({ id: editRecord.id, ...values })
            )
        }
        confirmLoading={updateMutation.isPending}
        okText="Save Changes"
        width={700}
      >
        <Form form={editForm} layout="vertical" className="mt-4">
          <ArticleFormFields form={editForm} />
        </Form>
      </Modal>

      {/* View Modal */}
      <Modal
        title={viewRecord?.title}
        open={!!viewRecord}
        onCancel={() => setViewRecord(null)}
        footer={[
          <Button key="close" onClick={() => setViewRecord(null)}>
            Close
          </Button>,
        ]}
        width={700}
      >
        {viewRecord && (
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              {viewRecord.category && (
                <Tag color="blue">{viewRecord.category.name}</Tag>
              )}
              {viewRecord.tags?.map((t) => (
                <Tag key={t}>{t}</Tag>
              ))}
              <Tag color={viewRecord.isPublished ? "green" : "default"}>
                {viewRecord.isPublished ? "Published" : "Draft"}
              </Tag>
              <span className="text-xs text-gray-400">
                {viewRecord.viewCount} views
              </span>
            </div>
            <Typography.Paragraph
              style={{ whiteSpace: "pre-wrap" }}
              className="text-sm"
            >
              {viewRecord.body}
            </Typography.Paragraph>
            <p className="text-xs text-gray-400">
              By {viewRecord.createdBy?.name}
            </p>
          </div>
        )}
      </Modal>
    </PageShell>
  );
}
