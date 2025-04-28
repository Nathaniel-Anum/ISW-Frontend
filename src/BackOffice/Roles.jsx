import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import api from "../utils/config";
import { Button, Table } from "antd";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import { AiOutlinePlus } from "react-icons/ai";

const Roles = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
  //getting all departments
  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api.get("/admin/roles"),
  });
  console.log(roles?.data);

  const dataSource = roles?.data?.map((role) => ({
    key: role.id,
    name: role.name,
    permissions: role.permissions
      .map((perm) => perm.permission.resource)
      .join(", "),
  }));

  const handleEdit = (record) => {
    console.log("Editing record:", record);
    // Open modal, set form fields, etc
  };

  const handleDelete = (record) => {
    console.log("Deleting record:", record);
    // Confirm delete and call your delete API
  };

  const columns = [
    {
      title: "Role Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Permissions",
      dataIndex: "permissions",
      key: "permissions",
    },
     {
          title: "Action",
          key: "action",
          render: (_, record) => (
            <div className="flex items-center gap-3">
              <FiEdit
                className="text-blue-500 cursor-pointer"
                size={18}
                onClick={() => handleEdit(record)}
              />
              <FiTrash2
                className="text-red-500 cursor-pointer"
                size={18}
                onClick={() => handleDelete(record)}
              />
            </div>
          ),
        },
  ];
  return (
    <div className="px-[19rem]">
      Roles Page
      <div className=" flex justify-end">
        <Button
          type="primary"
          icon={<AiOutlinePlus />}
          onClick={() => setIsModalOpen(true)}
        >
          Add Role
        </Button>
      </div>
      <Table dataSource={dataSource} columns={columns} />
    </div>
  );
};

export default Roles;
