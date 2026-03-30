import React, { useEffect, useState } from "react";
import { Button, Form, Input, Spin } from "antd";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { LuIdCard, LuLockKeyhole, LuShieldCheck } from "react-icons/lu";
import { login } from "../lib/auth";
import AuthLayout from "./AuthLayout";

const Login = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [isSpinning, setIsSpinning] = useState(false);

  const loginMutation = useMutation({
    mutationFn: ({ staffId, password }) => login(staffId, password),
    onSuccess: () => {
      navigate("/dashboard");
    },
    onError: (err) => {
      console.error("Login failed:", err);
      toast.error(err.response?.data?.message || "Login failed");
      setIsSpinning(false);
    },
  });

  useEffect(() => {
    let timer;
    if (loginMutation.isPending) {
      setIsSpinning(true);
      timer = setTimeout(() => {
        setIsSpinning(false);
      }, 4000);
    }

    return () => clearTimeout(timer);
  }, [loginMutation.isPending]);

  const onFinish = (values) => {
    loginMutation.mutate(values);
  };

  return (
    <AuthLayout
      title="Sign in"
      description="Use your staff credentials to continue."
    >
      <Form form={form} name="login" layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="staffId"
          label="Staff ID"
          rules={[{ required: true, message: "Please input your staff ID!" }]}
        >
          <Input
            size="large"
            placeholder="Enter your staff ID"
            allowClear
            prefix={<LuIdCard className="text-[#9CA3AF]" />}
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: "Please input your password!" }]}
        >
          <Input.Password
            size="large"
            placeholder="Enter your password"
            prefix={<LuLockKeyhole className="text-[#9CA3AF]" />}
          />
        </Form.Item>

        <div className="mb-5 flex items-center gap-3 rounded-lg border border-[#FFEBEE] bg-[#FFF8F7] px-4 py-3 text-sm text-[#616161]">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FFEBEE] text-[#D32F2F]">
            <LuShieldCheck className="text-base" />
          </div>
          <p className="m-0 leading-5">Secure staff access.</p>
        </div>

        <Form.Item>
          <Button
            className="h-11 w-full border-0 bg-[#D32F2F] text-sm font-semibold hover:!bg-[#B71C1C]"
            type="primary"
            htmlType="submit"
            disabled={loginMutation.isPending}
          >
            {isSpinning ? <Spin size="small" /> : "Sign In"}
          </Button>
        </Form.Item>
      </Form>

      <p className="text-center text-sm text-[#6B7280]">
        Forgot your password?{" "}
        <Link
          to="/forgot-password"
          className="font-bold text-[#B71C1C] transition-colors hover:text-[#D32F2F]"
        >
          Reset it
        </Link>
      </p>
      <ToastContainer />
    </AuthLayout>
  );
};

export default Login;