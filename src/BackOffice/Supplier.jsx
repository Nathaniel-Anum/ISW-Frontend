import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SearchOutlined } from "@ant-design/icons";
import { Button, Form, Input, Modal, Popconfirm, Table } from "antd";
import { useDeferredValue, useMemo, useState } from "react";
import { LuPackageCheck, LuPhoneCall, LuPlus } from "react-icons/lu";
import { toast } from "react-toastify";
import { Delete } from "../Components/icons/icons.components";
import PageShell from "../Components/ui/page-shell";
import api from "../utils/config";

const Supplier = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const deferredSearch = useDeferredValue(searchText.trim());

  const { data } = useQuery({
    queryKey: ["getSupplier", deferredSearch],
    queryFn: () =>
      api.get("/admin/suppliers", {
        params: deferredSearch ? { search: deferredSearch } : undefined,
      }),
  });

  const suppliers = data?.data || [];

  const stats = useMemo(() => {
    const withRemarks = suppliers.filter((supplier) => supplier.remarks).length;
    const withContacts = suppliers.filter((supplier) => supplier.contactDetails).length;

    return [
      { label: "Suppliers", value: suppliers.length, caption: "Approved vendor records" },
      { label: "With contacts", value: withContacts, caption: "Suppliers ready for follow-up" },
      { label: "With remarks", value: withRemarks, caption: "Records carrying procurement notes" },
    ];
  }, [suppliers]);

  const createSupplier = useMutation({
    mutationKey: ["createSupplier"],
    mutationFn: (payload) => api.post("/admin/suppliers/create", payload),
    onSuccess: () => {
      toast.success("Supplier created successfully");
      form.resetFields();
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["getSupplier"] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to create supplier"),
  });

  const handleDelete = (id) => {
    if (!id) {
      toast.error("Unable to delete supplier: missing supplier ID");
      return;
    }
    api
      .delete(`/admin/suppliers/${id}`)
      .then(() => {
        toast.success("Supplier deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["getSupplier"] });
      })
      .catch(() => {
        toast.error("Failed to delete supplier");
      });
  };

  const handleCreateSupplier = (values) => {
    const name = values.name?.trim();
    const contactDetails = values.contactDetails?.trim();
    if (!name || !contactDetails) {
      toast.error("Supplier name and contact details are required");
      return;
    }
    createSupplier.mutate({
      name,
      contactDetails,
      remarks: values.remarks?.trim() || undefined,
    });
  };

  const columns = [
    {
      title: "Supplier",
      dataIndex: "name",
      key: "name",
      render: (value) => <span className="font-semibold text-[#212121]">{value}</span>,
    },
    {
      title: "Contact Details",
      dataIndex: "contactDetails",
      key: "contactDetails",
      render: (value) => value || "Not provided",
    },
    {
      title: "Remarks",
      dataIndex: "remarks",
      key: "remarks",
      render: (value) => value || "No remarks",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Popconfirm
          title="Delete supplier"
          description="This action removes the supplier record."
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
      title="Supplier Records"
      description="Keep vendor information current so procurement, stock receiving, and warranty traceability remain consistent across the inventory workflow."
      stats={stats}
      actions={
        <>
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search supplier, contact, LPO, voucher, or remarks"
            className="w-full sm:w-[340px]"
          />
          <Button
            type="primary"
            icon={<LuPlus size={16} />}
            className="!h-11 !rounded-2xl !px-5"
            onClick={() => setIsModalOpen(true)}
          >
            Create Supplier
          </Button>
        </>
      }
    >
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#212121]">Vendor Directory</h3>
            <p className="text-sm text-[#616161]">Track the suppliers that support item cataloging and stock replenishment.</p>
          </div>
          <div className="section-badge inline-flex items-center gap-2 rounded-full bg-[#F9FAFB] px-4 py-2 text-sm font-medium text-[#616161]">
            <LuPackageCheck size={16} className="text-[#D32F2F]" />
            {suppliers.length} active records
          </div>
        </div>

        <Table columns={columns} dataSource={suppliers} rowKey="id" pagination={false} size="middle" scroll={{ x: 820 }} />
      </section>

      <Modal title="Create Supplier" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} width={680} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleCreateSupplier}>
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <Form.Item
              label="Supplier Name"
              name="name"
              rules={[{ required: true, message: "Please enter supplier name" }]}
            >
              <Input placeholder="Supplier name" />
            </Form.Item>

            <Form.Item
              label="Contact Details"
              name="contactDetails"
              rules={[{ required: true, message: "Please enter contact details" }]}
            >
              <Input prefix={<LuPhoneCall size={16} className="text-[#616161]" />} placeholder="Phone, email, or representative" />
            </Form.Item>
          </div>

          <Form.Item label="Remarks" name="remarks">
            <Input.TextArea rows={4} placeholder="Optional procurement notes" />
          </Form.Item>

          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" loading={createSupplier.isPending} block className="!h-11 !rounded-2xl">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageShell>
  );
};

export default Supplier;
