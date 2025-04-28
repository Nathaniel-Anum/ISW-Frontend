import { Button, Form, Input, Modal, notification } from 'antd';
import React from 'react';
import { useAppStore } from '../../../store/store';
import { useMutation, useQueryClient } from 'react-query';
import swal from 'sweetalert';

import { updatePermission } from '../../../http/permissions';

const EditPermission = () => {
  const showPermissionsEditModal = useAppStore(
    (state) => state.showPermissionsEditModal
  );
  const togglePermissionsEditModal = useAppStore(
    (state) => state.togglePermissionsEditModal
  );

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (type, message, description) => {
    api[type]({
      message,
      description,
    });
  };

  const selectedRecord = useAppStore((state) => state.selectedRecord);

  const queryClient = useQueryClient();

  const { mutate } = useMutation(
    'editRole',
    (data) => updatePermission(selectedRecord.id, data),
    {
      onSuccess: () => {
        togglePermissionsEditModal();
        queryClient.invalidateQueries({ queryKey: ['permissions'] });
        swal({
          title: 'Success',
          icon: 'success',
          text: 'Permission Updated successfully',
        });
      },
      onError: (err) => openNotification('error', 'Error', err.message),
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
        open={showPermissionsEditModal}
        footer={false}
        onCancel={togglePermissionsEditModal}
        maskClosable={false}
      >
        <div className="p-6">
          <Form
            onFinish={(values) => {
              handleSubmit(values);
            }}
            layout="vertical"
          >
            <Form.Item
              label="Name"
              name={'name'}
              labelCol={{
                span: 10,
              }}
              wrapperCol={{
                span: 20,
              }}
              initialValue={selectedRecord.name}
            >
              <Input />
            </Form.Item>

            <Form.Item
              wrapperCol={{
                span: 20,
              }}
            >
              <Button htmlType="submit" type="primary" style={{ width: 350 }}>
                Update
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default EditPermission;
