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
import { addHoliday } from '../../../http/holiday';
import { useGetAllRoles } from '../../../query_hooks/roles/roles.query';
import { useGetAllPermissions } from '../../../query_hooks/permissions/permission.query';
import { addRolePermission } from '../../../http/role_permission';

const AddRoleManagement = () => {
  const showRolePermissionsAddModal = useAppStore(
    (state) => state.showRolePermissionsAddModal
  );
  const toggleRolePermissionsAddModal = useAppStore(
    (state) => state.toggleRolePermissionsAddModal
  );

  const { data: roles } = useGetAllRoles();
  const { data: permissions } = useGetAllPermissions();

  const queryClient = useQueryClient();
  const [api, contextHolder] = notification.useNotification();
  const openNotification = (type, message, description) => {
    api[type]({
      message,
      description,
    });
  };

  const { mutate } = useMutation(
    'addRolePermission',
    (data) => addRolePermission(data),
    {
      onSuccess: () => {
        toggleRolePermissionsAddModal();
        queryClient.invalidateQueries({ queryKey: ['rolePermissions'] });
        swal({
          title: 'Success',
          icon: 'success',
          text: 'Role Permissions added successfully',
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
      <Modal
        open={showRolePermissionsAddModal}
        footer={false}
        onCancel={toggleRolePermissionsAddModal}
        maskClosable={false}
        requiredMark={true}
      >
        <div className="flex justify-center mt-6 ">
          <Form
            onFinish={(values) => {
              handleSubmit(values);
            }}
            layout="vertical"
            requiredMark={true}
          >
            <Form.Item
              label="Role"
              name={'role_id'}
              labelCol={{
                span: 10,
              }}
              rules={[{ required: true, message: 'Name field is required' }]}
            >
              <Select
                className="w-full"
                optionFilterProp={'label'}
                placeholder="Select Role"
                showSearch
                options={roles?.data.map((role) => ({
                  label: role.name,
                  value: role.id,
                }))}
              />
            </Form.Item>
            <Form.Item
              label="Permissions"
              rules={[{ required: true, message: 'Date Field is required' }]}
              name={'permissions'}
              labelCol={{
                span: 10,
              }}
            >
              <Select
                className="w-full"
                optionFilterProp={'label'}
                mode="multiple"
                placeholder="Select Permissions"
                showSearch
                options={permissions?.data.map((role) => ({
                  label: role.name,
                  value: role.id,
                }))}
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

export default AddRoleManagement;
