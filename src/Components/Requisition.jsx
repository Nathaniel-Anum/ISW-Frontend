import React, { useDeferredValue, useEffect, useState } from "react";
import { SearchOutlined } from "@ant-design/icons";
import { Modal, Form, Input, Button, Table, Tag, Select, Popconfirm } from "antd";
import { LuPlus } from "react-icons/lu";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../utils/config";
import { formatCapitalizedLabel } from "../utils/formatText";
import { useUser } from "../utils/userContext";
import PageShell from "./ui/page-shell";

import { REQUISITION_STATUS_STYLES } from "../utils/statusColors";

const Requisition = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRequisition, setEditingRequisition] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState("");
  const queryClient = useQueryClient();
  const { user } = useUser();
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const location = useLocation();
  const navigate = useNavigate();
  const deferredSearch = useDeferredValue(searchText.trim());

  useEffect(() => {
    if (user && isModalOpen) {
      form.setFieldsValue({
        staffId: user.staffId,
        roomNo: user.roomNo,
        unitId: user.unit.name,
        departmentId: user.department.name,
      });
    }
  }, [user, form, isModalOpen]);

  useEffect(() => {
    if (!location.state?.openCreateModal) {
      return;
    }

    setIsModalOpen(true);

    const nextState = { ...location.state };
    delete nextState.openCreateModal;

    navigate(location.pathname, {
      replace: true,
      state: Object.keys(nextState).length ? nextState : null,
    });
  }, [location.pathname, location.state, navigate]);

  const { mutate: createRequisition, isPending } = useMutation({
    mutationKey: ["createRequisition"],
    mutationFn: (values) => api.post("/user/requisitions", values),
    onSuccess: () => {
      queryClient.invalidateQueries(["requisition"]);
      form.resetFields();
      setIsModalOpen(false);
      toast.success("Requisition created successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to create requisition");
    },
  });

  const { mutate: requestFollowUp, isPending: isFollowUpPending } = useMutation({
    mutationFn: (requisitionId) => api.post(`/user/requisitions/${requisitionId}/follow-up`),
    onSuccess: (response) => {
      queryClient.invalidateQueries(["requisition"]);
      toast.success(response?.data?.message || "Stores officer notified successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to notify stores officer");
    },
  });

  const { mutate: cancelRequisition, isPending: isCancelPending } = useMutation({
    mutationFn: (requisitionId) => api.post(`/user/requisitions/${requisitionId}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries(["requisition"]);
      toast.success("Requisition cancelled successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to cancel requisition");
    },
  });

  const { mutate: updateRequisition, isPending: isUpdatePending } = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/user/requisitions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["requisition"]);
      setIsEditModalOpen(false);
      setEditingRequisition(null);
      editForm.resetFields();
      toast.success("Requisition updated successfully");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to update requisition");
    },
  });

  const openEditModal = (record) => {
    setEditingRequisition(record);
    editForm.setFieldsValue({
      quantity: record.quantity,
      justification: record.purpose,
      itItemId: record.itItemId,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (values) => {
    updateRequisition({ id: editingRequisition.id, data: values });
  };

  const handleSubmit = (values) => {
    const payload = {
      ...values,
      quantity: Number(values.quantity),
      unitId: user.unit.id,
      departmentId: user.department.id,
    };

    createRequisition(payload);
  };

  const { data: requisitionResponse } = useQuery({
    queryKey: ["requisition", deferredSearch],
    queryFn: () =>
      api.get("/user/requisitions", {
        params: deferredSearch ? { search: deferredSearch } : undefined,
      }),
  });

  const { data: categoriesResponse } = useQuery({
    queryKey: ["requisitionCategories"],
    queryFn: () => api.get("/user/requisition-categories"),
  });

  const requisitions = requisitionResponse?.data || [];
  const categories = categoriesResponse?.data || [];
  const pendingCount = requisitions.filter((item) =>
    ["PENDING_DEPT_APPROVAL", "PENDING_ITD_APPROVAL", "PENDING_STOCK_ISSUANCE"].includes(item.status)
  ).length;
  const processedCount = requisitions.filter((item) => item.status === "PROCESSED").length;
  const cancelledCount = requisitions.filter((item) => item.status === "CANCELLED").length;

  const stats = [
    { label: "Total Requests", value: requisitions.length, caption: "Created by your account" },
    { label: "Pending", value: pendingCount, caption: "Awaiting approval" },
    { label: "Processed", value: processedCount, caption: "Completed requisitions" },
    { label: "Cancelled", value: cancelledCount, caption: "Withdrawn requests" },
  ];

  const columns = [
    {
      title: "No",
      key: "index",
      render: (text, record, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Category",
      dataIndex: ["category", "name"],
      key: "category",
      render: (value) => value || "N/A",
    },
    {
      title: "Description",
      dataIndex: "itemDescription",
      key: "itemDescription",
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (quantity) => <span className="font-semibold text-[#212121]">{quantity}</span>,
    },
    {
      title: "Purpose",
      dataIndex: "purpose",
      key: "purpose",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          className={`rounded-full border-0 px-3 py-1 text-xs font-semibold ${
            REQUISITION_STATUS_STYLES[status] || "bg-[#F3F4F6] text-[#374151]"
          }`}
        >
          {formatCapitalizedLabel(status)}
        </Tag>
      ),
    },
    {
      title: "Date & Time Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) =>
        new Date(createdAt).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
    },
    {
      title: "Remarks",
      dataIndex: "declineReason",
      key: "declineReason",
      render: (text) => (text ? text : "-"),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => {
        if (record.status === "PENDING_DEPT_APPROVAL") {
          return (
            <div className="flex gap-2">
              <Button size="small" onClick={() => openEditModal(record)}>
                Edit
              </Button>
              <Popconfirm
                title="Cancel requisition"
                description="Are you sure you want to cancel this requisition?"
                onConfirm={() => cancelRequisition(record.id)}
                okText="Yes, cancel"
                cancelText="No"
                okButtonProps={{ danger: true }}
              >
                <Button size="small" danger loading={isCancelPending}>
                  Cancel
                </Button>
              </Popconfirm>
            </div>
          );
        }

        if (record.status !== "PENDING_STOCK_ISSUANCE") {
          return "-";
        }

        if (!record.stockAvailableNotifiedAt) {
          return <span className="text-xs text-[#9CA3AF]">Waiting for restock</span>;
        }

        if (record.followUpRequestedAt) {
          return <span className="text-xs font-medium text-[#166534]">Stores notified</span>;
        }

        return (
          <Button
            type="primary"
            size="small"
            loading={isFollowUpPending}
            onClick={() => requestFollowUp(record.id)}
          >
            Notify Stores Officer
          </Button>
        );
      },
    },
  ];

  return (
    <PageShell
      eyebrow="Request Management"
      title="Requisitions"
      description="Create structured item requests and monitor each approval stage from a clear, enterprise-grade requisition desk."
      stats={stats}
      actions={
        <>
          <Input
            placeholder="Search requisitions"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            prefix={<SearchOutlined />}
            className="w-full md:w-[260px]"
          />
          <Button type="primary" icon={<LuPlus />} onClick={() => setIsModalOpen(true)}>
            Create Requisition
          </Button>
        </>
      }
    >
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#616161]">Request Register</p>
            <h3 className="text-xl font-bold text-[#212121]">Submitted requisitions</h3>
          </div>
          <span className="section-badge rounded-full bg-[#FFEBEE] px-3 py-1 text-xs font-semibold text-[#D32F2F]">
            Approval tracking enabled
          </span>
        </div>

        <Table
          columns={columns}
          dataSource={requisitions}
          pagination={{
            current: currentPage,
            pageSize,
            onChange: (page, nextPageSize) => {
              setCurrentPage(page);
              setPageSize(nextPageSize);
            },
          }}
          rowKey="requisitionID"
          size="middle"
          scroll={{ x: 980 }}
        />
      </section>

      <Modal
        title="Create Requisition"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <Form.Item name="staffId" label="Staff ID" rules={[{ required: true }]}>
              <Input disabled />
            </Form.Item>

            <Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}>
              <Input type="number" min={0} placeholder="Enter Quantity" />
            </Form.Item>
          </div>

          <Form.Item
            name="categoryId"
            label="Item Category"
            rules={[{ required: true, message: "Please select item category" }]}
          >
            <Select placeholder="Select item category" showSearch optionFilterProp="children">
              {categories.map((category) => (
                <Select.Option key={category.id} value={category.id}>
                  {category.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="itemDescription"
            label="Item Description"
            rules={[{ required: true }]}
          >
            <Input placeholder="Enter Item Description" />
          </Form.Item>

          <Form.Item name="purpose" label="Purpose" rules={[{ required: true }]}>
            <Input.TextArea placeholder="Enter Purpose" rows={4} />
          </Form.Item>

          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-3">
            <Form.Item name="unitId" label="Unit">
              <Input disabled />
            </Form.Item>

            <Form.Item name="departmentId" label="Department" rules={[{ required: true }]}>
              <Input disabled />
            </Form.Item>

            <Form.Item name="roomNo" label="Room No">
              <Input placeholder="Enter Room Number" disabled />
            </Form.Item>
          </div>

          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" loading={isPending} block>
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Edit Requisition"
        open={isEditModalOpen}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingRequisition(null);
          editForm.resetFields();
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}>
            <Input type="number" min={1} placeholder="Enter Quantity" />
          </Form.Item>
          <Form.Item name="justification" label="Purpose / Justification">
            <Input.TextArea rows={3} placeholder="Update purpose" />
          </Form.Item>
          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" loading={isUpdatePending} block>
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageShell>
  );
};

export default Requisition;
