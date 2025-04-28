import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  notification,
} from 'antd';
import React from 'react';
import { useAppStore } from '../../../store/store';
import { useMutation, useQueryClient } from 'react-query';
import swal from 'sweetalert';
import { APPCONFIG, APPCONFIGFRONT } from '../../../../common/constants';
import { updateConfiguration } from '../../../http/appconfig';
import { disabledDate } from '../../../utils/validators';
import dayjs from 'dayjs';

const EditConfiguration = () => {
  const showConfigurationsEditModal = useAppStore(
    (state) => state.showConfigurationsEditModal
  );
  const toggleConfigurationsEditModal = useAppStore(
    (state) => state.toggleConfigurationsEditModal
  );

  const selectedRecord = useAppStore((state) => state.selectedRecord);

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (type, message, description) => {
    api[type]({
      message,
      description,
    });
  };

  const queryClient = useQueryClient();

  const { mutate, isLoading } = useMutation(
    'updateConfiguration',
    (data) => updateConfiguration(selectedRecord.id, data),
    {
      onSuccess: () => {
        toggleConfigurationsEditModal();
        queryClient.invalidateQueries({ queryKey: ['configurations'] });
        swal({
          title: 'Success',
          icon: 'success',
          text: 'Configurataion edited successfully',
        });
      },
      onError: (err) => {
        openNotification('error', 'Error', err.message);
      },
    }
  );

  const handleSubmit = (values) => {
    try {
      const _values = {
        name: selectedRecord.name,
        value:
          values.name === 'Roaster Start Date' ||
          values.name === 'Roaster End Date'
            ? values.value.toISOString()
            : values.value,
      };
      mutate(_values);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {contextHolder}
      <Modal
        open={showConfigurationsEditModal}
        footer={false}
        onCancel={toggleConfigurationsEditModal}
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
              name={'name'}
              labelCol={{
                span: 10,
              }}
              wrapperCol={{
                span: 20,
              }}
              initialValue={APPCONFIGFRONT[selectedRecord.name]}
            >
              <Input />
            </Form.Item>

            {selectedRecord.name !== APPCONFIG.ANNUAL_REQUEST_END_DATE &&
              selectedRecord.name !== APPCONFIG.ANNUAL_REQUEST_START_DATE && (
                <Form.Item
                  labelCol={{
                    span: 10,
                  }}
                  wrapperCol={{
                    span: 20,
                  }}
                  label="Value"
                  name={'value'}
                  initialValue={selectedRecord.value}
                >
                  <Input placeholder="Enter value" />
                </Form.Item>
              )}

            {selectedRecord.name === APPCONFIG.ANNUAL_REQUEST_START_DATE && (
              <Form.Item
                name={'value'}
                labelCol={{
                  span: 10,
                }}
                wrapperCol={{
                  span: 40,
                }}
                label="Start Date"
                initialValue={dayjs(selectedRecord.value)}
              >
                <DatePicker
                  disabledDate={disabledDate}
                  style={{ width: 350 }}
                />
              </Form.Item>
            )}

            {selectedRecord.name === APPCONFIG.ANNUAL_REQUEST_END_DATE && (
              <Form.Item
                name={'value'}
                labelCol={{
                  span: 10,
                }}
                wrapperCol={{
                  span: 40,
                }}
                label="Final Day"
                initialValue={dayjs(selectedRecord.value)}
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

export default EditConfiguration;
