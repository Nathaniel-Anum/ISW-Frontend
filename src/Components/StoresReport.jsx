import { useQuery } from "@tanstack/react-query";
import {
  Select,
  Table,
  Spin,
  Button,
  Modal,
  Form,
  DatePicker,
  Input,
  Empty,
} from "antd";
import api from "../utils/config";
import { useDeferredValue, useState } from "react";
import * as XLSX from "xlsx";
import { FilterOutlined, SearchOutlined } from "@ant-design/icons";
import PageShell from "./ui/page-shell";
import { formatCapitalizedLabel } from "../utils/formatText";

const { Option } = Select;

const REPORT_LABELS = {
  stock_received: "Stock Received",
  stock_issued: "Stock Issued",
  requisitions: "Requisitions",
  stock_levels: "Stock Levels",
};

const DEFAULT_REPORT_FILTERS = {
  reportType: "stock_issued",
};

const StoresReport = () => {
  const [submittedFilters, setSubmittedFilters] = useState(DEFAULT_REPORT_FILTERS);
  const [searchText, setSearchText] = useState("");
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const deferredSearch = useDeferredValue(searchText.trim());

  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get("/admin/users"),
  });

  const { data: suppliersResponse } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => api.get("/stores/suppliers"),
  });

  const { data: itItemResponse } = useQuery({
    queryKey: ["itItem"],
    queryFn: () => api.get("/stores/it-items"),
  });

  const { data: reportResponse, isFetching: reportLoading } = useQuery({
    queryKey: ["storesReport", submittedFilters, deferredSearch],
    enabled: !!submittedFilters?.reportType,
    queryFn: () =>
      api.get("/stores/reports", {
        params: {
          ...submittedFilters,
          ...(deferredSearch ? { search: deferredSearch } : {}),
        },
      }),
  });

  const userOptions = users?.data?.map((user) => ({
    label: `${user.name}`,
    value: user.id,
  }));

  const supplierOptions = suppliersResponse?.data?.map((supplier) => ({
    label: `${supplier.name}`,
    value: supplier.id,
  }));

  const itItemOptions = itItemResponse?.data?.map((item) => ({
    label: `${item.brand} - ${item.model}`,
    value: item.id,
  }));

  const selectedReport = submittedFilters?.reportType || null;
  const reportRows = reportResponse?.data?.data || [];
  const stats = [
    {
      label: "Current Report",
      value: REPORT_LABELS[selectedReport] || "None",
      caption: "Selected report type",
    },
    {
      label: "Rows Loaded",
      value: reportRows.length,
      caption: "Results available for export",
    },
    {
      label: "Suppliers",
      value: suppliersResponse?.data?.length || 0,
      caption: "Reportable supplier records",
    },
  ];

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date.$d).toISOString().split("T")[0];
  };

  const onFinish = (values) => {
    const {
      reportType,
      itemClass,
      status,
      deviceType,
      reqStatus,
      model,
      brand,
      lpoReference,
      technicianReceivedById,
      supplierId,
      itItemId,
    } = values;

    setSearchText("");
    setSubmittedFilters({
      reportType,
      ...(itemClass ? { itemClass } : {}),
      ...(status ? { status } : {}),
      ...(deviceType ? { deviceType } : {}),
      ...(reqStatus ? { reqStatus } : {}),
      ...(model ? { model } : {}),
      ...(brand ? { brand } : {}),
      ...(technicianReceivedById ? { technicianReceivedById } : {}),
      ...(lpoReference ? { lpoReference } : {}),
      ...(supplierId ? { supplierId } : {}),
      ...(itItemId ? { itItemId } : {}),
      ...(values.startDate ? { startDate: formatDate(values.startDate) } : {}),
      ...(values.endDate ? { endDate: formatDate(values.endDate) } : {}),
    });
    setOpen(false);
    form.resetFields();
  };

  const getColumns = () => {
    if (selectedReport === "stock_received") {
      return [
        { title: "Model", dataIndex: ["itItem", "model"], key: "model" },
        { title: "Brand", dataIndex: ["itItem", "brand"], key: "brand" },
        { title: "Quantity Received", dataIndex: "quantityReceived", key: "quantityReceived" },
        { title: "Received By", dataIndex: ["receivedBy", "name"], key: "receivedBy" },
        { title: "Supplier", dataIndex: ["supplier", "name"], key: "supplier" },
        { title: "LPO Ref", dataIndex: "lpoReference", key: "lpoReference" },
        { title: "Voucher No.", dataIndex: "voucherNumber", key: "voucherNumber" },
        {
          title: "Date Received",
          dataIndex: "dateReceived",
          key: "dateReceived",
          render: (date) => new Date(date).toLocaleDateString(),
        },
      ];
    }

    if (selectedReport === "stock_issued") {
      return [
        { title: "Model", dataIndex: ["itItem", "model"], key: "model" },
        { title: "Brand", dataIndex: ["itItem", "brand"], key: "brand" },
        { title: "Quantity Issued", dataIndex: "quantityIssued", key: "quantityIssued" },
        { title: "Issued By", dataIndex: ["issuedBy", "name"], key: "issuedBy" },
        {
          title: "Issue Date",
          dataIndex: "issueDate",
          key: "issueDate",
          render: (date) => new Date(date).toLocaleDateString(),
        },
        { title: "Remarks", dataIndex: "remarks", key: "remarks" },
        {
          title: "Requested By",
          dataIndex: ["requisition", "staff", "name"],
          key: "requestedBy",
        },
      ];
    }

    if (selectedReport === "requisitions") {
      return [
        { title: "Requisition ID", dataIndex: "requisitionID", key: "requisitionID" },
        { title: "Issued By", dataIndex: ["staff", "name"], key: "issuedBy" },
        { title: "Room No.", dataIndex: "roomNo", key: "roomNo" },
        {
          title: "Brand",
          dataIndex: ["itItem", "brand"],
          key: "brand",
          render: (text) => text || "-",
        },
        {
          title: "Model",
          dataIndex: ["itItem", "model"],
          key: "model",
          render: (text) => text || "-",
        },
        {
          title: "Device Type",
          dataIndex: ["itItem", "deviceType"],
          key: "deviceType",
          render: (text) => formatCapitalizedLabel(text, "-"),
        },
        { title: "Description", dataIndex: "itemDescription", key: "itemDescription" },
        { title: "Purpose", dataIndex: "purpose", key: "purpose" },
        { title: "Quantity", dataIndex: "quantity", key: "quantity" },
        {
          title: "Date Created",
          dataIndex: "createdAt",
          key: "createdAt",
          render: (date) => new Date(date).toLocaleDateString(),
        },
      ];
    }

    if (selectedReport === "stock_levels") {
      return [
        { title: "Brand", dataIndex: "brand", key: "brand" },
        { title: "Model", dataIndex: "model", key: "model" },
        { title: "Device Type", dataIndex: "deviceType", key: "deviceType", render: (text) => formatCapitalizedLabel(text, "-") },
        { title: "Item Class", dataIndex: "itemClass", key: "itemClass", render: (text) => formatCapitalizedLabel(text, "-") },
        { title: "Quantity In Stock", dataIndex: "quantityInStock", key: "quantityInStock" },
      ];
    }

    return [];
  };

  const downloadExcel = () => {
    if (!reportRows.length) return;

    let cleanData = [];

    if (selectedReport === "stock_received") {
      cleanData = reportRows.map((item, index) => ({
        No: index + 1,
        Model: item?.itItem?.model || "-",
        Brand: item?.itItem?.brand || "-",
        QuantityReceived: item?.quantityReceived || 0,
        Supplier: item?.supplier?.name || "-",
        ReceivedBy: item?.receivedBy?.name || "-",
        LPOReference: item?.lpoReference || "-",
        VoucherNumber: item?.voucherNumber || "-",
        DateReceived: item?.dateReceived ? new Date(item.dateReceived).toLocaleDateString() : "-",
      }));
    } else if (selectedReport === "stock_issued") {
      cleanData = reportRows.map((item, index) => ({
        No: index + 1,
        Model: item?.itItem?.model || "-",
        Brand: item?.itItem?.brand || "-",
        QuantityIssued: item?.quantityIssued || 0,
        IssuedBy: item?.issuedBy?.name || "-",
        RequestedBy: item?.requisition?.staff?.name || "-",
        Remarks: item?.remarks || "-",
        IssueDate: item?.issueDate ? new Date(item.issueDate).toLocaleDateString() : "-",
      }));
    } else if (selectedReport === "requisitions") {
      cleanData = reportRows.map((item, index) => ({
        No: index + 1,
        RequisitionID: item?.requisitionID || "-",
        IssuedBy: item?.staff?.name || "-",
        RoomNo: item?.roomNo || "-",
        Brand: item?.itItem?.brand || "-",
        Model: item?.itItem?.model || "-",
        DeviceType: formatCapitalizedLabel(item?.itItem?.deviceType, "-"),
        Description: item?.itemDescription || "-",
        Purpose: item?.purpose || "-",
        Quantity: item?.quantity || 0,
        DateCreated: item?.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-",
      }));
    } else if (selectedReport === "stock_levels") {
      cleanData = reportRows.map((item, index) => ({
        No: index + 1,
        Model: item?.model || "-",
        Brand: item?.brand || "-",
        DeviceType: formatCapitalizedLabel(item?.deviceType, "-"),
        ItemClass: formatCapitalizedLabel(item?.itemClass, "-"),
        QuantityInStock: item?.quantityInStock || 0,
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(cleanData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `${selectedReport || "report"}.xlsx`);
  };

  return (
    <PageShell
      eyebrow="Reporting Workspace"
      title="Stores Reports"
      description="Filter stock movement, requisitions, and stock levels from a cleaner reporting workspace with export-ready output."
      stats={stats}
      actions={
        <>
          <Button icon={<FilterOutlined />} onClick={() => setOpen(true)}>
            Filter
          </Button>
          <Input
            disabled={!selectedReport}
            placeholder="Search report"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            prefix={<SearchOutlined />}
            className="w-full md:w-[240px]"
          />
          <Button type="primary" onClick={downloadExcel} disabled={!reportRows.length}>
            Download
          </Button>
        </>
      }
    >
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#616161]">Generated Output</p>
            <h3 className="text-xl font-bold text-[#212121]">
              {REPORT_LABELS[selectedReport] || "No report selected"}
            </h3>
          </div>
          <span className="rounded-full bg-[#FFEBEE] px-3 py-1 text-xs font-semibold text-[#D32F2F]">
            Export-ready view
          </span>
        </div>

        {reportLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <Spin size="large" />
          </div>
        ) : !reportRows.length ? (
          <div className="rounded-3xl border border-dashed border-[#E0E0E0] bg-[#F9FAFB] px-6 py-12">
            <Empty
              description="No records found for the selected filters."
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <Table
            columns={getColumns()}
            dataSource={reportRows}
            rowKey={(record, index) => record.id || record.requisitionID || `${selectedReport}-${index}`}
            scroll={{ x: 1300 }}
          />
        )}
      </section>

      <Modal
        title="Generate Report"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
      >
        <div className="no-scrollbar max-h-[39rem] overflow-y-auto pr-2">
          <Form form={form} layout="vertical" onFinish={onFinish} initialValues={submittedFilters || DEFAULT_REPORT_FILTERS}>
            <Form.Item
              name="reportType"
              label="Report Type"
              rules={[{ required: true, message: "Select report type" }]}
            >
              <Select placeholder="Filter by" style={{ width: "100%" }}>
                <Option value="stock_received">Stock Received</Option>
                <Option value="stock_issued">Stock Issued</Option>
                <Option value="requisitions">Requisitions</Option>
                <Option value="stock_levels">Stock</Option>
              </Select>
            </Form.Item>

            <Form.Item label="Item Class" name="itemClass">
              <Select placeholder="Item Class" allowClear style={{ width: "100%" }}>
                <Select.Option value="CONSUMABLE">Consumable Asset</Select.Option>
                <Select.Option value="FIXED_ASSET">Fixed Asset</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Model" name="model">
              <Input placeholder="Model" />
            </Form.Item>
            <Form.Item label="Brand" name="brand">
              <Input placeholder="Brand" />
            </Form.Item>
            <Form.Item label="L.P.O Reference" name="lpoReference">
              <Input placeholder="L.P.O Reference" />
            </Form.Item>
            <Form.Item name="technicianReceivedById" label="Select Technician Received">
              <Select
                showSearch
                placeholder="Technician Received By"
                options={userOptions}
                filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
              />
            </Form.Item>
            <Form.Item name="supplierId" label="Select Supplier">
              <Select
                showSearch
                placeholder="Select Supplier"
                options={supplierOptions}
                filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
              />
            </Form.Item>
            <Form.Item name="itItemId" label="Select It Item">
              <Select
                showSearch
                placeholder="Select It Item"
                options={itItemOptions}
                filterOption={(input, option) => option.label.toLowerCase().includes(input.toLowerCase())}
              />
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
                <Select.Option value="NON_FUNCTIONAL">NON FUNCTIONAL</Select.Option>
                <Select.Option value="OBSOLETE">OBSOLETE</Select.Option>
                <Select.Option value="DISPOSED">DISPOSED</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Requisition Status" name="reqStatus">
              <Select placeholder="Requisition status" allowClear style={{ width: "100%" }}>
                <Select.Option value="DEPT_DECLINED">Department Declined</Select.Option>
                <Select.Option value="PROCESSED">Processed</Select.Option>
                <Select.Option value="ITD_DECLINED">ITD Declined</Select.Option>
                <Select.Option value="ITD_APPROVED">ITD Approved</Select.Option>
                <Select.Option value="PENDING_STOCK_ISSUANCE">Pending Stock Issuance</Select.Option>
                <Select.Option value="DEPT_APPROVED">Department Approved</Select.Option>
                <Select.Option value="PENDING_DEPT_APPROVAL">Pending Department Approval</Select.Option>
                <Select.Option value="PENDING_ITD_APPROVAL">Pending ITD Approval</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Device Type" name="deviceType">
              <Select placeholder="Device Type" allowClear style={{ width: "100%" }}>
                <Select.Option value="LAPTOP">LAPTOP</Select.Option>
                <Select.Option value="DESKTOP">DESKTOP</Select.Option>
                <Select.Option value="PRINTER">PRINTER</Select.Option>
                <Select.Option value="OTHER">OTHER</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={reportLoading} className="w-full">
                Submit
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </PageShell>
  );
};

export default StoresReport;
