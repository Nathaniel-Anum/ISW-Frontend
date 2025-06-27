import React, { useEffect, useState } from "react";
import { FilterOutlined } from "@ant-design/icons";
import { Button, DatePicker, Form, Modal, Select, Spin, Table } from "antd";
import api from "../utils/config";
import * as XLSX from "xlsx";
import { useQuery } from "@tanstack/react-query";

const InvOfficerReport = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [form] = Form.useForm();
  const [departments, setDepartments] = useState([]);
  const [units, setUnits] = useState([]);

  const { data } = useQuery({
    queryKey: ["department"],
    queryFn: () => {
      return api.get("/admin/departments?includeUnits=true");
    },
  });
  const { data: users } = useQuery({
    queryKey: ["user"],
    queryFn: () => {
      return api.get("/inventory/users");
    },
  });

  useEffect(() => {
    api.get("/admin/departments?includeUnits=true").then((res) => {
      setDepartments(res.data);

      // Flatten units across all departments
      const allUnits = res.data
        .flatMap((dept) => dept.units || []) // handle departments with no units
        .filter(
          (unit, index, self) =>
            index === self.findIndex((u) => u.id === unit.id) // remove duplicates
        );

      setUnits(allUnits);
    });
  }, []);

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date.$d).toISOString().split("T")[0]; // 'YYYY-MM-DD'
  };

  const onFinish = async (values) => {
    const {
      reportType,
      status,
      deviceType,
      warrantyPeriod,
      userId,
      unitId,
      departmentId,
    } = values;
    const filters = {
      startDate: values.startDate ? formatDate(values.startDate) : null,
      endDate: values.endDate ? formatDate(values.endDate) : null,
      warrantyPeriod: values.warrantyPeriod || null,
    };
    console.log("Filtering with:", filters);
    console.log(typeof filters.warrantyPeriod);
    const params = new URLSearchParams({ reportType });

    if (status) params.append("status", status);
    if (deviceType) params.append("deviceType", deviceType);
    if (warrantyPeriod) params.append("warrantyPeriod", warrantyPeriod);
    if (userId) params.append("userId", userId);
    if (departmentId) params.append("departmentId", departmentId);
    if (unitId) params.append("unitId", unitId);

    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    try {
      const response = await api.get(`/inventory/reports?${params.toString()}`);
      setSelectedReport(reportType);
      setReportData(response.data); //This will feed the table
      setOpen(false);
      form.resetFields();
    } catch (err) {
      console.error(err);
      setOpen(false);
      form.resetFields();
    }
  };
  const getColumns = () => {
    if (selectedReport === "inventory") {
      return [
        {
          title: "User Name",
          dataIndex: "userName",
          key: "userName",
        },
        {
          title: "User Email",
          dataIndex: "userEmail",
          key: "userEmail",
        },
        {
          title: "Department",
          dataIndex: "departmentName",
          key: "departmentName",
        },
        {
          title: "Unit Name",
          dataIndex: "unitName",
          key: "unitName",
        },
        {
          title: "Device Type",
          dataIndex: "deviceType",
          key: "deviceType",
        },
        { title: "Brand", dataIndex: "brand", key: "brand" },
        { title: "Model", dataIndex: "model", key: "model" },

        {
          title: "Serial Number",
          dataIndex: "serialNumber",
          key: "serialNumber",
        },
        {
          title: "Status",
          dataIndex: "status",
          key: "status",
        },

        {
          title: "Warranty Period",
          dataIndex: "warrantyPeriod",
          key: "warrantyPeriod",
        },

        {
          title: "Purchase Date",
          dataIndex: "purchaseDate",
          key: "purchaseDate",
          render: (date) => new Date(date).toLocaleDateString(),
        },
      ];
    }
  };

  const downloadExcel = () => {
    if (!reportData?.data?.length) return;

    let cleanData = [];

    if (selectedReport === "maintenance_tickets") {
      cleanData = reportData?.data.map((item, index) => ({
        No: index + 1,
        Item: item?.itItem?.model || "-",
        Supplier: item?.supplier?.name || "-",
        QuantityReceived: item?.quantityReceived || 0,
        DateReceived: item?.dateReceived
          ? new Date(item.dateReceived).toLocaleDateString()
          : "-",
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(cleanData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

    XLSX.writeFile(workbook, `${selectedReport || "report"}.xlsx`);
  };
  return (
    <div className="px-[3rem] py-[2rem]">
      <div className=" flex gap-2 justify-end">
        <Button
          // disabled={!reportData?.data?.length}
          icon={<FilterOutlined />}
          onClick={() => setOpen(true)}
        >
          Filter
        </Button>
        <Button
          type="primary"
          onClick={downloadExcel}
          disabled={!reportData?.data?.length}
        >
          Download
        </Button>
      </div>
      <div className="pl-[6rem] pt-6">
        {loading ? (
          <div className="flex justify-center items-center h-[300px]">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={getColumns()}
            dataSource={reportData?.data || []}
            rowKey={(record) => record.id || record.key}
          />
        )}
      </div>
      <Modal
        title="Filter"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
      >
        {" "}
        <div className="max-h-[39rem] overflow-y-auto pr-2 no-scrollbar">
          <Form form={form} onFinish={onFinish} layout="vertical">
            <Form.Item
              name="reportType"
              label="Report Type"
              rules={[{ required: true, message: "Select report type" }]}
            >
              <Select placeholder="Filter by" style={{ width: "100%" }}>
                <Option value="inventory">Inventory</Option>
              </Select>
            </Form.Item>

            <Form.Item label="Start Date" name="startDate">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item label="End Date" name="endDate">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Status" name="status">
              <Select placeholder="Status" allowClear style={{ width: "100%" }}>
                <Select.Option value="ACTIVE">ACTIVE</Select.Option>
                <Select.Option value="INACTIVE">INACTIVE</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Warranty Period" name="warrantyPeriod">
              <Select
                placeholder="Warranty Period"
                allowClear
                style={{ width: "100%" }}
              >
                <Select.Option value={12}>12</Select.Option>
                <Select.Option value={36}>36</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item label="Device Type" name="deviceType">
              <Select
                placeholder="Device Type"
                allowClear
                style={{ width: "100%" }}
              >
                <Select.Option value="LAPTOP">LAPTOP</Select.Option>
                <Select.Option value="DESKTOP">DESKTOP</Select.Option>
                <Select.Option value="PRINTER">PRINTER</Select.Option>
                <Select.Option value="OTHER">OTHER</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="User" name="userId">
              <Select
                placeholder="Select User"
                allowClear
                style={{ width: "100%" }}
                options={users?.data.map((user) => ({
                  label: user.name,
                  value: user.id,
                }))}
              />
            </Form.Item>
            <Form.Item label="Department" name="departmentId">
              <Select
                placeholder="Select Department"
                options={departments.map((dept) => ({
                  label: dept.name,
                  value: dept.id,
                }))}
                allowClear
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item label="Unit" name="unitId">
              <Select
                placeholder="Select Unit"
                options={units.map((unit) => ({
                  label: unit.name,
                  value: unit.id,
                }))}
                allowClear
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="w-full"
              >
                Submit
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default InvOfficerReport;
