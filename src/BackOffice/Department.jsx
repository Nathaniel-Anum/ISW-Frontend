import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SearchOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Popconfirm, Table } from "antd";
import { useDeferredValue, useMemo, useState } from "react";
import { LuBuilding2, LuMapPin, LuPlus } from "react-icons/lu";
import { toast } from "react-toastify";
import { Delete } from "../Components/icons/icons.components";
import PageShell from "../Components/ui/page-shell";
import api from "../utils/config";
import { formatCapitalizedLabel } from "../utils/formatText";

const Department = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const deferredSearch = useDeferredValue(searchText.trim());

  const { data } = useQuery({
    queryKey: ["getAllDepartments", deferredSearch],
    queryFn: () =>
      api.get("/admin/departments", {
        params: {
          includeUnits: true,
          ...(deferredSearch ? { search: deferredSearch } : {}),
        },
      }),
  });

  const departments = data?.data || [];

  const stats = useMemo(() => {
    const departmentsWithLocation = departments.filter((department) => department.location).length;
    const totalUnits = departments.reduce(
      (sum, department) => sum + (department.units?.length || 0),
      0
    );

    return [
      { label: "Departments", value: departments.length, caption: "Configured business functions" },
      { label: "Mapped locations", value: departmentsWithLocation, caption: "Departments with location data" },
      { label: "Attached units", value: totalUnits, caption: "Unit assignments across departments" },
    ];
  }, [departments]);

  const createDepartment = useMutation({
    mutationKey: ["createDepartment"],
    mutationFn: (values) => api.post("/admin/departments/new", values),
    onSuccess: () => {
      toast.success("Department created successfully");
      queryClient.invalidateQueries({ queryKey: ["getAllDepartments"] });
      form.resetFields();
      setIsModalOpen(false);
    },
  });

  const handleDelete = (id) => {
    api
      .delete(`/admin/departments/${id}/delete`)
      .then(() => {
        toast.success("Department deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["getAllDepartments"] });
      })
      .catch(() => {
        toast.error("Failed to delete department");
      });
  };

  const columns = [
    {
      title: "Department",
      dataIndex: "name",
      key: "name",
      render: (value) => <span className="font-semibold text-[#212121]">{formatCapitalizedLabel(value)}</span>,
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      render: (value) => (
        <span className="inline-flex items-center gap-2 text-[#616161]">
          <LuMapPin size={14} className="text-[#D32F2F]" />
          {value || "Not provided"}
        </span>
      ),
    },
    {
      title: "Units",
      key: "units",
      render: (_, record) => record.units?.length || 0,
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Popconfirm
          title="Delete department"
          description="This action removes the department record."
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
      title="Department Registry"
      description="Maintain department names, locations, and the unit structure that powers requisition routing and reporting across the organization."
      stats={stats}
      actions={
        <>
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search departments, locations, or units"
            className="w-full sm:w-[300px]"
          />
          <Button
            type="primary"
            icon={<LuPlus size={16} />}
            className="!h-11 !rounded-2xl !px-5"
            onClick={() => setIsModalOpen(true)}
          >
            Create Department
          </Button>
        </>
      }
    >
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#212121]">Department Directory</h3>
            <p className="text-sm text-[#616161]">Review registered departments and their available units.</p>
          </div>
          <div className="section-badge inline-flex items-center gap-2 rounded-full bg-[#F9FAFB] px-4 py-2 text-sm font-medium text-[#616161]">
            <LuBuilding2 size={16} className="text-[#D32F2F]" />
            {departments.length} records
          </div>
        </div>

        <Table columns={columns} dataSource={departments} rowKey="id" size="middle" scroll={{ x: 720 }} />
      </section>

      <Modal
        title="Create Department"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={(values) => createDepartment.mutate(values)}>
          <Form.Item
            name="name"
            label="Department Name"
            rules={[{ required: true, message: "Please enter department name" }]}
          >
            <Input placeholder="Enter department name" />
          </Form.Item>

          <Form.Item
            name="location"
            label="Location"
            rules={[{ required: true, message: "Please enter location" }]}
          >
            <Input placeholder="Enter location" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" block className="!h-11 !rounded-2xl">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageShell>
  );
};

export default Department;