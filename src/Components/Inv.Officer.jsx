import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Button, DatePicker, Dropdown, Form, Input, InputNumber, Modal, Popconfirm, Select, Switch, Table, Tabs, Tag, Divider } from "antd";
import { MoreOutlined, PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { LuQrCode, LuTrash2 } from "react-icons/lu";
import { toast } from "react-toastify";
import api from "../utils/config";
import { formatCapitalizedLabel } from "../utils/formatText";
import PageShell from "./ui/page-shell";

const INVENTORY_STATUS_STYLES = {
  ACTIVE: "bg-[#ECFDF3] text-[#166534]",
  INACTIVE: "bg-[#FFEBEE] text-[#B71C1C]",
  NON_FUNCTIONAL: "bg-[#FFF7ED] text-[#C2410C]",
  UNDER_REPAIR: "bg-[#FFF3E0] text-[#E65100]",
  LOANED: "bg-[#E3F2FD] text-[#0D47A1]",
  OBSOLETE: "bg-[#FFF7ED] text-[#C2410C]",
  DISPOSED: "bg-[#FFEBEE] text-[#B71C1C]",
};

const SERVICE_DESK_STATUS_STYLES = {
  NEW: "bg-[#FFF7ED] text-[#C2410C]",
  TRIAGED: "bg-[#FEF3C7] text-[#92400E]",
  ASSIGNED: "bg-[#F5F3FF] text-[#6D28D9]",
  IN_PROGRESS: "bg-[#EFF6FF] text-[#1D4ED8]",
  WAITING_FOR_USER: "bg-[#F3F4F6] text-[#4B5563]",
  RESOLVED: "bg-[#ECFDF3] text-[#166534]",
  CLOSED: "bg-[#F0FDFA] text-[#0F766E]",
  ESCALATED: "bg-[#FFEBEE] text-[#B71C1C]",
  CANCELLED: "bg-[#F3F4F6] text-[#6B7280]",
  REOPENED: "bg-[#FEE2E2] text-[#991B1B]",
};

const PRIORITY_STYLES = {
  CRITICAL: "bg-[#7F1D1D] text-white",
  HIGH: "bg-[#FEE2E2] text-[#B91C1C]",
  MEDIUM: "bg-[#FEF3C7] text-[#92400E]",
  LOW: "bg-[#ECFDF3] text-[#166534]",
};

const formatDateTime = (value) => {
  if (!value) return "N/A";

  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatValue = (value) => {
  if (typeof value === "boolean") {
    return value ? "Enabled" : "Disabled";
  }

  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  return String(value);
};

const DetailItem = ({ label, value }) => (
  <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3">
    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">{label}</p>
    <p className="mt-1 text-sm font-medium text-[#212121] break-words">{formatValue(value)}</p>
  </div>
);

const DetailSection = ({ title, description, items }) => (
  <section className="rounded-3xl border border-[#E5E7EB] bg-white p-4">
    <div className="mb-4">
      <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-[#111827]">{title}</h4>
      {description ? <p className="mt-1 text-sm text-[#616161]">{description}</p> : null}
    </div>
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {items.map((item) => (
        <DetailItem key={item.label} label={item.label} value={item.value} />
      ))}
    </div>
  </section>
);

const WorkflowCard = ({ title, subtitle, meta, badges, children }) => (
  <article className="rounded-3xl border border-[#E5E7EB] bg-[#FAFAFA] p-4">
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div>
        <h5 className="text-base font-bold text-[#111827]">{title}</h5>
        {subtitle ? <p className="mt-1 text-sm text-[#616161]">{subtitle}</p> : null}
      </div>
      {badges ? <div className="flex flex-wrap gap-2">{badges}</div> : null}
    </div>
    {meta?.length ? (
      <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-[#4B5563] md:grid-cols-2">
        {meta.map((item) => (
          <p key={item.label}>
            <span className="font-semibold text-[#111827]">{item.label}:</span> {formatValue(item.value)}
          </p>
        ))}
      </div>
    ) : null}
    {children ? <div className="mt-3">{children}</div> : null}
  </article>
);

const EmptyWorkflowState = ({ message }) => (
  <div className="rounded-3xl border border-dashed border-[#D1D5DB] bg-[#FCFCFC] px-4 py-6 text-sm text-[#6B7280]">
    {message}
  </div>
);

const getDefinitionInputType = (definition) => {
  switch (definition.dataType) {
    case "BOOLEAN":
      return "switch";
    case "SELECT":
      return "select";
    case "TEXTAREA":
      return "textarea";
    default:
      return "input";
  }
};

const renderCategoryFieldInput = (definition) => {
  const inputType = getDefinitionInputType(definition);

  if (inputType === "switch") {
    return <Switch />;
  }

  if (inputType === "select") {
    const options = Array.isArray(definition.optionsJson) ? definition.optionsJson : [];

    return (
      <Select placeholder={`Select ${definition.label.toLowerCase()}`}>
        {options.map((option) => (
          <Select.Option key={option} value={option}>
            {option}
          </Select.Option>
        ))}
      </Select>
    );
  }

  if (inputType === "textarea") {
    return <Input.TextArea rows={3} placeholder={definition.helpText || definition.label} />;
  }

  return (
    <Input
      placeholder={definition.helpText || definition.label}
      type={definition.dataType === "NUMBER" ? "number" : "text"}
    />
  );
};

const InvOfficer = () => {
  const [modalMode, setModalMode] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [activeForm, setActiveForm] = useState("user");
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedITItem, setSelectedITItem] = useState(null);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [itItemSearch, setItItemSearch] = useState("");
  const [selectedInventoryIds, setSelectedInventoryIds] = useState([]);
  const [quickCreateForm] = Form.useForm();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();
  const deferredSearch = useDeferredValue(searchText.trim());

  const { data: inventoryResponse, isLoading: inventoryLoading } = useQuery({
    queryKey: ["inventory", deferredSearch],
    queryFn: () =>
      api.get("/inventory/all", {
        params: deferredSearch ? { search: deferredSearch } : undefined,
      }),
  });

  const { data: assignmentHistoryRes, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["assignmentHistory", selectedRecord?.id],
    queryFn: () => api.get(`/inventory/${selectedRecord.id}/assignment-history`),
    enabled: !!selectedRecord?.id && modalMode === "view",
  });

  const { data: stockHistoryRes, isLoading: isStockHistoryLoading } = useQuery({
    queryKey: ["stockHistory", selectedRecord?.id],
    queryFn: () => api.get(`/inventory/${selectedRecord.id}/stock-history`),
    enabled: !!selectedRecord?.id && modalMode === "view",
  });

  const { data: invuser } = useQuery({
    queryKey: ["invuser"],
    queryFn: () => api.get("/inventory/users"),
  });

  const { data: deviceFieldsData, isLoading: isDeviceFieldsLoading } = useQuery({
    queryKey: ["deviceFields"],
    queryFn: () => api.get("inventory/device-fields"),
  });
  const { data: itItemsResponse } = useQuery({
    queryKey: ["itItemsForCreate"],
    queryFn: () => api.get("/inventory/it-items"),
  });

  const itItemsList = itItemsResponse?.data || [];  const DEVICE_FIELDS = deviceFieldsData?.data || {};
  const inventoryData = inventoryResponse?.data || [];

  const stats = [
    { label: "Inventory Assets", value: inventoryData.length, caption: "Tracked devices" },
    {
      label: "Active Assets",
      value: inventoryData.filter((item) => item.status === "ACTIVE").length,
      caption: "Operational devices",
    },
    {
      label: "Attention Needed",
      value: inventoryData.filter((item) => ["INACTIVE", "NON_FUNCTIONAL", "OBSOLETE", "DISPOSED"].includes(item.status)).length,
      caption: "Assets requiring review",
    },
  ];

  const openViewModal = (record) => {
    setActiveForm("user");
    setSelectedRecord(record);
    setModalMode("view");
  };

  const openEditModal = (record) => {
    setActiveForm("user");
    setSelectedRecord(record);
    setModalMode("edit");
  };

  const handleCancel = () => {
    setModalMode(null);
    setActiveForm("user");
    setSelectedRecord(null);
    form.resetFields();
  };

  const handleCreateCancel = () => {
    setCreateModalOpen(false);
    setSelectedITItem(null);
    setQuickCreateOpen(false);
    setItItemSearch("");
    createForm.resetFields();
    quickCreateForm.resetFields();
  };

  // Built-in category slug → which legacy deviceTypes it covers
  const LEGACY_DEVICE_CATEGORY_MAP = { LAPTOP: "computer", DESKTOP: "computer", PRINTER: "printer", UPS: "power" };

  const createAttributeDefinitions = useMemo(() => {
    if (!selectedITItem) return [];

    // 1. Item has its own category with definitions — use those
    const ownDefs = selectedITItem.category?.attributeDefinitions || [];
    if (ownDefs.length > 0) {
      const assetDefs = ownDefs.filter((d) => ["ASSET", "BOTH"].includes(d.scope));
      const validationRules = Array.isArray(selectedITItem.validationRules) ? selectedITItem.validationRules : [];
      return validationRules.length > 0 ? assetDefs.filter((d) => validationRules.includes(d.key)) : assetDefs;
    }

    // 2. Legacy item — look up the matching built-in category from deviceFieldsData
    const slug = LEGACY_DEVICE_CATEGORY_MAP[selectedITItem.deviceType];
    if (slug) {
      const builtinCategory = (deviceFieldsData?.data?.categories || []).find((c) => c.slug === slug);
      if (builtinCategory) {
        return (builtinCategory.attributeDefinitions || []).filter((d) => ["ASSET", "BOTH"].includes(d.scope));
      }
    }

    return [];
  }, [selectedITItem, deviceFieldsData]);

  // Legacy device fields — only shown when no built-in category covers the device type
  const createLegacyDeviceFields = useMemo(() => {
    if (!selectedITItem || selectedITItem.category) return [];
    const slug = LEGACY_DEVICE_CATEGORY_MAP[selectedITItem.deviceType];
    const categories = deviceFieldsData?.data?.categories || [];
    if (slug && categories.some((c) => c.slug === slug)) return []; // built-in category covers it
    const allFields = DEVICE_FIELDS[selectedITItem.deviceType || "LAPTOP"] || [];
    return allFields.filter((f) => !f.disabled);
  }, [selectedITItem, DEVICE_FIELDS, deviceFieldsData]);

  const tabItems = [
    { key: "user", label: "Main" },
    { key: "device", label: "Device Details" },
  ];

  const columns = [
    {
      title: "User",
      dataIndex: ["user", "name"],
      key: "user",
    },
    { title: "Brand", dataIndex: ["itItem", "brand"], key: "brand" },
    { title: "Model", dataIndex: ["itItem", "model"], key: "model" },
    {
      title: "Category",
      key: "category",
      render: (_, record) => record.itItem?.category?.name || formatCapitalizedLabel(record.itItem?.deviceType),
    },
    { title: "Department", dataIndex: ["department", "name"], key: "department" },
    {
      title: "Location",
      dataIndex: "departmentLocation",
      render: (text) => text || "N/A",
    },
    { title: "Warranty Period", dataIndex: "warrantyPeriod", key: "warrantyPeriod" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          className={`rounded-full border-0 px-3 py-1 text-xs font-semibold ${
            INVENTORY_STATUS_STYLES[status] || "bg-[#F3F4F6] text-[#374151]"
          }`}
        >
          {formatCapitalizedLabel(status)}
        </Tag>
      ),
    },
    {
      title: "Purchase Date",
      dataIndex: "purchaseDate",
      key: "purchaseDate",
      render: (purchaseDate) => formatDateTime(purchaseDate),
    },
    {
      title: "Date Created",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) => formatDateTime(createdAt),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => {
        const items = [
          {
            key: "view",
            label: "View Details",
            onClick: () => openViewModal(record),
          },
          {
            key: "edit",
            label: "Edit Record",
            onClick: () => openEditModal(record),
          },
        ];

        return (
          <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
            <Button
              type="text"
              icon={<MoreOutlined />}
              className="flex items-center justify-center rounded-full border border-[#E5E7EB] text-[#616161] hover:!border-[#D32F2F] hover:!text-[#D32F2F]"
            />
          </Dropdown>
        );
      },
    },
  ];

  const selectedCategoryDefinitions = useMemo(() => {
    if (!selectedRecord?.itItem?.category?.attributeDefinitions?.length) {
      return [];
    }

    return selectedRecord.itItem.category.attributeDefinitions.filter((definition) => ["ASSET", "BOTH"].includes(definition.scope));
  }, [selectedRecord]);

  const selectedDeviceFields = useMemo(() => {
    if (!selectedRecord || !DEVICE_FIELDS) {
      return [];
    }

    if (selectedCategoryDefinitions.length) {
      return selectedCategoryDefinitions.map((definition) => ({
        name: definition.key,
        label: definition.label,
        type: getDefinitionInputType(definition),
        optionsJson: definition.optionsJson,
        helpText: definition.helpText,
        dataType: definition.dataType,
      }));
    }

    const deviceType = selectedRecord?.itItem?.deviceType || "LAPTOP";
    return DEVICE_FIELDS[deviceType] || DEVICE_FIELDS.LAPTOP || [];
  }, [DEVICE_FIELDS, selectedCategoryDefinitions, selectedRecord]);

  const selectedDeviceDetails = useMemo(() => {
    if (!selectedRecord) {
      return null;
    }

    if (selectedCategoryDefinitions.length) {
      return selectedRecord.assetAttributes || selectedRecord.itItem?.specifications || {};
    }

    const deviceType = selectedRecord?.itItem?.deviceType || "LAPTOP";

    switch (deviceType) {
      case "DESKTOP":
        return selectedRecord.desktopDetails;
      case "PRINTER":
        return selectedRecord.printerDetails;
      case "UPS":
        return selectedRecord.upsDetails;
      case "OTHER":
        return selectedRecord.otherDetails;
      case "LAPTOP":
      default:
        return selectedRecord.laptopDetails;
    }
  }, [selectedCategoryDefinitions, selectedRecord]);

  const detailSections = useMemo(() => {
    if (!selectedRecord) {
      return [];
    }

    const ownershipItems = [
      { label: "Asset ID", value: selectedRecord.assetId },
      { label: "Assigned User", value: selectedRecord.user?.name },
      { label: "Department", value: selectedRecord.department?.name },
      { label: "Unit", value: selectedRecord.unit?.name },
      {
        label: "Department Location",
        value: selectedRecord.departmentLocation || selectedRecord.department?.location,
      },
      { label: "Remarks", value: selectedRecord.remarks },
    ];

    const workflowItems = [
      { label: "Reported Issues", value: selectedRecord.serviceDeskTickets?.length || 0 },
      { label: "Maintenance Jobs", value: selectedRecord.maintenanceTickets?.length || 0 },
      {
        label: "Open Service Desk Issues",
        value:
          selectedRecord.serviceDeskTickets?.filter((ticket) =>
            ["NEW", "TRIAGED", "ASSIGNED", "IN_PROGRESS", "WAITING_FOR_USER", "ESCALATED", "REOPENED"].includes(
              ticket.status
            )
          ).length || 0,
      },
      {
        label: "Resolved Maintenance Jobs",
        value: selectedRecord.maintenanceTickets?.filter((ticket) => ticket.dateResolved).length || 0,
      },
      {
        label: "Latest Issue Logged",
        value: formatDateTime(selectedRecord.serviceDeskTickets?.[0]?.createdAt),
      },
      {
        label: "Latest Maintenance Update",
        value: formatDateTime(selectedRecord.maintenanceTickets?.[0]?.updatedAt),
      },
    ];

    const lifecycleItems = [
      { label: "Status", value: formatCapitalizedLabel(selectedRecord.status) },
      { label: "Tag Number", value: selectedRecord.stockReceived?.tagNumber },
      { label: "Warranty Period", value: selectedRecord.warrantyPeriod },
      { label: "Purchase Date", value: formatDateTime(selectedRecord.purchaseDate) },
      { label: "Created At", value: formatDateTime(selectedRecord.createdAt) },
      { label: "Updated At", value: formatDateTime(selectedRecord.updatedAt) },
      { label: "Status Changed At", value: formatDateTime(selectedRecord.statusChangedAt) },
    ];

    const deviceItems = [
      { label: "Category", value: selectedRecord.itItem?.category?.name || formatCapitalizedLabel(selectedRecord.itItem?.deviceType) },
      { label: "Brand", value: selectedRecord.itItem?.brand },
      { label: "Model", value: selectedRecord.itItem?.model },
      ...selectedDeviceFields.map((field) => {
        if (field.name.endsWith("Brand")) {
          return { label: field.label, value: selectedRecord.itItem?.brand };
        }

        if (field.name.endsWith("Model")) {
          return { label: field.label, value: selectedRecord.itItem?.model };
        }

        return {
          label: field.label,
          value: selectedDeviceDetails?.[field.name],
        };
      }),
    ];

    return [
      {
        key: "ownership",
        title: "Asset Assignment",
        description: "Who currently holds the asset and where it sits operationally.",
        items: ownershipItems,
      },
      {
        key: "linkage",
        title: "Current Linkage",
        description: "How this asset connects to reported issues, maintenance work, and operational activity.",
        items: workflowItems,
      },
      {
        key: "lifecycle",
        title: "Lifecycle Details",
        description: "Procurement timing, warranty tracking, and status timeline.",
        items: lifecycleItems,
      },
      {
        key: "device",
        title: "Device Details",
        description: "Detailed hardware metadata for the selected inventory record.",
        items: deviceItems,
      },
    ];
  }, [selectedDeviceDetails, selectedDeviceFields, selectedRecord]);

  const linkedServiceDeskTickets = selectedRecord?.serviceDeskTickets || [];
  const linkedMaintenanceTickets = selectedRecord?.maintenanceTickets || [];

  useEffect(() => {
    if (selectedRecord && DEVICE_FIELDS) {
      const categoryDefinitions = selectedRecord?.itItem?.category?.attributeDefinitions?.filter((definition) =>
        ["ASSET", "BOTH"].includes(definition.scope)
      );
      const deviceType = selectedRecord?.itItem?.deviceType || "LAPTOP";
      const fields = DEVICE_FIELDS[deviceType] || DEVICE_FIELDS.LAPTOP || [];
      const formValues = {
        userId: selectedRecord?.user?.id || selectedRecord?.userId || "",
        department: selectedRecord?.department?.name || "",
        unit: selectedRecord?.unit?.name || "",
        departmentId: selectedRecord?.department?.id || selectedRecord?.departmentId || "",
        unitIdHidden: selectedRecord?.unit?.id || selectedRecord?.unitId || null,
        status: selectedRecord?.status || "",
        remarks: selectedRecord?.remarks || "",
        deviceType,
        categoryName: selectedRecord?.itItem?.category?.name || "",
        attributes: {},
      };

      if (categoryDefinitions?.length) {
        const attributeSource = selectedRecord.assetAttributes || selectedRecord.itItem?.specifications || {};

        categoryDefinitions.forEach((definition) => {
          formValues.attributes[definition.key] = attributeSource?.[definition.key] ?? null;
        });

        form.setFieldsValue(formValues);
        return;
      }

      fields.forEach((field) => {
        if (field.name.endsWith("Brand")) {
          formValues[field.name] = selectedRecord?.itItem?.brand || "";
        } else if (field.name.endsWith("Model")) {
          formValues[field.name] = selectedRecord?.itItem?.model || "";
        } else {
          formValues[field.name] = selectedRecord?.itItem?.[field.name] || "";
        }
      });

      form.setFieldsValue(formValues);
    }
  }, [selectedRecord, form, DEVICE_FIELDS]);

  const { mutate: quickCreateITItem, isPending: isQuickCreating } = useMutation({
    mutationKey: ["quickCreateITItem"],
    mutationFn: (payload) => api.post("/inventory/it-items/quick-create", payload),
    onSuccess: (res) => {
      const item = res.data.item;
      const wasExisting = res.data.existing;
      queryClient.invalidateQueries({ queryKey: ["itItemsForCreate"] });
      setSelectedITItem(item);
      createForm.setFieldsValue({ itItemId: item.id, attributes: {} });
      setQuickCreateOpen(false);
      quickCreateForm.resetFields();
      toast.success(wasExisting ? `"${item.brand} ${item.model}" already exists — selected for you` : `"${item.brand} ${item.model}" registered and selected`);
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to register item";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    },
  });

  const { mutate: createInventory, isPending: isCreating } = useMutation({
    mutationKey: ["createInventory"],
    mutationFn: (payload) => api.post("/inventory/create", payload),
    onSuccess: () => {
      handleCreateCancel();
      toast.success("Inventory item created successfully");
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || "Failed to create inventory item";
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    },
  });

  const { mutate: updateInventory } = useMutation({
    mutationKey: ["updateInventory"],
    mutationFn: (payload) => api.patch(`/inventory/update/${selectedRecord?.id}`, payload),
    onSuccess: () => {
      handleCancel();
      toast.success("Updated successfully");
      queryClient.invalidateQueries(["inventory"]);
    },
    onError: (error) => {
      console.error("Error updating inventory:", error);
      toast.error("Failed to update inventory");
    },
  });

  const { mutate: updateDevice } = useMutation({
    mutationKey: ["updateDevice"],
    mutationFn: (payload) =>
      api.patch(`/inventory/update/${selectedRecord?.id}/device-details`, payload),
    onSuccess: () => {
      handleCancel();
      toast.success("Device details updated");
      queryClient.invalidateQueries(["inventory"]);
    },
  });

  const { mutate: deleteInventory, isPending: isDeletingInventory } = useMutation({
    mutationKey: ["deleteInventory"],
    mutationFn: (inventoryIds) =>
      Promise.all(inventoryIds.map((inventoryId) => api.delete(`/inventory/${inventoryId}`))),
    onSuccess: (_, inventoryIds) => {
      setSelectedInventoryIds([]);
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success(`${inventoryIds.length} inventory record${inventoryIds.length === 1 ? "" : "s"} deleted`);
    },
    onError: (error) => {
      const message = error?.response?.data?.message || "Failed to delete selected inventory records";
      toast.error(Array.isArray(message) ? message.join(", ") : message);
    },
  });

  const handleSubmit = (values) => {
    updateInventory({
      userId: values.userId,
      departmentId: values.departmentId,
      unitId: values.unitIdHidden,
      status: values.status,
      remarks: values.remarks,
    });
  };

  const handleCreateSubmit = (values) => {
    // If we're showing category-style attribute definitions (whether the item has its own
    // category or we're using a matching built-in category for a legacy item), always
    // store the result in assetAttributes so it's consistent and searchable.
    const usingAttributeDefs = createAttributeDefinitions.length > 0;

    let assetAttributes;
    let deviceDetails;
    if (usingAttributeDefs && values.attributes && Object.keys(values.attributes).length) {
      assetAttributes = values.attributes;
    } else if (!usingAttributeDefs && values.deviceFields && Object.keys(values.deviceFields).length) {
      deviceDetails = { ...values.deviceFields };
    }

    const payload = {
      itItemId: values.itItemId,
      userId: values.userId,
      departmentId: values.departmentId,
      unitId: values.unitIdHidden || undefined,
      warrantyPeriod: values.warrantyPeriod || undefined,
      purchaseDate: values.purchaseDate ? values.purchaseDate.toISOString() : undefined,
      status: values.status || undefined,
      lpoReference: values.lpoReference || undefined,
      supplierId: values.supplierId || undefined,
      remarks: values.remarks || undefined,
      assetAttributes,
      deviceDetails,
    };
    createInventory(payload);
  };

  const handleDeviceForm = (values) => {
    if (selectedCategoryDefinitions.length) {
      updateDevice({
        attributes: values.attributes || {},
      });
      return;
    }

    const deviceType = selectedRecord?.itItem?.deviceType || "LAPTOP";
    const fields = DEVICE_FIELDS[deviceType] || DEVICE_FIELDS.LAPTOP || [];
    const payload = { deviceType };

    fields.forEach((field) => {
      payload[field.name] = values[field.name];
    });

    updateDevice(payload);
  };

  if (isDeviceFieldsLoading) {
    return <div>Loading device fields...</div>;
  }

  return (
    <PageShell
      eyebrow="Inventory Control"
      title="Inventory Registry"
      description="Review device assignments, inspect hardware metadata, and update lifecycle information in a cleaner inventory workspace."
      stats={stats}
      actions={
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search inventory"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            prefix={<SearchOutlined />}
            className="w-full md:w-[260px]"
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalOpen(true)}
          >
            Create
          </Button>
        </div>
      }
    >
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#616161]">Asset Register</p>
            <h3 className="text-xl font-bold text-[#212121]">All inventory records</h3>
          </div>
          <span className="rounded-full bg-[#FFEBEE] px-3 py-1 text-xs font-semibold text-[#D32F2F]">
            Device details editable
          </span>
        </div>

        {selectedInventoryIds.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#FECACA] bg-[#FFF5F5] px-4 py-3">
            <span className="text-sm font-semibold text-[#991B1B]">
              {selectedInventoryIds.length} inventory record{selectedInventoryIds.length === 1 ? "" : "s"} selected
            </span>
            <div className="flex items-center gap-2">
              <Button size="small" type="link" onClick={() => setSelectedInventoryIds([])}>
                Clear
              </Button>
              <Popconfirm
                title="Delete selected inventory records?"
                description="This removes the selected records from the inventory register and cannot be undone."
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true, loading: isDeletingInventory }}
                onConfirm={() => deleteInventory(selectedInventoryIds)}
              >
                <Button size="small" danger icon={<LuTrash2 size={14} />} loading={isDeletingInventory}>
                  Delete selected
                </Button>
              </Popconfirm>
            </div>
          </div>
        )}

        <Table
          columns={columns}
          dataSource={inventoryData}
          loading={inventoryLoading}
          rowKey="id"
          scroll={{ x: 1400 }}
          rowSelection={{
            selectedRowKeys: selectedInventoryIds,
            onChange: setSelectedInventoryIds,
          }}
        />

        <Modal
          open={modalMode === "view"}
          onCancel={handleCancel}
          footer={null}
          title="Inventory Record Details"
          width={920}
        >
          {selectedRecord ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-[#FECACA] bg-[#FFF5F5] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#B91C1C]">
                  Detailed inventory view
                </p>
                <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#111827]">
                      {selectedRecord.itItem?.brand || "Unknown Brand"} {selectedRecord.itItem?.model || "Unknown Model"}
                    </h3>
                    <p className="text-sm text-[#616161]">
                      Asset {selectedRecord.assetId || "N/A"} • {selectedRecord.itItem?.category?.name || formatCapitalizedLabel(selectedRecord.itItem?.deviceType) || "Unknown Category"}
                    </p>
                  </div>
                  <Tag
                    className={`m-0 rounded-full border-0 px-3 py-1 text-xs font-semibold ${
                      INVENTORY_STATUS_STYLES[selectedRecord.status] || "bg-[#F3F4F6] text-[#374151]"
                    }`}
                  >
                    {formatCapitalizedLabel(selectedRecord.status)}
                  </Tag>
                </div>
              </div>

              {detailSections.map((section) => (
                <DetailSection
                  key={section.key}
                  title={section.title}
                  description={section.description}
                  items={section.items}
                />
              ))}

              <section className="rounded-3xl border border-[#E5E7EB] bg-white p-4">
                <div className="mb-4">
                  <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-[#111827]">Linked Service Desk Issues</h4>
                  <p className="mt-1 text-sm text-[#616161]">
                    Reported incidents, resolution notes, and support interactions tied to this asset.
                  </p>
                </div>

                <div className="space-y-3">
                  {linkedServiceDeskTickets.length ? (
                    linkedServiceDeskTickets.map((ticket) => (
                      <WorkflowCard
                        key={ticket.id}
                        title={`${ticket.ticketNo} • ${ticket.subject}`}
                        subtitle={ticket.description}
                        meta={[
                          { label: "Reporter", value: ticket.reporter?.name },
                          { label: "Assigned To", value: ticket.assignedTo?.name },
                          { label: "Category", value: ticket.category?.name },
                          { label: "Created", value: formatDateTime(ticket.createdAt) },
                          { label: "Resolved", value: formatDateTime(ticket.resolvedAt) },
                          { label: "Closed", value: formatDateTime(ticket.closedAt) },
                          { label: "Resolution Notes", value: ticket.resolutionNotes },
                          { label: "Linked Maintenance", value: ticket.maintenanceTicket?.ticketId },
                        ]}
                        badges={[
                          <Tag
                            key="status"
                            className={`m-0 rounded-full border-0 px-3 py-1 text-xs font-semibold ${
                              SERVICE_DESK_STATUS_STYLES[ticket.status] || "bg-[#F3F4F6] text-[#374151]"
                            }`}
                          >
                            {ticket.status?.replaceAll("_", " ")}
                          </Tag>,
                          <Tag
                            key="priority"
                            className={`m-0 rounded-full border-0 px-3 py-1 text-xs font-semibold ${
                              PRIORITY_STYLES[ticket.priority] || "bg-[#F3F4F6] text-[#374151]"
                            }`}
                          >
                            {ticket.priority}
                          </Tag>,
                          ticket.satisfaction ? (
                            <Tag key="rating" className="m-0 rounded-full border-0 bg-[#F0FDFA] px-3 py-1 text-xs font-semibold text-[#0F766E]">
                              Rating {ticket.satisfaction.rating}/5
                            </Tag>
                          ) : null,
                        ].filter(Boolean)}
                      >
                        {ticket.comments?.length ? (
                          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Recent Comments</p>
                            <div className="mt-2 space-y-2">
                              {ticket.comments.slice(0, 3).map((comment) => (
                                <div key={comment.id} className="rounded-2xl bg-[#F9FAFB] px-3 py-2 text-sm text-[#374151]">
                                  <p className="font-semibold text-[#111827]">
                                    {comment.author?.name || "Unknown"} • {formatDateTime(comment.createdAt)}
                                  </p>
                                  <p className="mt-1">{comment.body}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </WorkflowCard>
                    ))
                  ) : (
                    <EmptyWorkflowState message="No reported service desk issues are linked to this asset yet." />
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-[#E5E7EB] bg-white p-4">
                <div className="mb-4">
                  <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-[#111827]">Maintenance Work History</h4>
                  <p className="mt-1 text-sm text-[#616161]">
                    Technician work carried out on this asset, including action taken and linked requisitions.
                  </p>
                </div>

                <div className="space-y-3">
                  {linkedMaintenanceTickets.length ? (
                    linkedMaintenanceTickets.map((ticket) => (
                      <WorkflowCard
                        key={ticket.id}
                        title={ticket.ticketId}
                        subtitle={ticket.description}
                        meta={[
                          { label: "Issue Type", value: ticket.issueType },
                          { label: "Priority", value: ticket.priority },
                          { label: "Technician", value: ticket.technicianReceived?.name },
                          { label: "Returned By", value: ticket.technicianReturned?.name },
                          { label: "Logged", value: formatDateTime(ticket.dateLogged) },
                          { label: "Resolved", value: formatDateTime(ticket.dateResolved) },
                          { label: "Action Taken", value: ticket.actionTaken },
                          { label: "Remarks", value: ticket.remarks },
                          { label: "Linked Service Desk Ticket", value: ticket.serviceDeskTicket?.ticketNo },
                          { label: "Audited By", value: ticket.auditedBy?.name },
                        ]}
                        badges={[
                          <Tag
                            key="priority"
                            className={`m-0 rounded-full border-0 px-3 py-1 text-xs font-semibold ${
                              PRIORITY_STYLES[ticket.priority] || "bg-[#F3F4F6] text-[#374151]"
                            }`}
                          >
                            {ticket.priority}
                          </Tag>,
                          ticket.dateResolved ? (
                            <Tag key="resolved" className="m-0 rounded-full border-0 bg-[#ECFDF3] px-3 py-1 text-xs font-semibold text-[#166534]">
                              Resolved
                            </Tag>
                          ) : (
                            <Tag key="open" className="m-0 rounded-full border-0 bg-[#FFF7ED] px-3 py-1 text-xs font-semibold text-[#C2410C]">
                              Open Work
                            </Tag>
                          ),
                        ]}
                      >
                        {ticket.requisitions?.length ? (
                          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">Linked Requisitions</p>
                            <div className="mt-2 space-y-2">
                              {ticket.requisitions.map((requisition) => (
                                <div key={requisition.id} className="rounded-2xl bg-[#F9FAFB] px-3 py-2 text-sm text-[#374151]">
                                  <p className="font-semibold text-[#111827]">
                                    {requisition.requisitionID} • {requisition.status?.replaceAll("_", " ")}
                                  </p>
                                  <p className="mt-1">
                                    {requisition.itemDescription} {requisition.quantity ? `(${requisition.quantity})` : ""}
                                  </p>
                                  <p className="mt-1 text-xs text-[#6B7280]">Created {formatDateTime(requisition.createdAt)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </WorkflowCard>
                    ))
                  ) : (
                    <EmptyWorkflowState message="No maintenance work history is linked to this asset yet." />
                  )}
                </div>
              </section>

              <section className="rounded-3xl border border-[#E5E7EB] bg-white p-4">
                <div className="mb-4">
                  <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-[#111827]">Assignment History</h4>
                  <p className="mt-1 text-sm text-[#616161]">
                    Chronological record of user and department reassignments for this asset.
                  </p>
                </div>
                {isHistoryLoading ? (
                  <p className="text-sm text-[#9CA3AF]">Loading history…</p>
                ) : assignmentHistoryRes?.data?.length ? (
                  <Table
                    size="small"
                    dataSource={assignmentHistoryRes.data}
                    rowKey="id"
                    pagination={false}
                    columns={[
                      { title: "Assigned To", dataIndex: ["assignedTo", "name"], render: (v) => v || "—" },
                      { title: "Staff ID", dataIndex: ["assignedTo", "staffId"], render: (v) => v || "—" },
                      { title: "From", dataIndex: "fromDate", render: (v) => formatDateTime(v) },
                      { title: "To", dataIndex: "toDate", render: (v) => (v ? formatDateTime(v) : <Tag className="rounded-full border-0 bg-[#ECFDF3] text-xs font-semibold text-[#166534]">Current</Tag>) },
                      { title: "Changed By", dataIndex: ["reassignedBy", "name"], render: (v) => v || "—" },
                    ]}
                  />
                ) : (
                  <p className="text-sm text-[#9CA3AF]">No assignment history recorded yet.</p>
                )}
              </section>

              <section className="rounded-3xl border border-[#E5E7EB] bg-white p-4">
                <div className="mb-4">
                  <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-[#111827]">Stock History</h4>
                  <p className="mt-1 text-sm text-[#616161]">
                    Received, issued, and inventory update events related to this item.
                  </p>
                </div>
                {isStockHistoryLoading ? (
                  <p className="text-sm text-[#9CA3AF]">Loading stock history…</p>
                ) : stockHistoryRes?.data?.length ? (
                  <Table
                    size="small"
                    dataSource={stockHistoryRes.data}
                    rowKey="id"
                    pagination={false}
                    columns={[
                      {
                        title: "Event",
                        dataIndex: "eventType",
                        render: (value) => (
                          <Tag className="rounded-full border-0 bg-[#F3F4F6] px-3 py-0.5 text-xs font-semibold text-[#374151]">
                            {formatCapitalizedLabel(String(value || "").replaceAll("_", " "))}
                          </Tag>
                        ),
                      },
                      { title: "Date", dataIndex: "eventDate", render: (v) => formatDateTime(v) },
                      { title: "Tag", dataIndex: "tagNumber", render: (v) => v || "—" },
                      { title: "Serial", dataIndex: "serialNumber", render: (v) => v || "—" },
                      { title: "Qty", dataIndex: "quantity", render: (v) => (v ?? "—") },
                      { title: "Reference", dataIndex: "reference", render: (v) => v || "—" },
                      { title: "Actor", dataIndex: "actorName", render: (v) => v || "—" },
                      { title: "For", dataIndex: "counterparty", render: (v) => v || "—" },
                    ]}
                  />
                ) : (
                  <p className="text-sm text-[#9CA3AF]">No stock history found for this item yet.</p>
                )}
              </section>

              <div className="flex justify-end pt-2">
                <Button
                  icon={<LuQrCode size={15} />}
                  onClick={async () => {
                    try {
                      const res = await api.get(`/hardware/inventory/${selectedRecord.id}/qr-code`, { responseType: "blob" });
                      const url = URL.createObjectURL(res.data);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `asset-${selectedRecord.assetId}.png`;
                      a.click();
                      URL.revokeObjectURL(url);
                    } catch {
                      toast.error("Failed to download QR code");
                    }
                  }}
                >
                  Download QR Code
                </Button>
              </div>
            </div>
          ) : null}
        </Modal>

        <Modal
          open={modalMode === "edit"}
          onCancel={handleCancel}
          footer={null}
          title="Edit Inventory Record"
        >
          <Tabs activeKey={activeForm} onChange={(key) => setActiveForm(key)} items={tabItems} />

          {activeForm === "user" ? (
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item name="userId" label="Assigned User">
                <Select
                  showSearch
                  placeholder="Select a user"
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    String(option?.children || "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  onChange={(value) => {
                    const selectedUser = invuser?.data?.find((user) => user.id === value);
                    if (selectedUser) {
                      form.setFieldsValue({
                        department: selectedUser.department?.name || "",
                        unit: selectedUser.unit?.name || "",
                        departmentId: selectedUser.departmentId,
                        unitIdHidden: selectedUser.unitId,
                      });
                    }
                  }}
                >
                  {invuser?.data?.map((user) => (
                    <Select.Option key={user.id} value={user.id}>
                      {user.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="department" label="Department">
                <Input disabled />
              </Form.Item>

              <Form.Item name="unit" label="Unit">
                <Input disabled />
              </Form.Item>

              <Form.Item name="departmentId" hidden>
                <Input />
              </Form.Item>

              <Form.Item name="unitIdHidden" hidden>
                <Input />
              </Form.Item>

              <Form.Item name="status" label="Status">
                <Select>
                  <Select.Option value="ACTIVE">Active</Select.Option>
                  <Select.Option value="INACTIVE">Inactive</Select.Option>
                  <Select.Option value="NON_FUNCTIONAL">Non Functional</Select.Option>
                  <Select.Option value="UNDER_REPAIR">Under Repair</Select.Option>
                  <Select.Option value="LOANED">Loaned</Select.Option>
                  <Select.Option value="OBSOLETE">Obsolete</Select.Option>
                  <Select.Option value="DISPOSED">Disposed</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item name="remarks" label="Remarks">
                <Input.TextArea rows={4} />
              </Form.Item>

              <Button type="primary" htmlType="submit" block>
                Submit
              </Button>
            </Form>
          ) : (
            <Form form={form} layout="vertical" onFinish={handleDeviceForm}>
              {selectedCategoryDefinitions.length ? (
                <>
                  <Form.Item name="categoryName" label="Item Category">
                    <Input disabled />
                  </Form.Item>
                  {selectedCategoryDefinitions.map((definition) => (
                    <Form.Item
                      key={definition.id}
                      name={["attributes", definition.key]}
                      label={definition.label}
                      rules={definition.isRequired ? [{ required: true, message: `${definition.label} is required` }] : undefined}
                      valuePropName={getDefinitionInputType(definition) === "switch" ? "checked" : "value"}
                    >
                      {renderCategoryFieldInput(definition)}
                    </Form.Item>
                  ))}
                </>
              ) : (
                <>
                  <Form.Item name="deviceType" label="Device Type">
                    <Input disabled />
                  </Form.Item>
                  {(DEVICE_FIELDS[selectedRecord?.itItem?.deviceType || "LAPTOP"] || []).map((field) => (
                    <Form.Item
                      key={field.name}
                      name={field.name}
                      label={field.label}
                      valuePropName={field.type === "switch" ? "checked" : "value"}
                    >
                      {field.type === "switch" ? (
                        <Switch disabled={field.disabled} />
                      ) : (
                        <Input disabled={field.disabled} />
                      )}
                    </Form.Item>
                  ))}
                </>
              )}
              <Button type="primary" htmlType="submit" block>
                Save Attribute Details
              </Button>
            </Form>
          )}
        </Modal>
      </section>

      <Modal
        open={createModalOpen}
        onCancel={handleCreateCancel}
        footer={null}
        title={null}
        width={760}
        destroyOnClose
        styles={{ body: { padding: 0 } }}
      >
        {/* Modal Header */}
        <div className="rounded-t-2xl bg-[#D32F2F] px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#FFCDD2]">Inventory Officer</p>
          <h2 className="mt-1 text-xl font-bold text-white">Register Inventory Asset</h2>
          <p className="mt-0.5 text-sm text-[#FFCDD2]">
            {selectedITItem
              ? `${selectedITItem.brand} ${selectedITItem.model} • ${selectedITItem.category?.name || selectedITItem.deviceType || "Uncategorized"}`
              : "Select a subcategory to begin"}
          </p>
        </div>

        <Form form={createForm} layout="vertical" onFinish={handleCreateSubmit} className="px-6 pt-5 pb-6 space-y-6">

          {/* ── Section 1: Item ── */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">1 · Item</p>

            <Form.Item name="itItemId" label="Subcategory" rules={[{ required: true, message: "Please select a subcategory" }]} className="mb-3">
              <Select
                showSearch
                placeholder="Search by brand or model…"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  String(option?.children || "").toLowerCase().includes(input.toLowerCase())
                }
                onSearch={(val) => setItItemSearch(val)}
                dropdownRender={(menu) => (
                  <>
                    {menu}
                    {itItemSearch.trim() && (
                      <>
                        <Divider style={{ margin: "6px 0" }} />
                        <div className="px-3 pb-2">
                          <p className="mb-2 text-xs text-[#9CA3AF]">Not finding what you need?</p>
                          <Button
                            size="small"
                            type="dashed"
                            block
                            onClick={() => {
                              const parts = itItemSearch.trim().split(" ");
                              quickCreateForm.setFieldsValue({ brand: parts[0] || "", model: parts.slice(1).join(" ") || "" });
                              setQuickCreateOpen(true);
                            }}
                          >
                            + Register "{itItemSearch.trim()}" as a new item
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                )}
                onChange={(value) => {
                  const item = itItemsList.find((i) => i.id === value);
                  setSelectedITItem(item || null);
                  createForm.setFieldsValue({ attributes: {}, deviceFields: {} });
                  if (item?.specifications) {
                    const validationRules = Array.isArray(item.validationRules) ? item.validationRules : [];
                    const defs = item.category?.attributeDefinitions || [];
                    const prefill = {};
                    defs.forEach((d) => {
                      if (validationRules.includes(d.key) && ["BOTH"].includes(d.scope) && item.specifications[d.key] != null) {
                        prefill[d.key] = item.specifications[d.key];
                      }
                    });
                    if (Object.keys(prefill).length) createForm.setFieldsValue({ attributes: prefill });
                  }
                  if (item?.defaultWarranty) createForm.setFieldsValue({ warrantyPeriod: item.defaultWarranty });
                }}
              >
                {itItemsList.map((item) => (
                  <Select.Option key={item.id} value={item.id}>
                    {item.brand} {item.model} — {item.category?.name || item.deviceType || "Uncategorized"}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {/* Quick-create panel — uses component=false to avoid a nested <form> inside the outer form */}
            {quickCreateOpen && (
              <div className="mb-3 rounded-xl border border-dashed border-[#D32F2F] bg-[#FFF5F5] p-4">
                <p className="mb-3 text-sm font-bold text-[#D32F2F]">Register New Item</p>
                <Form form={quickCreateForm} layout="vertical" component={false} onFinish={(values) => quickCreateITItem(values)}>
                  <div className="grid grid-cols-2 gap-x-4">
                    <Form.Item name="brand" label="Brand" rules={[{ required: true, message: "Required" }]}>
                      <Input placeholder="e.g. Dell" />
                    </Form.Item>
                    <Form.Item name="model" label="Model" rules={[{ required: true, message: "Required" }]}>
                      <Input placeholder="e.g. Latitude 5520" />
                    </Form.Item>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4">
                    <Form.Item name="categoryId" label="Category">
                      <Select allowClear placeholder="Select category">
                        {(deviceFieldsData?.data?.categories || []).map((cat) => (
                          <Select.Option key={cat.id} value={cat.id}>{cat.name}</Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item name="itemClass" label="Item Class" rules={[{ required: true, message: "Required" }]}>
                      <Select placeholder="Select class">
                        <Select.Option value="FIXED_ASSET">Fixed Asset</Select.Option>
                        <Select.Option value="CONSUMABLE">Consumable</Select.Option>
                      </Select>
                    </Form.Item>
                  </div>
                  <Form.Item name="description" label="Description">
                    <Input placeholder="Brief description (optional)" />
                  </Form.Item>
                  <div className="flex gap-2">
                    <Button
                      type="primary"
                      loading={isQuickCreating}
                      size="small"
                      onClick={() => quickCreateForm.submit()}
                    >
                      Register Item
                    </Button>
                    <Button size="small" onClick={() => { setQuickCreateOpen(false); quickCreateForm.resetFields(); }}>Cancel</Button>
                  </div>
                </Form>
              </div>
            )}

            {/* Category-driven device details */}
            {createAttributeDefinitions.length > 0 && (
              <div className="mt-3 rounded-xl border border-[#E5E7EB] bg-white p-3">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                  Device Details · {selectedITItem?.category?.name}
                </p>
                <div className="grid grid-cols-2 gap-x-4">
                  {createAttributeDefinitions.map((definition) => {
                    const isWide = getDefinitionInputType(definition) === "textarea";
                    return (
                      <div key={definition.key} style={isWide ? { gridColumn: "1 / -1" } : {}}>
                        <Form.Item
                          name={["attributes", definition.key]}
                          label={definition.label}
                          rules={definition.isRequired ? [{ required: true, message: `${definition.label} is required` }] : undefined}
                          valuePropName={getDefinitionInputType(definition) === "switch" ? "checked" : "value"}
                        >
                          {renderCategoryFieldInput(definition)}
                        </Form.Item>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Legacy device fields */}
            {createLegacyDeviceFields.length > 0 && (
              <div className="mt-3 rounded-xl border border-[#E5E7EB] bg-white p-3">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                  Device Details · {selectedITItem?.deviceType}
                </p>
                <div className="grid grid-cols-2 gap-x-4">
                  {createLegacyDeviceFields.map((field) => (
                    <Form.Item
                      key={field.name}
                      name={["deviceFields", field.name]}
                      label={field.label}
                      valuePropName={field.type === "switch" ? "checked" : "value"}
                    >
                      {field.type === "switch" ? <Switch /> : <Input placeholder={field.label} />}
                    </Form.Item>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Section 2: Assignment ── */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">2 · Assignment</p>
            <Form.Item name="userId" label="Assigned User" rules={[{ required: true, message: "Please select a user" }]} className="mb-3">
              <Select
                showSearch
                placeholder="Select a user"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  String(option?.children || "").toLowerCase().includes(input.toLowerCase())
                }
                onChange={(value) => {
                  const user = invuser?.data?.find((u) => u.id === value);
                  if (user) {
                    createForm.setFieldsValue({
                      department: user.department?.name || "",
                      unit: user.unit?.name || "",
                      departmentId: user.departmentId,
                      unitIdHidden: user.unitId,
                    });
                  }
                }}
              >
                {invuser?.data?.map((user) => (
                  <Select.Option key={user.id} value={user.id}>{user.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <div className="grid grid-cols-2 gap-x-4">
              <Form.Item name="department" label="Department"><Input disabled /></Form.Item>
              <Form.Item name="unit" label="Unit"><Input disabled /></Form.Item>
            </div>
            <Form.Item name="departmentId" hidden><Input /></Form.Item>
            <Form.Item name="unitIdHidden" hidden><Input /></Form.Item>
          </div>

          {/* ── Section 3: Procurement (optional) ── */}
          <div className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-4">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">3 · Procurement <span className="normal-case font-normal text-[#D1D5DB]">— optional</span></p>
            <div className="grid grid-cols-2 gap-x-4">
              <Form.Item name="status" label="Status">
                <Select placeholder="Defaults to Active">
                  <Select.Option value="ACTIVE">Active</Select.Option>
                  <Select.Option value="INACTIVE">Inactive</Select.Option>
                  <Select.Option value="NON_FUNCTIONAL">Non Functional</Select.Option>
                  <Select.Option value="UNDER_REPAIR">Under Repair</Select.Option>
                  <Select.Option value="LOANED">Loaned</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="warrantyPeriod" label="Warranty Period (months)">
                <InputNumber min={0} className="w-full" placeholder="e.g. 12" />
              </Form.Item>
              <Form.Item name="purchaseDate" label="Purchase Date">
                <DatePicker className="w-full" />
              </Form.Item>
              <Form.Item name="lpoReference" label="LPO Reference">
                <Input placeholder="LPO reference number" />
              </Form.Item>
            </div>
            <Form.Item name="supplierId" label="Supplier">
              <Select showSearch allowClear placeholder="Select supplier (optional)" optionFilterProp="children"
                filterOption={(input, option) => String(option?.children || "").toLowerCase().includes(input.toLowerCase())}>
                {itItemsList
                  .filter((item) => item.supplier)
                  .reduce((acc, item) => {
                    if (!acc.find((s) => s.id === item.supplier.id)) acc.push(item.supplier);
                    return acc;
                  }, [])
                  .map((supplier) => (
                    <Select.Option key={supplier.id} value={supplier.id}>{supplier.name}</Select.Option>
                  ))}
              </Select>
            </Form.Item>
            <Form.Item name="remarks" label="Remarks" className="mb-0">
              <Input.TextArea rows={2} placeholder="Any additional notes" />
            </Form.Item>
          </div>

          <Button type="primary" htmlType="submit" block size="large" loading={isCreating}
            className="!bg-[#D32F2F] !border-[#D32F2F] hover:!bg-[#B71C1C]">
            Create Inventory Asset
          </Button>
        </Form>
      </Modal>
    </PageShell>
  );
};

export default InvOfficer;
