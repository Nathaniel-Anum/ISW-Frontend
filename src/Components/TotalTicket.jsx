import { useQuery } from '@tanstack/react-query';
import React, { useDeferredValue, useState } from 'react';
import api from '../utils/config';
import { Button, DatePicker, Form, Input, Modal, Select, Table } from 'antd';
import { DownloadOutlined, FilterOutlined, SearchOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';

const TotalTicket = () => {
  const { Option } = Select;
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [submittedFilters, setSubmittedFilters] = useState({});
  const [open, setOpen] = useState(false);
  const deferredSearch = useDeferredValue(searchText.trim());

  const { data } = useQuery({
    queryKey: ['totalTicket', submittedFilters, deferredSearch],
    queryFn: () =>
      api.get('reports/workshop', {
        params: {
          ...submittedFilters,
          ...(deferredSearch ? { search: deferredSearch } : {}),
        },
      }),
  });

  const { data: department } = useQuery({
    queryKey: ['department'],
    queryFn: () => api.get('admin/departments'),
  });

  const tickets = data?.data?.tickets || [];

  const columns = [
    { title: 'No.', key: 'index', render: (_text, _record, index) => index + 1 },
    { title: 'Ticket ID', dataIndex: 'ticketId' },
    { title: 'Brand', dataIndex: 'brand' },
    { title: 'Model', dataIndex: 'model' },
    { title: 'User Name', dataIndex: 'userName' },
    { title: 'Issue Type', dataIndex: 'issueType' },
    { title: 'Received By', dataIndex: 'technicianReceivedName' },
    { title: 'Returned By', dataIndex: 'technicianReturnedName' },
    { title: 'Action Taken', dataIndex: 'actionTaken', render: (value) => (value ? value : '-') },
    { title: 'Remarks', dataIndex: 'remarks' },
    { title: 'Date Logged', dataIndex: 'dateLogged', key: 'dateLogged', render: (value) => value ? new Date(value).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '-' },
    { title: 'Date Resolved', dataIndex: 'dateResolved', key: 'dateResolved', render: (value) => value ? new Date(value).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '-' },
  ];

  const handleDownload = () => {
    const cleanData = tickets.map((item, index) => ({
      No: index + 1,
      TicketID: item.ticketId,
      User: item.userName,
      Priority: item.priority,
      IssueType: item.issueType,
      Brand: item.brand,
      Model: item.model,
      ReceivedBy: item.technicianReceivedName,
      ReturnedBy: item.technicianReturnedName,
      ActionTaken: item.actionTaken || '-',
      Remarks: item.remarks || '-',
      DateLogged: item.dateLogged ? new Date(item.dateLogged).toLocaleDateString() : '-',
      DateResolved: item.dateResolved ? new Date(item.dateResolved).toLocaleDateString() : '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(cleanData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tickets');
    XLSX.writeFile(workbook, 'AllTickets.xlsx');
  };

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date.$d).toISOString().split('T')[0];
  };

  const handleFinish = (values) => {
    setSearchText('');
    setSubmittedFilters({
      ...(values.startDate ? { startDate: formatDate(values.startDate) } : {}),
      ...(values.endDate ? { endDate: formatDate(values.endDate) } : {}),
      ...(values.issueType ? { issueType: values.issueType } : {}),
      ...(values.department ? { departmentId: values.department } : {}),
    });
    setOpen(false);
    form.resetFields();
  };

  return (
    <div className="px-[3rem] py-[2rem]">
      <div className="flex gap-2 justify-end">
        <Input placeholder="Search..." value={searchText} onChange={(e) => setSearchText(e.target.value)} prefix={<SearchOutlined />} style={{ width: '200px' }} />
        <Button icon={<FilterOutlined />} onClick={() => setOpen(true)} />
        <Button icon={<DownloadOutlined />} onClick={handleDownload} />
      </div>
      <div className="pl-[6rem] pt-6">
        <Table dataSource={tickets} columns={columns} rowKey="ticketId" />
        <Modal title="Filter" open={open} onCancel={() => setOpen(false)} footer={null}>
          <Form form={form} layout="vertical" onFinish={handleFinish}>
            <Form.Item label="Start Date" name="startDate">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="End Date" name="endDate">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Issue Type" name="issueType">
              <Select placeholder="Select issue type">
                <Option value="HARDWARE">HARDWARE</Option>
                <Option value="SOFTWARE">SOFTWARE</Option>
              </Select>
            </Form.Item>
            <Form.Item name="department" label="Select Department">
              <Select placeholder="Choose a department">
                {department?.data?.map((dept) => (
                  <Option key={dept.id} value={dept.id}>
                    {dept.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" className="w-full">
                Submit
              </Button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default TotalTicket;