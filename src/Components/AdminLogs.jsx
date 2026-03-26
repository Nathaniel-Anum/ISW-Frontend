import { Input, Table, Spin, Tabs, Tag, Select } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import React, { useDeferredValue, useMemo, useState } from "react";
import api from "../utils/config";
import { useQuery } from "@tanstack/react-query";

const EMAIL_STATUS_COLORS = {
  QUEUED: "default",
  SENT: "green",
  FAILED: "red",
};

const AdminLogs = () => {
  const [emailStatusFilter, setEmailStatusFilter] = useState(undefined);
  const [auditSearch, setAuditSearch] = useState("");
  const [emailSearch, setEmailSearch] = useState("");
  const deferredAuditSearch = useDeferredValue(auditSearch.trim().toLowerCase());
  const deferredEmailSearch = useDeferredValue(emailSearch.trim().toLowerCase());

  const { data, isLoading } = useQuery({
    queryKey: ["adminLogs"],
    queryFn: () => {
      return api.get("/admin/audit-logs");
    },
  });

  const { data: emailLogsRes, isLoading: emailLogsLoading } = useQuery({
    queryKey: ["adminEmailLogs", emailStatusFilter],
    queryFn: () =>
      api.get("/admin/email-logs", {
        params: { status: emailStatusFilter || undefined, limit: 50 },
      }),
  });

  const skip = data?.data?.skip ?? 0;
  const take = data?.data?.take ?? 0;
  const total = data?.data?.total ?? 0;

  const filteredAuditLogs = useMemo(() => {
    const rows = data?.data?.data || [];
    if (!deferredAuditSearch) return rows;
    return rows.filter((r) =>
      [r.actionType, r.performedBy?.name, r.affectedUser?.name, r.ipAddress, r.entityType]
        .some((v) => v?.toLowerCase().includes(deferredAuditSearch)),
    );
  }, [data, deferredAuditSearch]);

  const filteredEmailLogs = useMemo(() => {
    const rows = emailLogsRes?.data?.data || [];
    if (!deferredEmailSearch) return rows;
    return rows.filter((r) =>
      [r.to, r.subject, r.errorMessage]
        .some((v) => v?.toLowerCase().includes(deferredEmailSearch)),
    );
  }, [emailLogsRes, deferredEmailSearch]);

  const columns = [
    {
      title: "Action Type",
      dataIndex: "actionType",
      key: "actionType",
      render: (text) =>
        text
          .toLowerCase()
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
    },
    {
      title: "Performed By",
      dataIndex: ["performedBy", "name"],
      key: "performedBy.name",
    },
    {
      title: "User Agent",
      dataIndex: "userAgent",
      key: "useragent",
    },
    {
      title: "Affected User",
      dataIndex: ["affectedUser", "name"],
      key: "affectedUser.name",
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) => {
        const date = new Date(createdAt);
        const options = { year: "numeric", month: "long", day: "numeric" };
        const formattedDate = date.toLocaleDateString(undefined, options);
        return formattedDate;
      },
    },
    {
      title: "Time",
      dataIndex: "createdAt",
      key: "createdAtTime",
      render: (createdAt) => {
        const date = new Date(createdAt);
        const formattedTime = date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        return formattedTime;
      },
    },
    {
      title: "IP Address",
      dataIndex: "ipAddress",
      key: "ipAddress",
    },
  ];

  const emailColumns = [
    { title: "To", dataIndex: "to", key: "to" },
    { title: "Subject", dataIndex: "subject", key: "subject", ellipsis: true },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 100,
      render: (status) => (
        <Tag color={EMAIL_STATUS_COLORS[status] ?? "default"}>{status}</Tag>
      ),
    },
    { title: "Attempts", dataIndex: "attemptCount", key: "attemptCount", width: 90, align: "center" },
    {
      title: "Last Attempt",
      dataIndex: "lastAttemptAt",
      key: "lastAttemptAt",
      render: (v) => (v ? new Date(v).toLocaleString() : "—"),
    },
    { title: "Error", dataIndex: "errorMessage", key: "errorMessage", ellipsis: true, render: (v) => v || "—" },
    {
      title: "Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (v) => new Date(v).toLocaleString(),
    },
  ];

  return (
    <div className="px-[3rem] py-[2rem]">
      <div className="pl-[6rem] pt-6">
        <Tabs
          defaultActiveKey="audit"
          items={[
            {
              key: "audit",
              label: "Audit Logs",
              children: isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Spin tip="Loading data..." />
                </div>
              ) : (
                <>
                  <div className="mb-3">
                    <Input
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      allowClear
                      prefix={<SearchOutlined />}
                      placeholder="Search action, user, IP, or entity"
                      style={{ maxWidth: 320 }}
                    />
                  </div>
                  <Table
                  columns={columns}
                  dataSource={filteredAuditLogs}
                  rowKey="id"
                  pagination={{ pageSize: 20, showSizeChanger: false }}
                  scroll={{ x: 900 }}
                  footer={() => (
                    <div className="flex justify-between text-sm text-gray-600 px-4">
                      <span>Skip: {skip}</span>
                      <span>Take: {take}</span>
                      <span>Total: {total}</span>
                    </div>
                  )}
                />
                </>
              ),
            },
            {
              key: "email-logs",
              label: "Email Logs",
              children: (
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-3">
                    <Input
                      value={emailSearch}
                      onChange={(e) => setEmailSearch(e.target.value)}
                      allowClear
                      prefix={<SearchOutlined />}
                      placeholder="Search recipient, subject, or error"
                      style={{ maxWidth: 280 }}
                    />
                    <span className="text-sm text-gray-600">Status:</span>
                    <Select
                      allowClear
                      placeholder="All statuses"
                      style={{ width: 140 }}
                      value={emailStatusFilter}
                      onChange={(val) => setEmailStatusFilter(val)}
                      options={[
                        { value: "QUEUED", label: "Queued" },
                        { value: "SENT", label: "Sent" },
                        { value: "FAILED", label: "Failed" },
                      ]}
                    />
                  </div>
                  {emailLogsLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <Spin tip="Loading email logs..." />
                    </div>
                  ) : (
                    <Table
                      columns={emailColumns}
                      dataSource={filteredEmailLogs}
                      rowKey="id"
                      pagination={{
                        pageSize: 20,
                        total: filteredEmailLogs.length,
                        showSizeChanger: false,
                      }}
                      scroll={{ x: 900 }}
                    />
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
};

export default AdminLogs;

