import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { loginWithToken } from "../lib/auth";
import AuthLayout from "./AuthLayout";
import { Spin } from "antd";

const LoginWithToken = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tokenLoginMutation = useMutation({
    mutationFn: (token) => loginWithToken(token),
    onSuccess: () => {
      const mustResetPassword =
        localStorage.getItem("mustResetPassword") === "true";
      navigate(mustResetPassword ? "/reset-password" : "/dashboard");
    },
    onError: (err) => {
      console.error("Token login failed:", err);
      toast.error("Token login failed. Redirecting to login...");
      setTimeout(() => navigate("/"), 2000); // Delay to show toast
    },
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get("token");
    if (token) {
      tokenLoginMutation.mutate(token);
    } else {
      toast.error("No token provided. Redirecting to login...");
      setTimeout(() => navigate("/"), 2000);
    }
  }, [location.search, navigate]);

  return (
    <AuthLayout title="Processing Login with Link">
      <div className="text-center">
        <Spin spinning={tokenLoginMutation.isPending} tip="Logging in..." />
        {!tokenLoginMutation.isPending && <p>Processing login...</p>}
      </div>
      <ToastContainer />
    </AuthLayout>
  );
};

export default LoginWithToken;
