import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Checkbox, Dropdown, Form, Input, Modal, Select, Table, Tag, Tooltip } from "antd";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { LuBoxes, LuEye, LuPencil, LuPlus, LuTrash2 } from "react-icons/lu";
import { toast } from "react-toastify";
import PageShell from "../Components/ui/page-shell";
import api from "../utils/config";
import { formatCapitalizedLabel } from "../utils/formatText";

const ITEM_CATEGORY_LABEL = "Computer and accessories";

const FORM_FACTOR_OPTIONS_BY_CATEGORY = {
  Computer: ["Laptop", "Desktop", "Mini PC", "All-in-One", "Workstation"],
  Printer: ["Laser", "Inkjet", "Thermal", "Dot Matrix"],
  Network: ["Router", "Switch", "Firewall", "Access Point", "Load Balancer", "Modem", "Gateway", "Repeater"],
  "CCTV Equipment": ["IP Camera", "NVR", "DVR", "Access Control Panel", "Alarm System", "Intercom Panel"],
  CCTV: ["IP Camera", "NVR", "DVR", "Access Control Panel", "Alarm System", "Intercom Panel"],
  Consumables: ["Accessories"],
  Consumable: ["Accessories"],
};

const getFormFactorOptionsForCategory = (categoryName) => {
  const normalized = String(categoryName || "").toLowerCase();
  if (normalized.includes("comput")) return FORM_FACTOR_OPTIONS_BY_CATEGORY.Computer;
  if (normalized.includes("print")) return FORM_FACTOR_OPTIONS_BY_CATEGORY.Printer;
  if (normalized.includes("network")) return FORM_FACTOR_OPTIONS_BY_CATEGORY.Network;
  if (normalized.includes("cctv") || normalized.includes("security")) return FORM_FACTOR_OPTIONS_BY_CATEGORY["CCTV Equipment"];
  if (normalized.includes("consumable")) return FORM_FACTOR_OPTIONS_BY_CATEGORY.Consumables;
  return FORM_FACTOR_OPTIONS_BY_CATEGORY[categoryName] || [];
};

const isClassificationLikeDefinition = (definition) => {
  const key = String(definition?.key || "").toLowerCase();
  const label = String(definition?.label || "").toLowerCase();
  return (
    key === "formfactor" ||
    key === "form_factor" ||
    key === "printtechnology" ||
    key === "print_technology" ||
    key.includes("device_type") ||
    key.includes("devicetype") ||
    key.includes("item_category") ||
    key.includes("itemcategory") ||
    label.includes("form factor") ||
    label.includes("device type") ||
    label.includes("item category") ||
    label.includes("print technology")
  );
};

const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "Not recorded");

const toOptionalNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return Number(value);
};

const getAttributeLabelMap = (record) => {
  const definitions = record?.category?.attributeDefinitions || [];

  return definitions.reduce((map, definition) => {
    map[definition.key] = definition.label;
    return map;
  }, {});
};

