import React, { useState } from "react";
import { Modal, Form, Input, Button, Select } from "antd";
import { AiOutlinePlus } from "react-icons/ai";

const Requisition = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields(); // Reset form when closing
  };

  const handleSubmit = (values) => {
    console.log("Form Values:", values);
    setIsModalOpen(false);
    form.resetFields(); // Reset after submission
  };

  return (
    <div className="px-[3rem] py-[2rem]">
      {/* Button to Open Modal */}
      <div className=" flex justify-end">
        <Button type="primary" icon={<AiOutlinePlus />} onClick={showModal}>
          Add Request
        </Button>
      </div>

      {/* Modal with Vertical Form */}
      <Modal
        title="New Request"
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
            <Input placeholder="Enter Staff ID" />
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
            <Input type="number" placeholder="Enter Quantity" />
          </Form.Item>

          <Form.Item
            name="urgency"
            label="Urgency"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select Urgency">
              <Select.Option value="low">Low</Select.Option>
              <Select.Option value="medium">Medium</Select.Option>
              <Select.Option value="high">High</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="purpose"
            label="Purpose"
            rules={[{ required: true }]}
          >
            <Input.TextArea placeholder="Enter Purpose" />
          </Form.Item>

          <Form.Item name="unitId" label="Unit ID" rules={[{ required: true }]}>
            <Input placeholder="Enter Unit ID" />
          </Form.Item>

          <Form.Item
            name="departmentId"
            label="Department ID"
            rules={[{ required: true }]}
          >
            <Input placeholder="Enter Department ID" />
          </Form.Item>

          <Form.Item name="roomNo" label="Room No" rules={[{ required: true }]}>
            <Input placeholder="Enter Room Number" />
          </Form.Item>

          {/* Submit Button */}
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Requisition;
