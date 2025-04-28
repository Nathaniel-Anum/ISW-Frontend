import { Button, Form, Input, Modal, Select, notification } from 'antd';
import React from 'react';
import { useAppStore } from '../../../store/store';
import { useMutation, useQueryClient } from 'react-query';
import swal from 'sweetalert';
import { addDistrict } from '../../../http/districts';
import { useGetAllRegions } from '../../../query_hooks/regions/region.query';

const AddDistrict = () => {
  const showDistrictsAddModal = useAppStore(
    (state) => state.showDistrictsAddModal
  );
  const toggleDistrictAddModal = useAppStore(
    (state) => state.toggleDistrictAddModal
  );

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (type, message, description) => {
    api[type]({
      message,
      description,
    });
  };

  const { data: regions } = useGetAllRegions();
  const queryClient = useQueryClient();

  const { mutate } = useMutation('addDistrict', (data) => addDistrict(data), {
    onSuccess: () => {
      toggleDistrictAddModal();
      queryClient.invalidateQueries({ queryKey: ['districts'] });
      swal({
        title: 'Success',
        icon: 'success',
        text: 'District added successfully',
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
        open={showDistrictsAddModal}
        footer={false}
        onCancel={toggleDistrictAddModal}
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
              rules={[{ required: true, message: 'Name Field is required' }]}
              name={'name'}
              // labelCol={{
              //   span: 10,
              // }}
              // wrapperCol={{
              //   span: 20,
              // }}
            >
              <Input className="w-full" placeholder="Enter name" />
            </Form.Item>

            <Form.Item
              label="Region"
              name={'region_id'}
              initialValue={'Select Region'}
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
                Save
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default AddDistrict;
