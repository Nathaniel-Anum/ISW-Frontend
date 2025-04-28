import React from 'react';
import { useMutation, useQueryClient } from 'react-query';
import swal from 'sweetalert';

import { Button, Form, Input, Modal, notification } from 'antd';
import { useAppStore } from '../../../store/store';
import { addDepartment } from '../../../http/departments';

const AddDepartment = () => {
  const [api, contextHolder] = notification.useNotification();
  const openNotification = (type, message, description) => {
    api[type]({
      message,
      description,
    });
  };

  const showDepartmentsAddModal = useAppStore(
    (state) => state.showDepartmentsAddModal
  );

  const toggleDepartmentAddModal = useAppStore(
    (state) => state.toggleDepartmentAddModal
  );

  const queryClient = useQueryClient();

  const { mutate, isLoading } = useMutation(
    'addDepartment',
    (values) => {
      addDepartment(values);
    },
    {
      onSuccess: () => {
        toggleDepartmentAddModal();
        queryClient.invalidateQueries({ queryKey: ['departments'] });
        swal({
          title: 'Success',
          icon: 'success',
          text: 'Department Added Succcessfully',
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
      console.log(err);
    }
  };

  return (
    <div>
      {contextHolder}
      <Modal
        footer={false}
        open={showDepartmentsAddModal}
        onCancel={toggleDepartmentAddModal}
        maskClosable={false}
      >
        <div className="flex justify-center mt-10">
          <Form
            name={'add_department'}
            requiredMark={true}
            onFinish={(values) => {
              handleSubmit(values);
            }}
            layout="vertical"
          >
            <Form.Item
              label={'Name'}
              name={'name'}
              rules={[
                {
                  required: true,
                  message: 'Name cannot be empty',
                },
              ]}
            >
              <Input style={{ width: 400 }} placeholder="Enter name" />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                style={{ width: 400 }}
                loading={isLoading}
              >
                Add
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default AddDepartment;
