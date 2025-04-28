import React from 'react';

import { Button, Form, Input, Modal, Select } from 'antd';
import { useAppStore } from '../../../store/store';
import { useGetAllRoles } from '../../../query_hooks/roles/roles.query';

const EditUser = () => {
  const showUsersEditModal = useAppStore((state) => state.showUsersEditModal);
  const toggleUsersEditModal = useAppStore(
    (state) => state.toggleUsersEditModal
  );

  const selectedRecord = useAppStore((state) => state.selectedRecord);

  const { data: roles } = useGetAllRoles();

  return (
    <div className="font-body">
      <Modal
        open={showUsersEditModal}
        onCancel={() => toggleUsersEditModal()}
        footer={null}
      >
        <div className="flex justify-center items-center py-8">
          <Form
            name="basic"
            layout="vertical"
            style={{
              maxWidth: 900,
              maxHeight: 600,
              overflow: 'auto',
            }}
            initialValues={{
              remember: true,
            }}
            requiredMark={false}
            onFinish={() => {}}
            onFinishFailed={() => {}}
            autoComplete="off"
          >
            <Form.Item
              label="Name"
              name="name"
              initialValue={selectedRecord?.name}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Email"
              name="email"
              initialValue={selectedRecord?.email}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Role"
              name="role_id"
              initialValue={selectedRecord?.role.name}
            >
              <Select
                style={{
                  maxWidth: 400,
                }}
                options={
                  roles &&
                  roles.data.map((role) => ({
                    value: role.id,
                    label: role.name,
                  }))
                }
              />
            </Form.Item>
            <Form.Item
              label="Status"
              name="status"
              initialValue={selectedRecord?.status}
            >
              <Select
                style={{
                  maxWidth: 400,
                }}
                options={[
                  {
                    value: 'ACTIVE',
                    label: 'Active',
                  },
                  {
                    value: 'INACTIVE',
                    label: 'Inactive',
                  },
                ]}
              />
            </Form.Item>

            <Form.Item
              wrapperCol={{
                span: 20,
              }}
            >
              <Button type="primary" htmlType="submit" style={{ width: 400 }}>
                Update
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default EditUser;
