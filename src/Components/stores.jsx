import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import React, { useState } from "react";
import api from "../utils/config";
import { Button, Input, Modal, Select, Table, Tag } from "antd";
import { AiOutlineCheck } from "react-icons/ai";

const StoresOfficer = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [disbursementNote, setDisbursementNote] = useState("");
  const [remarks, setRemarks] = useState("");
  const [quantity, setQuantity] = useState(1);

  //useQuery for stores items
  const { data: itemOptionsData, isLoading } = useQuery({
    queryKey: ["storesOfficer"],
    queryFn: () => {
      return api.get("/stores/it-items");
    },
  });
  //   console.log(itemOptionsData?.data);

  //useQuery for stockbatches
  //   const { data: stockbatches } = useQuery({
  //     queryKey: ["stock-batches"],
  //     queryFn: () => {
  //       return api.get("/stores/stock-batches");
  //     },
  //   });
  //   console.log(stockbatches?.data);

  const { data: batchesData, isLoading: isBatchesLoading } = useQuery({
    queryKey: ["stockBatches", selectedItem],
    queryFn: async () => {
      const res = await api.get(
        `/stores/stock-batches?itItemId=${selectedItem}`
      );
      return res.data;
    },
    enabled: !!selectedItem, // Only run if an IT item is selected
  });

  //useQuery for ITD Approved

  const { data: approved } = useQuery({
    queryKey: ["ITD-Approved"],
    queryFn: () => {
      return api.get("/stores/reqs/approved");
    },
  });
  //   console.log(approved?.data);

  const columns = [
    {
      title: "Item Description",
      dataIndex: "itemDescription",
      key: "itemDescription",
    },
    {
      title: "Urgency",
      dataIndex: "urgency",
      key: "urgency",
      render: (urgency) => (
        <Tag
          color={
            urgency === "HIGH"
              ? "red"
              : urgency === "MEDIUM"
              ? "orange"
              : "green"
          }
        >
          {urgency}
        </Tag>
      ),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Purpose",
      dataIndex: "purpose",
      key: "purpose",
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
      render: (status) => <Tag color="blue">{status}</Tag>,
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
      title: "Issue",
      key: "issue",
      render: (_, record) => (
        <AiOutlineCheck
          style={{ color: "green", cursor: "pointer", fontSize: 18 }}
          onClick={() => {
            setIsModalOpen(true);
            console.log(record);
            setSelectedRecord(record);
          }}
        />
      ),
    },
  ];

  // Mutation to issue selected item
  const issueMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/stores/req/${selectedRecord?.id}/issue`, {
        itemId: selectedItem,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["requisition"]); // adjust if needed
      setIsModalOpen(false);
      setSelectedItem(null);
      setSelectedRecord(null);
    },
  });

  const handleClose = () => {
    setSelectedItem(null);
    setSelectedBatch(null);
    setDisbursementNote("");
    setRemarks("");
    setQuantity(1);

  };
  return (
    <div className=" flex justify-center ">
      <div>
        <p>Stores Officer Page.</p>
        <div>
          <Table
            columns={columns}
            dataSource={approved?.data || []}
            rowKey="id"
          />
        </div>
      </div>
      <Modal
      title="Issue IT Item"
      open={isModalOpen}
      onCancel={handleClose}
      footer={null}
      destroyOnClose
    >
      {/* Select IT Item */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Select IT Item</label>
        <Select
          placeholder="Select IT Item"
          style={{ width: "100%" }}
          loading={isBatchesLoading}
          onChange={(value) => {
            setSelectedItem(value);
            setSelectedBatch(null);
          }}
          value={selectedItem}
        >
          {itemOptionsData?.data?.map((item) => (
            <Option key={item.id} value={item.id}>
              {item.deviceType} - {item.brand} {item.model}
            </Option>
          ))}
        </Select>
      </div>

      {/* Select Stock Batch */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Select Stock Batch</label>
        <Select
          placeholder="Select Stock Batch"
          style={{ width: "100%" }}
          onChange={(value) => setSelectedBatch(value)}
          value={selectedBatch}
          disabled={!selectedItem}
        >
          {batchesData?.map((batch) => (
            <Option key={batch.id} value={batch.id}>
              Batch ID: {batch.id} (Qty: {batch.quantityInStock})
            </Option>
          ))}
        </Select>
      </div>

      {/* Quantity Input */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Quantity</label>
        <Input
          type="number"
          min={1}
          max={
            itemOptionsData?.data?.find((item) => item.id === selectedItem)?.stock?.quantityInStock || 100
          }
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
        />
      </div>

      {/* Disbursement Note */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Disbursement Note</label>
        <Input.TextArea
          value={disbursementNote}
          onChange={(e) => setDisbursementNote(e.target.value)}
        />
      </div>

      {/* Remarks */}
      <div className="mb-4">
        <label className="block mb-1 font-semibold">Remarks</label>
        <Input.TextArea value={remarks} onChange={(e) => setRemarks(e.target.value)} />
      </div>

      {/* Issue Button */}
      <div className="flex justify-end">
        <Button
          type="primary"
          onClick={() => issueMutation.mutate()}
          loading={issueMutation.isLoading}
          disabled={!selectedItem || !selectedBatch || quantity <= 0}
        >
          Issue
        </Button>
      </div>
    </Modal>
    </div>
  );
};

export default StoresOfficer;
