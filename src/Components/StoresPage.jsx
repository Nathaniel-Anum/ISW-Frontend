import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
  Table,
  Tag,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { LuPlus, LuTrash2 } from "react-icons/lu";
import { toast } from "react-toastify";
import api from "../utils/config";
import PageShell from "./ui/page-shell";

// ─── helpers ────────────────────────────────────────────────────────────────

const formatDateValue = (v) => {
  if (!v) return null;
  const d = new Date(v?.$d ?? v);
  return isNaN(d.getTime()) ? null : d.toISOString().split("T")[0];
};

const getDefInputType = (def) => {
  switch (def.dataType) {
    case "BOOLEAN": return "switch";
    case "SELECT": return "select";
    case "TEXTAREA": return "textarea";
    case "NUMBER": return "number";
    case "DATE": return "date";
    default: return "input";
  }
};

const renderDefInput = (def, value, onChange) => {
  const type = getDefInputType(def);
  if (type === "switch") return <Switch size="small" checked={!!value} onChange={onChange} />;
  if (type === "select") {
    const opts = Array.isArray(def.optionsJson) ? def.optionsJson : [];
    return (
      <Select size="small" className="w-full" value={value} onChange={onChange} placeholder={def.helpText || def.label}>
        {opts.map((o) => <Select.Option key={o} value={o}>{o}</Select.Option>)}
      </Select>
    );
  }
  if (type === "textarea") return <Input.TextArea size="small" rows={2} value={value} onChange={(e) => onChange(e.target.value)} placeholder={def.helpText || def.label} />;
  if (type === "date") return <DatePicker size="small" className="w-full" value={value} onChange={onChange} />;
  if (type === "number") return <InputNumber size="small" className="w-full" value={value} onChange={onChange} min={0} placeholder={def.helpText || def.label} />;
  return <Input size="small" value={value} onChange={(e) => onChange(e.target.value)} placeholder={def.helpText || def.label} />;
};

const TYPE_COLOR = { CONSUMABLE: "blue", FIXED_ASSET: "orange" };
const TYPE_LABEL = { CONSUMABLE: "Consumable", FIXED_ASSET: "Fixed Asset" };
const MONITOR_FIELDS = [
  { key: "brand", label: "Monitor Brand", placeholder: "e.g. Dell" },
  { key: "model", label: "Monitor Model", placeholder: "e.g. P2422H" },
  { key: "serialNumber", label: "Monitor Serial Number", placeholder: "Monitor serial number" },
];

