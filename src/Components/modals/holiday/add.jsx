import { Button, DatePicker, Form, Input, Modal, notification } from 'antd';
import React from 'react';
import { useAppStore } from '../../../store/store';
import { useMutation, useQueryClient } from 'react-query';
import swal from 'sweetalert';
import { addHoliday } from '../../../http/holiday';
import { capitalize } from '../../../utils/capitalize';

const AddHoliday = () => {
  const showHolidaysAddModal = useAppStore(
    (state) => state.showHolidaysAddModal
  );
  const toggleHolidaysAddModal = useAppStore(
    (state) => state.toggleHolidaysAddModal
  );

  const queryClient = useQueryClient();

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (type, message, description) => {
    api[type]({
      message,
      description,
    });
  };

  const { mutate } = useMutation(
    'addHoliday',
    (data) => addHoliday(data),

    {
      onSuccess: () => {
        swal({
          title: 'Success',
          text: 'Holiday Added Successfully',
          icon: 'success',
        });

        queryClient.invalidateQueries({ queryKey: ['holidays'] });

        toggleHolidaysAddModal();
      },
      onError: (err) => {
        console.log(err);
        openNotification('error', 'Error', capitalize(err.message));
      },
    }
  );

  const handleSubmit = (values) => {
    const _values = {
      ...values,
      holiday: values['holiday'].toISOString(),
    };
    try {
      mutate(_values);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {contextHolder}
      <div>
        <Modal
          open={showHolidaysAddModal}
          footer={false}
          onCancel={toggleHolidaysAddModal}
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
                rules={[{ required: true, message: 'Name field is required' }]}
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
              >
                <DatePicker style={{ width: 350 }} />
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
    </>
  );
};

export default AddHoliday;
