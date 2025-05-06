import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import api from "../utils/config";
import {
  Button,
  Input,
  Table,
  Form,
  DatePicker,
  Modal,
  Popconfirm,
} from "antd";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { AiOutlinePlus } from "react-icons/ai";
import { toast } from "react-toastify";

const Supplier = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  //getting all suppliers
  const { data: getSupplier } = useQuery({
    queryKey: ["getSupplier"],
    queryFn: () => api.get("/admin/suppliers"),
  });
  console.log(getSupplier?.data);

  //mutation to add supplier
  const { mutate } = useMutation({
    mutationKey: ["createSupplier"],
    mutationFn: (payload) => api.post("/admin/suppliers/create", payload),
    onSuccess: () => {
      toast.success("Supplier created successfully");
      form.resetFields();
      setIsModalOpen(false);
      queryClient.invalidateQueries(["getSupplier"]);
    },
  });

  const handleEdit = (record) => {
    console.log("Editing record:", record);
    // Open modal, set form fields, etc
  };

  const handleDelete = (id) => {
    api
      .delete(`/admin/suppliers/${id}`)
      .then(() => {
        toast.success("Department deleted successfully!");
        queryClient.invalidateQueries(["getAllDepartments"]);
      })
      .catch((error) => {
        console.error("Delete failed:", error);
        toast.error("Failed to delete department.");
      });
  };

  const columns = [
    {
      title: "Supplier Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Contact Details",
      dataIndex: "contactDetails",
      key: "contactDetails",
    },
    // {
    //   title: "LPO Reference",
    //   dataIndex: "lpoReference",
    //   key: "lpoReference",
    // },
    // {
    //   title: "LPO Date",
    //   dataIndex: "lpoDate",
    //   key: "lpoDate",
    //   render: (text) => new Date(text).toLocaleDateString(), // Format the date nicely
    // },
    // {
    //   title: "Voucher Number",
    //   dataIndex: "voucherNumber",
    //   key: "voucherNumber",
    // },
    {
      title: "Remarks",
      dataIndex: "remarks",
      key: "remarks",
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
              onConfirm={() => handleDelete(record.id)}
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

  const handleSubmit = (values) => {
    // const payload = {
    //   ...values,
    //   lpoDate: values.lpoDate.format("YYYY-MM-DD"),
    // };
    console.log(values);
    mutate(values);
  };
  return (
    <div className="px-[19rem]">
      Supplier page
      <div className=" flex justify-end">
        <Button
          type="primary"
          icon={<AiOutlinePlus />}
          onClick={() => setIsModalOpen(true)}
        >
          Create Supplier
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={getSupplier?.data || []}
        rowKey="id"
        pagination={false}
      />
      <Modal
        title="Create Supplier"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Supplier Name"
            name="name"
            rules={[{ required: true, message: "Please enter supplier name" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Contact Details"
            name="contactDetails"
            rules={[
              { required: true, message: "Please enter contact details" },
            ]}
          >
            <Input />
          </Form.Item>

          {/* <Form.Item
            label="LPO Reference"
            name="lpoReference"
            rules={[{ required: true, message: "Please enter LPO reference" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="LPO Date"
            name="lpoDate"
            rules={[{ required: true, message: "Please select LPO date" }]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Voucher Number"
            name="voucherNumber"
            rules={[{ required: true, message: "Please enter voucher number" }]}
          >
            <Input />
          </Form.Item> */}
          <Form.Item label="Remarks" name="remarks">
            <Input />
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

export default Supplier;
