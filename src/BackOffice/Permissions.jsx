import { useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import api from "../utils/config";
import { Button, Popconfirm, Table } from "antd";
import { FiTrash2 } from "react-icons/fi";
import { toast } from "react-toastify";

const Permissions = () => {
  const queryClient = useQueryClient();
  //getting all permissions
  const { data: permissions } = useQuery({
    queryKey: ["permissions"],
    queryFn: () => api.get("/admin/permissions"),
  });

  const dataSource = permissions?.data?.map((permission) => ({
    key: permission.id,
    resource: permission.resource,
  }));

  //deleting permission
  const handleDelete = (key) => {
    console.log("This is the id", key);
    // api
    //   .delete(`/admin/permissions/${key}`)
    //   .then(() => {
    //     toast.success("Role deleted successfully!");
    //     queryClient.invalidateQueries(["permissions"]);
    //   })
    //   .catch((error) => {
    //     console.error("Delete failed:", error);
    //     toast.error("Failed to delete department.");
    //   });
  };

  const columns = [
    {
      title: "Permission Name",
      dataIndex: "resource",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Popconfirm
            title="Are you sure to delete this department?"
            onConfirm={() => handleDelete(record.key)}
            okText="Yes"
            cancelText="No"
          >
            <FiTrash2 className="text-red-500 cursor-pointer" size={18} />
          </Popconfirm>
        </div>
      ),
    },
  ];
  return (
    <div className="px-[19rem]">
      Permission Page..
      <div className=" flex justify-end"></div>
      <Table columns={columns} dataSource={dataSource || []} />
    </div>
  );
};

export default Permissions;
