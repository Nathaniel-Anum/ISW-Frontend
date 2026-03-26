import React, { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, InputNumber, Modal, Select, Table, Tag } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { LuCheck, LuClipboardList, LuRefreshCw, LuSettings2 } from "react-icons/lu";
import { toast } from "react-toastify";
import api from "../utils/config";
import { formatCapitalizedLabel } from "../utils/formatText";
import PageShell from "./ui/page-shell";

const STATUS_STYLES = {
  PROCESSED: "bg-[#ECFDF3] text-[#166534]",
  PENDING_ITD_APPROVAL: "bg-[#FFF7ED] text-[#C2410C]",
  ITD_APPROVED: "bg-[#ECFDF3] text-[#166534]",
  PENDING_STOCK_ISSUANCE: "bg-[#FFF7ED] text-[#9A3412]",
};

const REQUEST_TYPE_STYLES = {
  STANDARD: "bg-[#EFF6FF] text-[#1D4ED8]",
  MAINTENANCE: "bg-[#FFF7ED] text-[#C2410C]",
};

const StoresOfficer = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [remarks, setRemarks] = useState("");
  const [searchText, setSearchText] = useState("");
  const deferredSearch = useDeferredValue(searchText.trim());

  // Stock management state
  const [adjModalOpen, setAdjModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [approveAdjModalOpen, setApproveAdjModalOpen] = useState(false);
  const [selectedAdjRecord, setSelectedAdjRecord] = useState(null);
  const [thresholdItem, setThresholdItem] = useState(null);
  const [thresholdModalOpen, setThresholdModalOpen] = useState(false);
  const [adjForm] = Form.useForm();
  const [returnForm] = Form.useForm();
  const [rejectAdjForm] = Form.useForm();

  const { data: itemOptionsResponse, isLoading: isItemsLoading } = useQuery({
    queryKey: ["storesOfficer"],
    queryFn: () => api.get("/stores/it-items"),
  });

  const { data: filteredItemOptionsResponse, isLoading: isFilteredItemsLoading } = useQuery({
    queryKey: ["storesOfficerIssueItems", selectedRecord?.categoryId || null],
    queryFn: () =>
      api.get("/stores/it-items", {
        params: selectedRecord?.categoryId ? { categoryId: selectedRecord.categoryId } : undefined,
      }),
    enabled: isModalOpen,
  });

  const { data: batchesData, isLoading: isBatchesLoading } = useQuery({
    queryKey: ["stockBatches", selectedItem],
    queryFn: async () => {
      const response = await api.get(`/stores/stock-batches?itItemId=${selectedItem}`);
      return response.data;
    },
    enabled: !!selectedItem,
  });

  const { data: approvedResponse, isLoading } = useQuery({
    queryKey: ["ITD-Approved", deferredSearch],
    queryFn: () =>
      api.get("/stores/reqs/approved", {
        params: deferredSearch ? { search: deferredSearch } : undefined,
      }),
  });

  const { data: stockLevelsRes } = useQuery({
    queryKey: ["stockLevels"],
    queryFn: () => api.get("/stores/stock"),
  });

  const { data: adjustmentsRes, refetch: refetchAdjustments } = useQuery({
    queryKey: ["stockAdjustments"],
    queryFn: () => api.get("/stores/stock-adjustments"),
  });

  const { data: returnsRes, refetch: refetchReturns } = useQuery({
    queryKey: ["stockReturns"],
    queryFn: () => api.get("/stores/returns"),
  });

  const { data: stockIssuedRes } = useQuery({
    queryKey: ["stockIssued"],
    queryFn: () => api.get("/stores/reports", { params: { reportType: "stock_issued" } }),
  });

  const approvedRequests = approvedResponse?.data || [];
  const issueItemOptions = filteredItemOptionsResponse?.data || [];
  const requestedCategoryOptions = issueItemOptions.filter((item) => item.matchesRequestedCategory);
  const alternativeCategoryOptions = issueItemOptions.filter((item) => !item.matchesRequestedCategory);
  const readyToIssueRequests = approvedRequests.filter((item) => item.status === "ITD_APPROVED");
  const pendingStockRequests = approvedRequests.filter(
    (item) => item.status === "PENDING_STOCK_ISSUANCE"
  );

  const stats = useMemo(
    () => [
      {
        label: "Ready To Issue",
        value: readyToIssueRequests.length,
        caption: "Ready for issuance",
      },
      {
        label: "Pending Stock",
        value: pendingStockRequests.length,
        caption: "Waiting for restock",
      },
      {
        label: "Requested Units",
        value: approvedRequests.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        caption: "Total quantity pending issue",
      },
      {
        label: "Stock Items",
        value: itemOptionsResponse?.data?.length || 0,
        caption: "Available IT item options",
      },
    ],
    [approvedRequests, itemOptionsResponse?.data?.length, pendingStockRequests.length, readyToIssueRequests.length]
  );

  const issueMutation = useMutation({
    mutationFn: (payload) => api.patch(`/stores/req/${selectedRecord?.id}/issue`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(["ITD-Approved"]);
      toast.success("Issued successfully");
      setIsModalOpen(false);
      setSelectedItem(null);
      setSelectedBatch(null);
      setSelectedRecord(null);
      setQuantity(1);
      setRemarks("");
    },
  });

  const pendingStockMutation = useMutation({
    mutationFn: (payload) => api.patch(`/stores/req/${selectedRecord?.id}/pending-stock`, payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries(["ITD-Approved"]);
      toast.success(response?.data?.message || "Requisition moved to pending stock issuance");
      setIsModalOpen(false);
      setSelectedItem(null);
      setSelectedBatch(null);
      setSelectedRecord(null);
      setQuantity(1);
      setRemarks("");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to update requisition status");
    },
  });

  const thresholdMutation = useMutation({
    mutationFn: ({ itItemId, threshold }) => api.patch(`/stores/stock/${itItemId}/reorder-threshold`, { threshold }),
    onSuccess: () => {
      toast.success("Reorder threshold updated");
      queryClient.invalidateQueries(["stockLevels"]);
      setThresholdModalOpen(false);
      setThresholdItem(null);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to update threshold"),
  });

  const createAdjMutation = useMutation({
    mutationFn: (data) => api.post("/stores/stock-adjustments", data),
    onSuccess: () => {
      toast.success("Adjustment request submitted");
      adjForm.resetFields();
      setAdjModalOpen(false);
      refetchAdjustments();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to submit adjustment"),
  });

  const approveAdjMutation = useMutation({
    mutationFn: (id) => api.patch(`/stores/stock-adjustments/${id}/approve`),
    onSuccess: () => {
      toast.success("Adjustment approved and stock updated");
      refetchAdjustments();
      queryClient.invalidateQueries(["stockLevels"]);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to approve"),
  });

  const rejectAdjMutation = useMutation({
    mutationFn: ({ id, rejectReason }) => api.patch(`/stores/stock-adjustments/${id}/reject`, { rejectReason }),
    onSuccess: () => {
      toast.success("Adjustment rejected");
      refetchAdjustments();
      setApproveAdjModalOpen(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to reject"),
  });

  const createReturnMutation = useMutation({
    mutationFn: (data) => api.post("/stores/returns", data),
    onSuccess: () => {
      toast.success("Return request submitted");
      returnForm.resetFields();
      setReturnModalOpen(false);
      refetchReturns();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to submit return"),
  });

  const acceptReturnMutation = useMutation({
    mutationFn: (id) => api.patch(`/stores/returns/${id}/accept`),
    onSuccess: () => {
      toast.success("Return accepted and stock restored");
      refetchReturns();
      queryClient.invalidateQueries(["stockLevels"]);
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to accept return"),
  });

  const rejectReturnMutation = useMutation({
    mutationFn: (id) => api.patch(`/stores/returns/${id}/reject`, {}),
    onSuccess: () => {
      toast.success("Return rejected");
      refetchReturns();
    },
    onError: (err) => toast.error(err?.response?.data?.message || "Failed to reject return"),
  });

  const columns = [
    {
      title: "Category",
      dataIndex: ["category", "name"],
      key: "category",
      render: (value) => value || "N/A",
    },
    {
      title: "Item Description",
      dataIndex: "itemDescription",
      key: "itemDescription",
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (value) => <span className="font-semibold text-[#212121]">{value}</span>,
    },
    {
      title: "Purpose",
      dataIndex: "purpose",
      key: "purpose",
    },
    {
      title: "Source",
      dataIndex: "type",
      key: "type",
      render: (type, record) => (
        <div className="flex flex-col gap-1">
          <Tag
            className={`w-fit rounded-full border-0 px-3 py-1 text-xs font-semibold ${
              REQUEST_TYPE_STYLES[type] || "bg-[#F3F4F6] text-[#374151]"
            }`}
          >
            {type === "MAINTENANCE" ? "Maintenance" : "Standard"}
          </Tag>
          {record.maintenanceTicket?.ticketId ? (
            <span className="text-xs text-[#616161]">{record.maintenanceTicket.ticketId}</span>
          ) : null}
        </div>
      ),
    },
    {
      title: "Room No.",
      dataIndex: "roomNo",
      key: "roomNo",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          className={`rounded-full border-0 px-3 py-1 text-xs font-semibold ${
            STATUS_STYLES[status] || "bg-[#F3F4F6] text-[#374151]"
          }`}
        >
          {formatCapitalizedLabel(status)}
        </Tag>
      ),
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
      title: "Staff Name",
      dataIndex: ["staff", "name"],
      key: "staffName",
    },
    {
      title: "Requested By",
      key: "requestedBy",
      render: (_, record) => record.requestedByTechnician?.name || record.staff?.name || "-",
    },
    {
      title: "Issue",
      key: "issue",
      render: (_, record) => (
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ECFDF3] text-[#166534] transition-colors duration-200 hover:bg-[#DCFCE7]"
          onClick={() => {
            setIsModalOpen(true);
            setSelectedRecord(record);
          }}
        >
          <LuCheck />
        </button>
      ),
    },
  ];

  return (
    <PageShell
      eyebrow="Stores Fulfillment"
      title="Issue Approved Requests"
      description="Match approved standard and maintenance requisitions to available stock batches and issue items with cleaner fulfillment controls."
      stats={stats}
      actions={
        <Input
          placeholder="Search approved requests"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          prefix={<SearchOutlined />}
          className="w-full md:w-[280px]"
        />
      }
    >
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#616161]">Fulfillment Queue</p>
            <h3 className="text-xl font-bold text-[#212121]">Approved requisitions ready to issue</h3>
          </div>
          <span className="rounded-full bg-[#FFEBEE] px-3 py-1 text-xs font-semibold text-[#D32F2F]">
            Stock assignment required
          </span>
        </div>

        <Table columns={columns} dataSource={approvedRequests} rowKey="id" loading={isLoading} scroll={{ x: 1000 }} />
      </section>

      <Modal
        title="Issue Item"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setSelectedItem(null);
          setSelectedBatch(null);
          setSelectedRecord(null);
          setQuantity(1);
          setRemarks("");
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsModalOpen(false);
              setSelectedItem(null);
              setSelectedBatch(null);
              setSelectedRecord(null);
              setQuantity(1);
              setRemarks("");
            }}
          >
            Cancel
          </Button>,
          <Button
            key="issue"
            type="primary"
            onClick={() => {
              issueMutation.mutate({
                itItemId: selectedItem,
                quantity,
                stockBatchId: selectedBatch,
                remarks,
              });
            }}
            loading={issueMutation.isPending}
            disabled={!selectedItem || !selectedBatch || quantity <= 0 || pendingStockMutation.isPending}
          >
            Issue
          </Button>,
          <Button
            key="pending-stock"
            onClick={() => pendingStockMutation.mutate({ remarks })}
            loading={pendingStockMutation.isPending}
            disabled={issueMutation.isPending || pendingStockMutation.isPending || !selectedRecord}
          >
            Pending Stock
          </Button>,
        ]}
      >
        <div className="mb-4 rounded-2xl bg-[#F9FAFB] p-4">
          <p className="text-sm font-semibold text-[#212121]">
            Request: {selectedRecord?.itemDescription || "-"}
          </p>
          <p className="mt-1 text-sm text-[#616161]">
            Requested by {selectedRecord?.staff?.name || "-"}
          </p>
          <p className="mt-1 text-sm text-[#616161]">
            Category: {selectedRecord?.category?.name || "-"}
          </p>
        </div>

        <div className="mb-4">
          <label className="mb-1 block font-semibold text-[#212121]">Select IT Item</label>
          <Select
            style={{ width: "100%" }}
            placeholder="Requested category items appear first"
            loading={isFilteredItemsLoading || isItemsLoading}
            onChange={(value) => {
              setSelectedItem(value);
              setSelectedBatch(null);
            }}
            value={selectedItem}
          >
            {requestedCategoryOptions.length ? (
              <Select.OptGroup label="Requested Category">
                {requestedCategoryOptions.map((item) => (
                  <Select.Option key={item.id} value={item.id}>
                    {(item.category?.name || formatCapitalizedLabel(item.deviceType))} - {item.brand} {item.model} (Stock: {item.stock?.quantityInStock ?? 0})
                  </Select.Option>
                ))}
              </Select.OptGroup>
            ) : null}
            {alternativeCategoryOptions.length ? (
              <Select.OptGroup label="Other Categories">
                {alternativeCategoryOptions.map((item) => (
                  <Select.Option key={item.id} value={item.id}>
                    {(item.category?.name || formatCapitalizedLabel(item.deviceType))} - {item.brand} {item.model} (Stock: {item.stock?.quantityInStock ?? 0})
                  </Select.Option>
                ))}
              </Select.OptGroup>
            ) : null}
          </Select>
          {!requestedCategoryOptions.length && selectedRecord?.category?.name ? (
            <p className="mt-2 text-xs text-[#9A3412]">
              No in-stock item currently matches the requested category. You can issue an alternative item or mark the requisition as pending stock issuance.
            </p>
          ) : null}
        </div>

        <div className="mb-4">
          <label className="mb-1 block font-semibold text-[#212121]">Select Stock Batch</label>
          <Select
            style={{ width: "100%" }}
            placeholder="Select Stock Batch"
            loading={isBatchesLoading}
            disabled={!selectedItem}
            onChange={(value) => setSelectedBatch(value)}
            value={selectedBatch}
          >
            {batchesData?.map((batch) => (
              <Select.Option key={batch.id} value={batch.id}>
                Batch: {batch.batchCode} - Qty: {batch.quantity}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div className="mb-4">
          <label className="mb-1 block font-semibold text-[#212121]">Quantity</label>
          <InputNumber
            min={1}
            max={
              issueItemOptions?.find((item) => item.id === selectedItem)?.stock
                ?.quantityInStock || 100
            }
            value={quantity}
            onChange={(value) => setQuantity(Number(value || 0))}
            className="w-full"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1 block font-semibold text-[#212121]">Remarks</label>
          <Input value={remarks} onChange={(event) => setRemarks(event.target.value)} />
        </div>
      </Modal>

      {/* ── Stock Levels + Reorder Threshold ─────────────────────────────── */}
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#616161]">Stock Levels</p>
            <h3 className="text-xl font-bold text-[#212121]">Current inventory per item</h3>
          </div>
          <span className="rounded-full bg-[#FFF3CD] px-3 py-1 text-xs font-semibold text-[#92400E]">Thresholds editable</span>
        </div>
        <Table
          size="small"
          dataSource={stockLevelsRes?.data?.data || []}
          rowKey="id"
          scroll={{ x: 800 }}
          columns={[
            { title: "Brand", dataIndex: ["itItem", "brand"] },
            { title: "Model", dataIndex: ["itItem", "model"] },
            { title: "Category", dataIndex: ["itItem", "category", "name"], render: (v, r) => v || formatCapitalizedLabel(r.itItem?.deviceType) },
            {
              title: "In Stock",
              dataIndex: "quantityInStock",
              render: (qty, record) => {
                const below = record.reorderThreshold != null && qty <= record.reorderThreshold;
                return (
                  <span className={`font-bold ${below ? "text-[#D32F2F]" : "text-[#166534]"}`}>
                    {qty}
                    {below ? <Tag className="ml-2 rounded-full border-0 bg-[#FFEBEE] px-2 py-0.5 text-xs font-semibold text-[#D32F2F]">Low Stock</Tag> : null}
                  </span>
                );
              },
            },
            {
              title: "Reorder Threshold",
              dataIndex: "reorderThreshold",
              render: (v) => (v != null ? v : <span className="text-[#9CA3AF]">Not set</span>),
            },
            {
              title: "Actions",
              render: (_, record) => (
                <button
                  type="button"
                  className="flex items-center gap-1 rounded-xl bg-[#F0F9FF] px-3 py-1.5 text-xs font-semibold text-[#0369A1] hover:bg-[#E0F2FE]"
                  onClick={() => { setThresholdItem(record); setThresholdModalOpen(true); }}
                >
                  <LuSettings2 size={12} /> Set Threshold
                </button>
              ),
            },
          ]}
        />
      </section>

      {/* ── Stock Adjustments ─────────────────────────────────────────────── */}
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#616161]">Stock Adjustments</p>
            <h3 className="text-xl font-bold text-[#212121]">Adjustments pending approval</h3>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl bg-[#EFF6FF] px-4 py-2 text-sm font-semibold text-[#1D4ED8] hover:bg-[#DBEAFE]"
            onClick={() => setAdjModalOpen(true)}
          >
            <LuClipboardList size={14} /> New Adjustment
          </button>
        </div>
        <Table
          size="small"
          dataSource={adjustmentsRes?.data || []}
          rowKey="id"
          scroll={{ x: 900 }}
          columns={[
            { title: "Item", render: (_, r) => `${r.itItem?.brand} ${r.itItem?.model}` },
            { title: "Delta", dataIndex: "quantityDelta", render: (v) => <span className={v < 0 ? "font-bold text-[#D32F2F]" : "font-bold text-[#166534]"}>{v > 0 ? `+${v}` : v}</span> },
            { title: "Reason", dataIndex: "reason", render: (v) => formatCapitalizedLabel(v) },
            { title: "Justification", dataIndex: "justification", ellipsis: true },
            { title: "Submitted By", dataIndex: ["adjustedBy", "name"] },
            {
              title: "Status",
              dataIndex: "status",
              render: (s) => (
                <Tag className={`rounded-full border-0 px-2 py-0.5 text-xs font-semibold ${
                  s === "APPROVED" ? "bg-[#ECFDF3] text-[#166534]"
                  : s === "REJECTED" ? "bg-[#FEF2F2] text-[#B91C1C]"
                  : "bg-[#FFF7ED] text-[#C2410C]"
                }`}>{formatCapitalizedLabel(s)}</Tag>
              ),
            },
            {
              title: "Actions",
              render: (_, r) => r.status === "PENDING" ? (
                <div className="flex gap-2">
                  <button type="button" className="rounded-xl bg-[#ECFDF3] px-2 py-1 text-xs font-semibold text-[#166534] hover:bg-[#D1FAE5]" onClick={() => approveAdjMutation.mutate(r.id)}>Approve</button>
                  <button type="button" className="rounded-xl bg-[#FEF2F2] px-2 py-1 text-xs font-semibold text-[#B91C1C] hover:bg-[#FEE2E2]" onClick={() => { setSelectedAdjRecord(r); setApproveAdjModalOpen(true); }}>Reject</button>
                </div>
              ) : null,
            },
          ]}
        />
      </section>

      {/* ── Stock Returns ─────────────────────────────────────────────────── */}
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#616161]">Stock Returns</p>
            <h3 className="text-xl font-bold text-[#212121]">Issued items returned to stock</h3>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl bg-[#F0FDF4] px-4 py-2 text-sm font-semibold text-[#166534] hover:bg-[#DCFCE7]"
            onClick={() => setReturnModalOpen(true)}
          >
            <LuRefreshCw size={14} /> Log Return
          </button>
        </div>
        <Table
          size="small"
          dataSource={returnsRes?.data || []}
          rowKey="id"
          scroll={{ x: 900 }}
          columns={[
            { title: "Item", render: (_, r) => `${r.itItem?.brand} ${r.itItem?.model}` },
            { title: "Qty", dataIndex: "quantity" },
            { title: "Reason", dataIndex: "reason", ellipsis: true },
            { title: "Returned By", dataIndex: ["returnedBy", "name"] },
            {
              title: "Status",
              dataIndex: "status",
              render: (s) => (
                <Tag className={`rounded-full border-0 px-2 py-0.5 text-xs font-semibold ${
                  s === "ACCEPTED" ? "bg-[#ECFDF3] text-[#166534]"
                  : s === "REJECTED" ? "bg-[#FEF2F2] text-[#B91C1C]"
                  : "bg-[#FFF7ED] text-[#C2410C]"
                }`}>{formatCapitalizedLabel(s)}</Tag>
              ),
            },
            {
              title: "Actions",
              render: (_, r) => r.status === "PENDING" ? (
                <div className="flex gap-2">
                  <button type="button" className="rounded-xl bg-[#ECFDF3] px-2 py-1 text-xs font-semibold text-[#166534] hover:bg-[#D1FAE5]" onClick={() => acceptReturnMutation.mutate(r.id)}>Accept</button>
                  <button type="button" className="rounded-xl bg-[#FEF2F2] px-2 py-1 text-xs font-semibold text-[#B91C1C] hover:bg-[#FEE2E2]" onClick={() => rejectReturnMutation.mutate(r.id)}>Reject</button>
                </div>
              ) : null,
            },
          ]}
        />
      </section>

      {/* ── Reorder Threshold Modal ───────────────────────────────────────── */}
      <Modal
        title={`Set Reorder Threshold — ${thresholdItem?.itItem?.brand} ${thresholdItem?.itItem?.model}`}
        open={thresholdModalOpen}
        onCancel={() => { setThresholdModalOpen(false); setThresholdItem(null); }}
        onOk={() => {
          const el = document.getElementById("threshold-input");
          const val = parseInt(el?.value || "0", 10);
          if (!isNaN(val) && val >= 0) thresholdMutation.mutate({ itItemId: thresholdItem?.itItemId, threshold: val });
        }}
        confirmLoading={thresholdMutation.isPending}
      >
        <p className="mb-3 text-sm text-[#616161]">Current stock: <strong>{thresholdItem?.quantityInStock ?? "—"}</strong></p>
        <label className="mb-1 block text-sm font-semibold text-[#212121]">New Threshold</label>
        <input
          id="threshold-input"
          type="number"
          min={0}
          defaultValue={thresholdItem?.reorderThreshold ?? 0}
          key={thresholdItem?.id}
          className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm focus:border-[#2563EB] focus:outline-none"
        />
      </Modal>

      {/* ── New Adjustment Modal ──────────────────────────────────────────── */}
      <Modal
        title="Request Stock Adjustment"
        open={adjModalOpen}
        onCancel={() => { adjForm.resetFields(); setAdjModalOpen(false); }}
        footer={null}
      >
        <Form form={adjForm} layout="vertical" onFinish={(v) => createAdjMutation.mutate(v)}>
          <Form.Item name="itItemId" label="IT Item" rules={[{ required: true }]}>
            <Select showSearch placeholder="Select item" optionFilterProp="label">
              {(stockLevelsRes?.data?.data || []).map((s) => (
                <Select.Option key={s.itItemId} value={s.itItemId} label={`${s.itItem?.brand} ${s.itItem?.model}`}>
                  {s.itItem?.brand} {s.itItem?.model} (Stock: {s.quantityInStock})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="quantityDelta" label="Quantity Delta (negative to reduce)" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} placeholder="e.g. -5 to deduct, +3 to add" />
          </Form.Item>
          <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
            <Select>
              {["DAMAGED", "THEFT", "WRITE_OFF", "COUNT_CORRECTION"].map((r) => (
                <Select.Option key={r} value={r}>{formatCapitalizedLabel(r)}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="justification" label="Justification" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button htmlType="submit" type="primary" loading={createAdjMutation.isPending} block>Submit Adjustment</Button>
        </Form>
      </Modal>

      {/* ── Reject Adjustment Modal ───────────────────────────────────────── */}
      <Modal
        title="Reject Adjustment"
        open={approveAdjModalOpen}
        onCancel={() => { rejectAdjForm.resetFields(); setApproveAdjModalOpen(false); }}
        footer={null}
      >
        <Form form={rejectAdjForm} layout="vertical" onFinish={(v) => rejectAdjMutation.mutate({ id: selectedAdjRecord?.id, rejectReason: v.rejectReason })}>
          <Form.Item name="rejectReason" label="Reason for rejection">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button htmlType="submit" type="primary" danger loading={rejectAdjMutation.isPending} block>Confirm Rejection</Button>
        </Form>
      </Modal>

      {/* ── Log Return Modal ──────────────────────────────────────────────── */}
      <Modal
        title="Log Stock Return"
        open={returnModalOpen}
        onCancel={() => { returnForm.resetFields(); setReturnModalOpen(false); }}
        footer={null}
      >
        <Form form={returnForm} layout="vertical" onFinish={(v) => createReturnMutation.mutate(v)}>
          <Form.Item name="stockIssuedId" label="Stock Issued Record ID" rules={[{ required: true }]}>
            <Select showSearch placeholder="Select issued record" optionFilterProp="label">
              {(stockIssuedRes?.data?.data || []).map((r) => (
                <Select.Option key={r.id} value={r.id} label={`${r.itItem?.brand} ${r.itItem?.model} — ${new Date(r.issueDate).toLocaleDateString()}`}>
                  {r.itItem?.brand} {r.itItem?.model} — Issued {new Date(r.issueDate).toLocaleDateString()} (Qty: {r.quantityIssued})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="itItemId" label="IT Item" rules={[{ required: true }]}>
            <Select showSearch placeholder="Select item" optionFilterProp="label">
              {(stockLevelsRes?.data?.data || []).map((s) => (
                <Select.Option key={s.itItemId} value={s.itItemId} label={`${s.itItem?.brand} ${s.itItem?.model}`}>
                  {s.itItem?.brand} {s.itItem?.model}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="quantity" label="Return Quantity" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="reason" label="Reason for Return" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Button htmlType="submit" type="primary" loading={createReturnMutation.isPending} block>Submit Return</Button>
        </Form>
      </Modal>
    </PageShell>
  );
};

export default StoresOfficer;
