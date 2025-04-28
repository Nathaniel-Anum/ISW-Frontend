import { Button, Form, Input, Modal, notification } from 'antd';
import React from 'react';
import { useAppStore } from '../../../store/store';
import { useMutation, useQueryClient } from 'react-query';
import swal from 'sweetalert';
import { addDesignation } from '../../../http/designations';

const AddDesignation = () => {
  const showDesignationsAddModal = useAppStore(
    (state) => state.showDesignationsAddModal
  );
  const toggleDesignationsAddModal = useAppStore(
    (state) => state.toggleDesignationsAddModal
  );

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (type, message, description) => {
    api[type]({
      message,
      description,
    });
  };

  const queryClient = useQueryClient();

  const { mutate, isLoading } = useMutation(
    'addDesignation',
    (data) => addDesignation(data),
    {
      onSuccess: () => {
        toggleDesignationsAddModal();
        queryClient.invalidateQueries({ queryKey: ['getAllDesignations'] });
        swal({
          title: 'Success',
          icon: 'success',
          text: 'Designation added successfully',
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
        open={showDesignationsAddModal}
        footer={false}
        onCancel={toggleDesignationsAddModal}
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
              // wrapperCol={{
              //   span: 20,
              // }}
            >
              <Input placeholder={'Enter Designation'} className="w-full" />
            </Form.Item>

            <Form.Item
            // wrapperCol={{
            //   span: 20,
            // }}
            >
              <Button
                htmlType="submit"
                type="primary"
                // style={{ width: 350 }}
                className="w-full"
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

export default AddDesignation;
