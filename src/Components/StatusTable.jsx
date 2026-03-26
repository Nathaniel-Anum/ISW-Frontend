import React, { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Empty, Table, Tag } from "antd";
import { formatCapitalizedLabel } from "../utils/formatText";
import PageShell from "./ui/page-shell";
import { REQUISITION_STATUS_STYLES as STATUS_STYLES } from "../utils/statusColors";

const formatStatusLabel = (status) => formatCapitalizedLabel(status, "Status");

const StatusTable = () => {
  const location = useLocation();
  const { status, requisitions } = location.state || {};

  const filteredData = requisitions?.filter((item) => item.status === status) || [];

  const stats = useMemo(
    () => [
      {
        label: "Matching Requests",
        value: filteredData.length,
        caption: formatStatusLabel(status),
      },
      {
        label: "Requested Units",
        value: filteredData.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        caption: "Quantity in this filtered view",
      },
    ],
    [filteredData, status]
  );

  const columns = [
    {
      title: "Description",
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
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (currentStatus) => (
        <Tag
          className={`rounded-full border-0 px-3 py-1 text-xs font-semibold ${
            STATUS_STYLES[currentStatus] || "bg-[#F3F4F6] text-[#374151]"
          }`}
        >
          {formatStatusLabel(currentStatus)}
        </Tag>
      ),
    },
    {
      title: "Date Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) =>
        new Date(createdAt).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
    },
    {
      title: "Decline Reason",
      dataIndex: "declineReason",
      key: "declineReason",
      render: (value) => value || "-",
    },
  ];

  return (
    <PageShell
      eyebrow="Filtered View"
      title={formatStatusLabel(status)}
      description="Review requisitions grouped by workflow state with the same clean table and badge system used across the dashboard."
      stats={stats}
    >
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#616161]">Status Register</p>
            <h3 className="text-xl font-bold text-[#212121]">Requests for {formatStatusLabel(status)}</h3>
          </div>
          <span className="rounded-full bg-[#FFEBEE] px-3 py-1 text-xs font-semibold text-[#D32F2F]">
            Filtered results
          </span>
        </div>

        {filteredData.length ? (
          <Table columns={columns} dataSource={filteredData} rowKey="requisitionID" scroll={{ x: 950 }} />
        ) : (
          <div className="rounded-3xl border border-dashed border-[#E0E0E0] bg-[#F9FAFB] px-6 py-12">
            <Empty description="No requests match this status." image={Empty.PRESENTED_IMAGE_SIMPLE} />
          </div>
        )}
      </section>
    </PageShell>
  );
};

export default StatusTable;
