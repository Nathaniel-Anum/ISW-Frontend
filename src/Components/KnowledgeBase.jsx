import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Drawer,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import { useMemo, useState } from "react";
import {
  LuBookOpen,
  LuChevronRight,
  LuEye,
  LuFilter,
  LuPencil,
  LuPlus,
  LuSearch,
  LuTrash2,
  LuX,
} from "react-icons/lu";
import { toast } from "react-toastify";
import api from "../utils/config";
import { useUser } from "../utils/userContext";

const { TextArea } = Input;

const KB_AUTHOR_ROLES = [
  "admin",
  "hardware_technician",
  "supervisor",
  "workshop_supervisor",
  "service_desk_manager",
];

export default function KnowledgeBase() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  // UI state
  const [createOpen, setCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const canManage = user?.roles?.some((r) => KB_AUTHOR_ROLES.includes(r));
  const canDelete = user?.roles?.some((r) => ["admin"].includes(r));

  // ── Queries ───────────────────────────────────────────────────────────
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

  // ── Derived data ──────────────────────────────────────────────────────
  const filteredArticles = useMemo(() => {
    let list = articles;
    if (activeCategory) {
      list = list.filter((a) => a.categoryId === activeCategory);
    }
    // Non-managers only see published articles
    if (!canManage) {
      list = list.filter((a) => a.isPublished);
    }
    return list;
  }, [articles, activeCategory, canManage]);

  // Group articles by category for the ToC sidebar
  const articlesByCategory = useMemo(() => {
    const map = new Map();
    for (const cat of categories) {
      const catArticles = articles.filter(
        (a) => a.categoryId === cat.id && (canManage || a.isPublished)
      );
      if (catArticles.length > 0) {
        map.set(cat.id, { category: cat, articles: catArticles });
      }
    }
    // Uncategorised
    const uncategorised = articles.filter(
      (a) => !a.categoryId && (canManage || a.isPublished)
    );
    if (uncategorised.length > 0) {
      map.set("uncategorised", {
        category: { id: "uncategorised", name: "General" },
        articles: uncategorised,
      });
    }
    return map;
  }, [articles, categories, canManage]);

  // Stats
  const published = articles.filter((a) => a.isPublished).length;
  const drafts = articles.filter((a) => !a.isPublished).length;

  const invalidateArticles = () => queryClient.invalidateQueries({ queryKey: ["kbArticles"] });
  const normalizeArticleValues = (values) => ({
    ...values,
    title: values.title?.trim(),
    body: values.body?.trim(),
    tags: values.tags?.map((tag) => tag.trim()).filter(Boolean),
  });

  // ── Mutations ─────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data) => api.post("/service-desk/knowledge-base", data),
    onSuccess: () => {
      toast.success("Article created");
      invalidateArticles();
      setCreateOpen(false);
      createForm.resetFields();
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? "Failed to create article"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) =>
      api.patch(`/service-desk/knowledge-base/${id}`, data),
    onSuccess: (res) => {
      toast.success("Article updated");
      invalidateArticles();
      if (selectedArticle?.id === res?.data?.id) {
        setSelectedArticle((prev) => ({ ...prev, ...res.data }));
      }
      setEditRecord(null);
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? "Failed to update article"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/service-desk/knowledge-base/${id}`),
    onSuccess: () => {
      toast.success("Article deleted");
      invalidateArticles();
      setSelectedArticle(null);
    },
    onError: (err) => toast.error(err?.response?.data?.message ?? "Failed to delete article"),
  });

  const togglePublished = (record) => {
    if (!record?.id) {
      toast.error("Unable to update article: missing article ID");
      return;
    }
    updateMutation.mutate({ id: record.id, isPublished: !record.isPublished });
  };

  const handleCreateArticle = () => {
    createForm.validateFields().then((values) => {
      const payload = normalizeArticleValues(values);
      if (!payload.title || !payload.body) {
        toast.error("Title and content are required");
        return;
      }
      createMutation.mutate(payload);
    });
  };

  const handleUpdateArticle = () => {
    if (!editRecord?.id) {
      toast.error("Unable to update article: missing article ID");
      return;
    }

    editForm.validateFields().then((values) => {
      const payload = normalizeArticleValues(values);
      if (!payload.title || !payload.body) {
        toast.error("Title and content are required");
        return;
      }
      updateMutation.mutate({ id: editRecord.id, ...payload });
    });
  };

  const handleDeleteArticle = (article) => {
    if (!article?.id) {
      toast.error("Unable to delete article: missing article ID");
      return;
    }
    deleteMutation.mutate(article.id);
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

  // ── Form fields shared by create/edit ─────────────────────────────────
  const ArticleFormFields = () => (
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
        <TextArea rows={12} placeholder="Write the article content here..." />
      </Form.Item>
      <Form.Item
        name="categoryId"
        label="Category"
        rules={[{ required: true, message: "Please select a category" }]}
      >
        <Select
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

  // ── Category colour helper ────────────────────────────────────────────
  const catColor = (name) => {
    const map = {
      Software: "#2563EB",
      Hardware: "#D97706",
      Network: "#059669",
      Security: "#DC2626",
      Cameras: "#7C3AED",
    };
    return map[name] || "#616161";
  };

  // ── Sidebar / Table of Contents ───────────────────────────────────────
  const SidebarContent = () => (
    <div className="flex flex-col gap-1">
      {/* All articles button */}
      <button
        type="button"
        onClick={() => {
          setActiveCategory(null);
          setSelectedArticle(null);
          setMobileMenuOpen(false);
        }}
        className={`rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${
          !activeCategory
            ? "bg-[#D32F2F]/10 text-[#D32F2F]"
            : "text-[#616161] hover:bg-gray-100"
        }`}
      >
        All Articles
      </button>

      <div className="my-2 h-px bg-[#E0E0E0]" />

      {/* Category groups with article titles */}
      {[...articlesByCategory.entries()].map(([key, { category, articles: catArticles }]) => (
        <div key={key} className="mb-1">
          <button
            type="button"
            onClick={() => {
              setActiveCategory(category.id === "uncategorised" ? null : category.id);
              setSelectedArticle(null);
              setMobileMenuOpen(false);
            }}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-bold uppercase tracking-wide transition-colors ${
              activeCategory === category.id
                ? "bg-[#D32F2F]/10 text-[#D32F2F]"
                : "text-[#616161] hover:bg-gray-50"
            }`}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: catColor(category.name) }}
            />
            {category.name}
            <span className="ml-auto text-[10px] font-normal text-gray-400">
              {catArticles.length}
            </span>
          </button>

          {/* Article titles under each category */}
          <div className="ml-5 flex flex-col">
            {catArticles.slice(0, 8).map((article) => (
              <button
                type="button"
                key={article.id}
                onClick={() => {
                  setSelectedArticle(article);
                  setMobileMenuOpen(false);
                }}
                className={`truncate rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                  selectedArticle?.id === article.id
                    ? "bg-gray-100 font-medium text-[#212121]"
                    : "text-[#616161] hover:bg-gray-50 hover:text-[#212121]"
                }`}
              >
                {article.title}
                {!article.isPublished && (
                  <span className="ml-1 text-[10px] text-yellow-500">draft</span>
                )}
              </button>
            ))}
            {catArticles.length > 8 && (
              <span className="px-2 py-1 text-[10px] text-gray-400">
                +{catArticles.length - 8} more
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  // ── Article Reader View ───────────────────────────────────────────────
  const ArticleReader = ({ article }) => (
    <div className="rounded-2xl border border-[#E0E0E0] bg-white p-6 shadow-sm sm:p-8">
      {/* Back link */}
      <button
        type="button"
        onClick={() => setSelectedArticle(null)}
        className="mb-4 flex items-center gap-1 text-xs font-medium text-[#D32F2F] hover:underline"
      >
        <LuChevronRight className="rotate-180 text-sm" />
        Back to articles
      </button>

      {/* Title & meta */}
      <h1 className="text-2xl font-bold text-[#212121] sm:text-3xl">
        {article.title}
      </h1>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {article.category && (
          <Tag
            style={{
              backgroundColor: catColor(article.category.name) + "15",
              color: catColor(article.category.name),
              border: "none",
              fontWeight: 600,
              fontSize: 11,
            }}
          >
            {article.category.name}
          </Tag>
        )}
        {article.tags?.map((t) => (
          <Tag key={t} className="border-none bg-gray-100 text-xs text-gray-600">
            {t}
          </Tag>
        ))}
        <Tag
          color={article.isPublished ? "green" : "default"}
          className="text-[10px]"
        >
          {article.isPublished ? "Published" : "Draft"}
        </Tag>
      </div>

      <div className="mt-2 flex items-center gap-3 text-xs text-[#616161]">
        <span>By {article.createdBy?.name || "Unknown"}</span>
        <span>&middot;</span>
        <span>{new Date(article.createdAt).toLocaleDateString()}</span>
        <span>&middot;</span>
        <span className="flex items-center gap-1">
          <LuEye className="text-xs" /> {article.viewCount} views
        </span>
      </div>

      {/* Divider */}
      <div className="my-6 h-px bg-[#E0E0E0]" />

      {/* Article body — documentation style */}
      <div className="prose prose-sm max-w-none text-[#212121]">
        <Typography.Paragraph
          style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, fontSize: 14 }}
        >
          {article.body}
        </Typography.Paragraph>
      </div>

      {/* Actions bar */}
      {canManage && (
        <div className="mt-8 flex items-center gap-2 border-t border-[#E0E0E0] pt-4">
          <Button
            size="small"
            icon={<LuPencil className="text-xs" />}
            onClick={() => openEdit(article)}
          >
            Edit
          </Button>
          <Button
            size="small"
            onClick={() => togglePublished(article)}
          >
            {article.isPublished ? "Unpublish" : "Publish"}
          </Button>
          {canDelete && (
            <Button
              size="small"
              danger
              icon={<LuTrash2 className="text-xs" />}
              onClick={() =>
                Modal.confirm({
                  title: "Delete Article",
                  content: "This article will be soft-deleted. Continue?",
                  okType: "danger",
                  onOk: () => handleDeleteArticle(article),
                })
              }
            >
              Delete
            </Button>
          )}
        </div>
      )}
    </div>
  );

  // ── Article Card Grid (listing view) ──────────────────────────────────
  const ArticleGrid = () => (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {filteredArticles.length === 0 ? (
        <div className="col-span-full">
          <Empty
            description="No articles found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      ) : (
        filteredArticles.map((article) => (
          <button
            key={article.id}
            type="button"
            onClick={() => setSelectedArticle(article)}
            className="group flex flex-col rounded-2xl border border-[#E0E0E0] bg-white p-5 text-left transition-all hover:border-[#D32F2F]/30 hover:shadow-md"
          >
            {/* Category badge */}
            <div className="mb-3 flex items-center gap-2">
              {article.category && (
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                  style={{
                    backgroundColor: catColor(article.category.name) + "15",
                    color: catColor(article.category.name),
                  }}
                >
                  {article.category.name}
                </span>
              )}
              {!article.isPublished && (
                <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-[10px] font-medium text-yellow-600">
                  Draft
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-sm font-semibold text-[#212121] group-hover:text-[#D32F2F]">
              {article.title}
            </h3>

            {/* Preview */}
            <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[#616161]">
              {article.body}
            </p>

            {/* Footer */}
            <div className="mt-auto flex items-center gap-3 pt-4 text-[10px] text-gray-400">
              <span>{article.createdBy?.name}</span>
              <span>&middot;</span>
              <span className="flex items-center gap-0.5">
                <LuEye /> {article.viewCount}
              </span>
              {article.tags?.length > 0 && (
                <>
                  <span>&middot;</span>
                  <span>{article.tags.slice(0, 2).join(", ")}</span>
                </>
              )}
            </div>
          </button>
        ))
      )}
    </div>
  );

  // ── Main Render ───────────────────────────────────────────────────────
  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 xl:px-12">
      {/* Header */}
      <section className="rounded-[24px] border border-[#E0E0E0] bg-white px-6 py-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:px-8 sm:py-7 md:rounded-[28px] md:px-10 md:py-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#616161]">
              Documentation
            </p>
            <h2 className="mt-2 flex items-center gap-3 text-2xl font-bold text-[#212121] sm:text-3xl">
              <LuBookOpen className="text-[#D32F2F]" />
              Knowledge Base
            </h2>
            <p className="mt-2 text-sm text-[#616161]">
              IT support articles, troubleshooting guides, and technical documentation
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canManage && (
              <Button
                type="primary"
                icon={<LuPlus />}
                onClick={() => setCreateOpen(true)}
                className="shadow-none"
              >
                New Article
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total", value: articles.length, color: "bg-blue-50 text-blue-700" },
            { label: "Published", value: published, color: "bg-green-50 text-green-700" },
            ...(canManage
              ? [{ label: "Drafts", value: drafts, color: "bg-yellow-50 text-yellow-700" }]
              : []),
            { label: "Categories", value: categories.length, color: "bg-purple-50 text-purple-700" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl px-4 py-3 ${color}`}>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Content area with sidebar */}
      <div className="mt-6 flex gap-6">
        {/* Sidebar — Table of Contents (desktop) */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-6 rounded-2xl border border-[#E0E0E0] bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#616161]">
              Table of Contents
            </h3>
            <SidebarContent />
          </div>
        </aside>

        {/* Mobile sidebar trigger */}
        <button
          type="button"
          className="fixed bottom-6 left-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[#D32F2F] text-white shadow-lg lg:hidden"
          onClick={() => setMobileMenuOpen(true)}
        >
          <LuFilter className="text-lg" />
        </button>

        {/* Mobile sidebar drawer */}
        <Drawer
          title="Table of Contents"
          placement="left"
          onClose={() => setMobileMenuOpen(false)}
          open={mobileMenuOpen}
          width={280}
        >
          <SidebarContent />
        </Drawer>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          {/* Search bar */}
          <div className="mb-5 flex items-center gap-3">
            <div className="relative flex-1" style={{ maxWidth: 480 }}>
              <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles by title, content, or tag..."
                className="w-full rounded-xl border border-[#E0E0E0] bg-white py-2.5 pl-9 pr-4 text-sm text-[#212121] outline-none transition-colors focus:border-[#D32F2F] focus:ring-1 focus:ring-[#D32F2F]/20"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
              {searchText && (
                <button
                  type="button"
                  onClick={() => setSearchText("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <LuX />
                </button>
              )}
            </div>

            {activeCategory && (
              <Tooltip title="Clear category filter">
                <Button
                  size="small"
                  icon={<LuX className="text-xs" />}
                  onClick={() => setActiveCategory(null)}
                >
                  Clear filter
                </Button>
              </Tooltip>
            )}
          </div>

          {/* Article reader or grid */}
          {isLoading ? (
            <div className="flex h-64 items-center justify-center text-sm text-gray-400">
              Loading articles...
            </div>
          ) : selectedArticle ? (
            <ArticleReader article={selectedArticle} />
          ) : (
            <ArticleGrid />
          )}
        </main>
      </div>

      {/* ── Create Modal ────────────────────────────────────────────────── */}
      <Modal
        title="New Knowledge Base Article"
        open={createOpen}
        onCancel={() => {
          setCreateOpen(false);
          createForm.resetFields();
        }}
        onOk={handleCreateArticle}
        confirmLoading={createMutation.isPending}
        okText="Create Article"
        width={720}
      >
        <Form form={createForm} layout="vertical" className="mt-4">
          <ArticleFormFields />
        </Form>
      </Modal>

      {/* ── Edit Modal ──────────────────────────────────────────────────── */}
      <Modal
        title="Edit Article"
        open={!!editRecord}
        onCancel={() => setEditRecord(null)}
        onOk={handleUpdateArticle}
        confirmLoading={updateMutation.isPending}
        okText="Save Changes"
        width={720}
      >
        <Form form={editForm} layout="vertical" className="mt-4">
          <ArticleFormFields />
        </Form>
      </Modal>
    </div>
  );
}
