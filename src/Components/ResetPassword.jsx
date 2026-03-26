import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button, Form, Input } from "antd";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { resetPassword, resetPasswordWithToken } from "../lib/auth";
import AuthLayout from "./AuthLayout";

const ResetPassword = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get("token");

  const resetMutation = useMutation({
    mutationFn: (data) =>
      token
        ? resetPasswordWithToken(token, data.newPassword)
        : resetPassword(data.newPassword),
    onSuccess: () => {
      if (token) {
        toast.success("Password reset successfully. Redirecting to login...");
      } else {
        localStorage.setItem("mustResetPassword", "false");
        toast.success("Password set successfully. Redirecting to dashboard...");
      }
      setTimeout(() => navigate("/"), 2000);
    },
    onError: (err) => {
      console.error("Reset password failed:", err);
      toast.error(err.response?.data?.message || "Failed to reset password. Please try again.");
    },
  });

  const onFinish = (values) => {
    resetMutation.mutate(values);
  };

  return (
    <AuthLayout
      title={token ? "Reset Your Password" : "Set Your Password"}
      description={token ? "Enter your new password below." : "Create a password to secure your account."}
    >
      <Form form={form} name="reset-password" onFinish={onFinish} layout="vertical">
        <Form.Item
          name="newPassword"
          label="New Password"
          rules={[
            { required: true, message: "Please input your new password!" },
            { min: 8, message: "Password must be at least 8 characters!" },
            {
              pattern: /^(?=.*[A-Za-z])(?=.*\d)/,
              message: "Password must contain a letter and a number!",
            },
          ]}
        >
          <Input.Password size="large" placeholder="New Password" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Confirm Password"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "Please confirm your password!" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Passwords do not match!"));
              },
            }),
          ]}
        >
          <Input.Password size="large" placeholder="Confirm Password" />
        </Form.Item>

        <Form.Item>
          <Button
            className="h-13 w-full border-0 bg-[linear-gradient(135deg,#D32F2F,#B71C1C)] text-base font-bold shadow-[0_18px_34px_rgba(211,47,47,0.24)] hover:!bg-[linear-gradient(135deg,#B71C1C,#991B1B)]"
            type="primary"
            htmlType="submit"
            disabled={resetMutation.isPending}
          >
            {resetMutation.isPending ? "Saving..." : "Set Password"}
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

export default ResetPassword;
