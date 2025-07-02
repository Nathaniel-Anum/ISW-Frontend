import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import api from "../utils/config";
import {
  Button,
  Input,
  Select,
  Table,
  Form,
  Modal,
  DatePicker,
  InputNumber,
} from "antd";
import { AiOutlinePlus } from "react-icons/ai";
import { toast } from "react-toastify";

const StoresPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  //useQuery for stock received
  const { data } = useQuery({
    queryKey: ["stores"],
    queryFn: () => api.get("/stores/stock-received"),
  });

  //   console.log(data?.data);

  //useQuery for stores it-items
  const { data: itItems } = useQuery({
    queryKey: ["itItems"],
    queryFn: () => api.get("/stores/it-items"),
  });
  //   console.log(itItems?.data);

  //useQuery for stores suppliers
  const { data: Suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => api.get("/stores/suppliers"),
  });
  console.log(Suppliers?.data);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields(); // Reset form when closing
  };

  // Format to YYYY-MM-DD
  const formatDate = (dateObj) => {
    const date = new Date(dateObj);
    return date.toISOString().split("T")[0];
  };

  // Mutation function
  const mutation = useMutation({
    mutationFn: (payload) => api.post("/stores/stock-received/create", payload),
    onSuccess: () => {
      toast.success("Stock received successfully!");
      form.resetFields();
      setIsModalOpen(false);
      queryClient.invalidateQueries(["stores"]);
    },
    onError: () => {
      toast.error("Failed to submit stock received.");
    },
  });

  const handleSubmit = (values) => {
    const payload = {
      ...values,
      lpoDate: formatDate(values.lpoDate),
      dateReceived: formatDate(values.dateReceived),
    };
    mutation.mutate(payload);
  };

  const columns = [
    {
      title: "L.P.O Number",
      dataIndex: "lpoReference",
      key: "lpoReference",
    },
    {
      title: "Voucher No",
      dataIndex: "voucherNumber",
      key: "voucherNumber",
    },
    {
      title: "Quantity",
      dataIndex: "quantityReceived",
      key: "quantityReceived",
    },
    {
      title: "Warranty",
      dataIndex: "warrantyPeriod",
      key: "warrantyPeriod",
    },
    {
      title: "Date",
      dataIndex: "lpoDate",
      key: "lpoDate",
      render: (lpoDate) =>
        new Date(lpoDate).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
    },
    {
      title: "Received Date",
      dataIndex: "dateReceived",
      key: "lpoDate",
      render: (lpoDate) =>
        new Date(lpoDate).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
    },
    {
      title: "Remarks",
      dataIndex: "remarks",
      key: "remarks",
    },
    {
      title: "Brand",
      dataIndex: ["itItem", "brand"],
      key: "itItem.brand",
    },
    {
      title: "Model",
      dataIndex: ["itItem", "model"],
      key: "itItem.model",
    },
    {
      title: "Supplier",
      dataIndex: ["supplier", "name"],
      key: "supplier.name",
    },
    {
      title: "Receiver",
      dataIndex: ["receivedBy", "name"],
      key: "receivedBy.name",
    },
  ];
  return (
    <div className="px-[3rem] py-[2rem]">
      <div className=" flex justify-end">
        <Button type="primary" icon={<AiOutlinePlus />} onClick={showModal}>
          Receive Stock
        </Button>
      </div>
      <div className="pl-[6rem] pt-6">
        <Table columns={columns} dataSource={data?.data?.data || []} />
        {/* Modal with Vertical Form */}
        <Modal
          title="Receive Stock"
          open={isModalOpen}
          onCancel={handleCancel}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="lpoReference"
              label="LPO Reference"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="lpoDate"
              label="LPO Date"
              rules={[{ required: true }]}
            >
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item
              name="itItemId"
              label="Item"
              rules={[{ required: true }]}
            >
              <Select placeholder="Select Item">
                {itItems?.data?.map((item) => (
                  <Select.Option key={item.id} value={item.id}>
                    {`${item.brand} - ${item.model} (Stock: ${
                      item.stock?.quantityInStock || 0
                    })`}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="quantityReceived"
              label="Quantity Received"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} className="w-full" />
            </Form.Item>

            <Form.Item
              name="supplierId"
              label="Supplier"
              rules={[{ required: true }]}
            >
              <Select
                placeholder="Select Supplier"
                onChange={(value) => {
                  const selected = Suppliers?.data?.find((s) => s.id === value);
                  if (selected) {
                    form.setFieldsValue({
                      voucherNumber: selected.voucherNumber,
                    });
                  }
                }}
              >
                {Suppliers?.data?.map((supplier) => (
                  <Select.Option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="voucherNumber"
              label="Voucher Number"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="warrantyPeriod"
              label="Warranty Period (months)"
              rules={[{ required: true }]}
            >
              <InputNumber min={0} className="w-full" />
            </Form.Item>

            <Form.Item
              name="dateReceived"
              label="Date Received"
              rules={[{ required: true }]}
            >
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item name="remarks" label="Remarks">
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full"
                loading={mutation.isPending}
              >
                Submit
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default StoresPage;
