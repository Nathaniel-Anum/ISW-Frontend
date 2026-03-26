import React, { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Form, Input, Modal, Table } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { LuCheck } from "react-icons/lu";
import { toast } from "react-toastify";
import api from "../utils/config";
import { formatCapitalizedLabel } from "../utils/formatText";
import PageShell from "./ui/page-shell";

const Acknowledge = () => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchText, setSearchText] = useState("");
  const deferredSearch = useDeferredValue(searchText.trim());

  const { data: acknowledgmentResponse, isLoading } = useQuery({
    queryKey: ["acknowledge", deferredSearch],
    queryFn: () =>
      api.get("user/reqs/pending-acknowledgments", {
        params: deferredSearch ? { search: deferredSearch } : undefined,
      }),
  });

  const acknowledgments = acknowledgmentResponse?.data || [];

  const stats = useMemo(
    () => [
      {
        label: "Pending Acknowledgments",
        value: acknowledgments.length,
        caption: "Issued items awaiting confirmation",
      },
      {
        label: "Issued Units",
        value: acknowledgments.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        caption: "Total quantity awaiting acknowledgment",
      },
    ],
    [acknowledgments]
  );

  const mutateAcknowledgment = useMutation({
    mutationFn: (values) => api.post(`user/reqs/acknowledge/${selected?.stockIssuedId}`, values),
    onSuccess: () => {
      setOpen(false);
      toast.success("Acknowledgment submitted");
      queryClient.invalidateQueries({ queryKey: ["acknowledge"] });
      form.resetFields();
    },
  });

  const columns = [
    {
      title: "No",
      key: "index",
      render: (text, record, index) => (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Device Type",
      dataIndex: "deviceType",
      key: "deviceType",
      render: (value) => formatCapitalizedLabel(value),
    },
    {
      title: "Item Name",
      dataIndex: "itemName",
      key: "itemName",
    },
    {
      title: "Remarks",
      dataIndex: "remarks",
      key: "remarks",
      render: (value) => value || "-",
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      render: (value) => <span className="font-semibold text-[#212121]">{value}</span>,
    },
    {
      title: "Requisition ID",
      dataIndex: "requisitionID",
      key: "requisitionID",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ECFDF3] text-[#166534] transition-colors duration-200 hover:bg-[#DCFCE7]"
          onClick={() => {
            setOpen(true);
            setSelected(record);
          }}
        >
          <LuCheck />
        </button>
      ),
    },
  ];

  return (
    <PageShell
      eyebrow="Fulfillment Confirmation"
      title="Acknowledge Issued Items"
      description="Confirm receipt of issued devices and capture acknowledgment remarks in a cleaner confirmation workflow."
      stats={stats}
      actions={
        <Input
          placeholder="Search acknowledgments"
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
            <p className="text-sm font-semibold text-[#616161]">Pending Confirmation</p>
            <h3 className="text-xl font-bold text-[#212121]">Issued items awaiting acknowledgment</h3>
          </div>
          <span className="rounded-full bg-[#FFEBEE] px-3 py-1 text-xs font-semibold text-[#D32F2F]">
            Receipt confirmation needed
          </span>
        </div>

        <Table
          columns={columns}
          dataSource={acknowledgments}
          loading={isLoading}
          pagination={{
            current: currentPage,
            pageSize,
            onChange: (page, nextPageSize) => {
              setCurrentPage(page);
              setPageSize(nextPageSize);
            },
          }}
          rowKey="stockIssuedId"
          scroll={{ x: 950 }}
        />

        <Modal
          open={open}
          onCancel={() => {
            setOpen(false);
            form.resetFields();
          }}
          footer={null}
          title="Acknowledge Device"
        >
          <Form layout="vertical" form={form} onFinish={(values) => mutateAcknowledgment.mutate(values)}>
            <Form.Item label="Remarks" name="remarks">
              <Input.TextArea rows={4} placeholder="Add acknowledgment remarks" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={mutateAcknowledgment.isPending} block>
              Submit
            </Button>
          </Form>
        </Modal>
      </section>
    </PageShell>
  );
};

export default Acknowledge;
