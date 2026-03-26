import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SearchOutlined } from "@ant-design/icons";
import { Button, Checkbox, Form, Input, Modal, Popconfirm, Select, Table, Tag } from "antd";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { LuBoxes, LuPlus } from "react-icons/lu";
import { toast } from "react-toastify";
import { Delete } from "../Components/icons/icons.components";
import PageShell from "../Components/ui/page-shell";
import api from "../utils/config";
import { formatCapitalizedLabel } from "../utils/formatText";

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
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const deferredSearch = useDeferredValue(searchText.trim());
  const selectedCategoryId = Form.useWatch("categoryId", form);

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

  const items = itemsData?.data || [];
  const categories = categoriesData?.data || [];

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) || null,
    [categories, selectedCategoryId]
  );

  const allCategoryDefinitions = useMemo(
    () => selectedCategory?.attributeDefinitions || [],
    [selectedCategory]
  );

  const selectedAttributeKeys = Form.useWatch("validationRules", form) || [];

  const templateDefinitions = useMemo(
    () =>
      allCategoryDefinitions.filter(
        (definition) =>
          ["TEMPLATE", "BOTH"].includes(definition.scope) && selectedAttributeKeys.includes(definition.key)
      ),
    [allCategoryDefinitions, selectedAttributeKeys]
  );

  useEffect(() => {
    if (!selectedCategory) {
      return;
    }

    if (!form.getFieldValue("itemClass") && selectedCategory.defaultItemClass) {
      form.setFieldValue("itemClass", selectedCategory.defaultItemClass);
    }

    // Default: pre-check all attribute keys when category changes
    const allKeys = (selectedCategory.attributeDefinitions || []).map((d) => d.key);
    form.setFieldValue("validationRules", allKeys);
  }, [form, selectedCategory]);

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
  });

  const handleDelete = (id) => {
    api
      .delete(`/admin/it-items/${id}`)
      .then(() => {
        toast.success("Item deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["getItItems"] });
      })
      .catch(() => {
        toast.error("Failed to delete item");
      });
  };

  const openViewModal = (record) => {
    setSelectedItem(record);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setSelectedItem(null);
    setIsViewModalOpen(false);
  };

  const columns = [
    {
      title: "Category",
      key: "category",
      render: (_, record) => <span className="font-semibold text-[#212121]">{record.category?.name || formatCapitalizedLabel(record.deviceType)}</span>,
    },
    {
      title: "Item Class",
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
      title: "Quantity In Stock",
      key: "quantityInStock",
      render: (_, record) => record.stock?.quantityInStock ?? 0,
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Button type="default" size="small" className="rounded-xl" onClick={() => openViewModal(record)}>
            View
          </Button>
          <Popconfirm
            title="Delete item"
            description="This action removes the item template."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
          >
            <button className="rounded-full p-1.5 transition hover:bg-[#FFEBEE]">
              <Delete size={18} />
            </button>
          </Popconfirm>
        </div>
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
    addItem.mutate({
      categoryId: values.categoryId,
      itemClass: values.itemClass,
      brand: values.brand,
      model: values.model,
      defaultWarranty: Number(values.defaultWarranty || 12),
      specifications: values.attributes || {},
      validationRules: values.validationRules || [],
    });
  };

  return (
    <PageShell
      eyebrow="Back Office"
      title="IT Item Catalog"
      description="Create category-driven item templates used by stock intake, issuance, and asset tracking so the catalog can support more than computer hardware."
      stats={stats}
      actions={
        <>
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search item ID, brand, model, category, or class"
            className="w-full sm:w-[340px]"
          />
          <Button
            type="primary"
            icon={<LuPlus size={16} />}
            className="!h-11 !rounded-2xl !px-5"
            onClick={() => setIsModalOpen(true)}
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
          scroll={{ x: 1180 }}
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
                    {selectedItem.category?.name || formatCapitalizedLabel(selectedItem.deviceType)}
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
                  <p><span className="font-semibold text-[#111827]">Category:</span> {selectedItem.category?.name || "N/A"}</p>
                  <p><span className="font-semibold text-[#111827]">Brand:</span> {selectedItem.brand || "N/A"}</p>
                  <p><span className="font-semibold text-[#111827]">Model:</span> {selectedItem.model || "N/A"}</p>
                  <p><span className="font-semibold text-[#111827]">Item Class:</span> {formatCapitalizedLabel(selectedItem.itemClass)}</p>
                  <p><span className="font-semibold text-[#111827]">Legacy Type:</span> {formatCapitalizedLabel(selectedItem.deviceType)}</p>
                  <p><span className="font-semibold text-[#111827]">Default Warranty:</span> {selectedItem.defaultWarranty ?? 0} months</p>
                  <p><span className="font-semibold text-[#111827]">Quantity In Stock:</span> {selectedItem.stock?.quantityInStock ?? 0}</p>
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

      <Modal title="Add New Item" open={isModalOpen} footer={null} onCancel={() => setIsModalOpen(false)} width={820} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
            <Form.Item name="categoryId" label="Item Category" rules={[{ required: true }]}>
              <Select placeholder="Select item category" showSearch optionFilterProp="children">
                {categories.map((category) => (
                  <Select.Option key={category.id} value={category.id}>
                    {category.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item name="itemClass" label="Item Class" rules={[{ required: true }]}>
              <Select placeholder="Select item class">
                <Select.Option value="FIXED_ASSET">Fixed Asset</Select.Option>
                <Select.Option value="CONSUMABLE">Consumable</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="brand" label="Brand" rules={[{ required: true }]}>
              <Input placeholder="Brand" />
            </Form.Item>

            <Form.Item name="model" label="Model" rules={[{ required: true }]}>
              <Input placeholder="Model" />
            </Form.Item>

            <Form.Item name="defaultWarranty" label="Default Warranty (months)">
              <Input placeholder="12" type="number" />
            </Form.Item>
          </div>

          {selectedCategory && allCategoryDefinitions.length ? (
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
                  {allCategoryDefinitions.map((definition) => (
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

          <Form.Item className="mb-0">
            <Button type="primary" htmlType="submit" block className="!h-11 !rounded-2xl">
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageShell>
  );
};

export default ItItems;