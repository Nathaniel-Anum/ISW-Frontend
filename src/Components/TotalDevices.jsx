import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DownloadOutlined,
  FilterOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import api from "../utils/config";
import { Button, Form, Input, Modal, Select, Table } from "antd";
import * as XLSX from "xlsx";
const TotalDevices = () => {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();

  //get all device details
  const { data, isLoading } = useQuery({
    queryKey: ["deviceDetails"],
    queryFn: () => {
      return api.get("reports/inventory/device-details");
    },
  });

  const tickets = data?.data?.assets || [];

  //get all itItems
  const { data: itItems } = useQuery({
    queryKey: ["itItems"],
    queryFn: () => {
      return api.get("stores/it-items");
    },
  });

  //get all departments with units

  const { data: department } = useQuery({
    queryKey: ["department"],
    queryFn: () => {
      return api.get("admin/departments?includeUnits=true");
    },
  });

  const handleCancel = () => {
    setOpen(false);
    form.resetFields();
  };

  const handleDownload = () => {
    const tickets = data?.data?.assets;

    const cleanData = tickets.map((item, index) => ({
      No: index + 1,
      TicketID: item.assetId,
      User: item.userName,
      DeviceType: item.deviceType,
      SerialNumber: item.deviceDetails.serialNumber,
      Brand: item.brand,
      Model: item.model,
      Department: item.departmentName,
      Unit: item.unitName,
      PurchaseDate: item.purchaseDate
        ? new Date(item.purchaseDate).toLocaleDateString()
        : "-",

      WarrantyMonths: item.warrantyPeriodMonths,
      Status: item.status,
      SupplierName: item.supplierName,
      LPOReference: item.lpoReference,
    }));

    const worksheet = XLSX.utils.json_to_sheet(cleanData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Total Assets");

    XLSX.writeFile(workbook, "TotalDevices.xlsx");
  };

  const columns = [
    {
      title: "No.",
      key: "index",
      render: (text, record, index) => index + 1,
    },
    {
      title: "Brand",
      dataIndex: "brand",
      key: "brand",
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
    },
    {
      title: "Device Type",
      dataIndex: "deviceType",
      key: "deviceType",
    },
    {
      title: "Serial Number",
      dataIndex: ["deviceDetails", "serialNumber"],
      key: "serialNumber",
    },
    {
      title: "Department",
      dataIndex: "departmentName",
      key: "departmentName",
    },
    {
      title: "Unit",
      dataIndex: "unitName",
      key: "unitName",
    },
    {
      title: "User",
      dataIndex: "userName",
      key: "userName",
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return (
          record.userName.toLowerCase().includes(searchText.toLowerCase()) ||
          record.brand.toLowerCase().includes(searchText.toLowerCase()) ||
          record.model.toLowerCase().includes(searchText.toLowerCase()) ||
          record.deviceType.toLowerCase().includes(searchText.toLowerCase()) ||
          record.deviceDetails.serialNumber
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          record.departmentName.toLowerCase().includes(searchText.toLowerCase())
        );
      },
    },
    {
      title: "Purchase Date",
      dataIndex: "purchaseDate",
      key: "purchaseDate",
      render: (value) =>
        value
          ? new Date(value).toLocaleString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })
          : "-",
    },

    {
      title: "Warranty (Months)",
      dataIndex: "warrantyPeriodMonths",
      key: "warrantyPeriodMonths",
    },
    // {
    //   title: "Days to Warranty Expiry",
    //   dataIndex: "daysToWarrantyExpiry",
    //   key: "daysToWarrantyExpiry",
    //   render: (days) => Math.round(days),
    // },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "LPO Reference",
      dataIndex: "lpoReference",
      key: "lpoReference",
    },
    {
      title: "Supplier",
      dataIndex: "supplierName",
      key: "supplierName",
    },
  ];
  return (
    <div className="py-[2rem]">
      <div className="flex justify-end items-center gap-2 pr-[18rem] mb-4">
        <Input
          placeholder="Search..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<SearchOutlined />}
          style={{ width: "200px" }}
        />
        <Button icon={<FilterOutlined />} onClick={() => setOpen(true)} />
        <Button icon={<DownloadOutlined />} onClick={handleDownload} />
      </div>
      <div className="flex items-center justify-center">
        <Table dataSource={tickets} columns={columns} />
        <Modal title="Filter" open={open} onCancel={handleCancel} footer={null}>
          <div className="max-h-[75vh] overflow-y-auto p-6  no-scrollbar">
            <Form
              form={form}
              layout="vertical"
              onFinish={(values) => console.log(values)}
            >
              <Form.Item label="Device Type" name="deviceType">
                <Select placeholder="Select a device type">
                  {itItems?.data?.map((item) => (
                    <Select.Option key={item.id} value={item.deviceType}>
                      {item.deviceType}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="Brand" name="brand">
                <Select placeholder="Select a brand">
                  {itItems?.data?.map((item) => (
                    <Select.Option key={item.id} value={item.brand}>
                      {item.brand}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="Model" name="model">
                <Select placeholder="Select a model">
                  {itItems?.data?.map((item) => (
                    <Select.Option key={item.id} value={item.model}>
                      {item.model}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="Serial Number" name="serialNumber">
                <Select placeholder="Select a brand">
                  {tickets?.map((item) => (
                    <Select.Option
                      key={item.id}
                      value={item.deviceDetails.serialNumber}
                    >
                      {item.deviceDetails.serialNumber}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="Toner Number" name="tonerNumber">
                <Select placeholder="Select a toner">
                  {tickets?.map((item) => (
                    <Select.Option
                      key={item.id}
                      value={item.deviceDetails.tonerNumber}
                    >
                      {item.deviceDetails.tonerNumber}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="Processor Type" name="processorType">
                <Select placeholder="Select a brand">
                  {tickets?.map((item) => (
                    <Select.Option
                      key={item.id}
                      value={item.deviceDetails.processorType}
                    >
                      {item.deviceDetails.processorType}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="department" label="Select Department">
                <Select placeholder="Choose a department">
                  {department?.data.map((dept) => (
                    <Option key={dept.id} value={dept.id}>
                      {dept.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item name="unit" label="Select Unit">
                <Select placeholder="Select a unit">
                  {department?.data?.flatMap((dept) =>
                    dept.units?.map((unit) => (
                      <Select.Option key={unit.id} value={unit.id}>
                        {unit.name}
                      </Select.Option>
                    ))
                  )}
                </Select>
              </Form.Item>
              <Form.Item label="Status" name="status">
                <Select placeholder="Select status ">
                  <Option value="ACTIVE">ACTIVE</Option>
                  <Option value="INACTIVE">INACTIVE</Option>
                  <Option value="OBSOLETE">OBSOLETE</Option>
                  <Option value="DISPOSED">DISPOSED</Option>
                  <Option value="NON_FUNCTIONAL">NON_FUNCTIONAL</Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" className="w-full">
                  Submit
                </Button>
              </Form.Item>
            </Form>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default TotalDevices;
