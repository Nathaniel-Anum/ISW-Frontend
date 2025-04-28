import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  notification,
} from 'antd';
import React, { useState } from 'react';
import { useAppStore } from '../../../store/store';
import { useMutation, useQueryClient } from 'react-query';
import swal from 'sweetalert';
import { addRole } from '../../../http/roles';
import { APPCONFIG } from '../../../../common/constants';
import { addConfiguration } from '../../../http/appconfig';
import { disabledDate } from '../../../utils/validators';

const AddConfiguration = () => {
  const showConfigurationsAddModal = useAppStore(
    (state) => state.showConfigurationsAddModal
  );
  const toggleConfigurationsAddModal = useAppStore(
    (state) => state.toggleConfigurationsAddModal
  );

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (type, message, description) => {
    api[type]({
      message,
      description,
    });
  };

  const queryClient = useQueryClient();

  const [chosenOption, setChosenOption] = useState('');
  const [date, setValue] = useState(new Date());

  const { mutate, isLoading } = useMutation(
    'addConfig',
    (data) => addConfiguration(data),
    {
      onSuccess: () => {
        toggleConfigurationsAddModal();
        queryClient.invalidateQueries({ queryKey: ['configurations'] });
        swal({
          title: 'Success',
          icon: 'success',
          text: 'Configuration added successfully',
        });
      },
      onError: (err) => {
        openNotification('error', 'Error', err.message);
      },
    }
  );

  const handleSubmit = (values) => {
    try {
      const _values =
        values.name === APPCONFIG.ANNUAL_REQUEST_START_DATE
          ? {
              ...values,
              value: new Date(
                values[APPCONFIG.ANNUAL_REQUEST_START_DATE]
              ).toISOString(),
            }
          : values.name === APPCONFIG.ANNUAL_REQUEST_END_DATE
          ? {
              ...values,
              value: new Date(
                values[APPCONFIG.ANNUAL_REQUEST_END_DATE]
              ).toISOString(),
            }
          : { ...values };

      mutate(_values);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {contextHolder}
      <Modal
        open={showConfigurationsAddModal}
        footer={false}
        onCancel={toggleConfigurationsAddModal}
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
              <Select
                showSearch={true}
                optionFilterProp={'label'}
                onChange={(value) => setChosenOption(value)}
                placeholder={'Select Configuration'}
                options={[
                  {
                    label: 'Travelling Days',
                    value: APPCONFIG.TRAVELING_DAYS,
                  },
                  {
                    label: 'Leave Days Junior',
                    value: APPCONFIG.LEAVE_DAYS_JUNIOR,
                  },
                  {
                    label: 'Leave Days Senior',
                    value: APPCONFIG.LEAVE_DAYS_SENIOR,
                  },
                  {
                    label: 'Leave Days Management',
                    value: APPCONFIG.LEAVE_DAYS_MANAGEMENT,
                  },
                  {
                    label: 'Days Deducted',
                    value: APPCONFIG.DAYS_DEDUCTED,
                  },
                  {
                    label: 'Roaster Start Date',
                    value: APPCONFIG.ANNUAL_REQUEST_START_DATE,
                  },
                  {
                    label: 'Roaster End Date',
                    value: APPCONFIG.ANNUAL_REQUEST_END_DATE,
                  },
                ]}
              />
            </Form.Item>
            {chosenOption !== APPCONFIG.ANNUAL_REQUEST_END_DATE &&
              chosenOption !== APPCONFIG.ANNUAL_REQUEST_START_DATE && (
                <Form.Item
                  labelCol={{
                    span: 10,
                  }}
                  wrapperCol={{
                    span: 20,
                  }}
                  label="Value"
                  name={'value'}
                  rules={[
                    { required: true, message: 'Value Field is required' },
                  ]}
                >
                  <Input placeholder="Enter value" />
                </Form.Item>
              )}

            {chosenOption === APPCONFIG.ANNUAL_REQUEST_START_DATE && (
              <Form.Item
                name={'ANNUAL_REQUEST_START_DATE'}
                labelCol={{
                  span: 10,
                }}
                wrapperCol={{
                  span: 40,
                }}
                label="Start Date"
              >
                <DatePicker
                  disabledDate={disabledDate}
                  style={{ width: 350 }}
                  onChange={(_date, dateString) => {
                    setValue(dateString);
                  }}
                  value={date}
                />
              </Form.Item>
            )}

            {chosenOption === APPCONFIG.ANNUAL_REQUEST_END_DATE && (
              <Form.Item
                name={'ANNUAL_REQUEST_END_DATE'}
                labelCol={{
                  span: 10,
                }}
                wrapperCol={{
                  span: 40,
                }}
                label="Final Day"
              >
                <DatePicker
                  disabledDate={disabledDate}
                  style={{ width: 350 }}
                />
              </Form.Item>
            )}

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

export default AddConfiguration;
