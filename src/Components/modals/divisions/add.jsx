import { Button, Form, Input, Modal, notification } from 'antd';
import React from 'react';
import { useAppStore } from '../../../store/store';
import { useMutation, useQueryClient } from 'react-query';
import { addDivision } from '../../../http/divisions';
import swal from 'sweetalert';

const AddDivision = () => {
  const showDivisionsAddModal = useAppStore(
    (state) => state.showDivisionsAddModal
  );
  const toggleDivisionsAddModal = useAppStore(
    (state) => state.toggleDivisionsAddModal
  );
  const queryClient = useQueryClient();

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (type, message, description) => {
    api[type]({
      message,
      description,
    });
  };

  const { mutate } = useMutation('addDivision', (data) => addDivision(data), {
    onSuccess: () => {
      toggleDivisionsAddModal();
      queryClient.invalidateQueries({ queryKey: ['divisions'] });
      swal({
        title: 'Success',
        icon: 'success',
        text: 'Divisions added successfully',
      });
    },
    onError: (err) => {
      openNotification('error', 'Error', err.message);
    },
  });

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
        open={showDivisionsAddModal}
        footer={false}
        onCancel={toggleDivisionsAddModal}
        maskClosable={false}
      >
        <div className="flex justify-center mt-10">
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
            >
              <Input placeholder="Enter name" />
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

export default AddDivision;
