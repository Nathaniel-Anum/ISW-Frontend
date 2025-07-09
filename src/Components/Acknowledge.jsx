import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import api from "../utils/config";
import { Button, Form, Input, Modal, Table } from "antd";

import { toast } from "react-toastify";
import { GiCheckMark } from "react-icons/gi";

const Acknowledge = () => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState("");

  const column = [
    {
      title: "Device Type",
      dataIndex: "deviceType",
      key: "deviceType",
    },
    // {
    //   title: "Disbursement Note",
    //   dataIndex: "disbursementNote",
    //   key: "disbursementNote",
    // },
    {
      title: "Item Name",
      dataIndex: "itemName",
      key: "itemName",
    },
    {
      title: "Remarks",
      dataIndex: "remarks",
      key: "remarks",
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
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
        <GiCheckMark
          onClick={() => showModal(record)}
          className="text-blue-600 text-xl hover:text-blue-800 cursor-pointer"
        />
      ),
    },
  ];

  const showModal = (record) => {
    setOpen(true);
    // console.log(record);
    setSelected(record);
  };

  const { data } = useQuery({
    queryKey: ["acknowledge"],
    queryFn: () => {
      return api.get("user/reqs/pending-acknowledgments");
    },
  });

  const { mutate } = useMutation({
    mutationFn: (values) => {
      return api.post(
        `user/reqs/acknowledge/${selected?.stockIssuedId}`,
        values
      );
    },
    onSuccess: () => {
      setOpen(false);
      toast.success("Successful");
      queryClient.invalidateQueries({ queryKey: ["acknowledge"] });
      form.resetFields();
    },
  });

  const handleSubmit = (values) => {
    console.log(values);
    mutate(values);
    form.resetFields();
  };

  return (
    <div className="pt-12">
      <div className="px-[10rem] ">
        <Table columns={column} dataSource={data?.data || []} />
        <Modal
          open={open}
          onCancel={() => setOpen(false)}
          footer={null}
          title="Acknowledge Device"
        >
          <Form layout="vertical" onFinish={(values) => handleSubmit(values)}>
            <Form.Item label="Remarks" name="remarks">
              <Input />
            </Form.Item>
            <Button type="primary" htmlType="submit">
              Submit
            </Button>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default Acknowledge;
