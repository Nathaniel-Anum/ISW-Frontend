import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import api from "../utils/config";
import {
  Button,
  Table,
  Modal,
  Form,
  Input,
  Select,
  Checkbox,
  Popconfirm,
} from "antd";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { AiOutlinePlus } from "react-icons/ai";
import { toast } from "react-toastify";

const ItItems = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  //getting all items
  const { data: getItItems } = useQuery({
    queryKey: ["getItItems"],
    queryFn: () => api.get("/admin/it-items"),
  });

  const { data: getSupplier } = useQuery({
    queryKey: ["getSupplier"],
    queryFn: () => api.get("/admin/suppliers"),
  });
  console.log(getSupplier?.data);

  const dataSource = getItItems?.data?.map((item) => ({
    key: item.id,
    deviceType: item.deviceType,
    itemClass: item.itemClass,
    brand: item.brand,
    model: item.model,
    specifications: item.specifications || "N/A",
    quantityInStock: item.stock?.quantityInStock ?? 0, // fallback to 0 if stock is undefined
  }));

  const handleEdit = (record) => {
    console.log("Editing record:", record);
    // Open modal, set form fields, etc
  };
  const handleDelete = (record) => {
    console.log("deleting this id", record?.key);
    api
      .delete(`/admin/it-items/${record?.key}`)
      .then(() => {
        toast.success("Department deleted successfully!");
        queryClient.invalidateQueries(["getItItems"]);
      })
      .catch((error) => {
        console.error("Delete failed:", error);
        toast.error("Failed to delete department.");
      });
  };
  const { Option } = Select;
  const columns = [
    {
      title: "Device Type",
      dataIndex: "deviceType",
      key: "deviceType",
    },
    {
      title: "Item Class",
      dataIndex: "itemClass",
      key: "itemClass",
    },
    {
      title: "Brand",
      dataIndex: "brand",
      key: "brand",
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
    },
    {
      title: "Specifications",
      dataIndex: "specifications",
      key: "specifications",
    },
    {
      title: "Quantity In Stock",
      dataIndex: "quantityInStock",
      key: "quantityInStock",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          {/* <FiEdit
            className="text-blue-500 cursor-pointer"
            size={18}
            onClick={() => handleEdit(record)}
          /> */}
          <div className="flex items-center gap-3">
            <Popconfirm
              title="Are you sure to delete this department?"
              onConfirm={() => handleDelete(record)}
              okText="Yes"
              cancelText="No"
            >
              <FiTrash2 className="text-red-500 cursor-pointer" size={18} />
            </Popconfirm>
          </div>
        </div>
      ),
    },
  ];

  //mutation to add item
  const { mutate } = useMutation({
    mutationFn: (values) => api.post("admin/ititems/new", values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getItItems"] });
      setIsModalOpen(false);
      toast.success("Item Added Successfully");
      form.resetFields();
    },
  });

  const handleSubmit = (values) => {
    const payload = {
      ...values,
      defaultWarranty: Number(values.defaultWarranty),
    };
    console.log(payload);
    mutate(payload);
  };

  return (
    <div className="px-[19rem]">
      It items
      <div className=" flex justify-end">
        <Button
          type="primary"
          icon={<AiOutlinePlus />}
          onClick={() => setIsModalOpen(true)}
        >
          Add Item
        </Button>
      </div>
      <Table dataSource={dataSource} columns={columns} pagination={false} />
      <Modal
        title="Add New Item"
        open={isModalOpen}
        footer={null}
        onCancel={() => setIsModalOpen(false)}
        okText="Submit"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="deviceType"
            label="Device Type"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select device type">
              <Option value="OTHER">Other</Option>
              <Option value="PRINTER">Printer</Option>
              <Option value="LAPTOP">Laptop</Option>
              <Option value="DESKTOP">Desktop</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="itemClass"
            label="Item Class"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select item class">
              <Option value="FIXED_ASSET">Fixed Asset</Option>
              <Option value="CONSUMABLE">Consumable</Option>
            </Select>
          </Form.Item>

          <Form.Item name="brand" label="Brand" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item name="model" label="Model" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item
            name="defaultWarranty"
            label="Default Warranty (months)"
            rules={[{ required: true }]}
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item
            name="supplierId"
            label="Supplier"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select Supplier">
              {getSupplier?.data?.map((supplier) => (
                <Select.Option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="requiresAssetTag" valuePropName="checked">
            <Checkbox>Requires Asset Tag?</Checkbox>
          </Form.Item>

          <Form.Item
            name="assignmentPolicy"
            label="Assignment Policy"
            rules={[{ required: true }]}
          >
            <Input placeholder="e.g., Standard User" />
          </Form.Item>

          <Form.Item label="Specifications">
            <Form.Item
              name="processor"
              label="Processor"
              style={{ marginBottom: 0 }}
            >
              <Input placeholder="Processor (e.g., M1)" />
            </Form.Item>
            <Form.Item name="memory" label="Memory" style={{ marginBottom: 0 }}>
              <Input placeholder="Memory (e.g., 8GB)" />
            </Form.Item>
            <Form.Item
              name="storage"
              label="Storage"
              style={{ marginBottom: 0 }}
            >
              <Input placeholder="Storage (e.g., 512GB)" />
            </Form.Item>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ItItems;
