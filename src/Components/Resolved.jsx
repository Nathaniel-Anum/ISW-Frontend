import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  Row,
  Space,
  Table,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useDeferredValue, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import api from '../utils/config';

const { Title, Text } = Typography;
const DATE_FORMAT = 'YYYY-MM-DD';

const columns = [
  {
    title: 'Ticket No.',
    dataIndex: 'ticketId',
    key: 'ticketId',
  },
  {
    title: 'Requester',
    dataIndex: 'requestedBy',
    key: 'requestedBy',
    render: (value) => value || 'N/A',
  },
  {
    title: 'Department',
    dataIndex: 'department',
    key: 'department',
    render: (value) => value || 'N/A',
  },
  {
    title: 'Unit',
    dataIndex: 'unitName',
    key: 'unitName',
    render: (value) => value || 'N/A',
  },
  {
    title: 'Category',
    dataIndex: 'itemCategory',
    key: 'itemCategory',
    render: (value) => value || 'N/A',
  },
  {
    title: 'Issue',
    dataIndex: 'description',
    key: 'description',
    render: (value) => value || 'N/A',
  },
  {
    title: 'Assigned To',
    dataIndex: 'assignedTo',
    key: 'assignedTo',
    render: (value) => value || 'Unassigned',
  },
  {
    title: 'Reported',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (value) => (value ? dayjs(value).format('DD MMM YYYY') : 'N/A'),
  },
  {
    title: 'Resolved',
    dataIndex: 'resolvedAt',
    key: 'resolvedAt',
    render: (value) => (value ? dayjs(value).format('DD MMM YYYY') : 'N/A'),
  },
];

const buildExportRows = (rows) =>
  rows.map((row) => ({
    'Ticket No.': row.ticketId,
    Requester: row.requestedBy || 'N/A',
    Department: row.department || 'N/A',
    Unit: row.unitName || 'N/A',
    Category: row.itemCategory || 'N/A',
    Issue: row.description || 'N/A',
    'Assigned To': row.assignedTo || 'Unassigned',
    Reported: row.createdAt ? dayjs(row.createdAt).format('YYYY-MM-DD') : 'N/A',
    Resolved: row.resolvedAt ? dayjs(row.resolvedAt).format('YYYY-MM-DD') : 'N/A',
  }));

export default function Resolved() {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [searchText, setSearchText] = useState('');
  const [submittedFilters, setSubmittedFilters] = useState(null);
  const deferredSearch = useDeferredValue(searchText.trim());

  const reportQuery = useQuery({
    queryKey: ['workshop-report', 'resolved', submittedFilters, deferredSearch],
    enabled: Boolean(submittedFilters),
    queryFn: async () => {
      const params = {
        startDate: submittedFilters.startDate,
        endDate: submittedFilters.endDate,
        status: 'RESOLVED',
      };

      if (deferredSearch) {
        params.search = deferredSearch;
      }

      const response = await api.get('/reports/workshop', { params });

      return response.data;
    },
  });

  const rows = useMemo(() => reportQuery.data?.data ?? [], [reportQuery.data]);

  const handleGenerate = (values) => {
    setSubmittedFilters({
      startDate: values.dateRange?.[0]?.format(DATE_FORMAT),
      endDate: values.dateRange?.[1]?.format(DATE_FORMAT),
    });
  };

  const handleExport = () => {
    if (!rows.length) {
      messageApi.warning('There is no resolved ticket data to export.');
      return;
    }

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(buildExportRows(rows));
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Resolved Tickets');
    XLSX.writeFile(workbook, 'resolved-maintenance-tickets.xlsx');
  };

  return (
    <div className="page-wrapper report-page">
      {contextHolder}
      <div className="page-header-card">
        <div>
          <Text className="section-tag">Workshop Report</Text>
          <Title level={2}>Resolved Maintenance Tickets</Title>
          <Text type="secondary">
            Generate date-bound reports and search across the returned resolved tickets.
          </Text>
        </div>
      </div>

      <div className="table-card">
        <Form form={form} layout="vertical" onFinish={handleGenerate}>
          <Row gutter={[16, 16]} align="bottom">
            <Col xs={24} md={12} lg={10}>
              <Form.Item
                label="Date range"
                name="dateRange"
                rules={[{ required: true, message: 'Select a date range.' }]}
              >
                <DatePicker.RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} lg={14}>
              <Space wrap>
                <Button type="primary" htmlType="submit" loading={reportQuery.isFetching && !reportQuery.data}>
                  Generate report
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  onClick={handleExport}
                  disabled={!rows.length}
                >
                  Export
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>

        <div className="toolbar-row" style={{ marginTop: 24 }}>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search ticket number, requester, department, unit, category, issue, or technician"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            disabled={!submittedFilters}
            style={{ maxWidth: 420 }}
          />
        </div>

        <Table
          rowKey={(record) => record.ticketId}
          columns={columns}
          dataSource={rows}
          loading={reportQuery.isFetching}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          scroll={{ x: 1100 }}
          style={{ marginTop: 20 }}
        />
      </div>
    </div>
  );
}