import React, { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Input, InputNumber, Modal, Select, Table, Tag } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { LuCheck } from "react-icons/lu";
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

const getIssueItemLabel = (item) =>
  `${item.category?.name || formatCapitalizedLabel(item.deviceType)} - ${item.brand || ""} ${item.model || ""} (Stock: ${item.stock?.quantityInStock ?? 0})`;

const getIssueItemSearchText = (item) =>
  [
    item.category?.name,
    item.deviceType,
    formatCapitalizedLabel(item.deviceType),
    item.brand,
    item.model,
    item.stock?.quantityInStock,
  ]
    .filter((value) => value !== undefined && value !== null && value !== "")
    .join(" ")
    .toLowerCase();

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

  const approvedRequests = approvedResponse?.data || [];
  const issueItemOptions = filteredItemOptionsResponse?.data || [];
  const requestedCategoryOptions = issueItemOptions.filter((item) => item.matchesRequestedCategory);
  const alternativeCategoryOptions = issueItemOptions.filter((item) => !item.matchesRequestedCategory);
  const selectedBatchData = batchesData?.find((batch) => batch.id === selectedBatch);
  const selectedItemStock = issueItemOptions?.find((item) => item.id === selectedItem)?.stock?.quantityInStock;
  const selectedBatchQuantity = Number(selectedBatchData?.availableQuantity ?? selectedBatchData?.quantity ?? 0);
  const requestedQuantity = Number(selectedRecord?.quantity || 0);
  const maxIssuableQuantity = Math.max(
    0,
    Math.min(
      selectedItemStock == null ? Number.POSITIVE_INFINITY : Number(selectedItemStock),
      selectedBatch ? selectedBatchQuantity : Number.POSITIVE_INFINITY,
      requestedQuantity || Number.POSITIVE_INFINITY,
    )
  );
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

  const resetIssueModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    setSelectedBatch(null);
    setSelectedRecord(null);
    setQuantity(1);
    setRemarks("");
  };

  const getRecordId = (record) => record?.id || record?.requisitionID;

  const issueMutation = useMutation({
    mutationFn: ({ recordId, ...payload }) => api.patch(`/stores/req/${recordId}/issue`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ITD-Approved"] });
      queryClient.invalidateQueries({ queryKey: ["stockLevels"] });
      queryClient.invalidateQueries({ queryKey: ["stockIssuedList"] });
      queryClient.invalidateQueries({ queryKey: ["requisition"] });
      queryClient.invalidateQueries({ queryKey: ["requisitions"] });
      toast.success("Issued successfully");
      resetIssueModal();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to issue item");
    },
  });

  const pendingStockMutation = useMutation({
    mutationFn: ({ recordId, ...payload }) => api.patch(`/stores/req/${recordId}/pending-stock`, payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["ITD-Approved"] });
      queryClient.invalidateQueries({ queryKey: ["requisition"] });
      queryClient.invalidateQueries({ queryKey: ["requisitions"] });
      toast.success(response?.data?.message || "Requisition moved to pending stock issuance");
      resetIssueModal();
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to update requisition status");
    },
  });

  const handleIssue = () => {
    const recordId = getRecordId(selectedRecord);
    if (!recordId) {
      toast.error("Unable to issue this request. Missing requisition ID.");
      return;
    }

    if (!selectedItem || !selectedBatch) {
      toast.error("Select an item and stock batch before issuing.");
      return;
    }

    if (!quantity || quantity < 1 || quantity > maxIssuableQuantity) {
      toast.error(`Quantity must be between 1 and ${maxIssuableQuantity || 1}.`);
      return;
    }

    issueMutation.mutate({
      recordId,
      itItemId: selectedItem,
      quantity,
      stockBatchId: selectedBatch,
      remarks: remarks.trim() || undefined,
    });
  };

  const handlePendingStock = () => {
    const recordId = getRecordId(selectedRecord);
    if (!recordId) {
      toast.error("Unable to mark this request as pending stock. Missing requisition ID.");
      return;
    }

    pendingStockMutation.mutate({ recordId, remarks: remarks.trim() || undefined });
  };

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
        }),
    },
    {
      title: "Requester",
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
            setSelectedRecord(record);
            setSelectedItem(null);
            setSelectedBatch(null);
            setQuantity(Math.max(1, Number(record.quantity || 1)));
            setRemarks("");
            setIsModalOpen(true);
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

        <Table columns={columns} dataSource={approvedRequests} rowKey={(record) => record.id || record.requisitionID} loading={isLoading} scroll={{ x: 1000 }} />
      </section>

      <Modal
        title="Issue Item"
        open={isModalOpen}
        onCancel={resetIssueModal}
        footer={[
          <Button
            key="cancel"
            onClick={resetIssueModal}
          >
            Cancel
          </Button>,
          <Button
            key="issue"
            type="primary"
            onClick={handleIssue}
            loading={issueMutation.isPending}
            disabled={!selectedItem || !selectedBatch || quantity <= 0 || quantity > maxIssuableQuantity || pendingStockMutation.isPending}
          >
            Issue
          </Button>,
          <Button
            key="pending-stock"
            onClick={handlePendingStock}
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
            showSearch
            allowClear
            optionFilterProp="searchText"
            filterOption={(input, option) =>
              String(option?.searchText || "")
                .toLowerCase()
                .includes(input.trim().toLowerCase())
            }
            onChange={(value) => {
              setSelectedItem(value);
              setSelectedBatch(null);
              setQuantity(1);
            }}
            onClear={() => {
              setSelectedItem(null);
              setSelectedBatch(null);
              setQuantity(1);
            }}
            value={selectedItem}
          >
            {requestedCategoryOptions.length ? (
              <Select.OptGroup label="Requested Category">
                {requestedCategoryOptions.map((item) => (
                  <Select.Option key={item.id} value={item.id} searchText={getIssueItemSearchText(item)}>
                    {getIssueItemLabel(item)}
                  </Select.Option>
                ))}
              </Select.OptGroup>
            ) : null}
            {alternativeCategoryOptions.length ? (
              <Select.OptGroup label="Other Categories">
                {alternativeCategoryOptions.map((item) => (
                  <Select.Option key={item.id} value={item.id} searchText={getIssueItemSearchText(item)}>
                    {getIssueItemLabel(item)}
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
            onChange={(value) => {
              const batch = batchesData?.find((item) => item.id === value);
              const batchQuantity = Number(batch?.availableQuantity ?? batch?.quantity ?? 1);
              setSelectedBatch(value);
              setQuantity(Math.max(1, Math.min(quantity || 1, batchQuantity, requestedQuantity || batchQuantity)));
            }}
            value={selectedBatch}
          >
            {batchesData?.map((batch) => (
              <Select.Option key={batch.id} value={batch.id}>
                Batch: {batch.batchCode} — Qty: {batch.quantity} | Serial: {batch.stockReceived?.serialNumber || "—"}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div className="mb-4">
          <label className="mb-1 block font-semibold text-[#212121]">Quantity</label>
          <InputNumber
            min={1}
            max={maxIssuableQuantity || 1}
            value={quantity}
            onChange={(value) => setQuantity(Number(value || 0))}
            className="w-full"
          />
          {selectedBatch ? (
            <p className="mt-2 text-xs text-[#616161]">
              Max issuable from this request and batch: {maxIssuableQuantity}
            </p>
          ) : null}
        </div>

        <div className="mb-4">
          <label className="mb-1 block font-semibold text-[#212121]">Remarks</label>
          <Input value={remarks} onChange={(event) => setRemarks(event.target.value)} />
        </div>
      </Modal>

    </PageShell>
  );
};

export default StoresOfficer;
