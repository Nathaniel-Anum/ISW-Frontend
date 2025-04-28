import { Button, Form, Input, Modal, notification } from 'antd';
import { useAppStore } from '../../../store/store';
import { useMutation, useQueryClient } from 'react-query';
import { updateDepartment } from '../../../http/departments';

const EditDepartment = () => {
  const selectedRecord = useAppStore((state) => state.selectedRecord);
  const [api, contextHolder] = notification.useNotification();
  const openNotification = (type, message, description) => {
    api[type]({
      message,
      description,
    });
  };
  const client = useQueryClient();
  const showDepartmentsEditModal = useAppStore(
    (state) => state.showDepartmentsEditModal
  );
  const toggleDepartmentEditModal = useAppStore(
    (state) => state.toggleDepartmentEditModal
  );

  const { mutate, isLoading } = useMutation(
    ['update_department', selectedRecord.id],
    (data) => {
      updateDepartment(data.id, data.values);
    },
    {
      onSuccess: (data) => {
        client.invalidateQueries({ queryKey: ['departments'] });
        toggleDepartmentEditModal();
      },

      onError: (err) => {
        openNotification('error', 'Error', err.message);
      },
    }
  );

  const handleUpdate = (values) => {
    try {
      mutate({ id: selectedRecord.id, values });

      // !isLoading && toggleDepartmentEditModal();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="font-body">
      {contextHolder}
      <Modal
        footer={false}
        open={showDepartmentsEditModal}
        onCancel={toggleDepartmentEditModal}
        maskClosable={false}
      >
        <div className="flex justify-center mt-10">
          <Form
            layout="vertical"
            name="departments_edit"
            initialValues={{
              remember: true,
            }}
            style={{
              maxWidth: 900,
              maxHeight: 600,
              overflow: 'auto',
            }}
            onFinish={(values) => {
              handleUpdate(values);
            }}
            onFinishFailed={() => {}}
            requiredMark={false}
          >
            <Form.Item
              label="Name"
              name={'name'}
              initialValue={selectedRecord.name}
            >
              <Input style={{ width: 400, borderRadius: '5px' }} />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                loading={isLoading}
                htmlType="submit"
                style={{ width: 400 }}
              >
                Update
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  );
};

export default EditDepartment;
