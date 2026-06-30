import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useDeferredValue, useState } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Table,
  Tabs,
  Tag,
  Tooltip,
} from "antd";
import { FilterOutlined, SearchOutlined } from "@ant-design/icons";
import { LuPlus, LuSlidersHorizontal } from "react-icons/lu";
import { toast } from "react-toastify";
import api from "../utils/config";
import PageShell from "./ui/page-shell";
import { formatCapitalizedLabel } from "../utils/formatText";

const STOCK_STATUS_STYLES = {
  "Not Available": "bg-[#F3F4F6] text-[#111827]",
  Low: "bg-[#FEE2E2] text-[#991B1B]",
  Medium: "bg-[#FEF3C7] text-[#92400E]",
  High: "bg-[#DCFCE7] text-[#166534]",
};

const ADJ_STATUS_STYLES = {
  PENDING: "bg-[#FFF7ED] text-[#C2410C]",
  APPROVED: "bg-[#ECFDF3] text-[#166534]",
  REJECTED: "bg-[#FEE2E2] text-[#991B1B]",
};

const RETURN_STATUS_STYLES = {
  PENDING: "bg-[#FFF7ED] text-[#C2410C]",
  ACCEPTED: "bg-[#ECFDF3] text-[#166534]",
  REJECTED: "bg-[#FEE2E2] text-[#991B1B]",
};

const ADJUSTMENT_REASONS = [
  { value: "DAMAGED", label: "Damaged" },
  { value: "THEFT", label: "Theft" },
  { value: "WRITE_OFF", label: "Write Off" },
  { value: "COUNT_CORRECTION", label: "Count Correction" },
];

const THRESHOLD_LEVELS = [
  { label: "Low", value: "LOW", qty: 5 },
  { label: "Medium", value: "MEDIUM", qty: 15 },
  { label: "High", value: "HIGH", qty: 30 },
];

const THRESHOLD_LEVEL_STYLES = {
  LOW: "bg-[#FEE2E2] text-[#991B1B]",
  MEDIUM: "bg-[#FEF3C7] text-[#92400E]",
  HIGH: "bg-[#DCFCE7] text-[#166534]",
};

const thresholdLevelFromQty = (qty) => {
  if (qty == null) return null;
  if (qty <= 5) return "LOW";
  if (qty <= 15) return "MEDIUM";
  return "HIGH";
};

const stockStatusLabel = (qty) => {
  if (qty === 0) return "Not Available";
  if (qty <= 5) return "Low";
  if (qty <= 15) return "Medium";
  return "High";
};

