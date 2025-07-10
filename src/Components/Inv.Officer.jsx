import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect } from "react";
import api from "../utils/config";
import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Switch,
  Table,
  Tabs,
  Tag,
} from "antd";
import { EyeOutlined, SearchOutlined } from "@ant-design/icons";
import { useState } from "react";
import { toast } from "react-toastify";

const InvOfficer = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeForm, setActiveForm] = useState("user");
  const [selectedRecord, setSelectedRecord] = useState(null);

  const queryClient = useQueryClient();

  const [form] = Form.useForm();

  //useQuery for inventory
  //get all inventory
  const { data } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => api.get("/inventory/all"),
  });
  // console.log(data?.data);

  //useQuery for users
  const { data: invuser } = useQuery({
    queryKey: ["invuser"],
    queryFn: () => api.get("/inventory/users"),
  });
  // console.log(invuser?.data);

  // get device fields
  const { data: deviceFieldsData, isLoading: isDeviceFieldsLoading } = useQuery(
    {
      queryKey: ["deviceFields"],
      queryFn: () => api.get("inventory/device-fields"),
    }
  );
  // console.log(deviceFieldsData);

  const DEVICE_FIELDS = deviceFieldsData?.data || {};

  const showModal = (record) => {
    setSelectedRecord(record);
    // console.log(record);
    setIsModalOpen(true);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  const tabItems = [
    {
      key: "user",
      label: "Main",
    },
    {
      key: "device",
      label: "Device Details",
    },
  ];
  const column = [
    {
      title: "User",
      dataIndex: ["user", "name"],
      key: "user",
        filteredValue: [searchText],
        onFilter: (value, record) => {
          return (
            record.user.name.toLowerCase().includes(value.toLowerCase()) ||
           
            record.status.toLowerCase().includes(value.toLowerCase()) ||
            record.department.name
              .toLowerCase()
              .includes(value.toLowerCase()) ||
            record.itItem.brand.toLowerCase().includes(value.toLowerCase()) ||
            record.itItem.model.toLowerCase().includes(value.toLowerCase()) ||
            record.itItem.deviceType.toLowerCase().includes(value.toLowerCase()) ||
            record.unit.name.toLowerCase().includes(value.toLowerCase()
          )
        )
        }
    },
    {
      title: "Brand",
      dataIndex: ["itItem", "brand"],
      key: "item",
    },
    {
      title: "Model",
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
      title: "Dpt Location ",
      dataIndex: "departmentLocation",
      render: (text) => text || "N/A",
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
      render: (status) => (
        <Tag
          color={
            status === "INACTIVE" || status === "DISPOSED"
              ? "red"
              : status === "OBSOLETE" || status === "NON_FUNCTIONAL"
              ? "orange"
              : "green"
          }
        >
          {status.replaceAll("_", " ")}
        </Tag>
      ),
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
    if (selectedRecord && DEVICE_FIELDS) {
      const deviceType = selectedRecord?.itItem?.deviceType || "LAPTOP";
      const fields = DEVICE_FIELDS[deviceType] || DEVICE_FIELDS.LAPTOP;
      const formValues = {
        userId: selectedRecord?.user?.userId || "",
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

    onError: (error) => {
      console.error("Error updating inventory:", error);
      toast.error("Failed to update inventory");
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

    // console.log(payload);
    mutate(payload);
  }

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
    <div className="px-[3rem] py-[2rem]">
      <div className="flex justify-end ">
        <Input
          placeholder="Search..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<SearchOutlined />}
          style={{ width: "200px" }}
        />
      </div>
      <div className="pl-[6rem] pt-2">
        <Table columns={column} dataSource={data?.data || []} />
        <Modal
          open={isModalOpen}
          onCancel={handleCancel}
          footer={null}
          title="Edit"
        >
          <Tabs
            activeKey={activeForm}
            onChange={(key) => setActiveForm(key)}
            items={tabItems}
          />

          {activeForm === "user" ? (
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item name="userId" label="Name">
                <Select
                  placeholder="Select a user"
                  onChange={(value) => {
                    const selectedUser = invuser?.data?.find(
                      (u) => u.id === value
                    );
                    console.log(selectedUser);
                    if (selectedUser) {
                      form.setFieldsValue({
                        department: selectedUser.department?.name || "",
                        unitId: selectedUser.unit?.name || "",
                        departmentId: selectedUser.departmentId,
                        unitIdHidden: selectedUser.unitId, //this has to go to the backend
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

              <Form.Item name="unit" label="Unit">
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
                  <Select.Option value="NON_FUNCTIONAL">
                    Non Functional
                  </Select.Option>
                  <Select.Option value="OBSOLETE">Obsolete</Select.Option>
                  <Select.Option value="DISPOSED">Disposed</Select.Option>
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
