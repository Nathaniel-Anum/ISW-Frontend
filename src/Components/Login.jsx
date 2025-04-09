import React from "react";
import { Button, Form, Input } from "antd";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../utils/config";

import { useNavigate } from "react-router-dom";

const Login = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleSubmit = (values) => {
    console.log(values);
    api
      .post("/auth/login", values)
      .then((res) => {
        console.log(res.data);
        const { access_token } = res.data;
        if (access_token) {
          localStorage.setItem("access_token", access_token);
          console.log("Token successfully set!");
          navigate("/dashboard");
        }
      })
      .catch((error) => {
        console.log(error.response.data?.message);
        toast.error(error.response.data?.message);
      });
  };

  return (
    <div className="h-screen px-[18rem] grid lg:grid-cols-2 md:grid-cols-1  py-[7rem] w-screen gap-[150px]  bg-[#E3E5E6]">
      <div className="flex flex-col justify-end h-[82%] gap-[20px]">
        <div className="">
          <img
            className="w-[620px] h-auto object-contain "
            src="/src/assets/undraw_term-sheet_70lo.svg"
            alt=""
          />
        </div>
      </div>
      <div className="bg-[#fff] text-black p-[15px] rounded-[10px] py-[50px] ">
        <div>
          <p className="text-center font-semibold">WELCOME TO </p>
        </div>
        <div>
          <div className="flex items-center">
            <img
              className="w-[70px] h-auto"
              src="/src/assets/logo.9a18109e1c16584832d5.png"
              alt=""
            />
            <div className="h-[20px] w-[2px] bg-[#6C63FF] mr-2"></div>
            <div>
              <p className="font-bold">Ghana Cocoa Board</p>
              <p className="text-[9px] font-semibold">
                Poised to Maintain Premium Quality Cocoa
              </p>
            </div>
          </div>
        </div>
        <div>
          <p className="text-[14px] text-center pb-[15px] font-semibold">
            Login to Proceed to your Dashboard
          </p>
        </div>
        <Form
          form={form}
          className=""
          name="login"
          onFinish={(values) => handleSubmit(values)}
        >
          <Form.Item
            name="staffId"
            rules={[
              {
                required: true,
                message: "Please input your staffID!",
              },
            ]}
          >
            <Input placeholder="Email" allowClear />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              {
                required: true,
                message: "Please input your password!",
              },
            ]}
          >
            <Input.Password placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button
              className="w-full bg-[#9D4D01]"
              type="primary"
              htmlType="submit"
            >
              Login
            </Button>
          </Form.Item>
        </Form>
        <div className="text-center">
          <button className="font-semibold">Forgot Password?</button>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default Login;
