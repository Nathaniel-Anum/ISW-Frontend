import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Input,
  Modal,
  Popconfirm,
  Popover,
  Space,
  Table,
  Tag,
} from "antd";
import api from "../utils/config";
import { AiOutlineCheck, AiOutlineClose } from "react-icons/ai";
import { toast } from "react-toastify";

const ITDApproval = () => {
  const queryClient = useQueryClient();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const { data: approval } = useQuery({
    queryKey: ["approval"],
    queryFn: () => {
      return api.get("/itd/requisitions");
    },
  });

  console.log(approval);

  const columns = [
    // {
    //   title: "Requisition ID",
    //   dataIndex: "requisitionID",
    //   key: "requisitionID"
    // },
    {
      title: "Staff Name",
      dataIndex: ["staff", "name"],
      key: "staffName",
    },
    // {
    //   title: "Staff Email",
    //   dataIndex: ["staff", "email"],
    //   key: "staffEmail"
    // },
    {
      title: "Item Description",
      dataIndex: "itemDescription",
      key: "itemDescription",
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
    },
    {
      title: "Urgency",
      dataIndex: "urgency",
      key: "urgency",
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
        <Tag color={"blue"}>{status.replaceAll("_", " ")}</Tag>
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
          {/* Approve Popconfirm */}
          <Popconfirm
            title="Are you sure?"
            onConfirm={() => handleApprove(record)}
            onCancel={() => handleCancel("approve")}
            okText="Yes"
            cancelText="No"
          >
            <Popover content="Approve">
              <AiOutlineCheck style={{ color: "green", cursor: "pointer" }} />
            </Popover>
          </Popconfirm>

          {/* Decline Popconfirm */}
          <Popover content="Decline">
            <AiOutlineClose
              style={{ color: "red", cursor: "pointer" }}
              onClick={() => showDeclineModal(record)}
            />
          </Popover>
        </Space>
      ),
    },
  ];

  //Mutation function to approve requisition
  const approveRequestMutation = useMutation({
    mutationFn: (recordId) => api.patch(`/itd/req/${recordId}/approve`),
    onSuccess: () => {
      toast.success("Requisition approved!");

      queryClient.invalidateQueries(["requisition"]);
    },
    onError: () => {
      toast.error("Failed to approve request.");
    },
  });

  const handleApprove = (record) => {
    approveRequestMutation.mutate(record?.id);
  };

  //Mutation to deline request
  const declineRequestMutation = useMutation({
    mutationFn: ({ id, reason }) =>
      api.patch(`/itd/req/${id}/decline`, { reason }),

    onSuccess: () => {
      toast.success("Requisition declined!");
      queryClient.invalidateQueries(["requisition"]);
      setIsModalVisible(false);
      setDeclineReason("");
      setSelectedRecord(null);
    },

    onError: () => {
      toast.error("Failed to decline requisition.");
    },
  });

  const handleDecline = () => {
    if (!declineReason.trim()) {
      toast.error("Please provide a reason for declining");
      return;
    }

    declineRequestMutation.mutate({
      id: selectedRecord?.id,
      reason: declineReason,
    });
  };

  // Function to open modal instead of direct confirmation
  const showDeclineModal = (record) => {
    console.log(record);
    setSelectedRecord(record);
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setDeclineReason("");
    setSelectedRecord(null);
  };
  return (
    <div className="px-[3rem] py-[2rem]">
      <div className="pl-[6rem] pt-6">
        <Table
          dataSource={approval?.data || []}
          columns={columns}
          rowKey="id"
        />
      </div>
      <Modal
        title="Decline Request"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button key="decline" type="primary" danger onClick={handleDecline}>
            Decline
          </Button>,
        ]}
      >
        <p>Please provide a reason for declining this request:</p>
        <Input.TextArea
          rows={4}
          value={declineReason}
          onChange={(e) => setDeclineReason(e.target.value)}
          placeholder="Enter decline reason..."
        />
      </Modal>
    </div>
  );
};

export default ITDApproval;
