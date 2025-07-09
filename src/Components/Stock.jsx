import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import api from "../utils/config";
import { Button, Modal, Table, Form, Spin, Select, Input } from "antd";
import { FilterOutlined, SearchOutlined } from "@ant-design/icons";

const Stock = () => {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({});
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const [filters, setFilters] = useState({
    brand: null,
    deviceType: null,
  });
  const fetchStock = async () => {
    setLoading(true);
    try {
      const response = await api.get("/stores/stock", { params: filters });
      const stockData = response.data.data || [];
      const metaData = response.data.meta || {};

      setData(
        stockData.map((item, index) => ({
          key: index,
          ...item,
          stockStatus: item.quantityInStock <= 1 ? "Low" : "Okay",
        }))
      );
      setMeta(metaData);
    } catch (error) {
      console.error("Failed to fetch stock:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStock();
  }, [filters]);

  const handleFilterSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        setFilters({
          brand: values.brand || null,
          deviceType: values.deviceType || null,
        });
        setIsModalOpen(false);
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  const handleReset = () => {
    form.resetFields();
    setFilters({ brand: null, deviceType: null });
    setIsModalOpen(false);
  };

  //   console.log(stockData);

  const columns = [
    {
      title: "Brand",
      dataIndex: "brand",
      key: "brand",
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return (
          record.brand.toLowerCase().includes(searchText.toLowerCase()) ||
          record.model.toLowerCase().includes(searchText.toLowerCase()) ||
          record.quantityInStock
            .toString()
            .includes(searchText.toLowerCase()) ||
          record.deviceType.toLowerCase().includes(searchText.toLowerCase()) ||
          record.stockStatus.toLowerCase().includes(searchText.toLowerCase())
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
    {
      title: "Stock Status",
      dataIndex: "stockStatus",
      key: "stockStatus",
      render: (status) => (
        <span
          className={`font-semibold ${
            status === "Low" ? "text-red-600" : "text-green-600"
          }`}
        >
          {status}
        </span>
      ),
    },
  ];
  return (
    <div className="px-[3rem] py-[2rem]">
      <div className="pl-[6rem] pt-6">
        <div className="flex justify-end gap-3 mb-4">
          <Input
            placeholder="Search..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
            style={{ width: "200px" }}
          />
          <Button
            // disabled={!reportData?.data?.length}
            icon={<FilterOutlined />}
            onClick={() => setIsModalOpen(true)}
          >
            Filter
          </Button>
          {/* <Button type="primary" onClick={() => setIsModalOpen(true)}>
            Filter
          </Button> */}
        </div>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={data}
            pagination={{
              total: meta?.total || 0,
              pageSize: 10,
              showTotal: (total) =>
                `Total ${total} items | Total Stock: ${
                  meta?.totalStockQuantity ?? 0
                }`,
            }}
            rowClassName={(record) =>
              record.quantityInStock <= 1
                ? "bg-red-50 hover:bg-red-100 transition"
                : "bg-white"
            }
          />
        </Spin>
      </div>
      {/* Filter Modal */}
      <Modal
        title="Filter "
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleFilterSubmit}
        okText="Apply"
        cancelText="Cancel"
        footer={[
          <Button key="reset" onClick={handleReset}>
            Reset
          </Button>,
          <Button key="submit" type="primary" onClick={handleFilterSubmit}>
            Apply
          </Button>,
        ]}
      >
        <Form layout="vertical" form={form}>
          <Form.Item name="brand" label="Brand">
            <Select placeholder="Select brand" allowClear>
              <Option value="HP">HP</Option>
              <Option value="Dell">Dell</Option>
              <Option value="Brother">Brother</Option>
              <Option value="Brookes">Brookes</Option>
            </Select>
          </Form.Item>

          <Form.Item name="deviceType" label="Device Type">
            <Select placeholder="Select device type" allowClear>
              <Option value="LAPTOP">Laptop</Option>
              <Option value="DESKTOP">Desktop</Option>
              <Option value="PRINTER">Printer</Option>
              <Option value="OTHER">Other</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Stock;
