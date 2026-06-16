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
                Batch: {batch.batchCode} — Qty: {batch.quantity} | Serial: {batch.stockReceived?.serialNumber || "—"}
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

    </PageShell>
  );
};

export default StoresOfficer;
