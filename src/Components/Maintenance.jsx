import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import api from "../utils/config";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Spin,
  Table,
} from "antd";
import { AiOutlinePlus } from "react-icons/ai";
import { FiEdit } from "react-icons/fi";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { SearchOutlined } from "@ant-design/icons";

const Maintenance = () => {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [record, setRecord] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setDebouncedSearch(searchTerm);

      if (!searchTerm.trim()) {
        setSelectedDevice(null); // <-- Reset when input is empty
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  //useQuery to get ticket
  const { data: Tickets } = useQuery({
    queryKey: ["tickets"],
    queryFn: () => api.get("/hardware/tickets?status=OPEN"),
  });

  //useQuery to get devices
  const { data, isLoading } = useQuery({
    queryKey: ["devices", debouncedSearch],
    queryFn: () =>
      api
        .get(`/hardware/devices/search?q=${debouncedSearch}`)
        .then((res) => res.data),
    enabled: !!debouncedSearch,
  });

  //useQuery to get Technician
  const { data: technicians } = useQuery({
    queryKey: ["technicians"],
    queryFn: () => api.get("/hardware/technicians"),
  });

  const handleEdit = (record) => {
    setIsModalOpen(true);
    console.log("Editing record:", record);
    setRecord(record);
  };
  const columns = [
    {
      title: "Brand",
      dataIndex: "brand",
      key: "remarks",
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
    },
    {
      title: "User",
      dataIndex: "userName",
      key: "user",
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return (
          record.userName.toLowerCase().includes(searchText.toLowerCase()) ||
          record.brand.toLowerCase().includes(searchText.toLowerCase()) ||
          record.model.toLowerCase().includes(searchText.toLowerCase()) ||
          record.departmentName
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          record.technicianReceivedName
            .toLowerCase()
            .includes(searchText.toLowerCase()) ||
          record.technicianReturnedName
            .toLowerCase()
            .includes(searchText.toLowerCase())
        );
      },
    },
    // {
    //   title: "Priority",
    //   dataIndex: "priority",
    // },
    {
      title: "System Received By",
      dataIndex: "technicianReceivedName",
    },
    {
      title: "Department ",
      dataIndex: "departmentName",
    },
    {
      title: "Dpt Location ",
      dataIndex: "departmentLocation",
      render: (text) => text || "N/A",
    },
    {
      title: "Description",
      dataIndex: "description",
    },
    {
      title: "Received By",
      dataIndex: "technicianReceivedName",
    },
    // {
    //   title: "Remarks",
    //   dataIndex: "remarks",
    // },
    {
      title: "Date Logged",
      dataIndex: "dateLogged",
      render: (text) => new Date(text).toLocaleString(), // nicely format date
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <FiEdit
            className="text-red-500 cursor-pointer"
            size={23}
            onClick={() => handleEdit(record)}
          />
        </div>
      ),
    },
  ];

  // Mutation to create a ticket
  const { mutate: createTicket, isLoading: isCreating } = useMutation({
    mutationFn: (ticketData) =>
      api.post("/hardware/tickets/create", ticketData),
    onSuccess: () => {
      toast.success("Ticket created successfully");
      form.resetFields();
      setSelectedDevice(null);
      queryClient.invalidateQueries(["tickets"]);
      setOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to create ticket");
      console.error("Create Ticket Error:", error);
    },
  });

  const onFinish = (values) => {
    console.log("Submitting ticket data:", values);
    const ticketData = {
      assetId: selectedDevice.inventoryId,
      userId: selectedDevice.userId,
      departmentId: selectedDevice.departmentId,
      unitId: selectedDevice.unitId,
      // remarks: values.remarks,
      priority: values.priority,
      description: values.description,
      issueType: values.issueType,
    };

    // console.log("Submitting ticket data:", ticketData);

    createTicket(ticketData);
  };

  // Mutation to resolve a ticket
  const { mutate: resolveTicket } = useMutation({
    mutationFn: (data) =>
      api.patch(`/hardware/tickets/${record?.id}/update`, data),
    onSuccess: () => {
      toast.success("Ticket resolved successfully");
      form.resetFields();
      queryClient.invalidateQueries(["tickets"]);
      setRecord(null);
      setIsModalOpen(false);
    },
    onError: () => {
      toast.error("Failed to resolve ticket");
    },
  });

  const handleResolve = (values) => {
    const payload = {
      ...values,
      dateResolved: values.dateResolved.toISOString(),
    };
    // console.log(payload);
    resolveTicket(payload);
  };

  return (
    <div className="px-[3rem] py-[2rem]">
      <div className=" flex gap-2 justify-end">
        <Input
          placeholder="Search..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<SearchOutlined />}
          style={{ width: "200px" }}
        />
        <Button
          type="primary"
          icon={<AiOutlinePlus />}
          onClick={() => setOpen(true)}
        >
          Create New Ticket
        </Button>
        <Link to="/dashboard/resolved-tickets">
          <Button type="primary">View Resolved Tickets</Button>
        </Link>
      </div>
      <div className="pl-[6rem] pt-6">
        <Table columns={columns} dataSource={Tickets?.data || []} />
      </div>
      {/* Modal for creating ticket */}
      <Modal
        open={open}
        footer={null}
        onCancel={() => {
          setOpen(false);
          setSelectedDevice(null);
          setSearchTerm("");
        }}
        title="Create Ticket"
      >
        <Input
          placeholder="Search device by name"
          onChange={(e) => setSearchTerm(e.target.value)}
          allowClear
          style={{ marginBottom: 16 }}
        />

        {isLoading ? (
          <Spin />
        ) : (
          <ul>
            {!selectedDevice && (
              <ul className="space-y-2">
                {data?.map((device) => (
                  <li
                    key={device.inventoryId}
                    className="cursor-pointer hover:bg-gray-100 p-2 rounded"
                    onClick={() => setSelectedDevice(device)}
                  >
                    {device.brand} - {device.model}
                  </li>
                ))}
              </ul>
            )}
          </ul>
        )}
        {selectedDevice && (
          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item label="Asset ID">
              <Input value={selectedDevice.inventoryId} disabled />
            </Form.Item>
            <Form.Item label="User ID">
              <Input value={selectedDevice.userId} disabled />
            </Form.Item>
            <Form.Item label="Department ID">
              <Input value={selectedDevice.departmentId} disabled />
            </Form.Item>
            <Form.Item label="Unit ID">
              <Input value={selectedDevice.unitId} disabled />
            </Form.Item>

            <Form.Item
              label="Issue Type"
              name="issueType"
              initialValue="HARDWARE"
            >
              <Select>
                <Select.Option value="HARDWARE">HARDWARE</Select.Option>
                <Select.Option value="SOFTWARE">SOFTWARE</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item label="Priority" name="priority" initialValue="MEDIUM">
              <Select disabled>
                <Select.Option value="HIGH">HIGH</Select.Option>
                <Select.Option value="MEDIUM">MEDIUM</Select.Option>
                <Select.Option value="LOW">LOW</Select.Option>
              </Select>
            </Form.Item>

            {/* <Form.Item label="Remarks" name="remarks">
              <Input.TextArea rows={2} disabled/>
            </Form.Item> */}

            <Form.Item
              name="technicianReceivedById"
              label="Received By"
              rules={[
                { required: true, message: "Please select a technician" },
              ]}
            >
              <Select placeholder="Select technician">
                {technicians?.data?.map((tech) => (
                  <Select.Option key={tech.id} value={tech.id}>
                    {tech.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Description" name="description">
              <Input.TextArea rows={3} />
            </Form.Item>

            <Form.Item>
              <Button htmlType="submit" type="primary" loading={isCreating}>
                Submit
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* Modal for editing ticket */}
      <Modal
        open={isModalOpen}
        title="Resolve Ticket"
        onCancel={() => {
          setIsModalOpen(false);
          setRecord(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleResolve}>
          <Form.Item
            name="actionTaken"
            label="Action Taken"
            rules={[{ required: true, message: "Please enter action taken" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="technicianReturnedById"
            label="Returned By"
            rules={[{ required: true, message: "Please select a technician" }]}
          >
            <Select placeholder="Select technician">
              {technicians?.data?.map((tech) => (
                <Select.Option key={tech.id} value={tech.id}>
                  {tech.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="dateResolved"
            label="Date Resolved"
            rules={[
              { required: true, message: "Please select resolution date" },
            ]}
          >
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="remarks" label="Remarks">
            <Input.TextArea />
          </Form.Item>

          <Form.Item>
            <Button htmlType="submit" type="primary" block>
              Resolve
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Maintenance;