const renderAttributeInput = (definition) => {
  if (definition.dataType === "BOOLEAN") {
    return (
      <Select placeholder={`Select ${definition.label.toLowerCase()}`}>
        <Select.Option value={true}>Yes</Select.Option>
        <Select.Option value={false}>No</Select.Option>
      </Select>
    );
  }

  if (definition.dataType === "SELECT") {
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

  if (definition.dataType === "TEXTAREA") {
    return <Input.TextArea rows={3} placeholder={definition.helpText || definition.label} />;
  }

  return <Input placeholder={definition.helpText || definition.label} type={definition.dataType === "NUMBER" ? "number" : "text"} />;
};

const ItItems = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const deferredSearch = useDeferredValue(searchText.trim());
  const selectedCategoryId = Form.useWatch("categoryId", form);
  const selectedStockType = Form.useWatch("itemClass", form);

  const { data: itemsData } = useQuery({
    queryKey: ["getItItems", deferredSearch],
    queryFn: () =>
      api.get("/admin/it-items", {
        params: deferredSearch ? { search: deferredSearch } : undefined,
      }),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["itItemCategories"],
    queryFn: () => api.get("/admin/it-item-categories"),
  });

  const items = useMemo(() => itemsData?.data || [], [itemsData]);
  const categories = useMemo(() => categoriesData?.data || [], [categoriesData]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );

  const allCategoryDefinitions = useMemo(
    () => selectedCategory?.attributeDefinitions || [],
    [selectedCategory]
  );

  const attributeDefinitionsForDetails = useMemo(
    () => allCategoryDefinitions.filter((definition) => !isClassificationLikeDefinition(definition)),
    [allCategoryDefinitions]
  );

  const selectedAttributeKeys = Form.useWatch("validationRules", form);
  const selectedAttributeKeyList = useMemo(() => selectedAttributeKeys || [], [selectedAttributeKeys]);

  const templateDefinitions = useMemo(
    () =>
      attributeDefinitionsForDetails.filter(
        (definition) =>
          ["TEMPLATE", "BOTH"].includes(definition.scope) && selectedAttributeKeyList.includes(definition.key)
      ),
    [attributeDefinitionsForDetails, selectedAttributeKeyList]
  );

  const formFactorOptionsFromCategory = useMemo(() => {
    const sourceDefinitions = allCategoryDefinitions.filter(
      (item) =>
        isClassificationLikeDefinition(item) &&
        item?.dataType === "SELECT" &&
        Array.isArray(item?.optionsJson)
    );

    const combined = sourceDefinitions.flatMap((definition) =>
      definition.optionsJson.filter((option) => typeof option === "string" && option.trim() !== "")
    );

    return [...new Set(combined)];
  }, [allCategoryDefinitions]);

  const formFactorOptions = useMemo(
    () => {
      if (formFactorOptionsFromCategory.length) {
        return formFactorOptionsFromCategory;
      }
      return getFormFactorOptionsForCategory(selectedCategory?.name);
    },
    [formFactorOptionsFromCategory, selectedCategory?.name]
  );

  useEffect(() => {
    if (!selectedCategory) {
      return;
    }

    if (!form.getFieldValue("itemClass") && selectedCategory.defaultItemClass) {
      form.setFieldValue("itemClass", selectedCategory.defaultItemClass);
    }

    const currentFormFactor = form.getFieldValue("formFactor");
    const allowedFormFactors = getFormFactorOptionsForCategory(selectedCategory.name);
    if (currentFormFactor && !allowedFormFactors.includes(currentFormFactor)) {
      form.setFieldValue("formFactor", undefined);
    }

    if (!editingItem) {
      const allKeys = (selectedCategory.attributeDefinitions || [])
        .filter((definition) => !isClassificationLikeDefinition(definition))
        .map((d) => d.key);
      form.setFieldValue("validationRules", allKeys);
    }
  }, [editingItem, form, selectedCategory]);

  useEffect(() => {
    if (selectedStockType !== "CONSUMABLE") {
      form.setFieldsValue({
        unitOfMeasure: undefined,
        reorderLevel: undefined,
        minimumLevel: undefined,
        maximumLevel: undefined,
      });
    }
  }, [form, selectedStockType]);

  const stats = useMemo(() => {
    const totalStock = items.reduce((sum, item) => sum + (item.stock?.quantityInStock ?? 0), 0);
    const fixedAssets = items.filter((item) => item.itemClass === "FIXED_ASSET").length;
    const consumables = items.filter((item) => item.itemClass === "CONSUMABLE").length;

    return [
      { label: "Catalog Items", value: items.length, caption: "Registered inventory templates" },
      { label: "Stock Units", value: totalStock, caption: "Total quantity currently in stock" },
      { label: "Fixed Assets", value: fixedAssets, caption: `${consumables} consumables in catalog` },
    ];
  }, [items]);

  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearch]);

  const addItem = useMutation({
    mutationFn: (values) => api.post("admin/ititems/new", values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["getItItems"] });
      setIsModalOpen(false);
      toast.success("Item added successfully");
      form.resetFields();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to add item");
    },
  });

  const updateItem = useMutation({
    mutationFn: ({ id, values }) => api.patch(`/admin/it-items/${id}`, values),
    onSuccess: () => {
      toast.success("Item updated successfully");
      queryClient.invalidateQueries({ queryKey: ["getItItems"] });
      closeItemModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update item");
    },
  });

  const deleteItem = useMutation({
    mutationFn: (id) => api.delete(`/admin/it-items/${id}`),
    onSuccess: () => {
      toast.success("Item deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["getItItems"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete item");
    },
  });

  const openViewModal = (record) => {
    setSelectedItem(record);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setSelectedItem(null);
    setIsViewModalOpen(false);
  };

  const closeItemModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    form.resetFields();
  };

  const openCreateModal = () => {
    setEditingItem(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingItem(record);
    form.setFieldsValue({
      categoryId: record.categoryId,
      itemClass: record.itemClass,
      brand: record.brand,
      model: record.model,
      formFactor: record.formFactor,
      description: record.description,
      unitOfMeasure: record.unitOfMeasure,
      reorderLevel: record.stock?.reorderThreshold,
      minimumLevel: record.stock?.minimumLevel,
      maximumLevel: record.stock?.maximumLevel,
      validationRules: record.validationRules || [],
      attributes: record.specifications || {},
    });
    setIsModalOpen(true);
  };

  const confirmDelete = (record) => {
    Modal.confirm({
      title: "Delete item",
      content: "This removes the item template from future use while preserving linked records.",
      okText: "Delete",
      okButtonProps: { danger: true },
      onOk: () => deleteItem.mutateAsync(record.id),
    });
  };

  const columns = [
    {
      title: "Item Category",
      key: "itemCategory",
      render: () => <span className="font-semibold text-[#212121]">{ITEM_CATEGORY_LABEL}</span>,
    },
    {
      title: "Sub Category",
      key: "category",
      render: (_, record) => <span className="font-semibold text-[#212121]">{record.category?.name || formatCapitalizedLabel(record.deviceType)}</span>,
    },
    {
      title: "Stock Type",
      dataIndex: "itemClass",
      key: "itemClass",
      render: (value) => formatCapitalizedLabel(value),
    },
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
      title: "Form Factor",
      dataIndex: "formFactor",
      key: "formFactor",
      render: (value) => value || "-",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (value) => value || "Not provided",
    },
    {
      title: "Unit",
      dataIndex: "unitOfMeasure",
      key: "unitOfMeasure",
      render: (value) => value || "-",
    },
    {
      title: "Reorder Level",
      key: "reorderLevel",
      render: (_, record) => record.stock?.reorderThreshold ?? "-",
    },
    {
      title: "Quantity In Stock",
      key: "quantityInStock",
      render: (_, record) => record.stock?.quantityInStock ?? 0,
    },
    {
      title: "Registered Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: formatDate,
    },
    {
      title: "Recorded By",
      key: "recordedBy",
      render: (_, record) => record.recordedBy?.name || record.recordedBy?.staffId || "Not recorded",
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      width: 72,
      render: (_, record) => (
        <Dropdown
          trigger={["click"]}
          placement="bottomRight"
          menu={{
            items: [
              { key: "view", label: "View", icon: <LuEye size={15} />, onClick: () => openViewModal(record) },
              { key: "edit", label: "Edit", icon: <LuPencil size={15} />, onClick: () => openEditModal(record) },
              { type: "divider" },
              { key: "delete", label: "Delete", icon: <LuTrash2 size={15} />, danger: true, onClick: () => confirmDelete(record) },
            ],
          }}
        >
          <Tooltip title="Actions">
            <Button type="text" shape="circle" icon={<MoreOutlined />} aria-label={`Actions for ${record.brand} ${record.model}`} />
          </Tooltip>
        </Dropdown>
      ),
    },
  ];

  const selectedItemAttributeLabels = useMemo(
    () => getAttributeLabelMap(selectedItem),
    [selectedItem]
  );

  const selectedItemSpecifications = useMemo(() => {
    if (!selectedItem?.specifications || typeof selectedItem.specifications !== "object") {
      return [];
    }

    return Object.entries(selectedItem.specifications).filter(([, value]) => value !== null && value !== undefined && value !== "");
  }, [selectedItem]);

  const selectedItemValidationRules = useMemo(() => {
    if (!Array.isArray(selectedItem?.validationRules)) {
      return [];
    }

    return selectedItem.validationRules;
  }, [selectedItem]);

  const handleSubmit = (values) => {
    const payload = {
      categoryId: values.categoryId,
      itemClass: values.itemClass,
      brand: values.brand,
      model: values.model,
      formFactor: values.formFactor,
      description: values.description,
      unitOfMeasure: values.itemClass === "CONSUMABLE" ? values.unitOfMeasure : undefined,
      reorderLevel: values.itemClass === "CONSUMABLE" ? toOptionalNumber(values.reorderLevel) : undefined,
      minimumLevel: values.itemClass === "CONSUMABLE" ? toOptionalNumber(values.minimumLevel) : undefined,
      maximumLevel: values.itemClass === "CONSUMABLE" ? toOptionalNumber(values.maximumLevel) : undefined,
      specifications: values.attributes || {},
      validationRules: values.validationRules || [],
    };

    if (editingItem) {
      updateItem.mutate({ id: editingItem.id, values: payload });
    } else {
      addItem.mutate(payload);
    }
  };

  return (
    <PageShell
      eyebrow="Back Office"
      title="IT Item Catalog"
      description="Create item templates used by stock intake, issuance, and asset tracking for computers and accessories."
      stats={stats}
      actions={
        <>
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search item ID, brand, model, sub category, or stock type"
            className="w-full sm:w-[340px]"
          />
          <Button
            type="primary"
            icon={<LuPlus size={16} />}
            className="!h-11 !rounded-2xl !px-5"
            onClick={openCreateModal}
          >
            Add Item
          </Button>
        </>
      }
    >
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#212121]">Catalog Inventory</h3>
            <p className="text-sm text-[#616161]">Each item record can later be received into stock and assigned during fulfillment.</p>
          </div>
          <div className="section-badge inline-flex items-center gap-2 rounded-full bg-[#F9FAFB] px-4 py-2 text-sm font-medium text-[#616161]">
            <LuBoxes size={16} className="text-[#D32F2F]" />
            {items.length} item types
          </div>
        </div>

        <Table
          dataSource={items}
          columns={columns}
          rowKey="id"
          size="middle"
          scroll={{ x: 1600 }}
          pagination={{
            current: currentPage,
            pageSize,
            total: items.length,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            onChange: (page, nextPageSize) => {
              setCurrentPage(page);
              setPageSize(nextPageSize);
            },
          }}
        />
      </section>

      <Modal
        title="IT Item Details"
        open={isViewModalOpen}
        footer={null}
        onCancel={closeViewModal}
        width={820}
      >
        {selectedItem ? (
          <div className="space-y-5">
            <div className="rounded-3xl border border-[#E5E7EB] bg-[#FAFAFA] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#111827]">
                    {selectedItem.brand} {selectedItem.model}
                  </h3>
                  <p className="mt-1 text-sm text-[#616161]">
                    {ITEM_CATEGORY_LABEL} / {selectedItem.category?.name || formatCapitalizedLabel(selectedItem.deviceType)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Tag className="m-0 rounded-full border-0 bg-[#EEF2FF] px-3 py-1 text-xs font-semibold text-[#3730A3]">
                    {formatCapitalizedLabel(selectedItem.itemClass)}
                  </Tag>
                  <Tag className="m-0 rounded-full border-0 bg-[#F9FAFB] px-3 py-1 text-xs font-semibold text-[#374151]">
                    {formatCapitalizedLabel(selectedItem.deviceType)}
                  </Tag>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-[#E5E7EB] bg-white p-4">
                <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-[#111827]">Core Details</h4>
                <div className="mt-3 space-y-2 text-sm text-[#374151]">
                  <p><span className="font-semibold text-[#111827]">Item Category:</span> {ITEM_CATEGORY_LABEL}</p>
                  <p><span className="font-semibold text-[#111827]">Sub Category:</span> {selectedItem.category?.name || "N/A"}</p>
                  <p><span className="font-semibold text-[#111827]">Brand:</span> {selectedItem.brand || "N/A"}</p>
                  <p><span className="font-semibold text-[#111827]">Model:</span> {selectedItem.model || "N/A"}</p>
                  <p><span className="font-semibold text-[#111827]">Form Factor:</span> {selectedItem.formFactor || "N/A"}</p>
                  <p><span className="font-semibold text-[#111827]">Description:</span> {selectedItem.description || "N/A"}</p>
                  <p><span className="font-semibold text-[#111827]">Stock Type:</span> {formatCapitalizedLabel(selectedItem.itemClass)}</p>
                  <p><span className="font-semibold text-[#111827]">Unit of Measure:</span> {selectedItem.unitOfMeasure || "N/A"}</p>
                  <p><span className="font-semibold text-[#111827]">Legacy Type:</span> {formatCapitalizedLabel(selectedItem.deviceType)}</p>
                  <p><span className="font-semibold text-[#111827]">Quantity In Stock:</span> {selectedItem.stock?.quantityInStock ?? 0}</p>
                  <p><span className="font-semibold text-[#111827]">Reorder Level:</span> {selectedItem.stock?.reorderThreshold ?? "N/A"}</p>
                  <p><span className="font-semibold text-[#111827]">Minimum Level:</span> {selectedItem.stock?.minimumLevel ?? "N/A"}</p>
                  <p><span className="font-semibold text-[#111827]">Maximum Level:</span> {selectedItem.stock?.maximumLevel ?? "N/A"}</p>
                  <p><span className="font-semibold text-[#111827]">Registered Date:</span> {formatDate(selectedItem.createdAt)}</p>
                  <p><span className="font-semibold text-[#111827]">Recorded By:</span> {selectedItem.recordedBy?.name || selectedItem.recordedBy?.staffId || "N/A"}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-[#E5E7EB] bg-white p-4">
                <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-[#111827]">Selected Attributes</h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedItemValidationRules.length ? (
                    selectedItemValidationRules.map((key) => (
                      <Tag key={key} className="m-0 rounded-full border-0 bg-[#FFF5F5] px-3 py-1 text-xs font-semibold text-[#B91C1C]">
                        {selectedItemAttributeLabels[key] || key}
                      </Tag>
                    ))
                  ) : (
                    <span className="text-sm text-[#616161]">No selected attributes.</span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#E5E7EB] bg-white p-4">
              <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-[#111827]">Template Specifications</h4>
              {selectedItemSpecifications.length ? (
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {selectedItemSpecifications.map(([key, value]) => (
                    <div key={key} className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9CA3AF]">
                        {selectedItemAttributeLabels[key] || key}
                      </p>
                      <p className="mt-1 text-sm font-medium text-[#212121] break-words">{String(value)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[#616161]">No template specification values were set for this item.</p>
              )}
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        title={
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-[#111827]">{editingItem ? "Edit Item" : "Add New Item"}</span>
            <Tag className="m-0 rounded-full border-0 bg-[#FEF3C7] px-3 py-0.5 text-xs font-semibold text-[#92400E]">
              {ITEM_CATEGORY_LABEL}
            </Tag>
          </div>
        }
        open={isModalOpen}
        onCancel={closeItemModal}
        width={860}
        destroyOnClose
        centered
        styles={{
          body: {
            maxHeight: "77vh",
            overflowY: "auto",
            overflowX: "hidden",
            paddingRight: 4,
          },
        }}
        footer={
          <Button
            type="primary"
            htmlType="submit"
            block
            className="!h-11 !rounded-2xl"
            onClick={() => form.submit()}
            loading={addItem.isPending || updateItem.isPending}
          >
            {editingItem ? "Save Changes" : "Submit"}
          </Button>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* ── Classification ─────────────────────────────────────────── */}
          <div className="mb-5 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] px-5 pt-4 pb-2">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#9CA3AF]">Classification</p>
            <div className="grid grid-cols-1 gap-x-4 md:grid-cols-3">

              <Form.Item name="categoryId" label="Sub Category" rules={[{ required: true }]}>
                <Select placeholder="Select sub category" showSearch optionFilterProp="children">
                  {categories.map((category) => (
                    <Select.Option key={category.id} value={category.id}>
                      {category.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="formFactor"
                label="Form Factor"
                rules={[{ required: true, message: "Select form factor" }]}
              >
                <Select
                  placeholder={selectedCategory ? "Select form factor" : "Select sub category first"}
                  disabled={!selectedCategory}
                  showSearch
                  optionFilterProp="children"
                >
                  {formFactorOptions.map((factor) => (
                    <Select.Option key={factor} value={factor}>
                      {factor}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item name="itemClass" label="Stock Type" rules={[{ required: true }]}>
                <Select placeholder="Select stock type">
                  <Select.Option value="FIXED_ASSET">Fixed Asset</Select.Option>
                  <Select.Option value="CONSUMABLE">Consumable</Select.Option>
                </Select>
              </Form.Item>
            </div>
          </div>

          {/* ── Item Details ────────────────────────────────────────────── */}
          <div className="mb-5 rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] px-5 pt-4 pb-2">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#9CA3AF]">Item Details</p>
            <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
              <Form.Item name="brand" label="Brand" rules={[{ required: true }]}>
                <Input placeholder="e.g. Dell" />
              </Form.Item>

              <Form.Item name="model" label="Model" rules={[{ required: true }]}>
                <Input placeholder="e.g. OptiPlex" />
              </Form.Item>

              <Form.Item name="description" label="Description" rules={[{ required: true, message: "Description is required" }]}>
                <Input placeholder="e.g. OptiPlex 2039" />
              </Form.Item>
            </div>
          </div>

          {/* ── Stock Controls (Consumable only) ────────────────────────── */}
          {selectedStockType === "CONSUMABLE" ? (
            <div className="mb-5 rounded-2xl border border-[#DBEAFE] bg-[#EFF6FF] px-5 pt-4 pb-2">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-[#3B82F6]">Stock Controls</p>
              <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
                <Form.Item name="unitOfMeasure" label="Unit of Measure">
                  <Input placeholder="1" />
                </Form.Item>

                <Form.Item name="reorderLevel" label="Reorder Level">
                  <Input placeholder="49" type="number" min={0} />
                </Form.Item>

                <Form.Item name="minimumLevel" label="Minimum Level">
                  <Input placeholder="Minimum quantity" type="number" min={0} />
                </Form.Item>

                <Form.Item name="maximumLevel" label="Maximum Level">
                  <Input placeholder="Maximum quantity" type="number" min={0} />
                </Form.Item>
              </div>
            </div>
          ) : null}

          {selectedCategory && attributeDefinitionsForDetails.length ? (
            <div className="mb-6 rounded-3xl border border-[#E5E7EB] bg-[#FAFAFA] p-4">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-base font-bold text-[#111827]">Category Attributes</h4>
                  <p className="mt-1 text-sm text-[#616161]">
                    Select which attributes the inventory officer should fill in when adding a new asset.
                  </p>
                </div>
                <Tag className="m-0 rounded-full border-0 bg-[#FFF5F5] px-3 py-1 text-xs font-semibold text-[#B91C1C]">
                  {selectedCategory.name}
                </Tag>
              </div>

              <Form.Item name="validationRules" className="mb-4">
                <Checkbox.Group className="flex flex-col gap-2">
                  {attributeDefinitionsForDetails.map((definition) => (
                    <Checkbox key={definition.key} value={definition.key}>
                      <span className="font-medium">{definition.label}</span>
                      <Tag className="ml-2" color="default">{definition.dataType}</Tag>
                      <Tag color={definition.scope === "ASSET" ? "blue" : definition.scope === "BOTH" ? "green" : "orange"}>
                        {definition.scope}
                      </Tag>
                      {definition.isRequired && <Tag color="red">Required</Tag>}
                    </Checkbox>
                  ))}
                </Checkbox.Group>
              </Form.Item>

              {templateDefinitions.length ? (
                <>
                  <h4 className="mb-3 text-sm font-semibold text-[#374151]">Template Values (optional defaults)</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {templateDefinitions.map((definition) => (
                      <Form.Item
                        key={definition.id}
                        name={["attributes", definition.key]}
                        label={definition.label}
                      >
                        {renderAttributeInput(definition)}
                      </Form.Item>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ) : null}

        </Form>
      </Modal>
    </PageShell>
  );
};

export default ItItems;
