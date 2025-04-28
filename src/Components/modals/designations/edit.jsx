import { Button, Form, Input, Modal, notification } from 'antd';
import React from 'react';
import { useAppStore } from '../../../store/store';
import { useMutation, useQueryClient } from 'react-query';
import swal from 'sweetalert';

import { updateDesignation } from '../../../http/designations';

const EditDesignation = () => {
  const showDesignationsEditModal = useAppStore(
    (state) => state.showDesignationsEditModal
  );
  const toggleDesignationsEditModal = useAppStore(
    (state) => state.toggleDesignationsEditModal
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
    'addDesignation',
    (data) => updateDesignation(selectedRecord.id, data),
    {
      onSuccess: () => {
        toggleDesignationsEditModal();
        queryClient.invalidateQueries({ queryKey: ['getAllDesignations'] });
        swal({
          title: 'Success',
          icon: 'success',
          text: 'Designation updated successfully',
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
        open={showDesignationsEditModal}
        footer={false}
        onCancel={toggleDesignationsEditModal}
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
              initialValue={selectedRecord.name}
            >
              <Input placeholder={'Enter Designation'} className="w-ful" />
            </Form.Item>

            <Form.Item>
              <Button
                htmlType="submit"
                type="primary"
                // style={{ width: 350 }}
                className="w-full"
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

export default EditDesignation;
