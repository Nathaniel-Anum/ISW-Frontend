import { Button, Form, Input, Modal, Select, notification } from 'antd';
import React from 'react';
import { useAppStore } from '../../../store/store';
import { useMutation, useQueryClient } from 'react-query';
import swal from 'sweetalert';
import { updateDistrict } from '../../../http/districts';
import { useGetAllRegions } from '../../../query_hooks/regions/region.query';

const EditDistrict = () => {
  const showDistrictsEditModal = useAppStore(
    (state) => state.showDistrictsEditModal
  );
  const toggleDistrictsEditModal = useAppStore(
    (state) => state.toggleDistrictsEditModal
  );

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (type, message, description) => {
    api[type]({
      message,
      description,
    });
  };

  const selectedRecord = useAppStore((state) => state.selectedRecord);

  const { data: regions } = useGetAllRegions();
  const queryClient = useQueryClient();

  const { mutate } = useMutation(
    'addDistrict',
    (data) => updateDistrict(selectedRecord.id, data),
    {
      onSuccess: () => {
        toggleDistrictsEditModal();
        queryClient.invalidateQueries({ queryKey: ['district'] });
        swal({
          title: 'Success',
          icon: 'success',
          text: 'District Updated successfully',
        });
      },
      onError: (err) => openNotification('error', 'Error', err.message),
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
        open={showDistrictsEditModal}
        footer={false}
        onCancel={toggleDistrictsEditModal}
        maskClosable={false}
      >
        <div className="flex justify-center">
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
              initialValue={selectedRecord.name}
            >
              <Input className="w-full" />
            </Form.Item>

            <Form.Item
              label="Region"
              name={'region_id'}
              initialValue={selectedRecord.region.id}
            >
              <Select
                className="w-full"
                options={
                  regions &&
                  regions.data.map((region) => ({
                    label: region.name,
                    value: region.id,
                  }))
                }
              />
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

export default EditDistrict;