const Stock = () => {
  const queryClient = useQueryClient();

  // ── Stock Levels state ──────────────────────────────────────────────────
  const [stockPagination, setStockPagination] = useState({ page: 1, limit: 20 });
  const [stockSearch, setStockSearch] = useState("");
  const deferredStockSearch = useDeferredValue(stockSearch.trim());
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filters, setFilters] = useState({ brand: null, deviceType: null });
  const [filterForm] = Form.useForm();
  const [thresholdModalOpen, setThresholdModalOpen] = useState(false);
  const [thresholdItem, setThresholdItem] = useState(null);
  const [thresholdForm] = Form.useForm();

  // ── Adjustments state ───────────────────────────────────────────────────
  const [adjModalOpen, setAdjModalOpen] = useState(false);
  const [adjForm] = Form.useForm();

  // ── Returns state ───────────────────────────────────────────────────────
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [rejectReturnModalOpen, setRejectReturnModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [returnItemFilter, setReturnItemFilter] = useState(null);
  const [returnForm] = Form.useForm();
  const [rejectReturnForm] = Form.useForm();
  const selectedReturnStockIssuedId = Form.useWatch("stockIssuedId", returnForm);

  // ── Queries ─────────────────────────────────────────────────────────────

  const { data: stockResponse, isLoading: stockLoading } = useQuery({
    queryKey: ["stockLevels", filters, stockPagination],
    queryFn: () =>
      api.get("/stores/stock", {
        params: { ...filters, page: stockPagination.page, limit: stockPagination.limit },
      }),
  });

  const { data: itItemsResponse } = useQuery({
    queryKey: ["itItemsForAdj"],
    queryFn: () => api.get("/stores/it-items", { params: { includeZeroStock: "true" } }),
  });

  const { data: adjustmentsResponse, isLoading: adjLoading } = useQuery({
    queryKey: ["stockAdjustments"],
    queryFn: () => api.get("/stores/stock-adjustments"),
  });

  const { data: returnsResponse, isLoading: returnsLoading } = useQuery({
    queryKey: ["stockReturns"],
    queryFn: () => api.get("/stores/returns"),
  });

  const { data: stockIssuedRes } = useQuery({
    queryKey: ["stockIssuedList"],
    queryFn: () => api.get("/stores/stock-issued"),
  });
  const stockIssuedList = stockIssuedRes?.data || [];

  const stockData = (stockResponse?.data?.data || []).map((item) => ({
    ...item,
    stockStatus: stockStatusLabel(item.quantityInStock),
  }));
  const stockMeta = stockResponse?.data?.meta || {};
  const itItemsList = itItemsResponse?.data || [];
  const adjustments = adjustmentsResponse?.data || [];
  const returns = returnsResponse?.data || [];
  const selectedIssuedReturn = stockIssuedList.find(
    (issued) => issued.id === selectedReturnStockIssuedId
  );
  const selectedIssuedQuantity = Number(selectedIssuedReturn?.quantityIssued || 0);

  // ── Stats ────────────────────────────────────────────────────────────────

  const stats = [
    { label: "Stock Lines", value: stockMeta?.total || stockData.length, caption: "Tracked catalog items" },
    { label: "Total Units", value: stockMeta?.totalStockQuantity || 0, caption: "Items currently in stock" },
    { label: "Adjustments", value: adjustments.length, caption: "Pending and resolved adjustments" },
    { label: "Returns", value: returns.length, caption: "Pending and resolved returns" },
  ];

  // ── Mutations ────────────────────────────────────────────────────────────

  const thresholdMutation = useMutation({
    mutationFn: ({ itItemId, thresholdLevel }) => {
      const levelMap = { LOW: 5, MEDIUM: 15, HIGH: 30 };
      return api.patch(`/stores/stock/${itItemId}/reorder-threshold`, { threshold: levelMap[thresholdLevel] });
    },
    onSuccess: () => {
      toast.success("Reorder threshold updated.");
      queryClient.invalidateQueries({ queryKey: ["stockLevels"] });
      setThresholdModalOpen(false);
      setThresholdItem(null);
      thresholdForm.resetFields();
    },
    onError: (error) => toast.error(error?.response?.data?.message || "Failed to update threshold."),
  });

  const createAdjMutation = useMutation({
    mutationFn: (values) => api.post("/stores/stock-adjustments", values),
    onSuccess: () => {
      toast.success("Stock adjusted successfully.");
      queryClient.invalidateQueries({ queryKey: ["stockAdjustments"] });
      queryClient.invalidateQueries({ queryKey: ["stockLevels"] });
      setAdjModalOpen(false);
      adjForm.resetFields();
    },
    onError: (error) => toast.error(error?.response?.data?.message || "Failed to submit adjustment."),
  });

  const createReturnMutation = useMutation({
    mutationFn: (values) => api.post("/stores/returns", values),
    onSuccess: () => {
      toast.success("Return logged.");
      queryClient.invalidateQueries({ queryKey: ["stockReturns"] });
      setReturnModalOpen(false);
      returnForm.resetFields();
      setReturnItemFilter(null);
    },
    onError: (error) => toast.error(error?.response?.data?.message || "Failed to log return."),
  });

  const acceptReturnMutation = useMutation({
    mutationFn: (id) => api.patch(`/stores/returns/${id}/accept`),
    onSuccess: () => {
      toast.success("Return accepted.");
      queryClient.invalidateQueries({ queryKey: ["stockReturns"] });
      queryClient.invalidateQueries({ queryKey: ["stockLevels"] });
      queryClient.invalidateQueries({ queryKey: ["stockIssuedList"] });
    },
    onError: (error) => toast.error(error?.response?.data?.message || "Failed to accept return."),
  });

  const rejectReturnMutation = useMutation({
    mutationFn: ({ id, rejectReason }) =>
      api.patch(`/stores/returns/${id}/reject`, { rejectReason }),
    onSuccess: () => {
      toast.success("Return rejected.");
      queryClient.invalidateQueries({ queryKey: ["stockReturns"] });
      setRejectReturnModalOpen(false);
      setSelectedReturn(null);
      rejectReturnForm.resetFields();
    },
    onError: (error) => toast.error(error?.response?.data?.message || "Failed to reject return."),
  });

  const handleThresholdSubmit = () => {
    thresholdForm.validateFields().then((values) => {
      const itItemId = thresholdItem?.itItemId || thresholdItem?.id;
      if (!itItemId) {
        toast.error("Unable to update threshold. Missing item ID.");
        return;
      }

      thresholdMutation.mutate({ itItemId, thresholdLevel: values.thresholdLevel });
    });
  };

  const handleAdjustmentSubmit = (values) => {
    const quantityDelta = Number(values.quantityDelta);
    if (!quantityDelta) {
      toast.error("Quantity delta cannot be zero.");
      return;
    }

    createAdjMutation.mutate({
      ...values,
      quantityDelta,
      justification: values.justification?.trim(),
    });
  };

  const handleReturnSubmit = (values) => {
    const issued = stockIssuedList.find((record) => record.id === values.stockIssuedId);
    const quantity = Number(values.quantity);
    const maxQuantity = Number(issued?.quantityIssued || 0);

    if (!issued) {
      toast.error("Select a valid issued stock record.");
      return;
    }

    if (!quantity || quantity < 1 || quantity > maxQuantity) {
      toast.error(`Quantity returned must be between 1 and ${maxQuantity || 1}.`);
      return;
    }

    createReturnMutation.mutate({
      ...values,
      itItemId: issued.itItemId,
      quantity,
      reason: values.reason?.trim(),
      notes: values.notes?.trim() || undefined,
    });
  };

  const handleAcceptReturn = (record) => {
    if (!record?.id) {
      toast.error("Unable to accept return. Missing return ID.");
      return;
    }

    acceptReturnMutation.mutate(record.id);
  };

  const handleRejectReturn = (values) => {
    if (!selectedReturn?.id) {
      toast.error("Unable to reject return. Missing return ID.");
      return;
    }

    const rejectReason = values.rejectReason?.trim();
    if (!rejectReason) {
      toast.error("Please provide a rejection reason.");
      return;
    }

    rejectReturnMutation.mutate({ id: selectedReturn.id, rejectReason });
  };

  // ── Columns ───────────────────────────────────────────────────────────────

  const stockColumns = [
    {
      title: "Brand",
      dataIndex: "brand",
      key: "brand",
      filteredValue: [deferredStockSearch],
      onFilter: (value, record) =>
        [record.brand, record.model, String(record.quantityInStock), record.deviceType]
          .some((field) => field?.toLowerCase().includes(value.toLowerCase())),
    },
    { title: "Model", dataIndex: "model", key: "model" },
    { title: "Device Type", dataIndex: "deviceType", key: "deviceType", render: formatCapitalizedLabel },
    { title: "Item Class", dataIndex: "itemClass", key: "itemClass", render: formatCapitalizedLabel },
    { title: "Qty In Stock", dataIndex: "quantityInStock", key: "quantityInStock" },
    {
      title: "Threshold Level",
      dataIndex: "reorderThreshold",
      key: "reorderThreshold",
      render: (v) => {
        const level = thresholdLevelFromQty(v);
        if (!level) return <span className="text-[#9CA3AF]">—</span>;
        return (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${THRESHOLD_LEVEL_STYLES[level]}`}>
            {level.charAt(0) + level.slice(1).toLowerCase()}
          </span>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "stockStatus",
      key: "stockStatus",
      render: (status) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STOCK_STATUS_STYLES[status]}`}>
          {status}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => {
        const level = thresholdLevelFromQty(record.reorderThreshold);
        return (
          <Tooltip title={level ? "Edit Threshold" : "Set Threshold"}>
            <button type="button" onClick={() => { setThresholdItem(record); thresholdForm.setFieldsValue({ thresholdLevel: level }); setThresholdModalOpen(true); }} className="flex items-center justify-center rounded border border-[#E0E0E0] bg-white p-1 text-[#616161] transition-all hover:border-[#1677ff] hover:bg-[#EFF6FF] hover:text-[#1677ff]">
              <LuSlidersHorizontal className="text-sm" />
            </button>
          </Tooltip>
        );
      },
    },
  ];

  const adjColumns = [
    { title: "Item", key: "item", render: (_, r) => `${r.itItem?.brand} ${r.itItem?.model}` },
    { title: "Delta", dataIndex: "quantityDelta", key: "quantityDelta", render: (v) => <span className={`font-semibold ${v > 0 ? "text-[#166534]" : "text-[#D32F2F]"}`}>{v > 0 ? `+${v}` : v}</span> },
    { title: "Reason", dataIndex: "reason", key: "reason", render: formatCapitalizedLabel },
    { title: "Justification", dataIndex: "justification", key: "justification" },
    { title: "Adjusted By", key: "adjustedBy", render: (_, r) => r.adjustedBy?.name || "—" },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (d) => new Date(d).toLocaleString("en-US", { dateStyle: "medium" }),
    },
  ];

  const returnColumns = [
    { title: "Item", key: "item", render: (_, r) => `${r.itItem?.brand || ""} ${r.itItem?.model || ""}`.trim() },
    { title: "Qty", dataIndex: "quantity", key: "quantity" },
    { title: "Reason", dataIndex: "reason", key: "reason" },
    { title: "Notes", dataIndex: "notes", key: "notes", render: (v) => v || "—" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${RETURN_STATUS_STYLES[status] || ""}`}>
          {formatCapitalizedLabel(status)}
        </span>
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (d) => new Date(d).toLocaleString("en-US", { dateStyle: "medium" }),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) =>
        record.status === "PENDING" ? (
          <div className="flex gap-2">
            <Button
              size="small"
              type="primary"
              loading={acceptReturnMutation.isPending}
              disabled={rejectReturnMutation.isPending}
              onClick={() => handleAcceptReturn(record)}
            >
              Accept
            </Button>
            <Button
              size="small"
              danger
              disabled={acceptReturnMutation.isPending || rejectReturnMutation.isPending}
              onClick={() => {
                setSelectedReturn(record);
                rejectReturnForm.resetFields();
                setRejectReturnModalOpen(true);
              }}
            >
              Reject
            </Button>
          </div>
        ) : (
          <span className="text-xs text-[#9CA3AF]">{formatCapitalizedLabel(record.status)}</span>
        ),
    },
  ];

  return (
    <PageShell
      eyebrow="Stores Operations"
      title="Stock Management"
      description="Monitor stock levels, manage adjustments, and track item returns across the stores."
      stats={stats}
      actions={
        <Input
          placeholder="Search stock..."
          value={stockSearch}
          onChange={(e) => setStockSearch(e.target.value)}
          prefix={<SearchOutlined />}
          className="w-full md:w-[240px]"
        />
      }
    >
      <section className="rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
        <Tabs
          defaultActiveKey="levels"
          items={[
            {
              key: "levels",
              label: "Stock Levels",
              children: (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <Button icon={<FilterOutlined />} onClick={() => setFilterModalOpen(true)}>
                      Filter
                    </Button>
                  </div>
                  <Table
                    columns={stockColumns}
                    dataSource={stockData}
                    loading={stockLoading}
                    rowKey="itItemId"
                    scroll={{ x: 900 }}
                    rowClassName={(r) => (r.quantityInStock === 0 ? "bg-red-50" : "")}
                    pagination={{
                      current: stockPagination.page,
                      pageSize: stockPagination.limit,
                      total: stockMeta?.total || 0,
                      showSizeChanger: true,
                      pageSizeOptions: ["10", "20", "50"],
                      showTotal: (total) =>
                        `${total} items | Total stock: ${stockMeta?.totalStockQuantity ?? 0}`,
                      onChange: (page, pageSize) =>
                        setStockPagination({ page, limit: pageSize }),
                    }}
                  />
                </>
              ),
            },
            {
              key: "adjustments",
              label: "Adjustments",
              children: (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-[#616161]">
                      Pending adjustments must be approved before stock is modified.
                    </p>
                    <Button
                      type="primary"
                      icon={<LuPlus />}
                      onClick={() => setAdjModalOpen(true)}
                    >
                      New Adjustment
                    </Button>
                  </div>
                  <Table
                    columns={adjColumns}
                    dataSource={adjustments}
                    loading={adjLoading}
                    rowKey="id"
                    scroll={{ x: 900 }}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                  />
                </>
              ),
            },
            {
              key: "returns",
              label: "Returns",
              children: (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-[#616161]">
                      Log returned items. Accepted returns restore stock.
                    </p>
                    <Button
                      type="primary"
                      icon={<LuPlus />}
                      onClick={() => setReturnModalOpen(true)}
                    >
                      Log Return
                    </Button>
                  </div>
                  <Table
                    columns={returnColumns}
                    dataSource={returns}
                    loading={returnsLoading}
                    rowKey="id"
                    scroll={{ x: 900 }}
                    pagination={{ pageSize: 10, showSizeChanger: false }}
                  />
                </>
              ),
            },
          ]}
        />
      </section>

      {/* ── Filter Modal ──────────────────────────────────────────────────── */}
      <Modal
        title="Filter Stock"
        open={filterModalOpen}
        onCancel={() => setFilterModalOpen(false)}
        footer={[
          <Button key="reset" onClick={() => { filterForm.resetFields(); setFilters({ brand: null, deviceType: null }); setFilterModalOpen(false); }}>
            Reset
          </Button>,
          <Button
            key="apply"
            type="primary"
            onClick={() => {
              filterForm.validateFields().then((values) => {
                setFilters({ brand: values.brand || null, deviceType: values.deviceType || null });
                setStockPagination((p) => ({ ...p, page: 1 }));
                setFilterModalOpen(false);
              });
            }}
          >
            Apply
          </Button>,
        ]}
      >
        <Form layout="vertical" form={filterForm}>
          <Form.Item name="brand" label="Brand">
            <Input placeholder="e.g. HP" allowClear />
          </Form.Item>
          <Form.Item name="deviceType" label="Device Type">
            <Select placeholder="Select device type" allowClear>
              <Select.Option value="LAPTOP">Laptop</Select.Option>
              <Select.Option value="DESKTOP">Desktop</Select.Option>
              <Select.Option value="PRINTER">Printer</Select.Option>
              <Select.Option value="UPS">UPS</Select.Option>
              <Select.Option value="OTHER">Other</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Reorder Threshold Modal ───────────────────────────────────────── */}
      <Modal
        title={`Set Threshold Level — ${thresholdItem?.brand} ${thresholdItem?.model}`}
        open={thresholdModalOpen}
        onCancel={() => { setThresholdModalOpen(false); setThresholdItem(null); thresholdForm.resetFields(); }}
        onOk={handleThresholdSubmit}
        okText="Save"
        confirmLoading={thresholdMutation.isPending}
      >
        <Form form={thresholdForm} layout="vertical">
          <p className="mb-4 text-sm text-[#616161]">
            Choose the stock level at which this item should be flagged for reorder.
          </p>
          <Form.Item
            name="thresholdLevel"
            label="Threshold Level"
            rules={[{ required: true, message: "Select a threshold level" }]}
          >
            <Select placeholder="Select threshold level">
              {THRESHOLD_LEVELS.map((lvl) => (
                <Select.Option key={lvl.value} value={lvl.value}>
                  <span
                    className={`mr-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${THRESHOLD_LEVEL_STYLES[lvl.value]}`}
                  >
                    {lvl.label}
                  </span>
                  <span className="text-[#9CA3AF] text-xs">— reorder below {lvl.qty} units</span>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── New Adjustment Modal ──────────────────────────────────────────── */}
      <Modal
        title="New Stock Adjustment"
        open={adjModalOpen}
        onCancel={() => { setAdjModalOpen(false); adjForm.resetFields(); }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={adjForm}
          layout="vertical"
          onFinish={handleAdjustmentSubmit}
        >
          <Form.Item name="itItemId" label="IT Item" rules={[{ required: true }]}>
            <Select placeholder="Select item" showSearch optionFilterProp="children">
              {itItemsList.map((item) => (
                <Select.Option key={item.id} value={item.id}>
                  {`${item.brand} — ${item.model}`}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="quantityDelta" label="Quantity Delta (negative to reduce)" rules={[{ required: true }]}>
            <InputNumber className="w-full" />
          </Form.Item>
          <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
            <Select placeholder="Select reason">
              {ADJUSTMENT_REASONS.map((r) => (
                <Select.Option key={r.value} value={r.value}>{r.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="justification" label="Justification" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className="w-full" loading={createAdjMutation.isPending}>
              Submit Adjustment
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Log Return Modal ──────────────────────────────────────────────── */}
      <Modal
        title="Log Stock Return"
        open={returnModalOpen}
        onCancel={() => { setReturnModalOpen(false); returnForm.resetFields(); setReturnItemFilter(null); }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={returnForm}
          layout="vertical"
          onFinish={handleReturnSubmit}
        >
          <Form.Item name="itItemId" hidden><input /></Form.Item>
          <Form.Item label="IT Item">
            <Select
              placeholder="Search item by name..."
              showSearch
              allowClear
              optionFilterProp="label"
              value={returnItemFilter}
              onChange={(val) => {
                setReturnItemFilter(val);
                returnForm.setFieldValue("stockIssuedId", undefined);
                returnForm.setFieldValue("itItemId", undefined);
              }}
              options={[
                ...new Map(
                  stockIssuedList.map((r) => [r.itItemId, { value: r.itItemId, label: `${r.itItem?.brand} ${r.itItem?.model}` }])
                ).values(),
              ]}
            />
          </Form.Item>
          <Form.Item name="stockIssuedId" label="LPO Number" rules={[{ required: true, message: "Select an issued record by LPO" }]}>
            <Select
              placeholder={returnItemFilter ? "Select LPO..." : "Select an item first"}
              showSearch
              disabled={!returnItemFilter}
              optionFilterProp="label"
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              onChange={(issuedId) => {
                const issued = stockIssuedList.find((r) => r.id === issuedId);
                if (issued) returnForm.setFieldValue("itItemId", issued.itItemId);
                returnForm.setFieldValue("quantity", undefined);
              }}
              options={stockIssuedList
                .filter((r) => !returnItemFilter || r.itItemId === returnItemFilter)
                .map((issued) => ({
                  value: issued.id,
                  label: `${issued.stockBatch?.stockReceived?.lpoReference || "No LPO"} — Qty issued: ${issued.quantityIssued}`,
                }))}
            />
          </Form.Item>
          <Form.Item name="quantity" label="Quantity Returned" rules={[{ required: true }]}>
            <InputNumber min={1} max={selectedIssuedQuantity || 1} className="w-full" />
          </Form.Item>
          {selectedIssuedQuantity ? (
            <p className="-mt-3 mb-4 text-xs text-[#616161]">Maximum return quantity: {selectedIssuedQuantity}</p>
          ) : null}
          <Form.Item name="reason" label="Return Reason" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="notes" label="Additional Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" className="w-full" loading={createReturnMutation.isPending}>
              Submit Return
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Reject Return Modal ───────────────────────────────────────────── */}
      <Modal
        title="Reject Return"
        open={rejectReturnModalOpen}
        onCancel={() => { setRejectReturnModalOpen(false); setSelectedReturn(null); rejectReturnForm.resetFields(); }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={rejectReturnForm}
          layout="vertical"
          onFinish={handleRejectReturn}
        >
          <p className="mb-4 text-sm text-[#616161]">
            Provide a reason for rejecting the return for{" "}
            <strong>{selectedReturn?.itItem?.brand} {selectedReturn?.itItem?.model}</strong>.
          </p>
          <Form.Item name="rejectReason" label="Rejection Reason" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Button danger type="primary" htmlType="submit" className="w-full" loading={rejectReturnMutation.isPending}>
              Reject Return
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageShell>
  );
};

export default Stock;
