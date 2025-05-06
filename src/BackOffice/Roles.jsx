import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import api from "../utils/config";
import { Button, Input, Modal, Table, Form, Select, Popconfirm } from "antd";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { AiOutlinePlus } from "react-icons/ai";
import { toast } from "react-toastify";

const Roles = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  //getting all roles
  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api.get("/admin/roles"),
  });
  //   console.log(roles?.data);

  //getting all permissions
  const { data: permissions } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => api.get("/admin/permissions"),
  });

  const dataSource = roles?.data?.map((role) => ({
    key: role.id,
    name: role.name,
  }));

  //   const handleEdit = (record) => {
  //     console.log("Editing record:", record);

  //   };

  const handleDelete = (key) => {
    // console.log("This is the id", id);
    api
      .delete(`/admin/roles/${key}`)
      .then(() => {
        toast.success("Role deleted successfully!");
        queryClient.invalidateQueries(["roles"]);
      })
      .catch((error) => { 
        console.error("Delete failed:", error);
        toast.error("Failed to delete department.");
      });
  };

  const { data: Logs } = useQuery({
    queryKey: ["logs"],
    queryFn: () => api.get("admin/audit-logs"),
  });

  const columns = [
    {
      title: "Role Name",
      dataIndex: "name",
      key: "name",
    },

    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Popconfirm
            title="Are you sure to delete this department?"
            onConfirm={() => handleDelete(record.key)}
            okText="Yes"
            cancelText="No"
          >
            <FiTrash2 className="text-red-500 cursor-pointer" size={18} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  //mutation to add role
  const { mutate: AddRole } = useMutation({
    mutationKey: ["addRole"],
    mutationFn: (values) => api.post("/admin/role", values),
    onSuccess: () => {
      toast.success("Role created successfully");
      queryClient.invalidateQueries(["roles"]);
      form.resetFields();
      setIsModalOpen(false);
    },
    onError: (error) => {
      console.error("Error adding role:", error);
      toast.error("Failed to create role");
      setIsModalOpen(false);
    },
  });

  function handleSubmit(values) {
    console.log(values);
    AddRole(values);
  }
  return (
    <div className="px-[19rem]">
      Roles Page
      <div className=" flex justify-end">
        <Button
          type="primary"
          icon={<AiOutlinePlus />}
          onClick={() => setIsModalOpen(true)}
        >
          Add Role
        </Button>
      </div>
      <Table dataSource={dataSource} columns={columns} />
      <Modal
        title="Add Role"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => handleSubmit(values)}
        >
          <Form.Item
            name="name"
            label=" Name"
            rules={[{ required: true, message: "Please enter role name" }]}
          >
            <Input placeholder="Enter role name" />
          </Form.Item>
          <Form.Item
            label="Permission"
            name="permissionId"
            rules={[{ required: true, message: "Please select permission" }]}
          >
            <Select placeholder="Select permission">
              {permissions?.data?.map((permission) => (
                <Select.Option key={permission.id} value={permission.id}>
                  {permission.resource}
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

export default Roles;
