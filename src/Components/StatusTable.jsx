import { useLocation } from "react-router-dom";

import { Table, Tag } from "antd";

const StatusTable = () => {
  const location = useLocation();
  const { status, requisitions } = location.state || {};

  const filteredData = requisitions?.filter((item) => item.status === status);

  console.log("Filtered Table Data:", filteredData);

  const columns = [
    {
      title: "Description",
      dataIndex: "itemDescription",
      key: "itemDescription",
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
    },

    {
      title: "Purpose",
      dataIndex: "purpose",
      key: "purpose",
    },

    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          color={
            status === "PENDING_DEPT_APPROVAL"
              ? "blue"
              : status === "APPROVED"
              ? "green"
              : status === "PENDING_ITD_APPROVAL"
              ? "yellow"
              : status === "ITD_APPROVED" || status === "PROCESSED"
              ? "green"
              : "red"
          }
        >
          {status.replaceAll("_", " ")}
        </Tag>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt) =>
        new Date(createdAt).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
    },
    {
      title: "Decline Reason",
      dataIndex: "declineReason",
      key: "declineReason",
    },
  ];

  return (
    <div className="px-[3rem] py-[2rem]">
      <div className="pl-[6rem] pt-6">
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="requisitionID"
        />
      </div>
    </div>
  );
};

export default StatusTable;
