import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Modal, Form, Input, Button, Select } from 'antd';
import { AiOutlinePlus } from 'react-icons/ai';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createRequisition, getProfile } from '../lib/auth';

  const NewRequisition = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
  
    const { data: user, isLoading: userLoading } = useQuery({
      queryKey: ['profile'],
      queryFn: getProfile,
    });
  
    const mutation = useMutation({
      mutationFn: createRequisition,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['requisitions'] });
        toast.success('Requisition created successfully!');
        setIsModalOpen(false);
        form.resetFields();
        navigate('/dashboard/requisitions');
      },
      onError: (err) => {
        console.error('Requisition creation failed:', err);
        toast.error('Failed to create requisition. Please try again.');
      },
    });
  
    useEffect(() => {
      if (isModalOpen && user) {
        form.setFieldsValue({
          staffId: user.staffId,
          departmentId: user.department.id,
          departmentName: user.department.name,
          unitId: user.unit?.id || undefined,
          unitName: user.unit?.name || 'N/A',
          roomNo: user.roomNo || undefined,
        });
      }
    }, [user, isModalOpen, form]);
  
    const showModal = () => {
      setIsModalOpen(true);
    };
  
    const handleCancel = () => {
      setIsModalOpen(false);
      form.resetFields();
    };
  
    const onFinish = (values) => {
      const { departmentName, unitName, ...submissionData } = values;
    mutation.mutate(submissionData);
    };
  
    if (userLoading) return <div>Loading...</div>;

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
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ quantity: 1 }}
        >
          <Form.Item
            name="staffId"
            label="Staff ID"
            rules={[{ required: true, message: 'Staff ID is required!' }]}
          >
            <Input placeholder="Staff ID" disabled/>
          </Form.Item>

          <Form.Item name="departmentId" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="departmentName"
            label="Department"
            rules={[{ required: true, message: 'Department is required!' }]}
          >
            <Input disabled />
          </Form.Item>

          <Form.Item name="unitId" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="unitName" label="Unit">
            <Input disabled />
          </Form.Item>

          <Form.Item
            name="itemDescription"
            label="Item Description"
            rules={[{ required: true, message: 'Description is required!' }]}
          >
            <Input placeholder="Enter Item Description" />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[
              { required: true, message: 'Quantity is required!' },
              { type: 'number', min: 1, message: 'Quantity must be at least 1!' },
            ]}
          >
            <Input type="number" placeholder="Enter Quantity" />
          </Form.Item>

          <Form.Item 
          name="urgency" 
          label="Urgency" 
          initialValue="MEDIUM"
        >
          <Select placeholder="Select Urgency">
            <Select.Option value="LOW">Low</Select.Option>
            <Select.Option value="MEDIUM">Medium</Select.Option>
            <Select.Option value="HIGH">High</Select.Option>
          </Select>
        </Form.Item>

          <Form.Item
            name="purpose"
            label="Purpose"
            rules={[{ required: true,  message: 'Purpose is required!' }]}
          >
            <Input.TextArea placeholder="Enter Purpose" />
          </Form.Item>

          <Form.Item name="roomNo" label="Room Number">
            <Input placeholder={user?.roomNo || 'Enter Room Number'} />
          </Form.Item>

          {/* Submit Button */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              disabled={mutation.isPending}
            >
              {mutation.isPending ? 'Submitting...' : 'Submit Requisition'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <ToastContainer />
    </div>
  );
};

export default NewRequisition;
