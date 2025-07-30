import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Button, Form, Input, Select } from "antd";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  resetPassword,
  resetPasswordWithToken,
  getSecurityQuestions,
} from "../lib/auth";
import AuthLayout from "./AuthLayout";

const ResetPassword = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const [questions, setQuestions] = useState([]);

  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get("token");

  const resetMutation = useMutation({
    mutationFn: (data) => {
      return token
        ? resetPasswordWithToken(token, data.newPassword)
        : resetPassword(
            data.newPassword,
            data.securityQuestion,
            data.securityAnswer
          );
    },
    onSuccess: () => {
      if (token) {
        toast.success("Password reset successfully. Redirecting to login...");
        setTimeout(() => navigate("/"), 2000);
      } else {
        localStorage.setItem("mustResetPassword", "false");
        toast.success(
          "Password reset successfully. Redirecting to dashboard..."
        );
        setTimeout(() => navigate("/"), 2000);
      }
    },
    onError: (err) => {
      console.error("Reset password failed:", err);
      toast.error(err.message || "Failed to reset password. Please try again.");
    },
  });

  useEffect(() => {
    if (!token) {
      getSecurityQuestions()
        .then((questions) => setQuestions(questions))
        .catch((err) => {
          console.error("Failed to fetch security questions:", err);
          toast.error("Could not load security questions.");
        });
    }
  }, [token]);

  const onFinish = (values) => {
    resetMutation.mutate(values);
  };

  return (
    <AuthLayout title="Reset Your Password">
      <Form
        form={form}
        name="reset-password"
        onFinish={onFinish}
        layout="vertical"
      >
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
          <Input.Password placeholder="New Password" />
        </Form.Item>

        {!token && (
          <>
            <Form.Item
              name="securityQuestion"
              label="Security Question"
              rules={[
                {
                  required: true,
                  message: "Please select a security question!",
                },
              ]}
            >
              <Select placeholder="Select a question">
                {questions.map((q) => (
                  <Select.Option key={q} value={q}>
                    {q}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="securityAnswer"
              label="Security Answer"
              rules={[
                {
                  required: true,
                  message: "Please input your security answer!",
                },
              ]}
            >
              <Input placeholder="Security Answer" />
            </Form.Item>
          </>
        )}

        <Form.Item>
          <Button
            className="w-full bg-[#9D4D01] hover:bg-[#7A3C01]"
            type="primary"
            htmlType="submit"
            disabled={resetMutation.isPending}
          >
            {resetMutation.isPending ? "Resetting..." : "Reset Password"}
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

export default ResetPassword;
