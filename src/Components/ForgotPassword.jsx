import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button, Form, Input } from 'antd';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { forgotPassword } from '../lib/auth'; 
import AuthLayout from './AuthLayout';

const ForgotPassword = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const forgotPasswordMutation = useMutation({
    mutationFn: ({ email, securityAnswer }) => forgotPassword(email, securityAnswer),
    onSuccess: () => {
      toast.success('Check your email for reset instructions');
      navigate('/');
    },
    onError: (err) => {
      console.error('Forgot password failed:', err);
      toast.error('Failed to send reset instructions. Please try again.');
    },
  });

  const onFinish = (values) => {
    forgotPasswordMutation.mutate(values);
  };

  return (
    <AuthLayout title="Reset Your Password">
      <Form form={form} name="forgot-password" onFinish={onFinish}>
        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Please input your email!' },
            { type: 'email', message: 'Invalid email format!' },
          ]}
        >
          <Input placeholder="Email" allowClear />
        </Form.Item>

        <Form.Item
          name="securityAnswer"
          rules={[{ required: true, message: 'Please input your security answer!' }]}
        >
          <Input placeholder="Security Answer (to your chosen question)" />
        </Form.Item>

        <Form.Item>
          <Button
            className="w-full bg-[#9D4D01] hover:bg-[#7A3C01]"
            type="primary"
            htmlType="submit"
            disabled={forgotPasswordMutation.isPending}
          >
            {forgotPasswordMutation.isPending ? 'Submitting...' : 'Submit'}
          </Button>
        </Form.Item>
      </Form>

        <p className="text-center mt-4">
          <a href="/" className="font-semibold text-[#6C63FF]">
            Back to Login
          </a>
          </p>
      <ToastContainer />
    </AuthLayout>
  );
};

export default ForgotPassword;