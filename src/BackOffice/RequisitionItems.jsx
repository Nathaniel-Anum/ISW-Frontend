import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SearchOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Popconfirm, Table } from "antd";
import { useDeferredValue, useMemo, useState } from "react";
import { LuBoxes, LuPlus } from "react-icons/lu";
import { toast } from "react-toastify";
import { Delete } from "../Components/icons/icons.components";
import PageShell from "../Components/ui/page-shell";
import api from "../utils/config";

const RequisitionItems = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const deferredSearch = useDeferredValue(searchText.trim());

  const { data } = useQuery({
    queryKey: ["requisitionItems"],
    queryFn: () => api.get("/admin/requisition-items"),
  });

  const items = useMemo(() => {
    const all = data?.data || [];
    if (!deferredSearch) return all;
    return all.filter((item) =>
      item.name?.toLowerCase().includes(deferredSearch.toLowerCase())
    );
  }, [data, deferredSearch]);

  const stats = useMemo(
    () => [
      {
        label: "Requisition Items",
        value: (data?.data || []).length,
        caption: "Available items for requisitions",
      },
    ],
    [data]
  );

  const createItem = useMutation({
    mutationKey: ["createRequisitionItem"],
    mutationFn: (payload) => api.post("/admin/requisition-items", payload),
    onSuccess: () => {
      toast.success("Item added successfully");
      form.resetFields();
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["requisitionItems"] });
    },
    onError: (err) => {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || "Failed to add item");
    },
  });

  const handleDelete = (id) => {
    if (!id) {
      toast.error("Unable to delete item: missing item ID");
      return;
    }
    api
      .delete(`/admin/requisition-items/${id}`)
      .then(() => {
        toast.success("Item deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["requisitionItems"] });
      })
      .catch((err) => {
        const msg = err?.response?.data?.message;
        toast.error(Array.isArray(msg) ? msg[0] : msg || "Failed to delete item");
      });
  };

  const handleCreateItem = (values) => {
    const name = values.name?.trim();
    if (!name) {
      toast.error("Item name is required");
      return;
    }
    createItem.mutate({ name });
  };

  const columns = [
    {
      title: "#",
      key: "index",
      width: 60,
      render: (_, __, index) => index + 1,
    },
    {
      title: "Item Name",
      dataIndex: "name",
      key: "name",
      render: (value) => <span className="font-semibold text-[#212121]">{value}</span>,
    },
    {
      title: "Action",
      key: "action",
      width: 80,
      render: (_, record) => (
        <Popconfirm
          title="Delete item"
          description="Remove this item from the requisition list?"
          onConfirm={() => handleDelete(record.id)}
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
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
      eyebrow="Setup"
      title="Requisition Items"
      description="Manage the list of items available for selection when staff create a requisition. Add items like keyboard, mouse, laptop, etc."
      stats={stats}
      actions={
        <>
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search items"
            className="w-full sm:w-[300px]"
          />
          <Button
            type="primary"
            icon={<LuPlus size={16} />}
            className="!h-11 !rounded-2xl !px-5"
            onClick={() => setIsModalOpen(true)}
          >
            Add Item
          </Button>
        </>
      }
    >
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#212121]">Item Directory</h3>
            <p className="text-sm text-[#616161]">
              Items listed here appear as dropdown options when staff create a requisition.
            </p>
          </div>
          <div className="section-badge inline-flex items-center gap-2 rounded-full bg-[#F9FAFB] px-4 py-2 text-sm font-medium text-[#616161]">
            <LuBoxes size={16} className="text-[#D32F2F]" />
            {items.length} {items.length === 1 ? "item" : "items"}
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={items}
          rowKey="id"
          pagination={false}
          size="middle"
          scroll={{ x: 400 }}
        />
      </section>

      <Modal
        title="Add Requisition Item"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={440}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreateItem}>
          <Form.Item
            label="Item Name"
            name="name"
            rules={[{ required: true, message: "Please enter an item name" }]}
          >
            <Input placeholder="e.g. Keyboard, Mouse, USB Hub" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              block
              className="!h-11 !rounded-2xl"
              loading={createItem.isPending}
            >
              Add Item
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageShell>
  );
};

export default RequisitionItems;
