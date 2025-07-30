import React, { useEffect, useState } from "react";
import { Button, Form, Input, message, Spin } from "antd";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom"; //the change
import { useMutation } from "@tanstack/react-query"; //the change
import { login } from "../lib/auth";
import AuthLayout from "./AuthLayout";

const Login = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [isSpinning, setIsSpinning] = useState(false);

  const loginMutation = useMutation({
    mutationFn: ({ staffId, password }) => login(staffId, password),
    onSuccess: () => {
      const mustResetPassword =
        localStorage.getItem("mustResetPassword") === "true";
      navigate(mustResetPassword ? "/reset-password" : "/dashboard");
    },
    onError: (err) => {
      console.error("Login failed:", err);
      toast.error(err.response.data.message || "Login failed");
      setIsSpinning(false);
    },
  });

  useEffect(() => {
    let timer;
    if (loginMutation.isPending) {
      setIsSpinning(true);
      timer = setTimeout(() => {
        setIsSpinning(false);
      }, 4000); // 4 seconds
    }
    return () => clearTimeout(timer);
  }, [loginMutation.isPending]);

  const onFinish = (values) => {
    loginMutation.mutate(values);
  };

  return (
    <AuthLayout title="Login to Proceed to your Dashboard">
      <Form form={form} name="login" onFinish={onFinish}>
        <Form.Item
          name="staffId"
          rules={[{ required: true, message: "Please input your staff ID!" }]}
        >
          <Input placeholder="Staff ID" allowClear />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: "Please input your password!" }]}
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
            {isSpinning ? (
              <Spin size="small" className="text-black" />
            ) : (
              "Login"
            )}
          </Button>
        </Form.Item>
      </Form>
      <p className="text-center ">
        <a href="/forgot-password" className="font-semibold text-[#6C63FF]">
          Forgot Password?
        </a>
      </p>
      <ToastContainer />
    </AuthLayout>
  );
};

export default Login;
