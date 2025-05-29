import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
  DownloadOutlined,
  FilterOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import api from "../utils/config";
import {
  Table,
  Form,
  Input,
  Button,
  Modal,
  DatePicker,
  Select,
  InputNumber,
} from "antd";
import * as XLSX from "xlsx";

const TotalAssets = () => {
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
const [filteredTickets, setFilteredTickets] = useState(null)
  const { data } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => {
      return api.get("reports/inventory/device-age");
    },
  });
  //   console.log(data?.data?.assets);

  const tickets = filteredTickets || data?.data?.assets || [];

  const { data: department } = useQuery({
    queryKey: ["department"],
    queryFn: () => {
      return api.get("admin/departments?includeUnits=true");
    },
  });

  const { data: itItems } = useQuery({
    queryKey: ["itItems"],
    queryFn: () => {
      return api.get("stores/it-items");
    },
  });
  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => {
      return api.get("stores/suppliers");
    },
  });
 

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date.$d).toISOString().split("T")[0]; // 'YYYY-MM-DD'
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
      title: "Warranty Expiry",
      dataIndex: "warrantyExpiry",
      key: "warrantyExpiry",
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
    {
      title: "Days to Warranty Expiry",
      dataIndex: "daysToWarrantyExpiry",
      key: "daysToWarrantyExpiry",
      render: (days) => Math.round(days),
    },
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
    // {
    //   title: "Age (Years)",
    //   dataIndex: "ageYears",
    //   key: "ageYears",
    //   render: (age) => age.toFixed(2),
    // },
  ];

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
      WarrantyExpiry: item.warrantyExpiry
        ? new Date(item.warrantyExpiry).toLocaleDateString()
        : "-",
      WarrantyMonths: item.warrantyPeriodMonths,
      Status: item.status,
      SupplierName: item.supplierName,
      LPOReference: item.lpoReference,
      ExpiryDays: item.daysToWarrantyExpiry
        ? Math.round(item.daysToWarrantyExpiry)
        : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(cleanData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Total Assets");

    XLSX.writeFile(workbook, "TotalAssets.xlsx");
  };

  const handleFinish = (values) => {
    //This is formatting the date to YYYY-MM-DD
    const filters = {
      startPurchaseDate: values.startPurchaseDate
        ? formatDate(values.startPurchaseDate)
        : null,
      endPurchaseDate: values.endPurchaseDate
        ? formatDate(values.endPurchaseDate)
        : null,
      minAgeYears: values.minAgeYears || null,
      maxAgeYears: values.maxAgeYears || null,
      warrantyPeriodMonths: values.warrantyPeriodMonths || null,
      department: values.department || null,
      unit: values.unit || null,
      active: values.active || null,
      brand: values.brand || null,
      deviceType: values.deviceType || null,
      lpoReference: values.lpoReference || null,
      supplier: values.supplier || null,
    };
    console.log("Filtering with:", filters);

    const params = new URLSearchParams();

    if (filters.startPurchaseDate)
      params.append("startPurchaseDate", filters.startPurchaseDate);
    if (filters.endPurchaseDate)
      params.append("endPurchaseDate", filters.endPurchaseDate);
    if (filters.minAgeYears) params.append("minAgeYears", filters.minAgeYears);
    if (values.maxAgeYears) params.append("maxAgeYears", values.maxAgeYears);
    if (values.warrantyPeriodMonths)
      params.append("warrantyPeriodMonths", values.warrantyPeriodMonths);
    if (values.department) params.append("departmentId", values.department);
    if (values.unit) params.append("unitId", values.unit);
    if (values.status) params.append("status", values.status);
    if (values.brand) params.append("brand", values.brand);
    if (values.deviceType) params.append("deviceType", values.deviceType);
    if (values.lpoReference) params.append("lpoReference", values.lpoReference);
    if (values.supplier) params.append("supplierId", values.supplier);

    const url = `http://localhost:3000/reports/inventory/device-age?${params.toString()}`;
    // console.log("Fetching from:", url);

    api
      .get(url)
      .then((res) => {
        console.log("Filtered data:", res.data);
        setFilteredTickets(res.data.assets);
      })
      .catch((err) => {
        console.error("Error fetching filtered data:", err);
      });

    setOpen(false);
    form.resetFields();
  };

  return (
    <div className="py-[2rem]">
      <div className="flex justify-end items-center gap-2 pr-[9rem] mb-4">
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
      <div className="flex justify-center px-[8.9rem]">
        <Table dataSource={tickets} columns={columns} />
        <Modal
          open={open}
          title="Filter"
          onCancel={handleCancel}
          footer={null}
          width={600}
        >
          <div className="max-h-[80vh] overflow-y-auto p-6  no-scrollbar">
            <Form form={form} layout="vertical" onFinish={handleFinish}>
              <Form.Item label="Start Purchase Date" name="startPurchaseDate">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>

              <Form.Item label="End Purchase Date" name="endPurchaseDate">
                <DatePicker style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item label="Minimum Age Years" name="minAgeYears">
                <InputNumber
                  min={1}
                  placeholder="Enter min age year"
                  style={{ width: "100%" }}
                />
              </Form.Item>
              <Form.Item label="Maximum Age Years" name="maxAgeYears">
                <InputNumber
                  min={1}
                  placeholder="Enter maximum age year"
                  style={{ width: "100%" }}
                />
              </Form.Item>
              <Form.Item
                label="Warranty Period (Months)"
                name="warrantyPeriodMonths"
              >
                <InputNumber
                  min={1}
                  placeholder="Enter warranty months"
                  style={{ width: "100%" }}
                />
              </Form.Item>
              <Form.Item name="supplier" label="Select Supplier">
                <Select placeholder="Choose a supplier">
                  {suppliers?.data.map((supplier) => (
                    <Option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="LPO Reference" name="lpoReference">
                <Input
                  placeholder="Enter lpo Reference"
                  style={{ width: "100%" }}
                />
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
              <Form.Item label="Brand" name="brand">
                <Select placeholder="Select a brand">
                  {itItems?.data?.map((item) => (
                    <Select.Option key={item.id} value={item.brand}>
                      {item.brand}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="Device Type" name="deviceType">
                <Select placeholder="Select a device type">
                  {itItems?.data?.map((item) => (
                    <Select.Option key={item.id} value={item.deviceType}>
                      {item.deviceType}
                    </Select.Option>
                  ))}
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

export default TotalAssets;
