import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import api from "../utils/config";
import { Button, Input, Modal, Spin, Table, Tabs, Tag } from "antd";
import { IoArrowBackSharp } from "react-icons/io5";
import { Link } from "react-router-dom";
import { SearchOutlined } from "@ant-design/icons";
import PageShell from "./ui/page-shell";

const TicketsResolved = () => {
  const [searchText, setSearchText] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyRecord, setHistoryRecord] = useState(null);

  const { data: ticketsResolved } = useQuery({
    queryKey: ["ticketsResolved"],
    queryFn: () => api.get("/hardware/tickets?status=RESOLVED"),
  });

  const { data: partsHistoryRes, isFetching: partsLoading } = useQuery({
    queryKey: ["partsHistory", historyRecord?.assetId],
    queryFn: () => api.get(`/hardware/assets/${historyRecord?.assetId}/parts-history`),
    enabled: !!historyRecord?.assetId,
  });

  const { data: techHistoryRes, isFetching: techLoading } = useQuery({
    queryKey: ["technicianHistory", historyRecord?.assetId],
    queryFn: () => api.get(`/hardware/assets/${historyRecord?.assetId}/technician-history`),
    enabled: !!historyRecord?.assetId,
  });

  const partsHistory = partsHistoryRes?.data || null;
  const techHistory = techHistoryRes?.data || [];

  const column = [
    {
      title: "User Name",
      dataIndex: "userName",
      key: "userName",
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return (
          record.userName.toLowerCase().includes(searchText.toLowerCase()) ||
          record.departmentName
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          record.brand.toLowerCase().includes(searchText.toLowerCase()) ||
          record.issueType.toLowerCase().includes(searchText.toLowerCase()) ||
          record.unitName.toLowerCase().includes(searchText.toLowerCase()) ||
          record.model.toLowerCase().includes(searchText.toLowerCase()) ||
          record.technicianReceivedName
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          record.technicianReturnedName
            .toLowerCase()
            .includes(searchText.toLowerCase())
        );
      },
    },
    {
      title: "Unit Name",
      dataIndex: "unitName",
      key: "unitName",
    },
    {
      title: "Department",
      dataIndex: "departmentName",
      key: "departmentName",
    },
    {
      title: "Dept Location",
      dataIndex: "departmentLocation",
      key: "departmentLocation",
      render: (text) => (text ? text : "-"),
    },
    {
      title: "Action Taken",
      dataIndex: "actionTaken",
      key: "actionTaken",
      render: (text) => (text ? text : "-"),
    },
    {
      title: "Issue Type",
      dataIndex: "issueType",
      key: "issueType",
    },
    { title: "Brand", dataIndex: "brand", key: "brand" },
    { title: "Model", dataIndex: "model", key: "model" },
    {
      title: "Remarks",
      dataIndex: "remarks",
      key: "remarks",
    },
    {
      title: "Received By",
      dataIndex: "technicianReceivedName",
      key: "technicianReceivedName",
    },
    {
      title: "Sent By",
      dataIndex: "technicianReturnedName",
      key: "technicianReturnedName",
    },
    {
      title: "Date Logged",
      dataIndex: "dateLogged",
      key: "dateLogged",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Date Resolved",
      dataIndex: "dateResolved",
      key: "dateResolved",
      render: (date) => (date ? new Date(date).toLocaleDateString() : "-"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => (
        <Button
          size="small"
          onClick={() => { setHistoryRecord(row); setIsHistoryOpen(true); }}
        >
          View History
        </Button>
      ),
    },
  ];

  return (
    <PageShell
      eyebrow="Maintenance"
      title="Resolved Tickets"
      description="All maintenance jobs that have been completed and resolved."
      actions={
        <>
          <Link to="/dashboard/maintenance">
            <Button icon={<IoArrowBackSharp />} className="go-back-button">
              Go Back
            </Button>
          </Link>
          <Input
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
            style={{ width: "220px" }}
          />
        </>
      }
    >
      <section className="rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
        <Table
          columns={column}
          dataSource={ticketsResolved?.data || []}
          rowKey="ticketId"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 15, showSizeChanger: true }}
        />
      </section>

      <Modal
        open={isHistoryOpen}
        title={`Device History — ${historyRecord?.brand || ""} ${historyRecord?.model || ""}`}
        onCancel={() => { setIsHistoryOpen(false); setHistoryRecord(null); }}
        footer={null}
        width={820}
        destroyOnClose
      >
        <Tabs defaultActiveKey="parts" items={[
          {
            key: "parts",
            label: "Parts History",
            children: partsLoading ? <Spin /> : partsHistory ? (
              <div className="space-y-4">
                {partsHistory.tickets.length === 0 && (
                  <p className="text-sm text-gray-500">No maintenance history for this asset yet.</p>
                )}
                {partsHistory.tickets.map((t) => (
                  <div key={t.ticketId} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-gray-800">{t.ticketId}</p>
                        <p className="text-xs text-gray-500">{t.issueType} · {t.priority}</p>
                      </div>
                      <p className="text-xs text-gray-400">{new Date(t.dateLogged).toLocaleDateString()}</p>
                    </div>
                    {t.parts.length > 0 && (
                      <Table
                        className="mt-3"
                        size="small"
                        rowKey="requisitionID"
                        pagination={false}
                        dataSource={t.parts}
                        columns={[
                          { title: "Requisition", dataIndex: "requisitionID", key: "req" },
                          { title: "Item", dataIndex: "itemDescription", key: "item" },
                          { title: "Qty", dataIndex: "quantity", key: "qty" },
                          { title: "Status", dataIndex: "status", key: "status", render: (v) => <Tag>{v?.replaceAll("_", " ")}</Tag> },
                          { title: "Issued", dataIndex: "issuedAt", key: "issued", render: (v) => v ? new Date(v).toLocaleDateString() : "—" },
                        ]}
                      />
                    )}
                    {t.parts.length === 0 && (
                      <p className="mt-2 text-xs text-gray-400">No parts requisitioned for this job.</p>
                    )}
                  </div>
                ))}
              </div>
            ) : null,
          },
          {
            key: "technicians",
            label: "Technician History",
            children: techLoading ? <Spin /> : (
              techHistory.length === 0 ? (
                <p className="text-sm text-gray-500">No technician activity recorded yet.</p>
              ) : (
                <Table
                  size="small"
                  rowKey="id"
                  dataSource={techHistory}
                  pagination={false}
                  columns={[
                    { title: "Ticket", dataIndex: "ticketId", key: "ticketId" },
                    { title: "Technician", dataIndex: "technicianName", key: "tech" },
                    { title: "Action", dataIndex: "action", key: "action", render: (v) => <Tag>{v}</Tag> },
                    {
                      title: "Status Change",
                      key: "status",
                      render: (_, r) => r.fromStatus && r.fromStatus !== r.toStatus
                        ? `${r.fromStatus?.replaceAll("_", " ")} → ${r.toStatus?.replaceAll("_", " ")}`
                        : r.toStatus?.replaceAll("_", " ") || "—",
                    },
                    { title: "Note", dataIndex: "note", key: "note", render: (v) => v || "—" },
                    { title: "Date", dataIndex: "loggedAt", key: "date", render: (v) => new Date(v).toLocaleString() },
                  ]}
                />
              )
            ),
          },
        ]} />
      </Modal>
    </PageShell>
  );
};

export default TicketsResolved;

