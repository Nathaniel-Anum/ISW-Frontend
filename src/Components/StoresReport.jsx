import { useQuery } from "@tanstack/react-query";
import { Select, Table, Spin, Button, Modal, Form, DatePicker } from "antd";
import api from "../utils/config";
import { useState } from "react";
import * as XLSX from "xlsx";
import { FilterOutlined } from "@ant-design/icons";
const { Option } = Select;

const StoresReport = () => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  // const { data: report } = useQuery({
  //   queryKey: ["storesReport"],
  //   queryFn: () => {
  //     return api.get("/stores/reports?reportType=stock_received");
  //   },
  // });

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date.$d).toISOString().split("T")[0]; // 'YYYY-MM-DD'
  };

  const onFinish = async (values) => {
    const { reportType, itemClass, status, deviceType, reqStatus } = values;
    const filters = {
      startDate: values.startDate ? formatDate(values.startDate) : null,
      endDate: values.endDate ? formatDate(values.endDate) : null,
    };
    console.log("Filtering with:", filters);
    const params = new URLSearchParams({ reportType });
    if (itemClass) params.append("itemClass", itemClass);
    if (status) params.append("status", status);
    if (deviceType) params.append("deviceType", deviceType);
    if (reqStatus) params.append("reqStatus", reqStatus);

    if (filters.startDate) params.append("startDate", filters.startDate);
    if (filters.endDate) params.append("endDate", filters.endDate);

    try {
      const response = await api.get(`/stores/reports?${params.toString()}`);
      setSelectedReport(reportType);
      setReportData(response.data); //This will feed the table
      setOpen(false);
      form.resetFields();
    } catch (err) {
      console.error(err);
      setOpen(false);
      form.resetFields();
    }
  };

  const getColumns = () => {
    if (selectedReport === "stock_received") {
      return [
        { title: "Item", dataIndex: ["itItem", "model"], key: "model" },
        { title: "Brand", dataIndex: ["itItem", "brand"], key: "brand" },
        {
          title: "Quantity Received",
          dataIndex: "quantityReceived",
          key: "quantityReceived",
        },
        {
          title: "Received By",
          dataIndex: ["receivedBy", "name"],
          key: "receivedBy",
        },
        { title: "Supplier", dataIndex: ["supplier", "name"], key: "supplier" },
        { title: "LPO Ref", dataIndex: "lpoReference", key: "lpoReference" },
        {
          title: "Voucher No.",
          dataIndex: "voucherNumber",
          key: "voucherNumber",
        },
        {
          title: "Date Received",
          dataIndex: "dateReceived",
          key: "dateReceived",
          render: (date) => new Date(date).toLocaleDateString(),
        },
      ];
    } else if (selectedReport === "stock_issued") {
      return [
        { title: "Item", dataIndex: ["itItem", "model"], key: "model" },
        { title: "Brand", dataIndex: ["itItem", "brand"], key: "brand" },
        {
          title: "Quantity Issued",
          dataIndex: "quantityIssued",
          key: "quantityIssued",
        },
        {
          title: "Issued By",
          dataIndex: ["issuedBy", "name"],
          key: "issuedBy",
        },
        {
          title: "Issue Date",
          dataIndex: "issueDate",
          key: "issueDate",
          render: (date) => new Date(date).toLocaleDateString(),
        },
        {
          title: "Disbursement Note",
          dataIndex: "disbursementNote",
          key: "disbursementNote",
        },
        {
          title: "Requested By",
          dataIndex: ["requisition", "staff", "name"],
          key: "requestedBy",
        },
      ];
    } else if (selectedReport === "requisitions") {
      return [
        {
          title: "Requisition ID",
          dataIndex: "requisitionID",
          key: "requisitionID",
        },
        { title: "Room No.", dataIndex: "roomNo", key: "roomNo" },
        {
          title: "Item Description",
          dataIndex: "itemDescription",
          key: "itemDescription",
        },
        { title: "Purpose", dataIndex: "purpose", key: "purpose" },
        { title: "Quantity", dataIndex: "quantity", key: "quantity" },
        {
          title: "Created At",
          dataIndex: "createdAt",
          key: "createdAt",
          render: (date) => new Date(date).toLocaleDateString(),
        },
      ];
    } else if (selectedReport === "stock_levels") {
      return [
        {
          title: "Brand",
          dataIndex: "brand",
          key: "brand",
        },
        {
          title: "Model",
          dataIndex: "model",
          key: "model",
        },
        {
          title: "Device Type",
          dataIndex: "deviceType",
          key: "deviceType",
        },
        {
          title: "Item Class",
          dataIndex: "itemClass",
          key: "itemClass",
        },
        {
          title: "Quantity In Stock",
          dataIndex: "quantityInStock",
          key: "quantityInStock",
        },
       
      ];
    } else {
      return [];
    }
  };

  const downloadExcel = () => {
    if (!reportData?.data?.length) return;

    let cleanData = [];

    if (selectedReport === "stock_received") {
      cleanData = reportData?.data.map((item, index) => ({
        No: index + 1,
        Item: item?.itItem?.model || "-",
        Supplier: item?.supplier?.name || "-",
        QuantityReceived: item?.quantityReceived || 0,
        DateReceived: item?.dateReceived
          ? new Date(item.dateReceived).toLocaleDateString()
          : "-",
      }));
    } else if (selectedReport === "stock_issued") {
      cleanData = reportData?.data.map((item, index) => ({
        No: index + 1,
        Item: item?.itItem?.model || "-",
        QuantityIssued: item?.quantityIssued || 0,
        IssuedBy: item?.issuedBy?.name || "-",
        IssueDate: item?.issueDate
          ? new Date(item.issueDate).toLocaleDateString()
          : "-",
      }));
    } else if (selectedReport === "requisition") {
      cleanData = reportData?.data.map((item, index) => ({
        No: index + 1,
        RequisitionID: item?.requisitionID || "-",
        Purpose: item?.purpose || "-",
        Quantity: item?.quantity || 0,
        RoomNo: item?.roomNo || "-",
      }));
    } else if (selectedReport === "inventory") {
      cleanData = reportData?.data.map((item, index) => ({
        No: index + 1,
        Item: item?.itItem?.model || "-",
        Stock: item?.stock || 0,
        MinimumStock: item?.minStock || 0,
        MaximumStock: item?.maxStock || 0,
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(cleanData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

    XLSX.writeFile(workbook, `${selectedReport || "report"}.xlsx`);
  };

  return (
    <div className="px-[3rem] py-[2rem]">
      <div className=" flex gap-2 justify-end">
        <Button
          // disabled={!reportData?.data?.length}
          icon={<FilterOutlined />}
          onClick={() => setOpen(true)}
        >
          Filter
        </Button>
        <Button
          type="primary"
          onClick={downloadExcel}
          disabled={!reportData?.data?.length}
        >
          Download
        </Button>
      </div>
      <div className="pl-[6rem] pt-6">
        {loading ? (
          <div className="flex justify-center items-center h-[300px]">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={getColumns()}
            dataSource={reportData?.data || []}
            rowKey={(record) => record.id || record.key}
          />
        )}
      </div>
      <Modal
        title="Filter"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
      >
        <div className="max-h-[39rem] overflow-y-auto pr-2 no-scrollbar">
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item
              name="reportType"
              label="Report Type"
              rules={[{ required: true, message: "Select report type" }]}
            >
              <Select placeholder="Filter by" style={{ width: "100%" }}>
                <Option value="stock_received">Stock Received</Option>
                <Option value="stock_issued">Stock Issued</Option>
                <Option value="requisitions">Requisitions</Option>
                <Option value="stock_levels">Stock</Option>
              </Select>
            </Form.Item>

            <Form.Item label="Item Class" name="itemClass">
              <Select
                placeholder="Item Class"
                allowClear
                style={{ width: "100%" }}
              >
                <Select.Option value="CONSUMABLE">
                  Consumable Asset
                </Select.Option>
                <Select.Option value="FIXED_ASSET">Fixed Asset</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Start Date" name="startDate">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item label="End Date" name="endDate">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Status" name="status">
              <Select placeholder="Status" allowClear style={{ width: "100%" }}>
                <Select.Option value="ACTIVE">ACTIVE</Select.Option>
                <Select.Option value="INACTIVE">INACTIVE</Select.Option>
                <Select.Option value="NON_FUNCTIONAL">
                  NON FUNCTIONAL
                </Select.Option>
                <Select.Option value="OBSOLETE">OBSOLETE</Select.Option>
                <Select.Option value="DISPOSED">DISPOSED</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Requisition Status" name="reqStatus">
              <Select
                placeholder="Requisition status"
                allowClear
                style={{ width: "100%" }}
              >
                <Select.Option value="DEPT_DECLINED">
                  Department Declined
                </Select.Option>
                <Select.Option value="PROCESSED">Processed</Select.Option>
                <Select.Option value="ITD_DECLINED">ITD Declined</Select.Option>
                <Select.Option value="ITD_APPROVED,">
                  ITD Approved
                </Select.Option>
                <Select.Option value="DEPT_APPROVED">
                  Department Approved
                </Select.Option>
                <Select.Option value="PENDING_DEPT_APPROVAL">
                  Pending Department Approval
                </Select.Option>
                <Select.Option value="PENDING_DEPT_APPROVAL">
                  Pending ITD Approval
                </Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Device Type" name="deviceType">
              <Select
                placeholder="Device Type"
                allowClear
                style={{ width: "100%" }}
              >
                <Select.Option value="LAPTOP">LAPTOP</Select.Option>
                <Select.Option value="DESKTOP">DESKTOP</Select.Option>
                <Select.Option value="PRINTER">PRINTER</Select.Option>
                <Select.Option value="OTHER">OTHER</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="w-full"
              >
                Submit
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default StoresReport;
