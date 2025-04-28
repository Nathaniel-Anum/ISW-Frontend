import {
  Button,
  Form,
  Modal,
  Select,
  Upload,
  message,
  notification,
} from 'antd';

import { UploadOutlined } from '@ant-design/icons';
import { useAppStore } from '../../../store/store';
import { useGetAllEmployees } from '../../../query_hooks/employees/employees.query';
import { useMutation, useQueryClient } from 'react-query';

import { saveSignature, upload } from '../../../http/signatures';
import swal from 'sweetalert';

const AddSignature = () => {
  const showSignaturesAddModal = useAppStore(
    (state) => state.showSignaturesAddModal
  );

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (type, message, description) => {
    api[type]({
      message,
      description,
    });
  };

  const toggleSignaturesAddModal = useAppStore(
    (state) => state.toggleSignaturesAddModal
  );

  const queryClient = useQueryClient();

  const { mutate: mutation } = useMutation(
    'saveSignatures',
    (data) => saveSignature(data),
    {
      onSuccess: () => {
        toggleSignaturesAddModal();
        queryClient.invalidateQueries({ queryKey: 'getAllSignatures' });
        swal({
          title: 'Success',
          icon: 'success',
          text: 'Signatures saved successfully',
        });
      },

      onError: (err) => {
        message.error(err.message);
      },
    }
  );

  const [form] = Form.useForm();

  const { data: employees } = useGetAllEmployees();

  const { mutate } = useMutation(
    'uploadSignature',
    (data) => {
      upload(data)
        .then((response) => {
          const { employee_id } = form.getFieldsValue();
          mutation({ employee_id, signature: response?.data?.filePath });
        })
        .catch((err) => {
          openNotification('error', 'Error', err.message);
        });
    },
    {
      onError: (err) => message.error(err.message),
    }
  );

  const handleFileUpload = (values) => {
    const _values = {
      ...values,
      file: values['file'].file,
    };

    const formData = new FormData();

    formData.append('file', _values.file);

    mutate(formData);
  };

  const props = {
    name: 'file',
    beforeUpload: () => false,
    onChange(info) {
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  return (
    <div>
      {contextHolder}
      <Modal
        open={showSignaturesAddModal}
        footer={false}
        onCancel={toggleSignaturesAddModal}
      >
        <div className="pt-9">
          <h2 className="py-4 text-primary text-xl font-semibold text-center">
            Upload Signature for Staff
          </h2>
          <Form onFinish={handleFileUpload} form={form}>
            <Form.Item name="employee_id">
              <Select
                showSearch
                optionFilterProp={'label'}
                placeholder={'Select Employee'}
                options={employees?.data?.map((emp) => ({
                  label: emp?.user.name,
                  value: emp.id,
                }))}
              />
            </Form.Item>
            <Form.Item name="file">
              <Upload {...props}>
                <Button icon={<UploadOutlined />}>Upload Signature</Button>
              </Upload>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Submit
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default AddSignature;
