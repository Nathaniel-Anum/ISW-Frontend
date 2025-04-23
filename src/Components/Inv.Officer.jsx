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

  //useQuery for users
  const { data: invuser } = useQuery({
    queryKey: ["invuser"],
    queryFn: () => api.get("/inventory/users"),
  });
  console.log(invuser?.data);

  // get device fields
  const { data: deviceFieldsData, isLoading: isDeviceFieldsLoading } = useQuery(
    {
      queryKey: ["deviceFields"],
      queryFn: () => api.get("inventory/device-fields"),
    }
  );
  console.log(deviceFieldsData);

  const DEVICE_FIELDS = deviceFieldsData?.data || {};

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
  //   useEffect(() => {
  //     if (selectedRecord) {
  //       form.setFieldsValue({
  //         userId: selectedRecord?.user?.name || "",
  //         department: selectedRecord?.department?.name || "",
  //         unit: selectedRecord?.unit?.name || "",
  //         status: selectedRecord?.status || "",
  //         remarks: selectedRecord?.remarks || "",
  //         deviceType: selectedRecord?.itItem?.deviceType || "",
  //         laptopBrand: selectedRecord?.itItem?.brand || "",
  //         laptopModel: selectedRecord?.itItem?.model || "",
  //       });
  //     }
  //   }, [selectedRecord, form]);

  useEffect(() => {
    if (selectedRecord && DEVICE_FIELDS) {
      const deviceType = selectedRecord?.itItem?.deviceType || "LAPTOP";
      const fields = DEVICE_FIELDS[deviceType] || DEVICE_FIELDS.LAPTOP;
      const formValues = {
        userId: selectedRecord?.user?.name || "",
        department: selectedRecord?.department?.name || "",
        unit: selectedRecord?.unit?.name || "",
        status: selectedRecord?.status || "",
        remarks: selectedRecord?.remarks || "",
        deviceType: deviceType,
      };
      // Map device-specific fields
      fields.forEach((field) => {
        if (field.name.endsWith("Brand")) {
          formValues[field.name] = selectedRecord?.itItem?.brand || "";
        } else if (field.name.endsWith("Model")) {
          formValues[field.name] = selectedRecord?.itItem?.model || "";
        } else {
          formValues[field.name] = selectedRecord?.itItem?.[field.name] || "";
        }
      });
      form.setFieldsValue(formValues);
    }
  }, [selectedRecord, form, DEVICE_FIELDS]);

  //Main edit mutate
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
      userId: values.userId,
      departmentId: values.departmentId,
      unitId: values.unitIdHidden,
      status: values.status,
      remarks: values.remarks,
    };

    mutate(payload);
  }

  //   function handleForm(values) {
  //     console.log(values);
  //     const payload = {
  //       deviceType: values.deviceType,
  //       laptopBrand: values.laptopBrand,
  //       laptopModel: values.laptopModel,
  //       laptopSerialNumber: values.laptopSerialNumber,
  //       laptopMacAddress: values.laptopMacAddress,
  //       laptopProcessorType: values.laptopProcessorType,
  //       laptopMemorySize: values.laptopMemorySize,
  //       laptopStorageDriveType: values.laptopStorageDriveType,
  //       laptopStorageDriveSize: values.laptopStorageDriveSize,
  //       laptopOperatingSystem: values.laptopOperatingSystem,
  //       laptopEndpointSecurity: values.laptopEndpointSecurity,
  //       laptopSpiceworksMonitoring: values.laptopSpiceworksMonitoring,
  //     };
  //     deviceMutate(payload);
  //   }

  function handleForm(values) {
    const deviceType = selectedRecord?.itItem?.deviceType || "LAPTOP";
    const fields = DEVICE_FIELDS[deviceType] || DEVICE_FIELDS.LAPTOP || [];
    const payload = { deviceType };
    fields.forEach((field) => {
      payload[field.name] = values[field.name];
    });
    deviceMutate(payload);
  }
  if (isDeviceFieldsLoading) {
    return <div>Loading device fields...</div>;
  }
  return (
    <div className="pt-6">
      <div className="flex justify-center items-center pl-[5.6rem]">
        <Table columns={column} dataSource={data?.data || []} />
        <Modal
          open={isModalOpen}
          onCancel={handleCancel}
          footer={null}
          bodyStyle={{ maxHeight: "65vh", overflowY: "auto" }}
          title="Edit"
        >
          <div className="flex justify-center gap-4 mb-4">
            <Button
              type={activeForm === "user" ? "primary" : "default"}
              onClick={() => setActiveForm("user")}
            >
              Main
            </Button>
            <Button
              type={activeForm === "device" ? "primary" : "default"}
              onClick={() => setActiveForm("device")}
            >
              Device Details
            </Button>
          </div>

          {activeForm === "user" ? (
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item name="userId" label="Name">
                <Select
                  placeholder="Select a user"
                  onChange={(value) => {
                    const selectedUser = invuser?.data?.find(
                      (u) => u.id === value
                    );

                    if (selectedUser) {
                      form.setFieldsValue({
                        department: selectedUser.department?.name || "",
                        unitId: selectedUser.unit?.name || "",
                        departmentId: selectedUser.departmentId,
                        unitIdHidden: selectedUser.unitId, // needed for backend
                      });
                    }
                  }}
                >
                  {invuser?.data?.map((user) => (
                    <Select.Option key={user.id} value={user.id}>
                      {user.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="department" label="Department">
                <Input disabled />
              </Form.Item>

              <Form.Item name="unitId" label="Unit">
                <Input disabled />
              </Form.Item>

              {/* Hidden fields to store IDs for backend */}
              <Form.Item name="departmentId" hidden>
                <Input />
              </Form.Item>

              <Form.Item name="unitIdHidden" hidden>
                <Input />
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
                <Input disabled />
              </Form.Item>
              {DEVICE_FIELDS[
                selectedRecord?.itItem?.deviceType || "LAPTOP"
              ].map((field) => (
                <Form.Item
                  key={field.name}
                  name={field.name}
                  label={field.label}
                  valuePropName={field.type === "switch" ? "checked" : "value"}
                >
                  {field.type === "switch" ? (
                    <Switch disabled={field.disabled} />
                  ) : (
                    <Input disabled={field.disabled} />
                  )}
                </Form.Item>
              ))}
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
