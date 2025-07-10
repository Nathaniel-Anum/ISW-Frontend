import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Modal, Form, Input, Button, Select, Table, Tag } from "antd";
import { AiOutlinePlus } from "react-icons/ai";
import { useUser } from "../utils/userContext";
import api from "../utils/config";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const Requisition = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { user } = useUser();

  const [form] = Form.useForm();

  useEffect(() => {
    if (user && isModalOpen) {
      form.setFieldsValue({
        staffId: user.staffId,
        roomNo: user.roomNo,
        unitId: user.unit.name, // Display name, but send ID later
        departmentId: user.department.name,
      });
    }
  }, [user, form, isModalOpen]);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields(); // Reset form when closing
  };

  //Mutation to Create Requisition
  const { mutate: createRequisition, isPending } = useMutation({
    mutationKey: "createRequisition",
    mutationFn: (values) => {
      return api.post("/user/requisitions", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["requisition"]);
      form.resetFields();
      setIsModalOpen(false);
      toast.success("Requisition created successfully");
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || "Failed to create requisition"
      );
    },
  });

  const handleSubmit = (values) => {
    const payload = {
      ...values,
      quantity: Number(values.quantity),
      unitId: user.unit.id,
      departmentId: user.department.id,
      // urgency: values.urgency.toUpperCase(),
    };

    console.log("Final Payload:", payload);

    createRequisition(payload);

    setIsModalOpen(false);
    form.resetFields(); // Reset after submission
  };

  //Query to get user requisition

  const { data: requisition } = useQuery({
    queryKey: ["requisition"],
    queryFn: () => api.get("/user/requisitions"),
  });
  console.log(requisition?.data);

  const columns = [
    // {
    //   title: "Requisition ID",
    //   dataIndex: "requisitionID",
    //   key: "requisitionID",
    // },
    {
      title: "Description",
      dataIndex: "itemDescription",
      key: "itemDescription",
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
    },
    // {
    //   title: "Urgency",
    //   dataIndex: "urgency",
    //   key: "urgency",
    //   render: (urgency) => (
    //     <Tag
    //       color={
    //         urgency === "HIGH"
    //           ? "red"
    //           : urgency === "MEDIUM"
    //           ? "orange"
    //           : "green"
    //       }
    //     >
    //       {urgency}
    //     </Tag>
    //   ),
    // },
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
          color={
            status === "PENDING_DEPT_APPROVAL"
              ? "blue"
              : status === "APPROVED"
              ? "green"
              : status === "PENDING_ITD_APPROVAL"
              ? "yellow"
              : status === "ITD_APPROVED" || status === "PROCESSED"
              ? "green"
              : "red"
          }
        >
          {status.replaceAll("_", " ")}
        </Tag>
      ),
    },
    {
      title: "Date Created",
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
  ];

  return (
    <div className="px-[3rem] py-[2rem]">
      {/* Button to Open Modal */}
      <div className="flex justify-end">
        <Button type="primary" icon={<AiOutlinePlus />} onClick={showModal}>
          Create Requisition
        </Button>
      </div>

      {/* Modal with Vertical Form */}
      <Modal
        title="Create Requisition"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null} // Removing default footer
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="staffId"
            label="Staff ID"
            rules={[{ required: true }]}
          >
            <Input disabled />
          </Form.Item>

          <Form.Item
            name="itemDescription"
            label="Item Description"
            rules={[{ required: true }]}
          >
            <Input placeholder="Enter Item Description" />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true }]}
          >
            <Input type="number" min={0} placeholder="Enter Quantity" />
          </Form.Item>

          {/* <Form.Item
            name="urgency"
            label="Urgency"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select Urgency">
              <Select.Option value="low">LOW</Select.Option>
              <Select.Option value="medium">MEDIUM</Select.Option>
              <Select.Option value="high">HIGH</Select.Option>
            </Select>
          </Form.Item> */}

          <Form.Item
            name="purpose"
            label="Purpose"
            rules={[{ required: true }]}
          >
            <Input.TextArea placeholder="Enter Purpose" />
          </Form.Item>

          <Form.Item name="unitId" label="Unit ">
            <Input disabled />
          </Form.Item>

          <Form.Item
            name="departmentId"
            label="Department "
            rules={[{ required: true }]}
          >
            <Input disabled />
          </Form.Item>

          <Form.Item name="roomNo" label="Room No">
            <Input placeholder="Enter Room Number" />
          </Form.Item>

          {/* Submit Button */}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isPending} block>
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <div className="pl-[6rem] pt-6">
        <Table
          columns={columns}
          dataSource={requisition?.data || []}
          rowKey="requisitionID"
        />
      </div>
    </div>
  );
};

export default Requisition;