const newKey = () => `row_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
const emptyItem = () => ({ key: newKey(), categoryId: null, itItemId: null, quantity: 1, serialNumber: "", stockType: null, deviceDetails: {}, warrantyPeriod: null, warrantyDate: null });
const parseSerialTokens = (value) => String(value || "").split(/[\n,]+/).map((v) => v.trim()).filter(Boolean);

// ─── component ──────────────────────────────────────────────────────────────

const StoresPage = () => {
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [items, setItems] = useState([]);
  const watchedWarrantyPeriod = Form.useWatch("warrantyPeriod", editForm);
  const watchedWarrantyDate = Form.useWatch("warrantyDate", editForm);
  const [detailsItemKey, setDetailsItemKey] = useState(null);
  const [isProjectChecked, setIsProjectChecked] = useState(null);
  const [viewRecord, setViewRecord] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });
  const deferredSearch = useDeferredValue(searchText.trim());

  // ── queries ──
  const { data: storesResponse, isLoading: storesLoading } = useQuery({
    queryKey: ["stores", deferredSearch, pagination],
    queryFn: () => api.get("/stores/stock-received", {
      params: { page: pagination.page, limit: pagination.limit, ...(deferredSearch ? { search: deferredSearch } : {}) },
    }),
  });
  const { data: itItemsData } = useQuery({ queryKey: ["itItems", "all"], queryFn: () => api.get("/stores/it-items", { params: { includeZeroStock: "true" } }) });
  const { data: categoriesData } = useQuery({ queryKey: ["stockReceiveCategories"], queryFn: () => api.get("/stores/categories") });
  const { data: suppliersData } = useQuery({ queryKey: ["suppliers"], queryFn: () => api.get("/stores/suppliers") });
  const { data: projectsData } = useQuery({ queryKey: ["catalogProjects"], queryFn: () => api.get("/stores/projects") });

  const stockRows = storesResponse?.data?.data || [];
  const stockMeta = storesResponse?.data?.meta || {};
  const itItemsList = itItemsData?.data || [];
  const categories = categoriesData?.data || [];
  const suppliers = suppliersData?.data || [];
  const catalogProjects = projectsData?.data || [];

  // ── per-item warranty expiry helper ──
  const calcWarrantyExpiry = (warrantyDateVal, warrantyPeriod) => {
    if (!warrantyDateVal || !warrantyPeriod) return null;
    const d = new Date(warrantyDateVal?.$d ?? warrantyDateVal);
    if (isNaN(d.getTime())) return null;
    d.setMonth(d.getMonth() + Number(warrantyPeriod));
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  // ── stats ──
  const totalQty = stockRows.reduce((s, r) => s + Number(r.quantityReceived || 0), 0);
  const stats = [
    { label: "Receipts", value: stockMeta?.total || stockRows.length, caption: "Recorded stock entries" },
    { label: "Units Received", value: totalQty, caption: "Total quantity booked in" },
    { label: "Suppliers", value: suppliers.length, caption: "Available supplier records" },
  ];

  // ── item state helpers ──
  const addItemRow = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItemRow = (key) => { setItems((prev) => prev.filter((i) => i.key !== key)); if (detailsItemKey === key) setDetailsItemKey(null); };
  const updateItem = (key, field, value) => {
    setItems((prev) => prev.map((item) => {
      if (item.key !== key) return item;
      const next = { ...item, [field]: field === "quantity" ? Math.max(1, Number(value || 1)) : value };
      if (field === "itItemId") {
        const found = itItemsList.find((x) => x.id === value);
        const monitorDetails = found?.specifications?.monitorDetails;
        next.stockType = found?.itemClass ?? null;
        next.categoryId = found?.categoryId ?? null;
        next.deviceDetails = monitorDetails && typeof monitorDetails === "object"
          ? { monitorDetails: { ...monitorDetails } }
          : {};
      }
      return next;
    }));
  };
  const updateDeviceDetail = (key, defKey, value) => setItems((prev) => prev.map((i) => i.key !== key ? i : { ...i, deviceDetails: { ...i.deviceDetails, [defKey]: value } }));
  const updateMonitorDetail = (key, field, value) => setItems((prev) => prev.map((i) => (
    i.key !== key
      ? i
      : {
          ...i,
          deviceDetails: {
            ...i.deviceDetails,
            monitorDetails: {
              ...(i.deviceDetails?.monitorDetails || {}),
              [field]: value,
            },
          },
        }
  )));
  const getTemplateMonitorDetails = (itItemId) => {
    const monitorDetails = itItemsList.find((x) => x.id === itItemId)?.specifications?.monitorDetails;
    return monitorDetails && typeof monitorDetails === "object" ? monitorDetails : null;
  };
  const getReceiptMonitorDetails = (record) => {
    const monitorDetails = record?.itItem?.specifications?.monitorDetails || getTemplateMonitorDetails(record?.itItem?.id ?? record?.itItemId);
    return monitorDetails && typeof monitorDetails === "object" ? monitorDetails : null;
  };
  const getRowMonitorDetails = (record) => {
    const existing = record?.deviceDetails?.monitorDetails;
    if (existing && typeof existing === "object") return existing;
    return getTemplateMonitorDetails(record?.itItemId);
  };
  const normalizeMonitorDetails = (monitorDetails) => {
    if (!monitorDetails || typeof monitorDetails !== "object") return undefined;
    const normalized = Object.fromEntries(
      Object.entries(monitorDetails)
        .map(([key, value]) => [key, typeof value === "string" ? value.trim() : value])
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
    );
    return Object.keys(normalized).length ? normalized : undefined;
  };
  const getCurrentItemMonitorDetails = (itItemId) => normalizeMonitorDetails(getTemplateMonitorDetails(itItemId));
  const monitorDetailsChanged = (itItemId, monitorDetails) => {
    const current = getCurrentItemMonitorDetails(itItemId) || {};
    const next = normalizeMonitorDetails(monitorDetails) || {};
    return MONITOR_FIELDS.some((field) => (current[field.key] || "") !== (next[field.key] || ""));
  };
  const monitorDetailsCompleteOrEmpty = (monitorDetails) => {
    const normalized = normalizeMonitorDetails(monitorDetails);
    if (!normalized) return true;
    return MONITOR_FIELDS.every((field) => String(normalized[field.key] || "").trim());
  };
  const getCategoryDefs = (categoryId) =>
    (categories.find((c) => c.id === categoryId)?.attributeDefinitions || []).filter(
      (d) =>
        ["TEMPLATE", "BOTH"].includes(d.scope) &&
        !["formfactor", "form_factor"].includes((d.key || "").toLowerCase()) &&
        !String(d.label || "").toLowerCase().includes("form factor")
    );

  const closeModal = () => { setIsModalOpen(false); form.resetFields(); setItems([]); setDetailsItemKey(null); setIsProjectChecked(null); };

  // ── update mutation ──
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/stores/stock-received/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
    onError: (err) => {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || "Failed to update receipt.");
    },
  });

  const updateItItemMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/stores/it-items/${id}`, data),
    onError: (err) => {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || "Failed to update item details.");
    },
  });

  const updateItItemMonitorMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/admin/it-items/${id}`, data),
    onError: (err) => {
      const msg = err.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : msg || "Failed to update monitor details.");
    },
  });

  // ── populate edit form when viewRecord changes ──
  useEffect(() => {
    if (viewRecord) {
      editForm.setFieldsValue({
        brand: viewRecord.itItem?.brand,
        model: viewRecord.itItem?.model,
        supplierId: viewRecord.supplier?.id ?? viewRecord.supplierId,
        lpoReference: viewRecord.lpoReference,
        lpoDate: viewRecord.lpoDate ? dayjs(viewRecord.lpoDate) : null,
        voucherNumber: viewRecord.voucherNumber,
        dateReceived: viewRecord.dateReceived ? dayjs(viewRecord.dateReceived) : null,
        serialNumber: viewRecord.serialNumber,
        warrantyPeriod: viewRecord.warrantyPeriod,
        warrantyDate: viewRecord.warrantyDate ? dayjs(viewRecord.warrantyDate) : null,
        monitorDetails: getReceiptMonitorDetails(viewRecord) || undefined,
        remarks: viewRecord.remarks,
      });
    }
  }, [viewRecord, editForm]);

  // ── mutation ──
  const mutation = useMutation({
    mutationFn: async ({ headerValues, itemsList }) => {
      const shared = {
        purchaseType: isProjectChecked ? "PROJECT" : "INTERNAL",
        projectName: isProjectChecked ? headerValues.projectName : undefined,
        supplierId: headerValues.supplierId || undefined,
        lpoReference: headerValues.lpoReference || undefined,
        lpoDate: formatDateValue(headerValues.lpoDate),
        voucherNumber: headerValues.voucherNumber || undefined,
        dateReceived: formatDateValue(headerValues.dateReceived),
        remarks: headerValues.remarks,
      };
      for (const item of itemsList) {
        const dd = { ...(item.deviceDetails || {}) };
        const monitorDetails = normalizeMonitorDetails(dd.monitorDetails);
        delete dd.monitorDetails;
        Object.keys(dd).forEach((k) => { const v = dd[k]; if (v?.$d) dd[k] = new Date(v.$d).toISOString().split("T")[0]; else if (v instanceof Date) dd[k] = v.toISOString().split("T")[0]; });
        if (monitorDetailsChanged(item.itItemId, monitorDetails)) {
          await api.patch(`/admin/it-items/${item.itItemId}`, { monitorDetails: monitorDetails || null });
        }
        await api.post("/stores/stock-received/create", {
          ...shared,
          categoryId: item.categoryId,
          itItemId: item.itItemId,
          quantityReceived: Number(item.quantity || 1),
          serialNumber: item.serialNumber?.trim() || undefined,
          warrantyPeriod: item.warrantyPeriod || undefined,
          warrantyDate: formatDateValue(item.warrantyDate),
          deviceDetails: Object.keys(dd).length ? dd : undefined,
        });
      }
    },
    onSuccess: () => {
      toast.success("Stock received successfully!");
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["stockLevels"] });
      queryClient.invalidateQueries({ queryKey: ["itItems"] });
    },
    onError: (err) => { const msg = err.response?.data?.message; toast.error(Array.isArray(msg) ? msg[0] : msg || "Failed to submit stock received."); },
  });

  const handleSubmit = (headerValues) => {
    if (!items.length) { toast.error("Please add at least one item."); return; }
    if (items.some((i) => !i.itItemId)) { toast.error("Please select an IT item for every row."); return; }
    if (items.some((i) => Number(i.quantity || 0) < 1)) { toast.error("Quantity must be at least 1 for every item."); return; }
    const invalidFixedSerial = items.find((i) => {
      const qty = Number(i.quantity || 1);
      if (i.stockType !== "FIXED_ASSET" || qty <= 1) return false;
      const serials = parseSerialTokens(i.serialNumber);
      return serials.length > 0 && serials.length !== qty;
    });
    if (invalidFixedSerial) {
      toast.error("For fixed assets with qty above 1, provide one serial per unit (comma-separated) or leave serial blank.");
      return;
    }
    const incompleteMonitorDetails = items.find((item) => {
      const monitorDetails = item.deviceDetails?.monitorDetails;
      return monitorDetailsChanged(item.itItemId, monitorDetails) && !monitorDetailsCompleteOrEmpty(monitorDetails);
    });
    if (incompleteMonitorDetails) {
      toast.error("Complete monitor brand, model, and serial number, or leave all monitor fields blank.");
      setDetailsItemKey(incompleteMonitorDetails.key);
      return;
    }
    const missingRequiredFixedDetails = items.find((item) => {
      if (item.stockType !== "FIXED_ASSET") return false;
      return getCategoryDefs(item.categoryId).some((def) => {
        if (!def.isRequired) return false;
        const value = item.deviceDetails?.[def.key];
        return value == null || value === "";
      });
    });
    if (missingRequiredFixedDetails) {
      toast.error("Complete required device details for all fixed asset items.");
      setDetailsItemKey(missingRequiredFixedDetails.key);
      return;
    }

    mutation.mutate({ headerValues, itemsList: items });
  };

  const handleEditSubmit = (values) => {
    const receiptId = viewRecord?.id;
    if (!receiptId) {
      toast.error("Unable to update receipt. Missing receipt ID.");
      return;
    }
    const editedMonitorDetails = values.monitorDetails;
    const itItemId = viewRecord.itItem?.id ?? viewRecord.itItemId;
    if (monitorDetailsChanged(itItemId, editedMonitorDetails) && !monitorDetailsCompleteOrEmpty(editedMonitorDetails)) {
      toast.error("Complete monitor brand, model, and serial number, or leave all monitor fields blank.");
      return;
    }

    const { monitorDetails: _oldMonitorDetails, ...baseDeviceDetails } = viewRecord.deviceDetails || {};
    const receiptPayload = {
      lpoReference: values.lpoReference?.trim() || undefined,
      lpoDate: values.lpoDate ? formatDateValue(values.lpoDate) : undefined,
      voucherNumber: values.voucherNumber?.trim() || undefined,
      dateReceived: values.dateReceived ? formatDateValue(values.dateReceived) : undefined,
      serialNumber: values.serialNumber?.trim() || undefined,
      warrantyPeriod: values.warrantyPeriod ?? undefined,
      warrantyDate: values.warrantyDate ? formatDateValue(values.warrantyDate) : undefined,
      deviceDetails: baseDeviceDetails,
      remarks: values.remarks?.trim() || undefined,
    };
    if (!Object.keys(receiptPayload.deviceDetails).length) {
      delete receiptPayload.deviceDetails;
    }
    const brand = values.brand?.trim();
    const model = values.model?.trim();
    const brandChanged = brand !== viewRecord.itItem?.brand;
    const modelChanged = model !== viewRecord.itItem?.model;
    const promises = [updateMutation.mutateAsync({ id: receiptId, data: receiptPayload })];

    if (itItemId && (brandChanged || modelChanged)) {
      promises.push(updateItItemMutation.mutateAsync({ id: itItemId, data: { brand, model } }));
    }
    if (itItemId && monitorDetailsChanged(itItemId, editedMonitorDetails)) {
      promises.push(updateItItemMonitorMutation.mutateAsync({ id: itItemId, data: { monitorDetails: normalizeMonitorDetails(editedMonitorDetails) || null } }));
    }

    Promise.all(promises)
      .then(() => {
        toast.success("Receipt updated successfully!");
        setViewRecord(null);
        editForm.resetFields();
        queryClient.invalidateQueries({ queryKey: ["stores"] });
        queryClient.invalidateQueries({ queryKey: ["stockLevels"] });
        queryClient.invalidateQueries({ queryKey: ["itItems"] });
      })
      .catch(() => {});
  };

  // ── items table columns ──
  const itemColumns = [
    {
      title: "IT Item", width: 260,
      render: (_, record) => {
        return (
          <Select size="small" className="w-full" placeholder="Select IT item" value={record.itItemId} showSearch optionFilterProp="children" onChange={(v) => updateItem(record.key, "itItemId", v)}>
            {itItemsList.map((it) => <Select.Option key={it.id} value={it.id}>{it.brand} {it.model}</Select.Option>)}
          </Select>
        );
      },
    },
    {
      title: "Type", width: 110,
      render: (_, record) => record.stockType ? <Tag color={TYPE_COLOR[record.stockType]}>{TYPE_LABEL[record.stockType]}</Tag> : null,
    },
    {
      title: "Qty", width: 72,
      render: (_, record) => (
        <InputNumber size="small" className="w-full" min={1} value={record.quantity} onChange={(v) => updateItem(record.key, "quantity", v)} />
      ),
    },
    {
      title: "Serial No", width: 140,
      render: (_, record) => {
        const qty = Number(record.quantity || 1);
        const placeholder = record.stockType === "FIXED_ASSET" && qty > 1
          ? "Serials (comma-separated)"
          : "Serial number";
        return <Input size="small" placeholder={placeholder} value={record.serialNumber} onChange={(e) => updateItem(record.key, "serialNumber", e.target.value)} />;
      },
    },
    {
      title: "Monitor", width: 180,
      render: (_, record) => {
        const monitorDetails = getRowMonitorDetails(record);
        if (!monitorDetails) return <span className="text-xs text-[#9E9E9E]">—</span>;
        return (
          <div className="text-xs leading-5 text-[#424242]">
            <p className="font-semibold">{monitorDetails.brand || "—"} {monitorDetails.model || ""}</p>
            <p className="text-[#757575]">{monitorDetails.serialNumber || "No serial"}</p>
          </div>
        );
      },
    },
    {
      title: "", width: 62,
      render: (_, record) => record.itItemId ? (
        <button type="button" onClick={() => setDetailsItemKey(record.key)} className="cursor-pointer text-xs text-[#D32F2F] hover:underline whitespace-nowrap">
          Details
        </button>
      ) : null,
    },
    {
      title: "", width: 44,
      render: (_, record) => <Button type="text" danger size="small" icon={<LuTrash2 size={13} />} onClick={() => removeItemRow(record.key)} />,
    },
  ];

  const expandedRowRender = (record) => {
    const defs = getCategoryDefs(record.categoryId);
    if (!defs.length) return <div className="px-4 py-3 text-xs text-[#9E9E9E]">No device fields defined for this sub-category.</div>;
    const isFixed = record.stockType === "FIXED_ASSET";
    return (
      <div className="px-4 py-3">
        <div className={`mb-3 rounded-xl px-3 py-2 text-xs ${isFixed ? "bg-[#FFF3E0] text-[#E65100]" : "bg-[#F3F4F6] text-[#616161]"}`}>
          {isFixed
            ? "Fixed Asset — qty is allowed; if qty is above 1, you can enter comma-separated serials."
            : "Optional device fields for this consumable item."}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {defs.map((def) => (
            <div key={def.id}>
              <label className="mb-1 block text-xs font-medium text-[#424242]">{def.label}{isFixed && def.isRequired ? " *" : ""}</label>
              {renderDefInput(def, record.deviceDetails?.[def.key], (v) => updateDeviceDetail(record.key, def.key, v))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── main history table ──
  const columns = [
    { title: "Tag No.", dataIndex: "tagNumber", key: "tagNumber", width: 150, render: (v) => v ? <Tag color="red">{v}</Tag> : <span className="text-[#9E9E9E]">Pending</span> },
    { title: "L.P.O Number", dataIndex: "lpoReference", key: "lpoReference" },
    { title: "Voucher No", dataIndex: "voucherNumber", key: "voucherNumber" },
    { title: "Quantity", dataIndex: "quantityReceived", key: "quantityReceived" },
    { title: "Serial No", dataIndex: "serialNumber", key: "serialNumber", render: (v) => v || "—" },
    {
      title: "Monitor",
      key: "monitorDetails",
      render: (_, record) => {
        const monitorDetails = getReceiptMonitorDetails(record);
        if (!monitorDetails) return "—";
        return (
          <div className="text-xs leading-5">
            <p className="font-semibold text-[#212121]">{monitorDetails.brand || "—"} {monitorDetails.model || ""}</p>
            <p className="text-[#757575]">{monitorDetails.serialNumber || "No serial"}</p>
          </div>
        );
      },
    },
    { title: "Warranty (mo)", dataIndex: "warrantyPeriod", key: "warrantyPeriod", render: (v) => v || "—" },
    { title: "Brand", dataIndex: ["itItem", "brand"], key: "brand" },
    { title: "Model", dataIndex: ["itItem", "model"], key: "model" },
    { title: "Supplier", dataIndex: ["supplier", "name"], key: "supplier" },
    { title: "Received Date", dataIndex: "dateReceived", key: "dateReceived", render: (d) => d ? new Date(d).toLocaleDateString() : "—" },
    { title: "Receiver", dataIndex: ["receivedBy", "name"], key: "receiver" },
    {
      title: "Actions", key: "actions", fixed: "right", width: 90,
      render: (_, record) => (
        <button
          type="button"
          onClick={() => setViewRecord(record)}
          className="cursor-pointer rounded-full bg-[#FFEBEE] px-3 py-1 text-xs font-semibold text-[#D32F2F] transition hover:bg-[#D32F2F] hover:text-white"
        >
          View
        </button>
      ),
    },
  ];

  return (
    <PageShell
      eyebrow="Stores Operations"
      title="Stock Receiving"
      description="Register incoming stock with supplier, LPO, warranty, and receiving details in a structured stores intake workflow."
      stats={stats}
      actions={
        <>
          <Input placeholder="Search by LPO, serial or tag number" value={searchText} onChange={(e) => setSearchText(e.target.value)} prefix={<SearchOutlined />} className="w-full md:w-[280px]" />
          <Button type="primary" icon={<LuPlus />} onClick={() => setIsModalOpen(true)}>Receive Stock</Button>
        </>
      }
    >
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#616161]">Receiving Log</p>
            <h3 className="text-xl font-bold text-[#212121]">Stock received history</h3>
          </div>
          <span className="rounded-full bg-[#FFEBEE] px-3 py-1 text-xs font-semibold text-[#D32F2F]">Supplier traceability active</span>
        </div>
        <Table columns={columns} dataSource={stockRows} loading={storesLoading} rowKey="id" scroll={{ x: 1300 }}
          pagination={{ current: pagination.page, pageSize: pagination.limit, total: stockMeta?.total || 0, showSizeChanger: true, pageSizeOptions: ["10", "20", "50"], showTotal: (t) => `${t} receipts`, onChange: (page, pageSize) => setPagination({ page, limit: pageSize }) }}
        />
      </section>

      {/* ── Receive Stock Modal ── */}
      <Modal title="Receive Stock" open={isModalOpen} onCancel={closeModal} footer={null} width={1020} destroyOnClose
        styles={{ body: { maxHeight: "78vh", overflowY: "auto", padding: "16px 24px" } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="mb-4 rounded-2xl border border-[#E0E0E0] bg-[#F9FAFB] p-4">
            <div className="grid grid-cols-3 gap-x-4 gap-y-0">
              <Form.Item name="supplierId" label="Supplier" rules={[{ required: true, message: "Select a supplier" }]}>
                <Select placeholder="Select supplier" showSearch optionFilterProp="children">
                  {suppliers.map((s) => <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>)}
                </Select>
              </Form.Item>

              <Form.Item name="lpoReference" label="LPO Reference" rules={[{ required: true }]}>
                <Input placeholder="e.g. LPO-2024-001" />
              </Form.Item>

              <Form.Item name="lpoDate" label="LPO Date" rules={[{ required: true }]}>
                <DatePicker className="w-full" disabledDate={(current) => current && current.isAfter(dayjs().endOf('day'))} />
              </Form.Item>

              <Form.Item name="voucherNumber" label="Voucher Number" rules={[{ required: true }]}>
                <Input placeholder="Voucher No." />
              </Form.Item>

              <Form.Item name="dateReceived" label="Receive Date" rules={[{ required: true }]}>
                <DatePicker className="w-full" disabledDate={(current) => current && current.isAfter(dayjs().endOf('day'))} />
              </Form.Item>

              <Form.Item name="remarks" label="Remarks">
                <Input placeholder="Optional notes" />
              </Form.Item>
            </div>
          </div>

          {/* Internal type */}
          <div className="mb-4 rounded-2xl border border-[#E0E0E0] bg-[#F9FAFB] p-4">
            <Form.Item
              name="isInternalType"
              rules={[
                {
                  validator: (_, value) =>
                    typeof value === "boolean"
                      ? Promise.resolve()
                      : Promise.reject(new Error("Please choose Yes or No")),
                },
              ]}
              className="mb-0"
            >
              <div>
                <p className="mb-3 text-sm font-semibold text-[#212121]">Is it an Internal type?</p>
                <div className="flex gap-2">
                  {[{ value: true, label: "Yes" }, { value: false, label: "No" }].map(({ value, label }) => (
                    <button
                      key={String(value)}
                      type="button"
                      onClick={() => {
                        setIsProjectChecked(!value);
                        form.setFieldsValue({ isInternalType: value });
                        if (value) form.setFieldsValue({ projectName: undefined });
                      }}
                      className={`cursor-pointer rounded-full px-6 py-1.5 text-sm font-semibold transition-all ${
                        (value ? isProjectChecked === false : isProjectChecked === true)
                          ? "bg-[#D32F2F] text-white shadow-sm"
                          : "border border-[#E0E0E0] bg-white text-[#616161] hover:border-[#D32F2F] hover:text-[#D32F2F]"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </Form.Item>
            {isProjectChecked === true && (
              <div className="mt-4 grid grid-cols-3 gap-x-4">
                <Form.Item name="projectName" label="Purchase Type" rules={[{ required: true, message: "Select a purchase type" }]}>
                  <Select placeholder="Select project" showSearch optionFilterProp="children">
                    {catalogProjects.map((p) => (
                      <Select.Option key={p.id} value={p.name}>{p.name}</Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="mb-4 rounded-2xl border border-[#E0E0E0] bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-[#9E9E9E]">Items</p>
              <Button size="small" type="dashed" icon={<LuPlus size={12} />} onClick={addItemRow}>Add Item</Button>
            </div>
            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#E0E0E0] bg-[#F9FAFB] py-10 text-center text-sm text-[#9E9E9E]">
                Click <strong className="text-[#616161]">Add Item</strong> to include items in this receipt.
              </div>
            ) : (
              <Table
                dataSource={items} rowKey="key" columns={itemColumns} pagination={false} size="small"
                scroll={{ x: 960 }}
              />
            )}
          </div>

          <Button type="primary" htmlType="submit" className="w-full" loading={mutation.isPending}>
            Submit
          </Button>
        </Form>
      </Modal>
      {/* ── View / Edit Receipt Modal ── */}
      {viewRecord && (
        <Modal
          title={
            <div>
              <p className="text-base font-semibold">Edit Receipt</p>
              <div className="mt-1 flex items-center gap-2 text-sm text-[#616161]">
                <span>{viewRecord.itItem?.brand} {viewRecord.itItem?.model}</span>
                {viewRecord.tagNumber && <Tag color="red">{viewRecord.tagNumber}</Tag>}
              </div>
            </div>
          }
          open
          onCancel={() => { setViewRecord(null); editForm.resetFields(); }}
          footer={null}
          width={680}
          destroyOnClose
        >
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleEditSubmit}
          >
            {/* Item */}
            <div className="mb-4 rounded-xl border border-[#E0E0E0] bg-[#F9FAFB] p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#D32F2F]">Item</p>
              <div className="grid grid-cols-3 gap-3">
                <Form.Item name="brand" label="Brand" className="mb-0" rules={[{ required: true, message: "Required" }]}>
                  <Input placeholder="e.g. Dell" />
                </Form.Item>
                <Form.Item name="model" label="Model" className="mb-0" rules={[{ required: true, message: "Required" }]}>
                  <Input placeholder="e.g. Latitude 5530" />
                </Form.Item>
                <div>
                  <span className="text-xs text-[#9E9E9E]">Category</span>
                  <p className="mt-0.5 rounded-lg bg-[#F3F4F6] px-3 py-1.5 text-sm font-medium text-[#212121]">{viewRecord.itItem?.category?.name || "—"}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-[#9E9E9E]">Quantity Received</span>
                  <p className="mt-0.5 rounded-lg bg-[#F3F4F6] px-3 py-1.5 text-sm font-semibold text-[#212121]">{viewRecord.quantityReceived}</p>
                </div>
                <Form.Item name="serialNumber" label="Serial No." className="mb-0">
                  <Input placeholder="Serial number" />
                </Form.Item>
              </div>
            </div>

            {(() => {
              const monitorDetails = getReceiptMonitorDetails(viewRecord);
              if (!monitorDetails || typeof monitorDetails !== "object") return null;
              return (
                <div className="mb-4 rounded-xl border border-[#E0E0E0] bg-[#F9FAFB] p-4">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#D32F2F]">Monitor Details</p>
                  <div className="grid grid-cols-3 gap-3">
                    {MONITOR_FIELDS.map((field) => (
                      <Form.Item
                        key={field.key}
                        name={["monitorDetails", field.key]}
                        label={field.label}
                        className="mb-0"
                      >
                        <Input placeholder={field.placeholder} />
                      </Form.Item>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Procurement */}
            <div className="mb-4 rounded-xl border border-[#E0E0E0] bg-[#F9FAFB] p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#D32F2F]">Procurement</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-[#9E9E9E]">Supplier</span>
                  <p className="mt-0.5 rounded-lg bg-[#F3F4F6] px-3 py-1.5 text-sm font-medium text-[#212121]">{viewRecord.supplier?.name || "—"}</p>
                </div>
                <Form.Item name="lpoReference" label="LPO Reference" className="mb-0">
                  <Input placeholder="e.g. LPO-2024-001" />
                </Form.Item>
                <Form.Item name="lpoDate" label="LPO Date" className="mb-0">
                  <DatePicker className="w-full" />
                </Form.Item>
                <Form.Item name="voucherNumber" label="Voucher Number" className="mb-0">
                  <Input placeholder="Voucher No." />
                </Form.Item>
                <Form.Item name="dateReceived" label="Date Received" className="mb-0">
                  <DatePicker className="w-full" />
                </Form.Item>
                <div>
                  <span className="text-xs text-[#9E9E9E]">Received By</span>
                  <p className="mt-0.5 rounded-lg bg-[#F3F4F6] px-3 py-1.5 text-sm font-medium text-[#212121]">{viewRecord.receivedBy?.name || "—"}</p>
                </div>
                <Form.Item name="remarks" label="Remarks" className="col-span-2 mb-0">
                  <Input placeholder="Optional notes" />
                </Form.Item>
              </div>
            </div>

            {/* Warranty */}
            <div className="mb-4 rounded-xl border border-[#E0E0E0] bg-[#F9FAFB] p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#D32F2F]">Warranty</p>
              <div className="grid grid-cols-3 gap-3">
                <Form.Item name="warrantyPeriod" label="Period (months)" className="mb-0">
                  <InputNumber min={0} className="w-full" placeholder="e.g. 12" />
                </Form.Item>
                <Form.Item name="warrantyDate" label="Start Date" className="mb-0">
                  <DatePicker className="w-full" />
                </Form.Item>
                <div>
                  <span className="text-xs text-[#9E9E9E]">Expiry (auto)</span>
                  <p className="mt-0.5 rounded-lg bg-[#F3F4F6] px-3 py-1.5 text-sm font-medium text-[#212121]">
                    {calcWarrantyExpiry(watchedWarrantyDate, watchedWarrantyPeriod) || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Device Details (read-only) */}
            {viewRecord.deviceDetails && Object.keys(viewRecord.deviceDetails).filter((key) => key !== "monitorDetails").length > 0 && (
              <div className="mb-4 rounded-xl border border-[#E0E0E0] bg-[#F9FAFB] p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#D32F2F]">Device Details</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {Object.entries(viewRecord.deviceDetails).filter(([k]) => k !== "monitorDetails").map(([k, v]) => (
                    <div key={k}>
                      <span className="text-[#9E9E9E] capitalize">{k.replace(/_/g, " ")}</span>
                      <p className="font-medium text-[#212121]">{String(v) || "—"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={() => { setViewRecord(null); editForm.resetFields(); }} className="flex-1">Cancel</Button>
              <Button type="primary" htmlType="submit" loading={updateMutation.isPending || updateItItemMutation.isPending || updateItItemMonitorMutation.isPending} className="flex-1">Save Changes</Button>
            </div>
          </Form>
        </Modal>
      )}

      {/* ── Device Details Modal ── */}
      {detailsItemKey !== null && (() => {
        const record = items.find((i) => i.key === detailsItemKey);
        if (!record) return null;
        const defs = getCategoryDefs(record.categoryId);
        const isFixed = record.stockType === "FIXED_ASSET";
        const label = itItemsList.find((x) => x.id === record.itItemId);
        return (
          <Modal
            title={
              <div>
                <p className="text-base font-semibold">Device Details</p>
                {label && <p className="text-xs font-normal text-[#9E9E9E]">{label.brand} {label.model}</p>}
              </div>
            }
            open
            onCancel={() => setDetailsItemKey(null)}
            onOk={() => setDetailsItemKey(null)}
            okText="Save"
            cancelText="Close"
            width={660}
          >
            {/* Warranty section — always shown */}
            <div className="mb-4 rounded-xl border border-[#E0E0E0] bg-[#F9FAFB] p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#D32F2F]">Warranty</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#424242]">Period (months)</label>
                  <InputNumber
                    size="small" min={0} className="w-full"
                    placeholder="e.g. 12"
                    value={record.warrantyPeriod}
                    onChange={(v) => updateItem(record.key, "warrantyPeriod", v)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#424242]">Start Date</label>
                  <DatePicker
                    size="small" className="w-full"
                    value={record.warrantyDate}
                    onChange={(v) => updateItem(record.key, "warrantyDate", v)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[#424242]">Expiry (auto)</label>
                  <Input
                    size="small" disabled
                    value={calcWarrantyExpiry(record.warrantyDate, record.warrantyPeriod) || "—"}
                    className="!bg-[#F3F4F6] font-medium !text-[#212121]"
                  />
                </div>
              </div>
            </div>

            {(() => {
              const monitorDetails = getRowMonitorDetails(record);
              if (!monitorDetails) return null;
              return (
                <div className="mb-4 rounded-xl border border-[#E0E0E0] bg-[#F9FAFB] p-4">
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#D32F2F]">Monitor Details</p>
                  <div className="grid grid-cols-3 gap-3">
                    {MONITOR_FIELDS.map((field) => (
                      <div key={field.key}>
                        <label className="mb-1 block text-xs font-medium text-[#424242]">{field.label}</label>
                        <Input
                          size="small"
                          placeholder={field.placeholder}
                          value={record.deviceDetails?.monitorDetails?.[field.key] ?? monitorDetails[field.key]}
                          onChange={(e) => updateMonitorDetail(record.key, field.key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {!defs.length ? (
              <p className="py-2 text-sm text-[#9E9E9E]">No device attribute fields defined for this sub-category.</p>
            ) : (
              <>
                <div className={`mb-4 rounded-xl px-3 py-2 text-xs ${isFixed ? "bg-[#FFF3E0] text-[#E65100]" : "bg-[#F3F4F6] text-[#616161]"}`}>
                  {isFixed ? "Fixed Asset — complete device details before submitting." : "Optional device fields for this consumable item."}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {defs.map((def) => (
                    <div key={def.id}>
                      <label className="mb-1 block text-xs font-medium text-[#424242]">{def.label}{isFixed && def.isRequired ? " *" : ""}</label>
                      {renderDefInput(def, record.deviceDetails?.[def.key], (v) => updateDeviceDetail(record.key, def.key, v))}
                    </div>
                  ))}
                </div>
              </>
            )}
          </Modal>
        );
      })()}
    </PageShell>
  );
};

export default StoresPage;
