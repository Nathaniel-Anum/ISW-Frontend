import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import React, { useState } from "react";
import api from "../utils/config";
import { Button, Input, Modal, Select, Table, Tag } from "antd";
import { AiOutlineCheck } from "react-icons/ai";
import { toast } from "react-toastify";

const StoresOfficer = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [disbursementNote, setDisbursementNote] = useState("");
  const [remarks, setRemarks] = useState("");

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
    // {
    //   title: "Urgency",
    //   dataIndex: "urgency",
    //   key: "urgency",
    //   render: (urgency) => (
    //     <Tag
    //       color={
    //         urgency === "HIGH"
    //           ? "red"
    //           : urgency === "MEDIUM"
    //           ? "orange"
    //           : "green"
    //       }
    //     >
    //       {urgency}
    //     </Tag>
    //   ),
    // },
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
    mutationFn: async (payload) => {
      return api.patch(`/stores/req/${selectedRecord?.id}/issue`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["requisition"]); // adjust if needed
      toast.success("Issued successfully");
      setIsModalOpen(false);
      setSelectedItem(null);
      setSelectedRecord(null);
      setRemarks("");
      setDisbursementNote("");
    },
  });
  return (
    <div className="px-[3rem] py-[2rem]">
      <div>
        <div className="pl-[6rem] pt-6">
          <Table
            columns={columns}
            dataSource={approved?.data || []}
            rowKey="id"
          />
        </div>
      </div>
      <Modal
        title="Issue Item"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setSelectedItem(null);
          setSelectedBatch(null);
          setSelectedRecord(null);
        }}
        footer={[
          <Button key="cancel" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>,
          <Button
            type="primary"
            onClick={() => {
              const payload = {
                itItemId: selectedItem,
                quantity,
                stockBatchId: selectedBatch,
                disbursementNote,
                remarks,
              };
              console.log("Issuing payload:", payload); // 👈 this logs to your console
              issueMutation.mutate(payload);
            }}
            loading={issueMutation.isLoading}
            disabled={!selectedItem || !selectedBatch || quantity <= 0}
          >
            Issue
          </Button>,
        ]}
      >
        {/* First Select: IT Item */}
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Select IT Item</label>
          <Select
            style={{ width: "100%" }}
            placeholder="Select IT Item"
            loading={isLoading}
            onChange={(value) => {
              setSelectedItem(value);
              setSelectedBatch(null); // reset batch if IT item changes
            }}
            value={selectedItem}
          >
            {itemOptionsData?.data?.map((item) => (
              <Option key={item.id} value={item.id}>
                {item.deviceType} - {item.brand} {item.model} (Stock:{" "}
                {item.stock?.quantityInStock ?? 0})
              </Option>
            ))}
          </Select>
        </div>

        {/* Second Select: Stock Batch */}
        <div>
          <label className="block mb-1 font-semibold">Select Stock Batch</label>
          <Select
            style={{ width: "100%" }}
            placeholder="Select Stock Batch"
            loading={isBatchesLoading}
            disabled={!selectedItem}
            onChange={(value) => setSelectedBatch(value)}
            value={selectedBatch}
          >
            {batchesData?.map((batch) => (
              <Option key={batch.id} value={batch.id}>
                Batch: {batch.batchCode} — Qty: {batch.quantity}
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
              itemOptionsData?.data?.find((item) => item.id === selectedItem)
                ?.stock?.quantityInStock || 100
            }
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </div>
        {/* Disbursement Note */}
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Disbursement Note</label>
          <Input
            value={disbursementNote}
            onChange={(e) => setDisbursementNote(e.target.value)}
          />
        </div>
        {/* Remarks */}
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Remarks</label>
          <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </div>
      </Modal>
    </div>
  );
};

export default StoresOfficer;
