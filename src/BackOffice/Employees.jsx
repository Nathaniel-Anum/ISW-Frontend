import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import api from "../utils/config";
import {
  Table,
  Button,
  Modal,
  Input,
  Select,
  Form,
  message,
  Popconfirm,
} from "antd";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { AiOutlinePlus } from "react-icons/ai";
import { toast } from "react-toastify";

const Employees = () => {
  const [open, setOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState({});
  const [isEditing, setIsEditing] = useState(false);

  const [form] = Form.useForm();
  const [selectedUnits, setSelectedUnits] = useState([]);
  const queryClient = useQueryClient();
  //getting all users
  const { data: getAllUsers } = useQuery({
    queryKey: ["getAllUsers"],
    queryFn: () => api.get("/admin/users"),
  });

  //   console.log(getAllUsers?.data);

  //getting all departments
  const { data: getAllDepartments } = useQuery({
    queryKey: ["getAllDepartments"],
    queryFn: () => api.get("/admin/departments?includeUnits=true"),
  });
  console.log(getAllDepartments?.data);
  //getting all roles
  const { data: Roles } = useQuery({
    queryKey: ["getAllRoles"],
    queryFn: () => api.get("/admin/roles"),
  });

  //mutation to add users
  const { mutate } = useMutation({
    mutationKey: ["createStaff"],
    mutationFn: (values) => api.post("/admin/user", values),
    onSuccess: () => {
      toast.success("Staff Created Successfully");
      form.resetFields();
      setOpen(false);
      queryClient.invalidateQueries(["getAllUsers"]);
    },
  });

  const handleCreate = () => {
    setOpen(true);
    setEditingRecord(null); // very important
    setIsEditing(false);
  };

  const columns = [
    {
      title: "Staff ID",
      dataIndex: "staffId",
      key: "staffId",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Department",
      dataIndex: ["department", "name"],
      key: "department",
    },
    {
      title: "Room No",
      dataIndex: "roomNo",
      key: "roomNo",
    },
    {
      title: "Role",
      dataIndex: "roles",
      key: "roles",
      render: (roles) => roles.map((r) => r.role?.name).join(", "),
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
          <Popconfirm
            title="Are you sure to delete this user?"
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            cancelText="No"
          >
            <FiTrash2 className="text-red-500 cursor-pointer" size={18} />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const handleEdit = (record) => {
    console.log("Editing record:", record);
    setEditingRecord(record);
    setIsModalOpen(true);
    setIsEditing(true);
  };

  const { mutate: deleteStaff } = useMutation({
    mutationFn: (staffId) => api.delete(`/admin/user/${staffId}/permanent`),
    onSuccess: () => {
      toast.success("Staff Deleted Successfully");
      message.success("Staff Deleted Successfully");
      queryClient.invalidateQueries(["getAllUsers"]);
    },
  });
  
  // handleDelete function
  const handleDelete = (record) => {
    console.log('Deleting record:', record);
    deleteStaff(record.staffId);
  };

  const handleDepartmentChange = (deptId) => {
    const department = getAllDepartments?.data?.find((d) => d.id === deptId);
    if (department) {
      setSelectedUnits(department.units || []);
      // Reset unitId field when department changes
      form.setFieldsValue({ unitId: undefined });
    }
  };

  const handleSubmit = (values) => {
    console.log(values);
    mutate(values);
    setOpen(false);
  };

  useEffect(() => {
    if (isEditing && editingRecord) {
      form.setFieldsValue({
        staffId: editingRecord.staffId,
        name: editingRecord.name,
        email: editingRecord.email,
        departmentId: editingRecord.department?.id,
        unitId: editingRecord.unit?.id,
        roomNo: editingRecord.roomNo,
        roleName: editingRecord.roles?.[0]?.role?.name,
      });
    } else {
      form.resetFields(); // Reset form when creating new
    }
  }, [isEditing, editingRecord, form]);

  //mutation to edit staff
  const { mutate: EditStaff } = useMutation({
    mutationFn: (values) =>
      api.patch(`/admin/user/${editingRecord.staffId}`, values),
    onSuccess: () => {
      toast.success("Staff Updated Successfully");
      message.success("Staff Updated Successfully");
      form.resetFields();
      setIsModalOpen(false);
      queryClient.invalidateQueries(["getAllUsers"]);
    },
  });

  const handleEditSubmit = (values) => {
    console.log("sending this to the backend", values);
    EditStaff(values);
    setIsModalOpen(false);
  };

  return (
    <div className="px-[15rem] py-[2rem]">
      <p>This is the Employees Page</p>
      <div className=" flex justify-end">
        <Button type="primary" icon={<AiOutlinePlus />} onClick={handleCreate}>
          Create Staff
        </Button>
      </div>
      
      <Table
        columns={columns}
        dataSource={getAllUsers?.data || []}
        rowKey="id"
      />
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        title="Create Staff"
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item
            name="staffId"
            label="Staff ID"
            rules={[{ required: true }]}
          >
            <Input placeholder="Enter Staff ID" />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Enter Name" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input placeholder="Enter Email" />
          </Form.Item>
          <Form.Item
            name="departmentId"
            label="Department"
            rules={[{ required: true }]}
          >
            <Select
              placeholder="Select Department"
              onChange={(value) => handleDepartmentChange(value)}
            >
              {getAllDepartments?.data?.map((dept) => (
                <Select.Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="unitId" label="Unit" rules={[{ required: true }]}>
            <Select placeholder="Select Unit" disabled={!selectedUnits.length}>
              {selectedUnits.map((unit) => (
                <Select.Option key={unit.id} value={unit.id}>
                  {unit.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="roomNo" label="Room No" rules={[{ required: true }]}>
            <Input placeholder="Enter Room No" />
          </Form.Item>

          <Form.Item
            name="roleName"
            label="Role Name"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select Role">
              {Roles?.data?.map((role) => (
                <Select.Option key={role.id} value={role.name}>
                  {role.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        title="Edit Staff"
      >
        <Form layout="vertical" form={form} onFinish={handleEditSubmit}>
          <Form.Item
            name="staffId"
            label="Staff ID"
            rules={[{ required: true }]}
          >
            <Input placeholder="Enter Staff ID" />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Enter Name" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input placeholder="Enter Email" />
          </Form.Item>
          <Form.Item
            name="departmentId"
            label="Department"
            rules={[{ required: true }]}
          >
            <Select
              placeholder="Select Department"
              onChange={(value) => handleDepartmentChange(value)}
            >
              {getAllDepartments?.data?.map((dept) => (
                <Select.Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="unitId" label="Unit" rules={[{ required: true }]}>
            <Select placeholder="Select Unit" disabled={!selectedUnits.length}>
              {selectedUnits.map((unit) => (
                <Select.Option key={unit.id} value={unit.id}>
                  {unit.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="roomNo" label="Room No" rules={[{ required: true }]}>
            <Input placeholder="Enter Room No" />
          </Form.Item>

          <Form.Item
            name="roleName"
            label="Role Name"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select Role">
              {Roles?.data?.map((role) => (
                <Select.Option key={role.id} value={role.name}>
                  {role.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Update Staff
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Employees;
