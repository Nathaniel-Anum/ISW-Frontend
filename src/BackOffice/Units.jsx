import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SearchOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Popconfirm, Select, Table } from "antd";
import { useDeferredValue, useMemo, useState } from "react";
import { LuFolderTree, LuPlus } from "react-icons/lu";
import { toast } from "react-toastify";
import { Delete } from "../Components/icons/icons.components";
import PageShell from "../Components/ui/page-shell";
import api from "../utils/config";
import { formatCapitalizedLabel } from "../utils/formatText";

const Units = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();
  const deferredSearch = useDeferredValue(searchText.trim());

  const { data: unitsData } = useQuery({
    queryKey: ["getAllUnits", deferredSearch],
    queryFn: () =>
      api.get("/admin/units", {
        params: deferredSearch ? { search: deferredSearch } : undefined,
      }),
  });

  const { data: departmentsData } = useQuery({
    queryKey: ["getAllDepartments"],
    queryFn: () => api.get("/admin/departments?includeUnits=true"),
  });

  const units = unitsData?.data || [];
  const departments = departmentsData?.data || [];

  const stats = useMemo(() => {
    const uniqueDepartments = new Set(units.map((unit) => unit.department?.id).filter(Boolean)).size;
    const orphanedUnits = units.filter((unit) => !unit.department?.id).length;

    return [
      { label: "Units", value: units.length, caption: "Operational teams configured" },
      { label: "Covered departments", value: uniqueDepartments, caption: "Departments with unit mappings" },
      { label: "Unlinked units", value: orphanedUnits, caption: "Units missing department assignment" },
    ];
  }, [units]);

  const addUnit = useMutation({
    mutationKey: ["addUnit"],
    mutationFn: (values) => api.post("/admin/units/new", values),
    onSuccess: () => {
      toast.success("Unit created successfully");
      queryClient.invalidateQueries({ queryKey: ["getAllUnits"] });
      queryClient.invalidateQueries({ queryKey: ["getAllDepartments"] });
      form.resetFields();
      setIsModalOpen(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to create unit"),
  });

  const handleDelete = (id) => {
    if (!id) {
      toast.error("Unable to delete unit: missing unit ID");
      return;
    }
    api
      .delete(`/admin/units/${id}/delete`)
      .then(() => {
        toast.success("Unit deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["getAllUnits"] });
        queryClient.invalidateQueries({ queryKey: ["getAllDepartments"] });
      })
      .catch(() => {
        toast.error("Failed to delete unit");
      });
  };

  const handleCreateUnit = (values) => {
    const name = values.name?.trim();
    if (!name || !values.departmentId) {
      toast.error("Unit name and department are required");
      return;
    }
    addUnit.mutate({ name, departmentId: values.departmentId });
  };

  const columns = [
    {
      title: "Unit",
      dataIndex: "name",
      key: "name",
      render: (value) => <span className="font-semibold text-[#212121]">{formatCapitalizedLabel(value)}</span>,
    },
    {
      title: "Department",
      dataIndex: ["department", "name"],
      key: "departmentName",
      render: (_, record) => (record.department?.name ? formatCapitalizedLabel(record.department.name) : "Not Assigned"),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Popconfirm
          title="Delete unit"
          description="This action removes the unit record."
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
      title="Unit Structure"
      description="Organize sub-teams within departments so employee assignment, requisition ownership, and reporting remain accurate."
      stats={stats}
      actions={
        <>
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search units or departments"
            className="w-full sm:w-[300px]"
          />
          <Button
            type="primary"
            icon={<LuPlus size={16} />}
            className="!h-11 !rounded-2xl !px-5"
            onClick={() => setIsModalOpen(true)}
          >
            Create Unit
          </Button>
        </>
      }
    >
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#212121]">Unit Directory</h3>
            <p className="text-sm text-[#616161]">Each unit should roll up to a valid department for approval routing.</p>
          </div>
          <div className="section-badge inline-flex items-center gap-2 rounded-full bg-[#F9FAFB] px-4 py-2 text-sm font-medium text-[#616161]">
            <LuFolderTree size={16} className="text-[#D32F2F]" />
            {units.length} registered units
          </div>
        </div>

        <Table dataSource={units} columns={columns} rowKey="id" pagination={false} size="middle" scroll={{ x: 720 }} />
      </section>

      <Modal title="Create Unit" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} width={640} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleCreateUnit}>
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <Form.Item
              label="Unit Name"
              name="name"
              rules={[{ required: true, message: "Please input unit name" }]}
            >
              <Input placeholder="Enter unit name" />
            </Form.Item>

            <Form.Item
              label="Department"
              name="departmentId"
              rules={[{ required: true, message: "Please select department" }]}
            >
              <Select placeholder="Select department">
                {departments.map((department) => (
                  <Select.Option key={department.id} value={department.id}>
                    {department.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" loading={addUnit.isPending} block className="!h-11 !rounded-2xl">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageShell>
  );
};

export default Units;
