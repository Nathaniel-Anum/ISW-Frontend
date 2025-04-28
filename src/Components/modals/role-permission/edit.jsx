import { Button, Form, Input, Modal, Select, notification } from 'antd';
import React from 'react';
import { useAppStore } from '../../../store/store';
import { useMutation, useQueryClient } from 'react-query';
import swal from 'sweetalert';
import { updateRegion } from '../../../http/regions';
import {} from '../../../query_hooks/divisions/divisions.query';
import { useGetAllRoles } from '../../../query_hooks/roles/roles.query';
import { useGetAllPermissions } from '../../../query_hooks/permissions/permission.query';
import { addRolePermission } from '../../../http/role_permission';

const EditRoleManagement = () => {
  const showRolePermissionsEditModal = useAppStore(
    (state) => state.showRolePermissionsEditModal
  );
  const toggleRolePermissionsEditModal = useAppStore(
    (state) => state.toggleRolePermissionsEditModal
  );

  const selectedRecord = useAppStore((state) => state.selectedRecord);

  const queryClient = useQueryClient();

  const { data: permissions } = useGetAllPermissions();

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (type, message, description) => {
    api[type]({
      message,
      description,
    });
  };

  const { mutate } = useMutation(
    'addRegion',
    (data) => addRolePermission(data),
    {
      onSuccess: () => {
        toggleRolePermissionsEditModal();
        queryClient.invalidateQueries({ queryKey: ['rolePermissions'] });
        swal({
          title: 'Success',
          icon: 'success',
          text: 'Role Permission updated successfully',
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
        ...values,
        role_id: selectedRecord.id,
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
        open={showRolePermissionsEditModal}
        footer={false}
        onCancel={toggleRolePermissionsEditModal}
        maskClosable={false}
      >
        <div className="p-6">
          <Form
            onFinish={(values) => {
              handleSubmit(values);
            }}
            layout="vertical"
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
              initialValue={selectedRecord.name}
            >
              <Input placeholder={'Enter name of region'} disabled />
            </Form.Item>

            <Form.Item
              label={'Permissions'}
              name={'permissions'}
              initialValue={
                selectedRecord?.permissions &&
                selectedRecord?.permissions.map((perm) => perm.id)
              }
              wrapperCol={{
                span: 20,
              }}
            >
              <Select
                mode="multiple"
                optionFilterProp={'label'}
                showSearch
                allowClear
                options={
                  permissions &&
                  permissions.data.map((perm) => {
                    return {
                      label: perm.name,
                      value: perm.id,
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
                Update
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default EditRoleManagement;
