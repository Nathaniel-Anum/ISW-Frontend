import { Button, Form, Input, Modal, Select, notification } from 'antd';
import React from 'react';
import { useAppStore } from '../../../store/store';
import { useMutation, useQueryClient } from 'react-query';
import swal from 'sweetalert';
import { addRegion } from '../../../http/regions';
import { useGetAllDivisions } from '../../../query_hooks/divisions/divisions.query';

const AddRegion = () => {
  const showRegionsAddModal = useAppStore((state) => state.showRegionsAddModal);
  const toggleRegionsAddModal = useAppStore(
    (state) => state.toggleRegionsAddModal
  );

  const queryClient = useQueryClient();
  const { data: divisions } = useGetAllDivisions();

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (type, message, description) => {
    api[type]({
      message,
      description,
    });
  };

  const { mutate } = useMutation('addRegion', (data) => addRegion(data), {
    onSuccess: () => {
      toggleRegionsAddModal();
      queryClient.invalidateQueries({ queryKey: ['regions'] });
      swal({
        title: 'Success',
        icon: 'success',
        text: 'Region added successfully',
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
        open={showRegionsAddModal}
        footer={false}
        onCancel={toggleRegionsAddModal}
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
              <Input placeholder={'Enter name of region'} />
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

export default AddRegion;
