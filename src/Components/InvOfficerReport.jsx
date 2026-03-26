import React, { useDeferredValue, useMemo, useState } from "react";
import { FilterOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Spin,
  Table,
} from "antd";
import api from "../utils/config";
import * as XLSX from "xlsx";
import { useQuery } from "@tanstack/react-query";

const { Option } = Select;
const DEFAULT_REPORT_FILTERS = { reportType: "inventory" };

const formatColumnTitle = (value) =>
  String(value)
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());

const InvOfficerReport = () => {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [submittedFilters, setSubmittedFilters] = useState(DEFAULT_REPORT_FILTERS);
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const deferredSearch = useDeferredValue(searchText.trim());

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
  const { data: categoriesResponse } = useQuery({
    queryKey: ["itItemCategories"],
    queryFn: () => api.get("/admin/it-item-categories"),
  });

  const departments = data?.data || [];
  const categories = categoriesResponse?.data || [];
  const units = useMemo(
    () =>
      departments
        .flatMap((dept) => dept.units || [])
        .filter((unit, index, self) => index === self.findIndex((item) => item.id === unit.id)),
    [departments]
  );

  const { data: reportResponse, isFetching: reportLoading } = useQuery({
    queryKey: ["inventoryReport", submittedFilters, deferredSearch],
    queryFn: () =>
      api.get("/inventory/reports", {
        params: {
          ...submittedFilters,
          ...(deferredSearch ? { search: deferredSearch } : {}),
        },
      }),
  });

  const selectedReport = submittedFilters?.reportType || null;
  const reportRows = reportResponse?.data?.data || [];
  const attributeColumns = reportResponse?.data?.meta?.attributeColumns || [];

  const openFilterModal = () => {
    form.setFieldsValue({
      reportType: submittedFilters?.reportType || DEFAULT_REPORT_FILTERS.reportType,
      status: submittedFilters?.status,
      deviceType: submittedFilters?.deviceType,
      categoryId: submittedFilters?.categoryId,
      warrantyPeriod: submittedFilters?.warrantyPeriod,
      userId: submittedFilters?.userId,
      departmentId: submittedFilters?.departmentId,
      unitId: submittedFilters?.unitId,
    });
    setOpen(true);
  };

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date.$d).toISOString().split("T")[0]; // 'YYYY-MM-DD'
  };

  const onFinish = (values) => {
    const {
      reportType,
      status,
      deviceType,
      categoryId,
      warrantyPeriod,
      userId,
      unitId,
      departmentId,
    } = values;
    setSearchText("");
    setSubmittedFilters({
      reportType,
      ...(status ? { status } : {}),
      ...(deviceType ? { deviceType } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(warrantyPeriod ? { warrantyPeriod } : {}),
      ...(userId ? { userId } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(unitId ? { unitId } : {}),
      ...(values.startDate ? { startDate: formatDate(values.startDate) } : {}),
      ...(values.endDate ? { endDate: formatDate(values.endDate) } : {}),
    });
    setCurrentPage(1);
    setOpen(false);
  };

  const getColumns = () => {
    if (selectedReport === "inventory") {
      return [
        {
          title: "No",
          key: "index",
          render: (_text, _record, index) => index + 1,
        },
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
          title: "Asset ID",
          dataIndex: "assetId",
          key: "assetId",
        },
        {
          title: "Category",
          dataIndex: "categoryName",
          key: "categoryName",
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
        ...attributeColumns.map((column) => ({
          title: column.label,
          key: `attr-${column.key}`,
          render: (_, record) => record.dynamicAttributes?.[column.key] || "-",
        })),
      ];
    }
  };

  const downloadExcel = () => {
    if (!reportRows.length) return;

    let cleanData = [];

    if (selectedReport === "inventory") {
      cleanData = reportRows.map((item, index) => ({
          No: index + 1,
          AssetId: item?.assetId || "-",
          UserName: item?.userName || "-",
          Email: item?.userEmail || "-",
          Department: item?.departmentName || "-",
          UnitName: item?.unitName || "-",
          Category: item?.categoryName || "-",
          DeviceType: item?.deviceType || "-",
          Brand: item?.brand || "-",
          Model: item?.model || "-",
          SerialNumber: item?.serialNumber || "-",
          Status: item?.status || "-",
          WarrantyPeriod: item?.warrantyPeriod || "-",
          PurchaseDate: item?.purchaseDate
            ? new Date(item.purchaseDate).toLocaleDateString()
            : "-",
          ...attributeColumns.reduce((result, column) => {
            result[column.label] = item?.dynamicAttributes?.[column.key] || "-";
            return result;
          }, {}),
        }));
    }

    const worksheet = XLSX.utils.json_to_sheet(cleanData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

    XLSX.writeFile(workbook, `${selectedReport || "report"}.xlsx`);
  };
  return (
    <div className="px-[3rem] py-[2rem]">
      <div className=" px-[7rem] flex gap-2">
        <Button
          icon={<FilterOutlined />}
          onClick={openFilterModal}
        >
          Filter
        </Button>
        <Input
          disabled={!selectedReport}
          placeholder="Search..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<SearchOutlined />}
          style={{ width: "200px" }}
        />

        <Button
          type="primary"
          onClick={downloadExcel}
          disabled={!reportRows.length}
        >
          Download
        </Button>
      </div>
      <div className="pl-[6rem] pt-6">
        {reportLoading ? (
          <div className="flex justify-center items-center h-[300px]">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={getColumns()}
            dataSource={reportRows}
            rowKey={(record) => record.id || record.key}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              onChange: (page, pageSize) => {
                setCurrentPage(page);
                setPageSize(pageSize);
              },
            }}
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
              initialValue={DEFAULT_REPORT_FILTERS.reportType}
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
            <Form.Item label="Item Category" name="categoryId">
              <Select
                placeholder="Select category"
                allowClear
                showSearch
                optionFilterProp="children"
                style={{ width: "100%" }}
              >
                {categories.map((category) => (
                  <Select.Option key={category.id} value={category.id}>
                    {category.name}
                  </Select.Option>
                ))}
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
                loading={reportLoading}
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
