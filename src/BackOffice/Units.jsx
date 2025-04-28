import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import api from "../utils/config";
import { Button, Table, Form, Modal, Input, Select } from "antd";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { AiOutlinePlus } from "react-icons/ai";
import { toast } from "react-toastify";

const Units = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  //getting all departments
  const { data: getAllUnits } = useQuery({
    queryKey: ["getAllUnits"],
    queryFn: () => api.get("/admin/units"),
  });
  console.log(getAllUnits?.data);

  //getting all departments
  const { data: getAllDepartments } = useQuery({
    queryKey: ["getAllDepartments"],
    queryFn: () => api.get("/admin/departments?includeUnits=true"),
  });
  console.log(getAllDepartments?.data);

  const handleEdit = (record) => {
    console.log("Editing record:", record);
    // Open modal, set form fields, etc
  };

  const handleDelete = (record) => {
    console.log("Deleting record:", record);
    // Confirm delete and call your delete API
  };

  const { mutate } = useMutation({
    mutationKey: ["addUnit"],
    mutationFn: (values) => api.post("/admin/units/new", values),
    onSuccess: () => {
      toast.success("Unit created successfully");
      queryClient.invalidateQueries(["getAllUnits"]);
      form.resetFields();
      setIsModalOpen(false);
    },
  });

  const handleSubmit = (values) => {
    console.log(values);
    mutate(values);
  };

  const columns = [
    {
      title: "Unit Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Department Name",
      dataIndex: ["department", "name"], // this gets department.name directly
      key: "departmentName",
      render: (_, record) => record.department?.name || "N/A",
    },
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
      unit page
      <div className=" flex justify-end">
        <Button
          type="primary"
          icon={<AiOutlinePlus />}
          onClick={() => setIsModalOpen(true)}
        >
          Create Unit
        </Button>
      </div>
      <Table
        dataSource={getAllUnits?.data || []}
        columns={columns}
        rowKey="id"
        pagination={false}
      />
      <Modal
        title="Create Unit"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
              {getAllDepartments?.data?.map((department) => (
                <Select.Option key={department.id} value={department.id}>
                  {department.name}
                </Select.Option>
              ))}
            </Select>
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

export default Units;
