import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect } from "react";
import api from "../utils/config";
import { Button, Form, Input, Modal, Select, Switch, Table } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { useState } from "react";
import { toast } from "react-toastify";

const InvOfficer = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeForm, setActiveForm] = useState("user");
  const [selectedRecord, setSelectedRecord] = useState(null);

  const queryClient = useQueryClient();

  const [form] = Form.useForm();
  const { data } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => api.get("/inventory/all"),
  });
  console.log(data?.data);
  const showModal = (record) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  const column = [
    {
      title: "User",
      dataIndex: ["user", "name"],
      key: "user",
    },
    {
      title: "Brand",
      dataIndex: ["itItem", "brand"],
      key: "item",
    },
    {
      title: "Item",
      dataIndex: ["itItem", "model"],
      key: "item",
    },
    {
      title: "Device Type",
      dataIndex: ["itItem", "deviceType"],
      key: "deviceType",
    },
    {
      title: "Department",
      dataIndex: ["department", "name"],
      key: "department",
    },
    {
      title: "Warranty Period",
      dataIndex: "warrantyPeriod",
      key: "warrantyPeriod",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
    },

    {
      title: "Purchase Date",
      dataIndex: "purchaseDate",
      key: "purchaseDate",
      render: (purchaseDate) =>
        new Date(purchaseDate).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) =>
        new Date(createdAt).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <EyeOutlined
          onClick={() => showModal(record)}
          className="text-blue-600 text-xl hover:text-blue-800 cursor-pointer"
        />
      ),
    },
  ];
  useEffect(() => {
    if (selectedRecord) {
      form.setFieldsValue({
        name: selectedRecord?.user?.name || "",
        department: selectedRecord?.department?.name || "",
        unit: selectedRecord?.unitId || "",
        status: selectedRecord?.status || "",
        remarks: selectedRecord?.remarks || "",
        deviceType: selectedRecord?.itItem?.deviceType || "",
        laptopBrand: selectedRecord?.itItem?.brand || "",
        laptopModel: selectedRecord?.itItem?.model || "",
      });
    }
  }, [selectedRecord, form]);

  //User mutate
  const { mutate } = useMutation({
    mutationKey: ["updateInventory"],
    mutationFn: (payload) =>
      api.patch(`/inventory/update/${selectedRecord?.id}`, payload),
    onSuccess: () => {
      handleCancel();
      form.resetFields();
      toast.success("updated successfully!");
      queryClient.invalidateQueries(["inventory"]);
    },
  });

  //Device mutate
  const { mutate: deviceMutate } = useMutation({
    mutationKey: ["updateDevice"],
    mutationFn: (payload) =>
      api.patch(
        `/inventory/update/${selectedRecord?.id}/device-details`,
        payload
      ),
    onSuccess: () => {
      handleCancel();
      form.resetFields();
      toast.success("Device details updated");
      queryClient.invalidateQueries(["inventory"]);
    },
  });

  function handleSubmit(values) {
    console.log(values);
    const payload = {
      name: values.name,
      department: values.department,
      unitId: values.unit,
      status: values.status,
      remarks: values.remarks,
    };

    mutate(payload);
  }

  function handleForm(values) {
    console.log(values);
    const payload = {
      deviceType: values.deviceType,
      laptopBrand: values.laptopBrand,
      laptopModel: values.laptopModel,
      laptopSerialNumber: values.laptopSerialNumber,
      laptopMacAddress: values.laptopMacAddress,
      laptopProcessorType: values.laptopProcessorType,
      laptopMemorySize: values.laptopMemorySize,
      laptopStorageDriveType: values.laptopStorageDriveType,
      laptopStorageDriveSize: values.laptopStorageDriveSize,
      laptopOperatingSystem: values.laptopOperatingSystem,
      laptopEndpointSecurity: values.laptopEndpointSecurity,
      laptopSpiceworksMonitoring: values.laptopSpiceworksMonitoring,
    };
    deviceMutate(payload);
  }
  return (
    <div className="pt-6">
      <div className="flex justify-center items-center pl-[5.2rem]">
        <Table columns={column} dataSource={data?.data || []} />
        <Modal
          open={isModalOpen}
          onCancel={handleCancel}
          footer={null}
          title="Edit"
        >
          <div className="flex justify-center gap-4 mb-4">
            <Button
              type={activeForm === "user" ? "primary" : "default"}
              onClick={() => setActiveForm("user")}
            >
              User
            </Button>
            <Button
              type={activeForm === "device" ? "primary" : "default"}
              onClick={() => setActiveForm("device")}
            >
              Device
            </Button>
          </div>

          {activeForm === "user" ? (
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item name="name" label="Name">
                <Input />
              </Form.Item>

              <Form.Item name="department" label="Department">
                <Input />
              </Form.Item>

              <Form.Item name="unit" label="Unit">
                <Input disabled />
              </Form.Item>

              <Form.Item name="status" label="Status">
                <Select>
                  <Select.Option value="ACTIVE">Active</Select.Option>
                  <Select.Option value="INACTIVE">Inactive</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item name="remarks" label="Remarks">
                <Input.TextArea />
              </Form.Item>

              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </Form>
          ) : (
            <Form form={form} layout="vertical" onFinish={handleForm}>
              <Form.Item name="deviceType" label="Device Type">
                <Input />
              </Form.Item>
              <Form.Item name="laptopBrand" label="Brand">
                <Input />
              </Form.Item>
              <Form.Item name="laptopModel" label="Model">
                <Input />
              </Form.Item>
              <Form.Item name="laptopSerialNumber" label="Serial Number">
                <Input />
              </Form.Item>
              <Form.Item name="laptopMacAddress" label="MAC Address">
                <Input />
              </Form.Item>
              <Form.Item name="laptopProcessorType" label="Processor">
                <Input />
              </Form.Item>
              <Form.Item name="laptopMemorySize" label="Memory Size">
                <Input />
              </Form.Item>
              <Form.Item name="laptopStorageDriveType" label="Drive Type">
                <Input />
              </Form.Item>
              <Form.Item name="laptopStorageDriveSize" label="Drive Size">
                <Input />
              </Form.Item>
              <Form.Item name="laptopOperatingSystem" label="OS">
                <Input />
              </Form.Item>
              <Form.Item
                name="laptopEndpointSecurity"
                label="Endpoint Security"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Form.Item
                name="laptopSpiceworksMonitoring"
                label="Spiceworks Monitoring"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Button type="primary" htmlType="submit">
                Submit Device Info
              </Button>
            </Form>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default InvOfficer;
