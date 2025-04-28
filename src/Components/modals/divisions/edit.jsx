import { Button, Form, Input, Modal, notification } from 'antd';
import React from 'react';
import { useAppStore } from '../../../store/store';
import { useMutation, useQueryClient } from 'react-query';
import { updateDivision } from '../../../http/divisions';
import swal from 'sweetalert';

const EditDivision = () => {
  const showDivisionsEditModal = useAppStore(
    (state) => state.showDivisionsEditModal
  );
  const toggleDivisionsEditModal = useAppStore(
    (state) => state.toggleDivisionsEditModal
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
    'updateDivision',
    (data) => updateDivision(selectedRecord.id, data),
    {
      onSuccess: () => {
        toggleDivisionsEditModal();
        queryClient.invalidateQueries({ queryKey: ['divisions'] });
        swal({
          title: 'Success',
          icon: 'success',
          text: 'Divisions updated successfully',
        });
      },
      onError: (err) => openNotification('error', 'Error', err.message),
    }
  );

  const handleUpdate = (values) => {
    try {
      mutate(values);
    } catch (e) {
      console.error(e.message);
    }
  };

  return (
    <div>
      {contextHolder}
      <Modal
        open={showDivisionsEditModal}
        footer={false}
        onCancel={toggleDivisionsEditModal}
        maskClosable={false}
      >
        <div className="p-6 flex justify-center">
          <Form
            onFinish={(values) => {
              handleUpdate(values);
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

export default EditDivision;
