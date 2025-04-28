import { Button, Form, Input, Modal, notification } from 'antd';
import React from 'react';
import { useAppStore } from '../../../store/store';
import { useMutation, useQueryClient } from 'react-query';
import swal from 'sweetalert';
import { addRole } from '../../../http/roles';

const AddRole = () => {
  const showRolesAddModal = useAppStore((state) => state.showRolesAddModal);
  const toggleRolesAddModal = useAppStore((state) => state.toggleRolesAddModal);

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (type, message, description) => {
    api[type]({
      message,
      description,
    });
  };

  const queryClient = useQueryClient();

  const { mutate, isLoading } = useMutation(
    'addRole',
    (data) => addRole(data),
    {
      onSuccess: () => {
        toggleRolesAddModal();
        queryClient.invalidateQueries({ queryKey: ['roles'] });
        swal({
          title: 'Success',
          icon: 'success',
          text: 'Role added successfully',
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
        open={showRolesAddModal}
        footer={false}
        onCancel={toggleRolesAddModal}
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
              rules={[{ required: true, message: 'Name Field is required' }]}
              name={'name'}
              labelCol={{
                span: 10,
              }}
              wrapperCol={{
                span: 20,
              }}
            >
              <Input placeholder={'Enter role'} />
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
                Save
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default AddRole;
