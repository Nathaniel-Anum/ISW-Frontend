import { Button, Form, Input, Modal, Select, notification } from 'antd';
import React from 'react';
import { useAppStore } from '../../../store/store';
import { useMutation, useQueryClient } from 'react-query';
import swal from 'sweetalert';
import { updateRegion } from '../../../http/regions';
import {} from '../../../query_hooks/divisions/divisions.query';
import { useGetAllDistricts } from '../../../query_hooks/districts/districts.query';

const EditRegion = () => {
  const showRegionsEditModal = useAppStore(
    (state) => state.showRegionsEditModal
  );
  const toggleRegionsEditModal = useAppStore(
    (state) => state.toggleRegionsEditModal
  );

  const selectedRecord = useAppStore((state) => state.selectedRecord);

  const queryClient = useQueryClient();

  const { data: districts } = useGetAllDistricts();

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (type, message, description) => {
    api[type]({
      message,
      description,
    });
  };

  const { mutate } = useMutation(
    'addRegion',
    (data) => updateRegion(selectedRecord.id, data),
    {
      onSuccess: () => {
        toggleRegionsEditModal();
        queryClient.invalidateQueries({ queryKey: ['regions'] });
        swal({
          title: 'Success',
          icon: 'success',
          text: 'Region updated successfully',
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
        open={showRegionsEditModal}
        footer={false}
        onCancel={toggleRegionsEditModal}
        maskClosable={false}
      >
        <div className="flex justify-center mt-8">
          <Form
            onFinish={(values) => {
              handleSubmit(values);
            }}
            layout="vertical"
          >
            <Form.Item
              label="Name"
              name={'name'}
              initialValue={selectedRecord.name}
            >
              <Input placeholder={'Enter name of region'} className="w-full" />
            </Form.Item>

            <Form.Item
              label={'Districts'}
              name={'district_id'}
              initialValue={
                selectedRecord.district &&
                selectedRecord.district.map((district) => district.id)
              }
            >
              <Select
                className="w-full"
                mode="multiple"
                showSearch
                allowClear
                options={
                  districts &&
                  districts.data.map((district) => {
                    return {
                      label: district.name,
                      value: district.id,
                    };
                  })
                }
              />
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

export default EditRegion;
