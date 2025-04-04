import React from "react";
import { Button, Form, Input, message } from "antd";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query"; 
import { login } from '../lib/auth';
import AuthLayout from "./AuthLayout";

const Login = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: ({ staffId, password }) => login(staffId, password),
    onSuccess: () => {
      const mustResetPassword = localStorage.getItem('mustResetPassword') === 'true';
      navigate(mustResetPassword ? '/reset-password' : '/dashboard');
    },
    onError: (err) => {
      console.error('Login failed:', err);
      toast.error(err.message || 'Login failed');
    },
  });

  const onFinish = (values) => {
    loginMutation.mutate(values);
  };

  return (
    <AuthLayout title="Login to Proceed to your Dashboard">
      <Form form={form} name="login" onFinish={onFinish}>
        <Form.Item
          name="staffId"
          rules={[{ required: true, message: 'Please input your staff ID!' }]}
        >
          <Input placeholder="Staff ID" allowClear />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password placeholder="Password" />
        </Form.Item>

        <Form.Item>
          <Button
            className="w-full bg-[#9D4D01] hover:bg-[#7A3C01]"
            type="primary"
            htmlType="submit"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Logging in...' : 'Login'}
          </Button>
        </Form.Item>
      </Form>
      <p className="text-center mt-4">
        <a href="/forgot-password" className="font-semibold text-[#6C63FF]">
          Forgot Password?
        </a>
      </p>
      <ToastContainer />
    </AuthLayout>
  );
};

export default Login;
