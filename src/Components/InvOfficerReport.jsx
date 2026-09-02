import React, { useDeferredValue, useMemo, useState } from "react";
import { FilterOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  Modal,
  Select,
  Spin,
  Table,
  Tag,
} from "antd";
import api from "../utils/config";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { downloadApiFile } from "../utils/download";
import PageShell from "./ui/page-shell";

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
  const [selectedRow, setSelectedRow] = useState(null);
  const [exporting, setExporting] = useState(false);
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

  const { data: reportResponse, isLoading, isFetching: reportLoading } = useQuery({
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
        { title: "Asset ID", dataIndex: "assetId", key: "assetId", render: (value) => <span className="font-semibold">{value}</span> },
        { title: "User", dataIndex: "userName", key: "userName" },
        { title: "Department", dataIndex: "departmentName", key: "departmentName" },
        {
          title: "Device",
          key: "device",
          render: (_, record) => `${record.brand || "-"} ${record.model || ""}`.trim(),
        },
        {
          title: "Status",
          dataIndex: "status",
          key: "status",
          render: (value) => (
            <Tag className={`rounded-full border-0 px-3 font-semibold ${value === "ACTIVE" ? "bg-[#ECFDF3] text-[#166534]" : "bg-[#FFF7ED] text-[#C2410C]"}`}>
              {value || "-"}
            </Tag>
          ),
        },
        { title: "Category", dataIndex: "categoryName", key: "categoryName" },
      ];
    }
    return [];
  };

  const downloadExcel = async () => {
    try {
      setExporting(true);
      await downloadApiFile(
        api,
        "/inventory/reports/export",
        {
          ...submittedFilters,
          ...(deferredSearch ? { search: deferredSearch } : {}),
        },
        "inventory-report.csv"
      );
    } catch (error) {
      toast.error(error?.message || "Failed to export report");
    } finally {
      setExporting(false);
    }
  };
  return (
    <PageShell
      eyebrow="Reporting Workspace"
      title="Inventory Report"
      description="Review assigned assets and device records. Click a row for serial numbers, warranty, and other details."
      loading={isLoading}
      actions={
        <>
          <Button icon={<FilterOutlined />} onClick={openFilterModal}>
            Filter
          </Button>
          <Input
            disabled={!selectedReport}
            placeholder="Search report"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            prefix={<SearchOutlined />}
            className="w-full md:w-[240px]"
          />
          <Button
            type="primary"
            onClick={downloadExcel}
            loading={exporting}
            disabled={!reportRows.length}
          >
            Download
          </Button>
        </>
      }
    >
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#616161]">Asset Output</p>
            <h3 className="text-xl font-bold text-[#212121]">Inventory records</h3>
          </div>
          <span className="rounded-full bg-[#FFEBEE] px-3 py-1 text-xs font-semibold text-[#D32F2F]">
            Click a row for details
          </span>
        </div>
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={getColumns()}
            dataSource={reportRows}
            rowKey={(record) => record.id || record.key}
            loading={reportLoading}
            scroll={{ x: "max-content" }}
            tableLayout="fixed"
            onRow={(record) => ({
              onClick: () => setSelectedRow(record),
              className: "cursor-pointer",
            })}
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
              onChange: (page, nextSize) => {
                setCurrentPage(page);
                setPageSize(nextSize);
              },
            }}
          />
        )}
      </section>
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
      <Drawer
        open={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        title={selectedRow ? selectedRow.assetId : "Asset details"}
        width={480}
      >
        {selectedRow && (
          <div>
            {[
              ["User", selectedRow.userName],
              ["Email", selectedRow.userEmail],
              ["Department", selectedRow.departmentName],
              ["Unit", selectedRow.unitName],
              ["Category", selectedRow.categoryName],
              ["Device type", selectedRow.deviceType],
              ["Brand", selectedRow.brand],
              ["Model", selectedRow.model],
              ["Serial number", selectedRow.serialNumber],
              ["Status", selectedRow.status],
              ["Warranty (months)", selectedRow.warrantyPeriod],
              ["Purchase date", selectedRow.purchaseDate ? new Date(selectedRow.purchaseDate).toLocaleDateString() : "-"],
              ["Supplier", selectedRow.supplier?.name],
              ["LPO reference", selectedRow.lpoReference],
              ["Voucher", selectedRow.voucherNumber],
              ...attributeColumns.map((column) => [column.label, selectedRow.dynamicAttributes?.[column.key]]),
            ].map(([label, value]) => (
              <div key={label} className="border-b border-[#F1F1F1] py-3 last:border-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">{label}</p>
                <p className="mt-1 text-sm text-[#212121] whitespace-pre-wrap">{value || "-"}</p>
              </div>
            ))}
          </div>
        )}
      </Drawer>
    </PageShell>
  );
};

export default InvOfficerReport;
