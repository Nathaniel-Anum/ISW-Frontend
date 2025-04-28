import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import api from "../utils/config";
import { Button, Table, Form, Modal, Input } from "antd";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { AiOutlinePlus } from "react-icons/ai";
import { toast } from "react-toastify";

const Department = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  //getting all departments
  const { data: getAllDepartments } = useQuery({
    queryKey: ["getAllDepartments"],
    queryFn: () => api.get("/admin/departments?includeUnits=true"),
  });
  console.log(getAllDepartments?.data);

  //mutate to add Department
  const { mutate } = useMutation({
    mutationKey: ["createDepartment"],
    mutationFn: (values) => api.post("/admin/departments/new", values),
    onSuccess: () => {
      toast.success("Department created successfully");
      queryClient.invalidateQueries(["getAllDepartments"]);
      form.resetFields();
      setIsModalOpen(false);
    },
  });

  const handleEdit = (record) => {
    console.log("Editing record:", record);
    // Open modal, set form fields, etc
  };

  const handleDelete = (record) => {
    console.log("Deleting record:", record);
    // Confirm delete and call your delete API
  };

  const handleSubmit = (values) => {
    console.log(values);

    mutate(values);
  };

  const columns = [
    {
      title: "Department Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Location",
      dataIndex: "location",
      key: "location",
      render: (text) => text || "-", // Show "-" if location is null
    },
    // {
    //   title: "Units",
    //   dataIndex: "units",
    //   key: "units",
    //   render: (units) => units?.map((unit) => unit.name).join(", ") || "-", // Show comma-separated units
    // },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <FiEdit
            className="text-blue-500 cursor-pointer"
            size={18}
            onClick={() => handleEdit(record)}
          />
          <FiTrash2
            className="text-red-500 cursor-pointer"
            size={18}
            onClick={() => handleDelete(record)}
          />
        </div>
      ),
    },
  ];
  return (
    <div className="px-[19rem]">
      Department Page!
      <div className=" flex justify-end">
        <Button
          type="primary"
          icon={<AiOutlinePlus />}
          onClick={() => setIsModalOpen(true)}
        >
          Create Department
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={getAllDepartments?.data || []}
        rowKey="id"
      />
      <Modal
        title="Create Department"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Department Name"
            rules={[
              { required: true, message: "Please enter department name" },
            ]}
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

export default Department;
