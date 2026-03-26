import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useDeferredValue, useState } from "react";
import {
  Button,
  Input,
  Select,
  Table,
  Form,
  Modal,
  DatePicker,
  InputNumber,
  Switch,
  Tabs,
} from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { LuPlus } from "react-icons/lu";
import { toast } from "react-toastify";
import api from "../utils/config";
import PageShell from "./ui/page-shell";

const getDefinitionInputType = (definition) => {
  switch (definition.dataType) {
    case "BOOLEAN":
      return "switch";
    case "SELECT":
      return "select";
    case "TEXTAREA":
      return "textarea";
    case "NUMBER":
      return "number";
    case "DATE":
      return "date";
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

  if (inputType === "date") {
    return <DatePicker className="w-full" />;
  }

  if (inputType === "number") {
    return <InputNumber className="w-full" min={0} placeholder={definition.helpText || definition.label} />;
  }

  return <Input placeholder={definition.helpText || definition.label} />;
};

const StoresPage = () => {
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("main");
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ page: 1, limit: 20 });
  const deferredSearch = useDeferredValue(searchText.trim());

  const { data: storesResponse, isLoading: storesLoading } = useQuery({
    queryKey: ["stores", deferredSearch, pagination],
    queryFn: () =>
      api.get("/stores/stock-received", {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          ...(deferredSearch ? { search: deferredSearch } : {}),
        },
      }),
  });

  const { data: itItems } = useQuery({
    queryKey: ["itItems"],
    queryFn: () => api.get("/admin/it-items"),
  });

  const { data: categoriesResponse } = useQuery({
    queryKey: ["stockReceiveCategories"],
    queryFn: () => api.get("/admin/it-item-categories"),
  });

  const { data: suppliersResponse } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => api.get("/stores/suppliers"),
  });

  const stockRows = storesResponse?.data?.data || [];
  const stockMeta = storesResponse?.data?.meta || {};
  const categories = categoriesResponse?.data || [];
  const itItemsList = itItems?.data || [];
  const selectedCategoryId = Form.useWatch("categoryId", form);
  const selectedItemId = Form.useWatch("itItemId", form);
  const filteredItItems = selectedCategoryId
    ? itItemsList.filter((item) => item.categoryId === selectedCategoryId)
    : itItemsList;
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) || null;
  const selectedItem = itItemsList.find((item) => item.id === selectedItemId) || null;
  const deviceDetailDefinitions = (selectedItem?.validationRules?.length
    ? (selectedItem.category?.attributeDefinitions || []).filter(
        (definition) =>
          selectedItem.validationRules.includes(definition.key) && ["TEMPLATE", "BOTH"].includes(definition.scope)
      )
    : (selectedCategory?.attributeDefinitions || []).filter((definition) => ["TEMPLATE", "BOTH"].includes(definition.scope))) || [];
  const totalQuantityReceived = stockRows.reduce(
    (sum, row) => sum + Number(row.quantityReceived || 0),
    0
  );

  const stats = [
    { label: "Receipts", value: stockMeta?.total || stockRows.length, caption: "Recorded stock entries" },
    { label: "Units Received", value: totalQuantityReceived, caption: "Total quantity booked in" },
    { label: "Suppliers", value: suppliersResponse?.data?.length || 0, caption: "Available supplier records" },
  ];

  const formatDate = (dateObj) => {
    const date = new Date(dateObj);
    return date.toISOString().split("T")[0];
  };

  const mutation = useMutation({
    mutationFn: (payload) => api.post("/stores/stock-received/create", payload),
    onSuccess: () => {
      toast.success("Stock received successfully!");
      form.resetFields();
      setIsModalOpen(false);
      setActiveTab("main");
      queryClient.invalidateQueries(["stores"]);
    },
    onError: () => {
      toast.error("Failed to submit stock received.");
    },
  });

  const handleSubmit = (values) => {
    const deviceDetails = { ...(values.deviceDetails || {}) };

    Object.keys(deviceDetails).forEach((key) => {
      const value = deviceDetails[key];
      if (value?._isAMomentObject || value?.$d) {
        deviceDetails[key] = new Date(value.$d || value).toISOString().split("T")[0];
      }
    });

    mutation.mutate({
      ...values,
      lpoDate: formatDate(values.lpoDate),
      dateReceived: formatDate(values.dateReceived),
      deviceDetails,
    });
  };

  const columns = [
    {
      title: "L.P.O Number",
      dataIndex: "lpoReference",
      key: "lpoReference",
    },
    { title: "Voucher No", dataIndex: "voucherNumber", key: "voucherNumber" },
    { title: "Quantity", dataIndex: "quantityReceived", key: "quantityReceived" },
    { title: "Warranty", dataIndex: "warrantyPeriod", key: "warrantyPeriod" },
    {
      title: "Date",
      dataIndex: "lpoDate",
      key: "lpoDate",
      render: (date) =>
        new Date(date).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
    },
    {
      title: "Received Date",
      dataIndex: "dateReceived",
      key: "dateReceived",
      render: (date) =>
        new Date(date).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
    },
    { title: "Remarks", dataIndex: "remarks", key: "remarks" },
    { title: "Brand", dataIndex: ["itItem", "brand"], key: "brand" },
    { title: "Model", dataIndex: ["itItem", "model"], key: "model" },
    { title: "Supplier", dataIndex: ["supplier", "name"], key: "supplier" },
    { title: "Receiver", dataIndex: ["receivedBy", "name"], key: "receiver" },
  ];

  return (
    <PageShell
      eyebrow="Stores Operations"
      title="Stock Receiving"
      description="Register incoming stock with supplier, LPO, warranty, and receiving details in a structured stores intake workflow."
      stats={stats}
      actions={
        <>
          <Input
            placeholder="Search receipts"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            prefix={<SearchOutlined />}
            className="w-full md:w-[260px]"
          />
          <Button type="primary" icon={<LuPlus />} onClick={() => setIsModalOpen(true)}>
            Receive Stock
          </Button>
        </>
      }
    >
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-[#616161]">Receiving Log</p>
            <h3 className="text-xl font-bold text-[#212121]">Stock received history</h3>
          </div>
          <span className="rounded-full bg-[#FFEBEE] px-3 py-1 text-xs font-semibold text-[#D32F2F]">
            Supplier traceability active
          </span>
        </div>

        <Table
          columns={columns}
          dataSource={stockRows}
          loading={storesLoading}
          rowKey="id"
          scroll={{ x: 1400 }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: stockMeta?.total || 0,
            showSizeChanger: true,
            pageSizeOptions: ["10", "20", "50"],
            showTotal: (total) => `${total} receipts`,
            onChange: (page, pageSize) => {
              setPagination({ page, limit: pageSize });
            },
          }}
        />

        <Modal
          title="Receive Stock"
          open={isModalOpen}
          onCancel={() => {
            setIsModalOpen(false);
            setActiveTab("main");
            form.resetFields();
          }}
          footer={null}
          width={760}
          destroyOnClose
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
              {
                key: "main",
                label: "Main",
                children: (
                  <>
                    <Form.Item name="lpoReference" label="LPO Reference" rules={[{ required: true }]}> 
                      <Input />
                    </Form.Item>

                    <Form.Item name="lpoDate" label="LPO Date" rules={[{ required: true }]}> 
                      <DatePicker className="w-full" />
                    </Form.Item>

                    <Form.Item name="categoryId" label="Item Category" rules={[{ required: true, message: "Please select an item category" }]}> 
                      <Select
                        placeholder="Select item category"
                        showSearch
                        optionFilterProp="children"
                        onChange={() => {
                          form.setFieldsValue({ itItemId: undefined, deviceDetails: {} });
                        }}
                      >
                        {categories.map((category) => (
                          <Select.Option key={category.id} value={category.id}>
                            {category.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item name="itItemId" label="Item" rules={[{ required: true }]}> 
                      <Select
                        placeholder={selectedCategoryId ? "Select item" : "Select category first"}
                        disabled={!selectedCategoryId}
                        showSearch
                        optionFilterProp="children"
                        onChange={(value) => {
                          const item = itItemsList.find((entry) => entry.id === value);
                          const prefill = {};
                          const definitions = (item?.category?.attributeDefinitions || []).filter((definition) =>
                            ["TEMPLATE", "BOTH"].includes(definition.scope)
                          );
                          const allowedKeys = Array.isArray(item?.validationRules) && item.validationRules.length
                            ? item.validationRules
                            : definitions.map((definition) => definition.key);

                          definitions.forEach((definition) => {
                            if (allowedKeys.includes(definition.key) && item?.specifications?.[definition.key] != null) {
                              prefill[definition.key] = item.specifications[definition.key];
                            }
                          });

                          form.setFieldsValue({
                            categoryId: item?.categoryId || selectedCategoryId,
                            warrantyPeriod: item?.defaultWarranty ?? form.getFieldValue("warrantyPeriod"),
                            deviceDetails: prefill,
                          });
                        }}
                      >
                        {filteredItItems.map((item) => (
                          <Select.Option key={item.id} value={item.id}>
                            {`${item.brand} - ${item.model} (Stock: ${item.stock?.quantityInStock || 0})`}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item name="quantityReceived" label="Quantity Received" rules={[{ required: true }]}> 
                      <InputNumber min={1} className="w-full" />
                    </Form.Item>

                    <Form.Item name="supplierId" label="Supplier" rules={[{ required: true }]}> 
                      <Select
                        placeholder="Select Supplier"
                        onChange={(value) => {
                          const selectedSupplier = suppliersResponse?.data?.find(
                            (supplier) => supplier.id === value
                          );
                          if (selectedSupplier) {
                            form.setFieldsValue({ voucherNumber: selectedSupplier.voucherNumber });
                          }
                        }}
                      >
                        {suppliersResponse?.data?.map((supplier) => (
                          <Select.Option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item name="voucherNumber" label="Voucher Number" rules={[{ required: true }]}> 
                      <Input />
                    </Form.Item>

                    <Form.Item
                      name="warrantyPeriod"
                      label="Warranty Period (months)"
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={0} className="w-full" />
                    </Form.Item>

                    <Form.Item name="dateReceived" label="Date Received" rules={[{ required: true }]}> 
                      <DatePicker className="w-full" />
                    </Form.Item>

                    <Form.Item name="remarks" label="Remarks">
                      <Input.TextArea rows={3} />
                    </Form.Item>
                  </>
                ),
              },
              {
                key: "device",
                label: "Device Details",
                children: deviceDetailDefinitions.length ? (
                  <>
                    <div className="mb-4 rounded-2xl bg-[#F9FAFB] p-4 text-sm text-[#616161]">
                      Capture the category-specific template details for the selected item. These values will be saved to the IT item specifications for future issuance and inventory use.
                    </div>
                    {deviceDetailDefinitions.map((definition) => (
                      <Form.Item
                        key={definition.id}
                        name={["deviceDetails", definition.key]}
                        label={definition.label}
                        rules={definition.isRequired ? [{ required: true, message: `${definition.label} is required` }] : undefined}
                        valuePropName={getDefinitionInputType(definition) === "switch" ? "checked" : "value"}
                      >
                        {renderCategoryFieldInput(definition)}
                      </Form.Item>
                    ))}
                  </>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#E0E0E0] bg-[#F9FAFB] px-4 py-8 text-center text-sm text-[#616161]">
                    Select an item category and IT item on the Main tab to load device details for that category.
                  </div>
                ),
              },
            ]} />

            <Form.Item>
              <Button type="primary" htmlType="submit" className="w-full" loading={mutation.isPending}>
                Submit
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </section>
    </PageShell>
  );
};

export default StoresPage;
