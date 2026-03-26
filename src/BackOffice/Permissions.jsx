import { useQuery } from "@tanstack/react-query";
import { SearchOutlined } from "@ant-design/icons";
import { Input, Table } from "antd";
import { useDeferredValue, useMemo, useState } from "react";
import { LuShieldCheck } from "react-icons/lu";
import PageShell from "../Components/ui/page-shell";
import api from "../utils/config";

const Permissions = () => {
  const [searchText, setSearchText] = useState("");
  const deferredSearch = useDeferredValue(searchText.trim());

  const { data } = useQuery({
    queryKey: ["permissions", deferredSearch],
    queryFn: () =>
      api.get("/admin/permissions", {
        params: deferredSearch ? { search: deferredSearch } : undefined,
      }),
  });

  const permissions = data?.data || [];

  const resourceGroups = useMemo(() => {
    return new Set(
      permissions
        .map((permission) => permission.resource)
        .filter(Boolean)
        .map((resource) => String(resource).split(/[.:/]/)[0])
    ).size;
  }, [permissions]);

  const alphabeticalFirst = [...permissions]
    .map((permission) => permission.resource)
    .filter(Boolean)
    .sort((first, second) => first.localeCompare(second))[0];

  const columns = [
    {
      title: "Permission Name",
      dataIndex: "resource",
      key: "resource",
      render: (value) => <span className="font-semibold text-[#212121]">{value}</span>,
    },
  ];

  return (
    <PageShell
      eyebrow="Back Office"
      title="Permission Catalog"
      description="Review the permission resources available to role definitions and confirm the security vocabulary used across the application."
      stats={[
        { label: "Permissions", value: permissions.length, caption: "Total access resources" },
        { label: "Resource groups", value: resourceGroups, caption: "Approximate permission families" },
        { label: "First label", value: alphabeticalFirst || "None", caption: "Alphabetical catalog reference" },
      ]}
      actions={
        <Input
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Search permissions or linked roles"
          className="w-full sm:w-[320px]"
        />
      }
    >
      <section className="responsive-data-card rounded-[28px] border border-[#E0E0E0] bg-white p-4 shadow-[0_20px_60px_rgba(15,23,42,0.06)] md:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#212121]">Permission Directory</h3>
            <p className="text-sm text-[#616161]">This is a read-only view of the permission keys currently available to access roles.</p>
          </div>
          <div className="section-badge inline-flex items-center gap-2 rounded-full bg-[#F9FAFB] px-4 py-2 text-sm font-medium text-[#616161]">
            <LuShieldCheck size={16} className="text-[#D32F2F]" />
            {permissions.length} permissions listed
          </div>
        </div>

        <Table columns={columns} dataSource={permissions} rowKey="id" pagination={false} size="middle" scroll={{ x: 720 }} />
      </section>
    </PageShell>
  );
};

export default Permissions;