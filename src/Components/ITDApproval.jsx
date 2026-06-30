import React, { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Modal, Popconfirm, Space, Table, Tag } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { LuCheck, LuX } from "react-icons/lu";
import { toast } from "react-toastify";
import api from "../utils/config";
import { formatCapitalizedLabel } from "../utils/formatText";
import PageShell from "./ui/page-shell";
import { REQUISITION_STATUS_STYLES as STATUS_STYLES } from "../utils/statusColors";

const ITDApproval = () => {
  const queryClient = useQueryClient();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [searchText, setSearchText] = useState("");
  const deferredSearch = useDeferredValue(searchText.trim());

  const { data: approvalResponse, isLoading } = useQuery({
    queryKey: ["approval", deferredSearch],
    queryFn: () =>
      api.get("/itd/requisitions", {
        params: deferredSearch ? { search: deferredSearch } : undefined,
      }),
  });

  const approvals = approvalResponse?.data || [];
  const getRecordId = (record) => record?.id || record?.requisitionID;

  const stats = useMemo(
    () => [
      {
        label: "ITD Reviews",
        value: approvals.length,
        caption: "Requests in technical queue",
      },
      {
        label: "Requested Units",
        value: approvals.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        caption: "Total quantity under review",
      },
      {
        label: "Departments",
        value: new Set(approvals.map((item) => item.department?.name).filter(Boolean)).size,
        caption: "Represented in queue",
      },
    ],
    [approvals]
  );

  const approveRequestMutation = useMutation({
    mutationFn: (recordId) => api.patch(`/itd/req/${recordId}/approve`),
    onSuccess: () => {
      toast.success("Requisition approved");
      queryClient.invalidateQueries({ queryKey: ["approval"] });
      queryClient.invalidateQueries({ queryKey: ["itd-queue"] });
      queryClient.invalidateQueries({ queryKey: ["requisition"] });
      queryClient.invalidateQueries({ queryKey: ["requisitions"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to approve request.");
    },
  });

  const declineRequestMutation = useMutation({
    mutationFn: ({ id, reason }) => api.patch(`/itd/req/${id}/decline`, { reason }),
    onSuccess: () => {
      toast.success("Requisition declined");
      queryClient.invalidateQueries({ queryKey: ["approval"] });
      queryClient.invalidateQueries({ queryKey: ["itd-queue"] });
      queryClient.invalidateQueries({ queryKey: ["requisition"] });
      queryClient.invalidateQueries({ queryKey: ["requisitions"] });
      setIsModalVisible(false);
      setDeclineReason("");
      setSelectedRecord(null);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Failed to decline requisition.");
    },
  });

  const handleDecline = () => {
    const recordId = getRecordId(selectedRecord);
    const reason = declineReason.trim();

    if (!recordId) {
      toast.error("Unable to decline this requisition. Missing requisition ID.");
      return;
    }

    if (!reason) {
      toast.error("Please provide a reason for declining");
      return;
    }

    declineRequestMutation.mutate({ id: recordId, reason });
  };

  const handleApprove = (record) => {
    const recordId = getRecordId(record);
    if (!recordId) {
      toast.error("Unable to approve this requisition. Missing requisition ID.");
      return;
    }

    approveRequestMutation.mutate(recordId);
  };

  const columns = [
    {
      title: "Staff Name",
      dataIndex: ["staff", "name"],
      key: "staffName",
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
      title: "Urgency",
      dataIndex: "urgency",
      key: "urgency",
      render: (urgency) => urgency || "-",
    },
    {
      title: "Purpose",
      dataIndex: "purpose",
      key: "purpose",
    },
    {
      title: "Department",
      dataIndex: ["department", "name"],
      key: "department",
    },
    {
      title: "Room No",
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
      render: (text) => new Date(text).toLocaleString(),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <Popconfirm
            title="Approve this requisition?"
            onConfirm={() => handleApprove(record)}
            okText="Approve"
            cancelText="Cancel"
          >
            <button
              type="button"
              disabled={approveRequestMutation.isPending || declineRequestMutation.isPending}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ECFDF3] text-[#166534] transition-colors duration-200 hover:bg-[#DCFCE7]"
            >
              <LuCheck />
            </button>
          </Popconfirm>

          <button
            type="button"
            disabled={approveRequestMutation.isPending || declineRequestMutation.isPending}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFEBEE] text-[#B71C1C] transition-colors duration-200 hover:bg-[#FDE2E2] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
              setSelectedRecord(record);
              setDeclineReason("");
              setIsModalVisible(true);
            }}
          >
            <LuX />
          </button>
        </Space>
      ),
    },
  ];

  return (
    <PageShell
      eyebrow="Approval Workflow"
      title="ITD Approval"
      description="Process technically reviewed requisitions with clearer approval controls and a cleaner data layout."
      stats={stats}
      actions={
        <Input
          placeholder="Search ITD queue"
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
            <p className="text-sm font-semibold text-[#616161]">Technical Queue</p>
            <h3 className="text-xl font-bold text-[#212121]">ITD approval requests</h3>
          </div>
          <span className="rounded-full bg-[#FFEBEE] px-3 py-1 text-xs font-semibold text-[#D32F2F]">
            Action required
          </span>
        </div>

        <Table columns={columns} dataSource={approvals} rowKey="id" loading={isLoading} scroll={{ x: 1150 }} />
      </section>

      <Modal
        title="Decline Request"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setDeclineReason("");
          setSelectedRecord(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsModalVisible(false);
              setDeclineReason("");
              setSelectedRecord(null);
            }}
          >
            Cancel
          </Button>,
          <Button key="decline" type="primary" danger onClick={handleDecline} loading={declineRequestMutation.isPending}>
            Decline
          </Button>,
        ]}
      >
        <p className="mb-3 text-sm text-[#616161]">Please provide a reason for declining this request.</p>
        <Input.TextArea
          rows={4}
          value={declineReason}
          onChange={(event) => setDeclineReason(event.target.value)}
          placeholder="Enter decline reason"
        />
      </Modal>
    </PageShell>
  );
};

export default ITDApproval;
