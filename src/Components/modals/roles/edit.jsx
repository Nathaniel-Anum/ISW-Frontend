import { Button, Form, Input, Modal, notification } from 'antd';
import React from 'react';
import { useAppStore } from '../../../store/store';
import { useMutation, useQueryClient } from 'react-query';
import swal from 'sweetalert';

import { updateRole } from '../../../http/roles';

const EditRole = () => {
  const showRolesEditModal = useAppStore((state) => state.showRolesEditModal);
  const toggleRolesEditModal = useAppStore(
    (state) => state.toggleRolesEditModal
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

  const { mutate, isLoading } = useMutation(
    'editRole',
    (data) => updateRole(selectedRecord.id, data),
    {
      onSuccess: () => {
        toggleRolesEditModal();
        queryClient.invalidateQueries({ queryKey: ['roles'] });
        swal({
          title: 'Success',
          icon: 'success',
          text: 'Role Updated successfully',
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
        open={showRolesEditModal}
        footer={false}
        onCancel={toggleRolesEditModal}
        maskClosable={false}
      >
        <div className="p-6">
          <Form
            onFinish={(values) => {
              handleSubmit(values);
            }}
            layout="vertical"
            requiredMark={true}
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
              <Button
                htmlType="submit"
                type="primary"
                style={{ width: 350 }}
                loading={isLoading}
              >
                Update
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default EditRole;
