import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SearchOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Popconfirm, Table } from "antd";
import { useDeferredValue, useMemo, useState } from "react";
import { LuFolderOpen, LuPlus } from "react-icons/lu";
import { toast } from "react-toastify";
import { Delete } from "../Components/icons/icons.components";
import PageShell from "../Components/ui/page-shell";
import api from "../utils/config";

const Projects = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const deferredSearch = useDeferredValue(searchText.trim());

  const { data } = useQuery({
    queryKey: ["getProjects", deferredSearch],
    queryFn: () =>
      api.get("/admin/projects", {
        params: deferredSearch ? { search: deferredSearch } : undefined,
      }),
  });

  const projects = data?.data || [];

  const stats = useMemo(() => [
    { label: "Purchase Type", value: projects.length, caption: "Registered purchase records" },
  ], [projects]);

  const createProject = useMutation({
    mutationKey: ["createProject"],
    mutationFn: (payload) => api.post("/admin/projects/create", payload),
    onSuccess: () => {
      toast.success("Purchase Type created successfully");
      form.resetFields();
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["getProjects"] });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || "Failed to create project");
    },
  });

  const handleDelete = (id) => {
    api
      .delete(`/admin/projects/${id}`)
      .then(() => {
        toast.success("Purchase deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["getProjects"] });
      })
      .catch(() => {
        toast.error("Failed to delete purchase");
      });
  };

  const columns = [
    {
      title: "Purchase Type",
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
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Popconfirm
          title="Delete project"
          description="This action removes the project record."
          onConfirm={() => handleDelete(record.id)}
          okText="Delete"
          cancelText="Cancel"
        >
          <button className="rounded-full p-1.5 transition hover:bg-[#FFEBEE]">
            <Delete size={18} />
          </button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <PageShell
      eyebrow="Back Office"
      title="Purchase Type"
      description="Manage purchase Type names used during stock receiving. These purchase Type can be selected when receiving stock under a purchase Type procurement."
      stats={stats}
      actions={
        <>
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search projects"
            className="w-full sm:w-[340px]"
          />
          <Button
            type="primary"
            icon={<LuPlus size={16} />}
            className="!h-11 !rounded-2xl !px-5"
            onClick={() => setIsModalOpen(true)}
          >
            Create Purchase Type
          </Button>
        </>
      }
    >
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#212121]">Purchase Directory</h3>
            <p className="text-sm text-[#616161]">Purchase Types listed here are available for selection during stock receiving.</p>
          </div>
          <div className="section-badge inline-flex items-center gap-2 rounded-full bg-[#F9FAFB] px-4 py-2 text-sm font-medium text-[#616161]">
            <LuFolderOpen size={16} className="text-[#D32F2F]" />
            {projects.length} active records
          </div>
        </div>

        <Table columns={columns} dataSource={projects} rowKey="id" pagination={false} size="middle" scroll={{ x: 600 }} />
      </section>

      <Modal title="Create Purchase Type" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} width={560} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={(values) => createProject.mutate(values)}>
          <Form.Item
            label="Purchase Type Name"
            name="name"
            rules={[{ required: true, message: "Please enter a Purchase Type name" }]}
          >
            <Input placeholder="e.g. Campus Network Upgrade 2025" />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} placeholder="Optional description" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" block className="!h-11 !rounded-2xl" loading={createProject.isPending}>
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageShell>
  );
};

export default Projects;
