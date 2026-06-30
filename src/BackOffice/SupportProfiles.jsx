import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SearchOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, Modal, Select, Switch, Table, Tag } from "antd";
import { useDeferredValue, useMemo, useState } from "react";
import { LuBadgeCheck, LuTag, LuUsersRound } from "react-icons/lu";
import { toast } from "react-toastify";
import PageShell from "../Components/ui/page-shell";
import api from "../utils/config";
import { formatCapitalizedLabel } from "../utils/formatText";

const STATUS_STYLES = {
  AVAILABLE: "bg-[#ECFDF3] text-[#166534]",
  BUSY: "bg-[#FFF7ED] text-[#C2410C]",
  AWAY: "bg-[#FEF3C7] text-[#92400E]",
  OFFLINE: "bg-[#F3F4F6] text-[#4B5563]",
};

const SupportProfiles = () => {
  const [open, setOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const deferredSearch = useDeferredValue(searchText.trim());

  const { data, isLoading } = useQuery({
    queryKey: ["serviceDeskSupportStaff", deferredSearch],
    queryFn: () =>
      api.get("/service-desk/support-staff", {
        params: deferredSearch ? { search: deferredSearch } : undefined,
      }),
  });

  const { data: skillTagsData } = useQuery({
    queryKey: ["activeSkillTags"],
    queryFn: () => api.get("/service-desk/skill-tags"),
  });

  const activeSkillTags = skillTagsData?.data || [];

  const supportStaff = data?.data || [];

  const stats = useMemo(() => {
    const availableCount = supportStaff.filter((staff) => staff.availabilityStatus === "AVAILABLE").length;
    const acceptingCount = supportStaff.filter((staff) => staff.isAcceptingTickets).length;
    const constrainedCount = supportStaff.filter((staff) => staff.availableCapacity <= 0).length;

    return [
      { label: "Support Staff", value: supportStaff.length, caption: "Profiles connected to ticket handling" },
      { label: "Available", value: availableCount, caption: "Ready for assignment" },
      { label: "Capacity constrained", value: constrainedCount + (supportStaff.length - acceptingCount), caption: "Busy or not accepting new tickets" },
    ];
  }, [supportStaff]);

  const updateProfile = useMutation({
    mutationFn: ({ userId, values }) => api.patch(`/service-desk/admin/support-profiles/${userId}`, values),
    onSuccess: () => {
      toast.success("Support profile updated");
      queryClient.invalidateQueries({ queryKey: ["serviceDeskSupportStaff"] });
      setOpen(false);
      setEditingRecord(null);
      form.resetFields();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to update support profile"),
  });

  const openEditModal = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      availabilityStatus: record.availabilityStatus,
      isAcceptingTickets: record.isAcceptingTickets,
      maxOpenTickets: record.maxOpenTickets,
      skillTags: record.skillTags || [],
    });
    setOpen(true);
  };

  const handleUpdateProfile = (values) => {
    if (!editingRecord?.id) {
      toast.error("Unable to update profile: missing user ID");
      return;
    }

    const maxOpenTickets = Number(values.maxOpenTickets);
    if (!Number.isFinite(maxOpenTickets) || maxOpenTickets < 1) {
      toast.error("Max open tickets must be at least 1");
      return;
    }

    updateProfile.mutate({
      userId: editingRecord.id,
      values: {
        availabilityStatus: values.availabilityStatus,
        isAcceptingTickets: values.isAcceptingTickets,
        maxOpenTickets,
        skillTags: values.skillTags?.map((tag) => tag.trim()).filter(Boolean) || [],
      },
    });
  };

  const columns = [
    {
      title: "Support Staff",
      key: "supportStaff",
      render: (_, record) => (
        <div>
          <p className="font-semibold text-[#212121]">{record.name || "Unnamed staff"}</p>
          <p className="text-sm text-[#616161]">{record.email}</p>
        </div>
      ),
    },
    {
      title: "Roles",
      dataIndex: "roles",
      key: "roles",
      render: (roles) => roles?.map((role) => formatCapitalizedLabel(role)).join(", ") || "None",
    },
    {
      title: "Availability",
      dataIndex: "availabilityStatus",
      key: "availabilityStatus",
      render: (value) => (
        <Tag className={`rounded-full border-0 px-3 py-1 text-xs font-semibold ${STATUS_STYLES[value] || "bg-[#F3F4F6] text-[#374151]"}`}>
          {formatCapitalizedLabel(value)}
        </Tag>
      ),
    },
    {
      title: "Capacity",
      key: "capacity",
      render: (_, record) => `${record.activeTicketCount}/${record.maxOpenTickets}`,
    },
    {
      title: "Skills",
      dataIndex: "skillTags",
      key: "skillTags",
      render: (skillTags) =>
        skillTags?.length ? (
          <div className="flex flex-wrap gap-1">
            {skillTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-xs font-medium text-[#374151]"
              >
                <LuTag size={10} />
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[#9E9E9E] text-sm">No skill tags</span>
        ),
    },
    {
      title: "Accepting",
      dataIndex: "isAcceptingTickets",
      key: "isAcceptingTickets",
      render: (value) => (value ? "Yes" : "No"),
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
      title="Support Profiles"
      description="Control staff availability, ticket capacity, and skill tagging for the service desk assignment model."
      stats={stats}
      actions={
        <Input
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Search support staff"
          className="w-full sm:w-[320px]"
        />
      }
    >
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#212121]">Support Team Capacity</h3>
            <p className="text-sm text-[#616161]">Shape who receives work and how much queue load each support owner can carry.</p>
          </div>
          <div className="section-badge inline-flex items-center gap-2 rounded-full bg-[#F9FAFB] px-4 py-2 text-sm font-medium text-[#616161]">
            <LuUsersRound size={16} className="text-[#D32F2F]" />
            {supportStaff.length} support users
          </div>
        </div>

        <Table columns={columns} dataSource={supportStaff} rowKey="id" loading={isLoading} size="middle" scroll={{ x: 1080 }} />
      </section>

      <Modal
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditingRecord(null);
        }}
        footer={null}
        title={editingRecord ? `Edit Support Profile - ${editingRecord.name || editingRecord.email}` : "Edit Support Profile"}
        width={700}
        destroyOnClose
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={handleUpdateProfile}
        >
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <Form.Item name="availabilityStatus" label="Availability Status" rules={[{ required: true, message: "Please select availability" }]}>
              <Select>
                <Select.Option value="AVAILABLE">Available</Select.Option>
                <Select.Option value="BUSY">Busy</Select.Option>
                <Select.Option value="AWAY">Away</Select.Option>
                <Select.Option value="OFFLINE">Offline</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="maxOpenTickets" label="Max Open Tickets" rules={[{ required: true, message: "Please set a ticket limit" }]}>
              <InputNumber min={1} className="!w-full" placeholder="Ticket capacity" />
            </Form.Item>

            <Form.Item name="isAcceptingTickets" label="Accepting New Tickets" valuePropName="checked">
              <Switch checkedChildren="Yes" unCheckedChildren="No" />
            </Form.Item>

            <Form.Item name="skillTags" label="Skill Tags">
              <Select
                mode="multiple"
                placeholder="Select or type skill tags"
                tokenSeparators={[","]}
                options={activeSkillTags.map((t) => ({ label: t.name, value: t.name }))}
                notFoundContent="No skill tags defined. Create them in Skill Tags."
                showSearch
                filterOption={(input, option) =>
                  option?.label?.toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </div>

          <div className="rounded-2xl bg-[#FAFAFA] p-4 text-sm text-[#616161]">
            <div className="flex items-center gap-2 text-[#212121]">
              <LuBadgeCheck size={16} className="text-[#D32F2F]" />
              Profile guidance
            </div>
            <p className="mt-2 leading-6">
              Use availability, capacity, and skill tags together so service desk managers can make faster assignment decisions and avoid overloading specific support staff.
            </p>
          </div>

          <Form.Item className="mb-0 mt-5">
            <Button type="primary" htmlType="submit" block className="!h-11 !rounded-2xl" loading={updateProfile.isPending}>
              Update Profile
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageShell>
  );
};

export default SupportProfiles;
