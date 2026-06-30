import React from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button, Form, Input } from "antd";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { forgotPassword } from "../lib/auth";
import AuthLayout from "./AuthLayout";

const ForgotPassword = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const forgotPasswordMutation = useMutation({
    mutationFn: ({ email }) => forgotPassword(email),
    onSuccess: () => {
      toast.success("If that email exists, a reset link has been sent");
      setTimeout(() => navigate("/"), 3000);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Something went wrong. Please try again.");
    },
  });

  const onFinish = (values) => {
    forgotPasswordMutation.mutate(values);
  };

  return (
    <AuthLayout title="Forgot Password" description="Enter your email and we'll send you a reset link.">
      <Form form={form} name="forgot-password" layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: "Please input your email!" },
            { type: "email", message: "Invalid email format!" },
          ]}
        >
          <Input size="large" placeholder="Enter your email" allowClear />
        </Form.Item>

        <Form.Item>
          <Button
            className="h-13 w-full border-0 bg-[linear-gradient(135deg,#D32F2F,#B71C1C)] text-base font-bold shadow-[0_18px_34px_rgba(211,47,47,0.24)] hover:!bg-[linear-gradient(135deg,#B71C1C,#991B1B)]"
            type="primary"
            htmlType="submit"
            disabled={forgotPasswordMutation.isPending}
          >
            {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
          </Button>
        </Form.Item>
      </Form>

      <p className="text-center text-sm text-[#6B7280]">
        <a href="/" className="font-bold text-[#B71C1C] transition-colors hover:text-[#D32F2F]">
          Back to Login
        </a>
      </p>
      <ToastContainer />
    </AuthLayout>
  );
};

export default ForgotPassword;
