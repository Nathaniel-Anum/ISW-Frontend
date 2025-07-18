import { useQuery } from "@tanstack/react-query";
import {
  Select,
  Table,
  Spin,
  Button,
  Modal,
  Form,
  DatePicker,
  Input,
} from "antd";
import api from "../utils/config";
import { useState } from "react";
import * as XLSX from "xlsx";
import { FilterOutlined, SearchOutlined } from "@ant-design/icons";
const { Option } = Select;

const StoresReport = () => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  //useQuery to get all users
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: () => {
      return api.get("/admin/users");
    },
  });

  //to get suppliers
  const { data } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => {
      return api.get("/stores/suppliers");
    },
  });

  //to get it-Item
  const { data: itItem } = useQuery({
    queryKey: ["itItem"],
    queryFn: () => {
      return api.get("/stores/it-items");
    },
  });

  const userOptions = users?.data?.map((user) => ({
    label: `${user.name}`,
    value: user.id,
  }));

  const supplierOptions = data?.data?.map((supplier) => ({
    label: `${supplier.name}`,
    value: supplier.id,
  }));

  const itItemOptions = itItem?.data?.map((item) => ({
    label: `${item.brand} - ${item.model}`,
    value: item.id,
  }));

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date.$d).toISOString().split("T")[0]; // 'YYYY-MM-DD'
  };

  const onFinish = async (values) => {
    const {
      reportType,
      itemClass,
      status,
      deviceType,
      reqStatus,
      model,
      brand,
      lpoReference,
      technicianReceivedById,
      supplierId,
      itItemId,
    } = values;
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
    if (model) params.append("model", model);
    if (brand) params.append("brand", brand);
    if (technicianReceivedById)
      params.append("technicianReceivedById", technicianReceivedById);
    if (lpoReference) params.append("lpoReference", lpoReference);
    if (supplierId) params.append("supplierId", supplierId);
    if (itItemId) params.append("itItemId", itItemId);

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
        {
          title: "Model",
          dataIndex: ["itItem", "model"],
          key: "model",
          filteredValue: [searchText],
          onFilter: (value, record) => {
            return (
              record?.voucherNumber
                .toLowerCase()
                .includes(searchText.toLowerCase()) ||
              record?.lpoReference
                ?.toLowerCase()
                .includes(searchText.toLowerCase()) ||
              record?.supplier?.name
                ?.toLowerCase()
                .includes(searchText.toLowerCase()) ||
              record?.receivedBy?.name
                ?.toLowerCase()
                .includes(searchText.toLowerCase()) ||
              record?.itItem?.model
                .toLowerCase()
                .includes(searchText.toLowerCase()) ||
              record?.itItem?.brand
                .toLowerCase()
                .includes(searchText.toLowerCase())
            );
          },
        },

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
        {
          title: "Model",
          dataIndex: ["itItem", "model"],
          key: "model",
          filteredValue: [searchText],
          onFilter: (value, record) => {
            return (
              record?.itItem?.model
                .toLowerCase()
                .includes(searchText.toLowerCase()) ||
              record?.itItem?.brand
                .toLowerCase()
                .includes(searchText.toLowerCase()) ||
              record?.quantityIssued
                .toString()
                .includes(searchText.toLowerCase()) ||
              record?.issuedBy?.name
                .toLowerCase()
                .includes(searchText.toLowerCase()) ||
              record?.requisition?.staff?.name
                .toLowerCase()
                .includes(searchText.toLowerCase()) ||
              record?.remarks.toLowerCase().includes(searchText.toLowerCase())
            );
          },
        },
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
          title: "Remarks",
          dataIndex: "remarks",
          key: "remarks",
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
          filteredValue: [searchText],
          onFilter: (value, record) => {
            return (
              record?.requisitionID
                .toLowerCase()
                .includes(searchText.toLowerCase()) ||
              record?.staff?.name
                .toLowerCase()
                .includes(searchText.toLowerCase()) ||
              record?.roomNo.toString().includes(searchText.toLowerCase()) ||
              record?.itItem?.model
                .toLowerCase()
                .includes(searchText.toLowerCase()) ||
              record?.itItem?.brand
                .toLowerCase()
                .includes(searchText.toLowerCase()) ||
              record?.itItem?.deviceType
                .toLowerCase()
                .includes(searchText.toLowerCase()) ||
              record?.itemDescription
                .toLowerCase()
                .includes(searchText.toLowerCase()) ||
              record?.purpose.toLowerCase().includes(searchText.toLowerCase())
            );
          },
        },
        {
          title: "Issued By",
          dataIndex: ["staff", "name"],
          key: "issuedBy",
        },
        { title: "Room No.", dataIndex: "roomNo", key: "roomNo" },
        {
          title: "Brand",
          dataIndex: ["itItem", "brand"],
          key: "brand",
          render: (text) => text || "-",
        },
        {
          title: "Model",
          dataIndex: ["itItem", "model"],
          key: "model",
          render: (text) => text || "-",
        },
        {
          title: "Device Type",
          dataIndex: ["itItem", "deviceType"],
          key: "deviceType",
          render: (text) => text || "-",
        },

        {
          title: " Description",
          dataIndex: "itemDescription",
          key: "itemDescription",
        },
        { title: "Purpose", dataIndex: "purpose", key: "purpose" },
        { title: "Quantity", dataIndex: "quantity", key: "quantity" },
        {
          title: "Date Created",
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
          filteredValue: [searchText],
          onFilter: (value, record) => {
            return (
              record?.model.toLowerCase().includes(searchText.toLowerCase()) ||
              record?.brand.toLowerCase().includes(searchText.toLowerCase()) ||
              record?.deviceType
                .toLowerCase()
                .includes(searchText.toLowerCase()) ||
              record?.itemClass
                .toLowerCase()
                .includes(searchText.toLowerCase()) ||
              record?.quantityInStock
                .toString()
                .includes(searchText.toLowerCase())
            );
          },
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
      cleanData = reportData?.data
        .filter(
          (record) =>
            record?.voucherNumber
              .toLowerCase()
              .includes(searchText.toLowerCase()) ||
            record?.lpoReference
              ?.toLowerCase()
              .includes(searchText.toLowerCase()) ||
            record?.supplier?.name
              ?.toLowerCase()
              .includes(searchText.toLowerCase()) ||
            record?.receivedBy?.name
              ?.toLowerCase()
              .includes(searchText.toLowerCase()) ||
            record?.itItem?.model
              .toLowerCase()
              .includes(searchText.toLowerCase()) ||
            record?.itItem?.brand
              .toLowerCase()
              .includes(searchText.toLowerCase())
        )
        .map((item, index) => ({
          No: index + 1,
          Model: item?.itItem?.model || "-",
          Brand: item?.itItem?.model || "-",
          QuantityReceived: item?.quantityReceived || 0,
          Supplier: item?.supplier?.name || "-",
          ReceivedBy: item?.receivedBy?.name || "-",
          LPOReference: item?.lpoReference || "-",
          VoucherNumber: item?.voucherNumber || "-",
          DateReceived: item?.dateReceived
            ? new Date(item.dateReceived).toLocaleDateString()
            : "-",
        }));
    } else if (selectedReport === "stock_issued") {
      cleanData = reportData?.data
        .filter(
          (record) =>
            record?.itItem?.model
              .toLowerCase()
              .includes(searchText.toLowerCase()) ||
            record?.itItem?.brand
              .toLowerCase()
              .includes(searchText.toLowerCase()) ||
            record?.quantityIssued
              .toString()
              .includes(searchText.toLowerCase()) ||
            record?.issuedBy?.name
              .toLowerCase()
              .includes(searchText.toLowerCase()) ||
            record?.requisition?.staff?.name
              .toLowerCase()
              .includes(searchText.toLowerCase()) ||
            record?.remarks.toLowerCase().includes(searchText.toLowerCase())
        )
        .map((item, index) => ({
          No: index + 1,
          Model: item?.itItem?.model || "-",
          Brand: item?.itItem?.brand || "-",
          QuantityIssued: item?.quantityIssued || 0,
          IssuedBy: item?.issuedBy?.name || "-",
          RequestedBy: item?.requisition?.staff?.name || "-",
          Remarks: item?.remarks || "-",
          IssueDate: item?.issueDate
            ? new Date(item.issueDate).toLocaleDateString()
            : "-",
        }));
    } else if (selectedReport === "requisitions") {
      cleanData = reportData?.data
        .filter(
          (record) =>
            record?.requisitionID
              .toLowerCase()
              .includes(searchText.toLowerCase()) ||
            record?.staff?.name
              .toLowerCase()
              .includes(searchText.toLowerCase()) ||
            record?.roomNo.toString().includes(searchText.toLowerCase()) ||
            record?.itItem?.model
              .toLowerCase()
              .includes(searchText.toLowerCase()) ||
            record?.itItem?.brand
              .toLowerCase()
              .includes(searchText.toLowerCase()) ||
            record?.itItem?.deviceType
              .toLowerCase()
              .includes(searchText.toLowerCase()) ||
            record?.itemDescription
              .toLowerCase()
              .includes(searchText.toLowerCase()) ||
            record?.purpose.toLowerCase().includes(searchText.toLowerCase())
        )

        .map((item, index) => ({
          No: index + 1,
          RequisitionID: item?.requisitionID || "-",
          IssuedBy: item?.staff?.name || "-",
          RoomNo: item?.roomNo || "-",
          Brand: item?.itItem?.brand || "-",
          Model: item?.itItem?.model || "-",
          DeviceType: item?.itItem?.deviceType || "-",
          Description: item?.description || "-",
          Purpose: item?.purpose || "-",
          Quantity: item?.quantity || 0,
          DateCreated: item?.createdAt
            ? new Date(item.createdAt).toLocaleDateString()
            : "-",
        }));
    } else if (selectedReport === "stock_levels") {
      cleanData = reportData?.data
        .filter(
          (record) =>
            record?.model.toLowerCase().includes(searchText.toLowerCase()) ||
            record?.brand.toLowerCase().includes(searchText.toLowerCase()) ||
            record?.deviceType
              .toLowerCase()
              .includes(searchText.toLowerCase()) ||
            record?.itemClass
              .toLowerCase()
              .includes(searchText.toLowerCase()) ||
            record?.quantityInStock
              .toString()
              .includes(searchText.toLowerCase())
        )

        .map((item, index) => ({
          No: index + 1,
          Model: item?.model || "-",
          Brand: item?.brand || "-",
          DeviceType: item?.deviceType || "-",
          ItemClass: item?.itemClass || "-",
          QuantityInStock: item?.quantityInStock || 0,
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
        <Input
          disabled={!reportData?.data?.length}
          placeholder="Search..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<SearchOutlined />}
          style={{ width: "200px" }}
        />
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
            <Form.Item label="Model" name="model">
              <Input placeholder=" Model" />
            </Form.Item>
            <Form.Item label="Brand" name="brand">
              <Input placeholder="Brand" />
            </Form.Item>
            <Form.Item label="L.P.O Reference" name="lpoReference">
              <Input placeholder="L.P.O Reference" />
            </Form.Item>
            <Form.Item
              name="technicianReceivedById"
              label="Select Technician Received"
            >
              <Select
                showSearch
                placeholder="Technician Received By"
                options={userOptions}
                filterOption={(input, option) =>
                  option.label.toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
            <Form.Item name="supplierId" label="Select Supplier">
              <Select
                showSearch
                placeholder="Select Supplier"
                options={supplierOptions}
                filterOption={(input, option) =>
                  option.label.toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
            <Form.Item name="itItemId" label="Select It Item">
              <Select
                showSearch
                placeholder="Select It Item"
                options={itItemOptions}
                filterOption={(input, option) =>
                  option.label.toLowerCase().includes(input.toLowerCase())
                }
              />
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
