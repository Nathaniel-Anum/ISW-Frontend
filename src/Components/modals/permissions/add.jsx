import { Button, Form, Input, Modal, notification } from 'antd';
import React from 'react';
import { useAppStore } from '../../../store/store';
import { useMutation, useQueryClient } from 'react-query';
import swal from 'sweetalert';
import { addPermission } from '../../../http/permissions';

const AddPermission = () => {
  const showPermissionsAddModal = useAppStore(
    (state) => state.showPermissionsAddModal
  );
  const togglePermissionsAddModal = useAppStore(
    (state) => state.togglePermissionsAddModal
  );

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (type, message, description) => {
    api[type]({
      message,
      description,
    });
  };

  const queryClient = useQueryClient();

  const { mutate } = useMutation(
    'addPermission',
    (data) => addPermission(data),
    {
      onSuccess: () => {
        togglePermissionsAddModal();
        queryClient.invalidateQueries({ queryKey: ['permissions'] });
        swal({
          title: 'Success',
          icon: 'success',
          text: 'Permission added successfully',
        });
      },
      onError: (err) => {
        openNotification('error', 'Error', err.message);
      },
    }
  );

  const handleSubmit = (values) => {
    try {
      mutate(values);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {contextHolder}
      <Modal
        open={showPermissionsAddModal}
        footer={false}
        onCancel={togglePermissionsAddModal}
        maskClosable={false}
      >
        <div className="p-6 flex justify-center">
          <Form
            onFinish={(values) => {
              handleSubmit(values);
            }}
            layout="vertical"
            requiredMark={true}
          >
            <Form.Item
              label="Name"
              rules={[{ required: true, message: 'Name Field is required' }]}
              name={'name'}
              labelCol={{
                span: 10,
              }}
            >
              <Input placeholder={'Enter Permission'} className="w-full" />
            </Form.Item>

            <Form.Item
              wrapperCol={{
                span: 20,
              }}
            >
              <Button htmlType="submit" type="primary" style={{ width: 350 }}>
                Save
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default AddPermission;
