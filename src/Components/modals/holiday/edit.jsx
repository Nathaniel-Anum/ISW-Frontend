import { Button, DatePicker, Form, Input, Modal, notification } from 'antd';
import React from 'react';
import { useAppStore } from '../../../store/store';
import { useMutation, useQueryClient } from 'react-query';
import swal from 'sweetalert';
import { updateHoliday } from '../../../http/holiday';
import dayjs from 'dayjs';

const EditHoliday = () => {
  const showHolidaysEditModal = useAppStore(
    (state) => state.showHolidaysEditModal
  );
  const toggleHolidaysEditModal = useAppStore(
    (state) => state.toggleHolidaysEditModal
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
    'updateHoliday',
    (data) => updateHoliday(selectedRecord.id, data),
    {
      onSuccess: () => {
        toggleHolidaysEditModal();
        queryClient.invalidateQueries({ queryKey: ['holidays'] });
        swal({
          title: 'Success',
          icon: 'success',
          text: 'Holiday updated successfully',
        });
      },
      onError: (err) => {
        openNotification('error', 'Error', err.message);
      },
    }
  );

  const handleSubmit = (values) => {
    const _values = {
      ...values,
      date: values['holiday'].toISOString(),
    };
    try {
      mutate(_values);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {contextHolder}
      <Modal
        open={showHolidaysEditModal}
        footer={false}
        onCancel={toggleHolidaysEditModal}
        maskClosable={false}
        requiredMark={true}
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
              label="Holiday Name"
              name={'name'}
              labelCol={{
                span: 10,
              }}
              wrapperCol={{
                span: 20,
              }}
              initialValue={selectedRecord.name}
            >
              <Input placeholder="Enter Holiday name" />
            </Form.Item>
            <Form.Item
              label="Date"
              rules={[{ required: true, message: 'Date Field is required' }]}
              name={'holiday'}
              labelCol={{
                span: 10,
              }}
              wrapperCol={{
                span: 70,
              }}
              initialValue={dayjs(selectedRecord.holiday)}
            >
              <DatePicker style={{ width: 350 }} />
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

export default EditHoliday;
