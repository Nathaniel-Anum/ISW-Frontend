import { Button, Form, Modal, Upload, message, notification } from 'antd';

import { UploadOutlined } from '@ant-design/icons';
import { useAppStore } from '../../../store/store';

import { useMutation, useQueryClient } from 'react-query';

import { upload } from '../../../http/signatures';
import swal from 'sweetalert';

import { uploadDesignations } from '../../../http/designations';

const DesignationsBulkUploadModal = () => {
  const showBulkDesignationsModal = useAppStore(
    (state) => state.showBulkDesignationsModal
  );

  const toggleShowBulkDesignationsModal = useAppStore(
    (state) => state.toggleShowBulkDesignationsModal
  );

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (type, message, description) => {
    api[type]({
      message,
      description,
    });
  };
  const queryClient = useQueryClient();

  const { mutate: mutation, isLoading } = useMutation(
    'uploadDesignations',
    (data) => uploadDesignations(data),
    {
      onSuccess: () => {
        toggleShowBulkDesignationsModal();
        queryClient.invalidateQueries({ queryKey: 'getAllDesignations' });
        swal({
          title: 'Success',
          icon: 'success',
          text: 'Designations uploaded successfully',
        });
      },

      onError: (err) => {
        message.error(err.message);
      },
    }
  );

  const [form] = Form.useForm();

  const { mutate } = useMutation(
    'upload',
    (data) => {
      upload(data)
        .then((response) => {
          mutation({ file_path: response?.data?.filePath });
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
        open={showBulkDesignationsModal}
        footer={false}
        onCancel={toggleShowBulkDesignationsModal}
      >
        <div className="pt-9 mx-auto w-[90%]">
          <h2 className="py-4 text-primary text-xl font-semibold text-center">
            Upload Designations from csv
          </h2>
          <Form onFinish={handleFileUpload} form={form}>
            <Form.Item name="file">
              <Upload {...props}>
                <Button style={{ width: '26.5rem' }} icon={<UploadOutlined />}>
                  Select csv file
                </Button>
              </Upload>
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full"
                loadin={isLoading}
              >
                Submit
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default DesignationsBulkUploadModal;
