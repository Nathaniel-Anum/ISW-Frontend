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

import { updateSignature, upload } from '../../../http/signatures';
import swal from 'sweetalert';

const EditSignature = () => {
  const showSignaturesEditModal = useAppStore(
    (state) => state.showSignaturesEditModal
  );

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (type, message, description) => {
    api[type]({
      message,
      description,
    });
  };

  const toggleSignaturesEditModal = useAppStore(
    (state) => state.toggleSignaturesEditModal
  );

  const selectedRecord = useAppStore((state) => state.selectedRecord);

  const queryClient = useQueryClient();

  const { mutate: updateSig } = useMutation(
    'updateSignature',
    (data) => updateSignature(selectedRecord.id, data),
    {
      onSuccess: () => {
        toggleSignaturesEditModal();
        queryClient.invalidateQueries({ queryKey: 'getAllSignatures' });
        swal({
          title: 'Success',
          icon: 'success',
          text: 'Signatures updated successfully',
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

          updateSig({ employee_id, signature: response?.data?.filePath });
        })
        .catch((err) => {
          openNotification('error', 'Error', err.message);
        });
    },
    {
      onError: (err) => console.log('Error', err.message),
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
  };

  return (
    <div>
      {contextHolder}
      <Modal
        open={showSignaturesEditModal}
        footer={false}
        onCancel={toggleSignaturesEditModal}
      >
        <div className="pt-9">
          <h2 className="py-4 text-primary text-xl font-semibold text-center">
            Upload Signature for Staff
          </h2>
          <Form onFinish={handleFileUpload} form={form} requiredMark={true}>
            <Form.Item
              name="employee_id"
              initialValue={selectedRecord.employee.id}
              rules={[
                {
                  required: true,
                  message: 'An employee is required',
                },
              ]}
            >
              <Select
                placeholder={'Select Employee'}
                options={employees?.data?.map((emp) => ({
                  label: emp?.user.name,
                  value: emp.id,
                }))}
              />
            </Form.Item>
            <Form.Item
              name="file"
              rules={[{ required: true, message: 'A signature is required' }]}
            >
              <Upload {...props}>
                <Button icon={<UploadOutlined />}>Update Signature</Button>
              </Upload>
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Update
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default EditSignature;
